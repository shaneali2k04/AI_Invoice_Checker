import { useEffect, useRef, useState } from 'react';
import { FileText, Save, AlertCircle, ArrowLeft, Crosshair } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import type { InvoiceField } from '@/types/models';
import { getInvoiceDetail, reuploadInvoice, updateInvoice } from '@/services/api';

const FIELD_LABELS: Record<string, string> = {
  Invoice_Date: 'Invoice Date',
  Invoice_No: 'Invoice No',
  Location: 'Location',
  GRN: 'GRN',
  Supplier_Name: 'Supplier Name',
  Supplier_NTN: 'Supplier NTN',
  Supplier_GST_No: 'Supplier GST No',
  Supplier_Registration_No: 'Supplier Registration No',
  Buyer_Name: 'Buyer Name',
  Buyer_NTN: 'Buyer NTN',
  Buyer_GST_No: 'Buyer GST No',
  Buyer_Registration_No: 'Buyer Registration No',
  Exclusive_Value: 'Exclusive Value (PKR)',
  GST_Sales_Tax: 'GST/Sales Tax (PKR)',
  Inclusive_Value: 'Inclusive Value (PKR)',
  Advance_Tax: 'Advance Tax (PKR)',
  Net_Amount: 'Net Amount (PKR)',
  Return: 'Return (PKR)',
  Discount: 'Discount (PKR)',
  Incentive: 'Incentive (PKR)',
};

const INVOICE_INFO_KEYS = ['Invoice_Date', 'Invoice_No', 'Location', 'GRN'] as const;
const SUPPLIER_KEYS = ['Supplier_Name', 'Supplier_NTN', 'Supplier_GST_No', 'Supplier_Registration_No'] as const;
const BUYER_KEYS = ['Buyer_Name', 'Buyer_NTN', 'Buyer_GST_No', 'Buyer_Registration_No'] as const;
const FINANCIAL_KEYS = [
  'Exclusive_Value',
  'GST_Sales_Tax',
  'Inclusive_Value',
  'Advance_Tax',
  'Net_Amount',
  'Return',
  'Discount',
  'Incentive',
] as const;

// Mandatory rules for validation/cross-check:
// - Financial mandatory fields
// - Supplier identifiers: at least one should exist (NTN/GST/Registration)
// "Total" corresponds to Inclusive_Value in the extractor.
const FINANCIAL_MANDATORY = new Set<string>(['Net_Amount', 'Inclusive_Value', 'Discount', 'Return', 'Incentive']);
const SUPPLIER_ID_FIELDS = ['Supplier_NTN', 'Supplier_GST_No', 'Supplier_Registration_No'] as const;

export function InvoiceDetailPage({ invoiceId, onBack }: { invoiceId: string; onBack: () => void }) {
  const [fields, setFields] = useState<InvoiceField[]>([]);
  const [original, setOriginal] = useState<Record<string, unknown>>({});
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pageNo, setPageNo] = useState<number | null>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string>('');
  const [needsRescan, setNeedsRescan] = useState(false);
  const [unreadableFields, setUnreadableFields] = useState<string[]>([]);
  const [fieldDiagnostics, setFieldDiagnostics] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfPreviewRef = useRef<HTMLDivElement | null>(null);
  const pdfCanvasWrapRef = useRef<HTMLDivElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    getInvoiceDetail(invoiceId)
      .then((detail) => {
        if (cancelled) return;
        setOriginal(detail.extracted ?? {});
        setDocumentUrl(detail.document_url ?? '');
        setPageNo(typeof detail.page_no === 'number' ? detail.page_no : null);
        // Keep preview gated behind a button (same-screen placeholder).
        setShowPdfPreview(false);
        const initialPage = typeof detail.page_no === 'number' && detail.page_no > 0 ? detail.page_no : 1;
        setPdfPage(initialPage);
        setNeedsRescan(Boolean(detail.needs_rescan));
        setUnreadableFields(detail.unreadable_fields ?? []);
        setFieldDiagnostics(detail.field_diagnostics ?? {});

        const extracted = detail.extracted ?? {};
        const edited = detail.edited ?? extracted;

        const unreadable = detail.unreadable_fields ?? [];
        setUnreadableFields(unreadable);

        const ORDERED_KEYS = [
          ...INVOICE_INFO_KEYS,
          ...SUPPLIER_KEYS,
          ...BUYER_KEYS,
          ...FINANCIAL_KEYS,
        ] as const;

        const nextFields: InvoiceField[] = ORDERED_KEYS.map((key) => ({
          label: FIELD_LABELS[key],
          value: String((edited as any)[key] ?? ''),
          confidence: Math.round(
            ((detail.field_diagnostics?.[key]?.confidence ??
              (unreadable.includes(String(key)) ? 0.6 : 0.95)) as number) * 100
          ),
          isEditable: true,
          fieldName: String(key),
        }));
        setFields(nextFields);
      })
      .catch(() => {
        if (!cancelled) setFields([]);
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  // Load PDF bytes and initialize PDF.js
  useEffect(() => {
    if (!showPdfPreview || !documentUrl) return;
    let cancelled = false;

    const run = async () => {
      try {
        setPdfLoading(true);
        setPdfError('');
        setPdfNumPages(0);
        pdfDocRef.current = null;

        const fileUrl = String(documentUrl).split('#')[0];
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(await res.text());
        const ab = await res.arrayBuffer();

        const pdfjs: any = await import('pdfjs-dist/build/pdf.mjs');
        const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default as string;
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

        const loadingTask = pdfjs.getDocument({ data: ab });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setPdfNumPages(Number(pdf.numPages) || 0);
      } catch (e: any) {
        if (cancelled) return;
        setPdfError(e?.message ? String(e.message) : 'Failed to load PDF preview.');
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [showPdfPreview, documentUrl]);

  // Render current PDF page into canvas
  useEffect(() => {
    if (!showPdfPreview) return;
    const pdf = pdfDocRef.current;
    const canvas = pdfCanvasRef.current;
    const wrap = pdfCanvasWrapRef.current;
    if (!pdf || !canvas || !wrap) return;

    let cancelled = false;
    const run = async () => {
      try {
        const pageIndex = Math.min(Math.max(1, pdfPage), Number(pdf.numPages) || 1);
        const page = await pdf.getPage(pageIndex);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const containerWidth = Math.max(1, wrap.clientWidth || 1);
        const scale = Math.min(3, Math.max(0.5, containerWidth / baseViewport.width));
        const viewport = page.getViewport({ scale });

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch {
        // rendering errors are non-fatal; keep UI usable
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [showPdfPreview, pdfPage, pdfNumPages]);

  const handleFieldChange = (fieldName: string, newValue: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.fieldName === fieldName ? { ...field, value: newValue } : field
      )
    );
  };

  const isEdited = (fieldName: string, value: string) => {
    const orig = (original as any)?.[fieldName];
    const origStr = orig === null || orig === undefined ? '' : String(orig);
    return origStr !== value;
  };

  const handleSave = () => {
    const edited: Record<string, unknown> = {};
    fields.forEach((f) => {
      edited[f.fieldName] = f.value;
    });
    updateInvoice(invoiceId, { edited })
      .then(() => {
        alert('Invoice data saved successfully!');
      })
      .catch(() => {
        alert('Save failed. Is the backend running on port 8000?');
      });
  };

  const avgConfidence = fields.length
    ? Math.round(fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length)
    : 0;

  const byName = new Map(fields.map((f) => [f.fieldName, f] as const));
  const groupFields = (keys: readonly string[]) =>
    keys.map((k) => byName.get(k)).filter(Boolean) as InvoiceField[];

  const openPdf = () => {
    if (!documentUrl) return;
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const locateInPdf = () => {
    if (!documentUrl) return;
    setShowPdfPreview(true);
    if (typeof pageNo === 'number' && pageNo > 0) setPdfPage(pageNo);
    // Scroll preview into view after it renders.
    setTimeout(() => {
      pdfPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const hasSupplierId = SUPPLIER_ID_FIELDS.some((k) => String(byName.get(k)?.value ?? '').trim().length > 0);

  const isMissingRequired = (fieldName: string, value: string) => {
    const hasValue = String(value ?? '').trim().length > 0;
    if (FINANCIAL_MANDATORY.has(fieldName)) return !hasValue;
    if (SUPPLIER_ID_FIELDS.includes(fieldName as any)) return !hasSupplierId;
    return false;
  };

  const missingMandatory = (Array.from(FINANCIAL_MANDATORY) as string[]).filter((k) => {
    const f = byName.get(k);
    const hasValue = String(f?.value ?? '').trim().length > 0;
    return !hasValue;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl">Invoice Details & Editor</h2>
            <p className="text-sm text-muted-foreground">
              Invoice ID: {invoiceId} · Overall AI Confidence: {avgConfidence}%
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Preview */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Document Preview
            </CardTitle>
          </CardHeader>
          <CardContent ref={pdfPreviewRef}>
            {documentUrl ? (
              showPdfPreview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {pdfNumPages > 0 ? (
                        <span>
                          Page {Math.min(Math.max(1, pdfPage), pdfNumPages)} of {pdfNumPages}
                        </span>
                      ) : typeof pageNo === 'number' ? (
                        <span>Page: {pageNo}</span>
                      ) : (
                        <span>Preview</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!pdfNumPages || pdfPage <= 1}
                        onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!pdfNumPages || pdfPage >= pdfNumPages}
                        onClick={() => setPdfPage((p) => Math.min(pdfNumPages || 1, p + 1))}
                      >
                        Next
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowPdfPreview(false)}>
                        Hide
                      </Button>
                    </div>
                  </div>

                  <div
                    ref={pdfCanvasWrapRef}
                    className="rounded-lg overflow-hidden border border-slate-200 bg-white min-h-[520px] flex items-center justify-center"
                  >
                    {pdfLoading ? (
                      <div className="text-sm text-muted-foreground">Loading PDF preview…</div>
                    ) : pdfError ? (
                      <div className="text-sm text-red-700 px-4 text-center">
                        {pdfError}
                        <div className="mt-2">
                          <Button size="sm" variant="outline" onClick={openPdf}>
                            Open PDF in new tab
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <canvas ref={pdfCanvasRef} className="w-full h-auto" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-[8.5/11] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <div className="text-center max-w-sm px-6">
                    <FileText className="w-14 h-14 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Click to preview the PDF here (inside the app).
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (typeof pageNo === 'number' && pageNo > 0) setPdfPage(pageNo);
                          setShowPdfPreview(true);
                        }}
                      >
                        Preview PDF
                      </Button>
                    </div>
                    {typeof pageNo === 'number' ? (
                      <div className="mt-3 text-xs text-muted-foreground">Page: {pageNo}</div>
                    ) : null}
                  </div>
                </div>
              )
            ) : (
              <div className="aspect-[8.5/11] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No document linked</p>
                </div>
              </div>
            )}
            {needsRescan && (
              <p className="text-sm text-orange-700 mt-3">
                This invoice was flagged as low readability. Please re-upload a clearer scan.
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  reuploadInvoice(invoiceId, f)
                    .then((detail) => {
                      setOriginal(detail.extracted ?? {});
                      setDocumentUrl(detail.document_url ?? '');
                      setNeedsRescan(Boolean(detail.needs_rescan));
                      setUnreadableFields(detail.unreadable_fields ?? []);
                      alert('Re-uploaded and reprocessed. Invoice record updated.');
                    })
                    .catch(() => alert('Re-upload failed. Is the backend running?'));
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Re-upload & Replace
              </Button>
              <p className="text-xs text-muted-foreground">
                Upload a clearer PDF; this will replace this invoice’s document + extraction.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Editable Form */}
        <div className="space-y-6">
          {/* Invoice Information */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupFields(INVOICE_INFO_KEYS as unknown as string[]).map((field) => (
                <div key={field.fieldName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.fieldName}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      {isEdited(field.fieldName, field.value) && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                          Edited
                        </Badge>
                      )}
                      <Badge
                        variant={field.confidence >= 90 ? 'default' : field.confidence >= 75 ? 'secondary' : 'destructive'}
                        className={
                          field.confidence >= 90
                            ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
                            : field.confidence >= 75
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs'
                            : 'text-xs'
                        }
                      >
                        AI: {field.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <Input
                    id={field.fieldName}
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                    className={
                      (() => {
                        const hasValue = String(field.value ?? '').trim().length > 0;
                        const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                        const flagged = ['ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                        const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                        return isMissingMandatory && field.confidence < 90 ? 'border-orange-300 bg-orange-50/30' : flagged ? 'border-orange-300 bg-orange-50/30' : '';
                      })()
                    }
                  />
                  {isEdited(field.fieldName, field.value) && (
                    <p className="text-xs text-slate-500">
                      Original: {String((original as any)?.[field.fieldName] ?? '')}
                    </p>
                  )}
                  {(() => {
                    const hasValue = String(field.value ?? '').trim().length > 0;
                    const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                    const flagged = ['ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                    const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                    // Only show "missing/low confidence" when a mandatory financial value is missing.
                    return flagged || (isMissingMandatory && field.confidence < 90);
                  })() && (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-orange-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldDiagnostics?.[field.fieldName]?.status
                          ? `Flagged: ${String(fieldDiagnostics?.[field.fieldName]?.status)}`
                          : 'Low confidence - please verify'}
                        {fieldDiagnostics?.[field.fieldName]?.reason
                          ? ` · ${String(fieldDiagnostics?.[field.fieldName]?.reason)}`
                          : ''}
                      </p>
                      {documentUrl ? (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={locateInPdf}>
                          <Crosshair className="w-3 h-3 mr-1" />
                          Locate in PDF
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Supplier Details */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasSupplierId && (
                <div className="p-3 rounded-lg border border-orange-200 bg-orange-50 text-sm text-orange-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Missing mandatory supplier identifiers: Supplier NTN / Supplier GST No / Supplier Registration No
                </div>
              )}
              {groupFields(SUPPLIER_KEYS as unknown as string[]).map((field) => (
                <div key={field.fieldName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.fieldName}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      {isEdited(field.fieldName, field.value) && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                          Edited
                        </Badge>
                      )}
                      <Badge
                        variant={field.confidence >= 90 ? 'default' : field.confidence >= 75 ? 'secondary' : 'destructive'}
                        className={
                          field.confidence >= 90
                            ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
                            : field.confidence >= 75
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs'
                            : 'text-xs'
                        }
                      >
                        AI: {field.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <Input
                    id={field.fieldName}
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                    className={
                      (() => {
                        const hasValue = String(field.value ?? '').trim().length > 0;
                        const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                        const flagged = ['ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                        const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                        return isMissingMandatory && field.confidence < 90 ? 'border-orange-300 bg-orange-50/30' : flagged ? 'border-orange-300 bg-orange-50/30' : '';
                      })()
                    }
                  />
                  {isEdited(field.fieldName, field.value) && (
                    <p className="text-xs text-slate-500">
                      Original: {String((original as any)?.[field.fieldName] ?? '')}
                    </p>
                  )}
                  {(() => {
                    const hasValue = String(field.value ?? '').trim().length > 0;
                    const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                    const flagged = ['ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                    const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                    return flagged || (isMissingMandatory && field.confidence < 90);
                  })() && (
                    <p className="text-xs text-orange-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldDiagnostics?.[field.fieldName]?.status
                        ? `Flagged: ${String(fieldDiagnostics?.[field.fieldName]?.status)}`
                        : 'Low confidence - please verify'}
                      {fieldDiagnostics?.[field.fieldName]?.reason
                        ? ` · ${String(fieldDiagnostics?.[field.fieldName]?.reason)}`
                        : ''}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Buyer Details */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Buyer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupFields(BUYER_KEYS as unknown as string[]).map((field) => (
                <div key={field.fieldName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.fieldName}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      {isEdited(field.fieldName, field.value) && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                          Edited
                        </Badge>
                      )}
                      <Badge
                        variant={field.confidence >= 90 ? 'default' : field.confidence >= 75 ? 'secondary' : 'destructive'}
                        className={
                          field.confidence >= 90
                            ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
                            : field.confidence >= 75
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs'
                            : 'text-xs'
                        }
                      >
                        AI: {field.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <Input
                    id={field.fieldName}
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                    className={
                      (() => {
                        const hasValue = String(field.value ?? '').trim().length > 0;
                        const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                        const flagged = ['ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                        const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                        return isMissingMandatory && field.confidence < 90 ? 'border-orange-300 bg-orange-50/30' : flagged ? 'border-orange-300 bg-orange-50/30' : '';
                      })()
                    }
                  />
                  {isEdited(field.fieldName, field.value) && (
                    <p className="text-xs text-slate-500">
                      Original: {String((original as any)?.[field.fieldName] ?? '')}
                    </p>
                  )}
                  {(() => {
                    const hasValue = String(field.value ?? '').trim().length > 0;
                    const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                    const flagged = ['handwritten', 'ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                    const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                    return flagged || (isMissingMandatory && field.confidence < 90);
                  })() && (
                    <p className="text-xs text-orange-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldDiagnostics?.[field.fieldName]?.status
                        ? `Flagged: ${String(fieldDiagnostics?.[field.fieldName]?.status)}`
                        : 'Low confidence - please verify'}
                      {fieldDiagnostics?.[field.fieldName]?.reason
                        ? ` · ${String(fieldDiagnostics?.[field.fieldName]?.reason)}`
                        : ''}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {missingMandatory.length > 0 && (
                <div className="p-3 rounded-lg border border-orange-200 bg-orange-50 text-sm text-orange-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Missing mandatory financial fields: {missingMandatory.join(', ')} (Total = Inclusive_Value)
                </div>
              )}
              {groupFields(FINANCIAL_KEYS as unknown as string[]).map((field) => (
                <div key={field.fieldName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.fieldName}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      {isEdited(field.fieldName, field.value) && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                          Edited
                        </Badge>
                      )}
                      <Badge
                        variant={field.confidence >= 90 ? 'default' : field.confidence >= 75 ? 'secondary' : 'destructive'}
                        className={
                          field.confidence >= 90
                            ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
                            : field.confidence >= 75
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs'
                            : 'text-xs'
                        }
                      >
                        AI: {field.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <Input
                    id={field.fieldName}
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                    className={
                      (() => {
                        const hasValue = String(field.value ?? '').trim().length > 0;
                        const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                        const flagged = ['ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                        const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                        return isMissingMandatory && field.confidence < 90 ? 'border-orange-300 bg-orange-50/30' : flagged ? 'border-orange-300 bg-orange-50/30' : '';
                      })()
                    }
                  />
                  {isEdited(field.fieldName, field.value) && (
                    <p className="text-xs text-slate-500">
                      Original: {String((original as any)?.[field.fieldName] ?? '')}
                    </p>
                  )}
                  {(() => {
                    const hasValue = String(field.value ?? '').trim().length > 0;
                    const status = String(fieldDiagnostics?.[field.fieldName]?.status ?? '');
                    const flagged = ['handwritten', 'ambiguous', 'blurry', 'faded', 'cut_off', 'unreadable'].includes(status);
                    const isMissingMandatory = isMissingRequired(field.fieldName, field.value);
                    return flagged || (isMissingMandatory && field.confidence < 90);
                  })() && (
                    <p className="text-xs text-orange-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldDiagnostics?.[field.fieldName]?.status
                        ? `Flagged: ${String(fieldDiagnostics?.[field.fieldName]?.status)}`
                        : 'Low confidence - please verify'}
                      {fieldDiagnostics?.[field.fieldName]?.reason
                        ? ` · ${String(fieldDiagnostics?.[field.fieldName]?.reason)}`
                        : ''}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
