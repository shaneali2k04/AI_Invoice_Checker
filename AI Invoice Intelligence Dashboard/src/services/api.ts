import type { InvoiceField, ProblematicInvoice, User } from '@/types/models';
import type { Invoice } from '@/types/models';

export type ApiInvoiceListItem = {
  id: string;
  document_id: string;
  page_no: number;
  status: string;
  needs_rescan: boolean;
  unreadable_fields: string[];
  reasons: string[];
  extracted: Record<string, unknown>;
  current?: Record<string, unknown>;
  model_avg_confidence?: number | null;
  system_confidence?: number | null;
  system_reasons?: string[];
  field_diagnostics?: Record<string, any>;
};

export type ApiParty = {
  id: string;
  type: 'supplier' | 'buyer' | string;
  name?: string | null;
  ntn?: string | null;
  gst_no?: string | null;
  registration_no?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApiInvoiceDetail = {
  id: string;
  document_id: string;
  page_no: number;
  status: string;
  needs_rescan: boolean;
  unreadable_fields: string[];
  reasons: string[];
  extracted: Record<string, unknown>;
  edited: Record<string, unknown>;
  current?: Record<string, unknown>;
  model_avg_confidence?: number | null;
  system_confidence?: number | null;
  system_reasons?: string[];
  field_diagnostics?: Record<string, any>;
  document_url: string;
};

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/documents', { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as { job_id: string; document_id: string };
}

export type ApiJobStatus = {
  id: string;
  document_id: string;
  filename?: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed' | string;
  total_pages?: number | null;
  processed_pages: number;
  message?: string | null;
  error?: string | null;
  invoice_ids: string[];
  has_low_readability: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function getJob(jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiJobStatus;
}

export async function listJobs(limit = 50) {
  const res = await fetch(`/api/jobs?limit=${encodeURIComponent(String(limit))}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiJobStatus[];
}

export async function listInvoices() {
  const res = await fetch('/api/invoices');
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiInvoiceListItem[];
}

export async function exportInvoicesXlsx(): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch('/api/invoices/export.xlsx');
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') || '';
  const m = /filename="([^"]+)"/i.exec(cd);
  const filename = m?.[1] || 'invoices.xlsx';
  return { blob, filename };
}

export async function listAIReview() {
  const res = await fetch('/api/ai-review');
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiInvoiceListItem[];
}

export async function getInvoiceDetail(id: string) {
  const res = await fetch(`/api/invoices/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiInvoiceDetail;
}

export async function updateInvoice(id: string, payload: { status?: string; edited?: Record<string, unknown> }) {
  const res = await fetch(`/api/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiInvoiceDetail;
}

export async function listParties(party_type?: 'supplier' | 'buyer') {
  const qs = party_type ? `?party_type=${encodeURIComponent(party_type)}` : '';
  const res = await fetch(`/api/parties${qs}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiParty[];
}

export async function requestRescan(id: string, payload: { reasons?: string[]; unreadable_fields?: string[] }) {
  const res = await fetch(`/api/invoices/${id}/request-rescan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiInvoiceDetail;
}

export async function reuploadInvoice(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/invoices/${id}/reupload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiInvoiceDetail;
}

