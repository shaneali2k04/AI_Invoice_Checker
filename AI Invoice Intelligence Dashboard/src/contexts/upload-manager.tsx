import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getJob, listJobs, uploadDocument } from '@/services/api';

export interface UploadedFile {
  id: string;
  name: string;
  size?: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'low-readability';
  needsReview?: boolean;
  progress: number;
  confidence?: number;
  invoiceIds?: string[];
  jobId?: string;
  documentId?: string;
  error?: string;
  message?: string;
}

type UploadManagerContextValue = {
  files: UploadedFile[];
  stats: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    needsReview: number;
  };
  startUpload: (uploadFiles: File[]) => void;
  removeFile: (id: string) => void;
  formatFileSize: (bytes?: number) => string;
};

const UploadManagerContext = createContext<UploadManagerContextValue | null>(null);

export function UploadManagerProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const pollingRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());

  // Keep in sync with UI copy on Upload page.
  const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12MB

  const STORAGE_KEY = 'uploadQueue.dismissedJobIds.v1';

  const loadDismissed = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(arr)) dismissedRef.current = new Set(arr.map(String));
    } catch {
      // ignore
    }
  };

  const persistDismissed = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissedRef.current)));
    } catch {
      // ignore
    }
  };

  const upsertFile = (next: UploadedFile) => {
    if (dismissedRef.current.has(next.id)) return;
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === next.id);
      if (idx === -1) return [next, ...prev];
      const copy = prev.slice();
      const existing = copy[idx];
      const merged: UploadedFile = { ...existing, ...next };
      // Never let progress go backwards while a job is in-flight.
      if (
        (merged.status === 'uploading' || merged.status === 'processing') &&
        typeof existing.progress === 'number' &&
        typeof next.progress === 'number'
      ) {
        merged.progress = Math.max(existing.progress, next.progress);
      }
      copy[idx] = merged;
      return copy;
    });
  };

  const pollJob = useCallback(async (jobId: string) => {
    if (pollingRef.current.has(jobId)) return;
    pollingRef.current.add(jobId);
    try {
      while (true) {
        if (dismissedRef.current.has(jobId)) break;
        const job = await getJob(jobId);
        const total = job.total_pages ?? null;
        const done = job.processed_pages ?? 0;
        let pct = total && total > 0 ? Math.min(99, Math.round((done / total) * 100)) : 20;
        if ((job.status === 'queued' || job.status === 'running') && done === 0) pct = Math.max(pct, 10);

        const status =
          job.status === 'failed' ? 'failed' : job.status === 'completed' ? 'completed' : 'processing';

        upsertFile({
          id: job.id,
          name: job.filename || 'Upload',
          size: undefined,
          status,
          needsReview: Boolean(job.has_low_readability),
          progress: job.status === 'completed' || job.status === 'failed' ? 100 : pct,
          jobId: job.id,
          documentId: job.document_id,
          invoiceIds: job.invoice_ids,
          error: job.error ?? undefined,
          message: job.message ?? undefined,
        });

        if (job.status === 'completed' || job.status === 'failed') break;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } finally {
      pollingRef.current.delete(jobId);
    }
  }, []);

  // Initial load + periodic refresh to pick up jobs created while user navigates.
  useEffect(() => {
    let cancelled = false;
    loadDismissed();

    const refresh = async () => {
      try {
        const jobs = await listJobs(50);
        if (cancelled) return;
        const mapped: UploadedFile[] = jobs.map((j) => {
          const total = j.total_pages ?? null;
          const done = j.processed_pages ?? 0;
          let pct = total && total > 0 ? Math.min(99, Math.round((done / total) * 100)) : 20;
          if ((j.status === 'queued' || j.status === 'running') && done === 0) pct = Math.max(pct, 10);
          const status = j.status === 'failed' ? 'failed' : j.status === 'completed' ? 'completed' : 'processing';
          return {
            id: j.id,
            name: j.filename || 'Upload',
            size: undefined,
            status,
            needsReview: Boolean(j.has_low_readability),
            progress: j.status === 'completed' || j.status === 'failed' ? 100 : pct,
            jobId: j.id,
            documentId: j.document_id,
            invoiceIds: j.invoice_ids,
            error: j.error ?? undefined,
            message: j.message ?? undefined,
          };
        });

        setFiles((prev) => {
          // Keep any local "uploading" temp items while the POST is still in-flight,
          // but replace/merge with server-backed jobs.
          const localTemps = prev.filter((x) => x.status === 'uploading' && !x.jobId);
          const combined = [...mapped.filter((x) => !dismissedRef.current.has(x.id)), ...localTemps];
          // de-dupe by id (server ids win)
          const seen = new Set<string>();
          const out: UploadedFile[] = [];
          for (const item of combined) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            out.push(item);
          }
          return out;
        });

        for (const j of jobs) {
          if (dismissedRef.current.has(j.id)) continue;
          if (j.status === 'queued' || j.status === 'running') {
            void pollJob(j.id);
          }
        }
      } catch {
        // ignore
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pollJob]);

  const startUpload = useCallback(
    (uploadFiles: File[]) => {
      uploadFiles.forEach((file, index) => {
        if (file.size > MAX_FILE_BYTES) {
          const tempId = `${Date.now()}_${index}_too_large`;
          setFiles((prev) => [
            {
              id: tempId,
              name: file.name,
              size: file.size,
              status: 'failed',
              progress: 100,
              error: `File too large (${Math.round((file.size / 1024 / 1024) * 100) / 100}MB). Max 12MB.`,
            },
            ...prev,
          ]);
          return;
        }

        const tempId = `${Date.now()}_${index}`;
        const newItem: UploadedFile = {
          id: tempId,
          name: file.name,
          size: file.size,
          status: 'uploading',
          progress: 5,
        };
        setFiles((prev) => [newItem, ...prev]);

        uploadDocument(file)
          .then(async (resp) => {
            // Replace temp item with job-backed item (stable across navigation).
            setFiles((prev) =>
              prev.map((f) =>
                f.id === tempId
                  ? {
                      ...f,
                      id: resp.job_id,
                      status: 'processing',
                      progress: 10,
                      jobId: resp.job_id,
                      documentId: resp.document_id,
                    }
                  : f
              )
            );
            void pollJob(resp.job_id);
          })
          .catch((e) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === tempId
                  ? {
                      ...f,
                      status: 'failed',
                      progress: 100,
                      error:
                        e instanceof Error && String(e.message || '').trim().length > 0
                          ? e.message
                          : 'Upload failed (backend unreachable?)',
                    }
                  : f
              )
            );
          });
      });
    },
    [pollJob]
  );

  const removeFile = useCallback((id: string) => {
    dismissedRef.current.add(id);
    persistDismissed();
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const formatFileSize = useCallback((bytes?: number) => {
    if (bytes === undefined) return '—';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const stats = useMemo(
    () => ({
      total: files.length,
      completed: files.filter((f) => f.status === 'completed').length,
      processing: files.filter((f) => f.status === 'processing' || f.status === 'uploading').length,
      failed: files.filter((f) => f.status === 'failed').length,
      needsReview: files.filter((f) => Boolean(f.needsReview)).length,
    }),
    [files]
  );

  const value = useMemo<UploadManagerContextValue>(
    () => ({ files, stats, startUpload, removeFile, formatFileSize }),
    [files, stats, startUpload, removeFile, formatFileSize]
  );

  return <UploadManagerContext.Provider value={value}>{children}</UploadManagerContext.Provider>;
}

export function useUploadManager() {
  const ctx = useContext(UploadManagerContext);
  if (!ctx) throw new Error('useUploadManager must be used within UploadManagerProvider');
  return ctx;
}

