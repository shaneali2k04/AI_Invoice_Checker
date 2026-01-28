import { useEffect, useMemo, useState } from 'react';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, X, Eye, CheckCircle, RefreshCw, Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { listAIReview, updateInvoice } from '@/services/api';
import type { ApiInvoiceListItem } from '@/services/api';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useUploadManager } from '@/contexts/upload-manager';

// Mandatory rules for review flags:
// - Financial mandatory fields (Total is Inclusive_Value)
// - Supplier identifiers: at least one of NTN/GST/Registration must exist
const FINANCIAL_MANDATORY_FIELDS: ReadonlyArray<string> = ['Net_Amount', 'Inclusive_Value', 'Discount', 'Return', 'Incentive'];
const SUPPLIER_ID_FIELDS: ReadonlyArray<string> = ['Supplier_NTN', 'Supplier_GST_No', 'Supplier_Registration_No'];

type IssueType = 'blurry' | 'missing-fields' | 'low-confidence';
type ReviewStatus = 'pending' | 'in-review';

type ReviewRow = {
  id: string;
  documentId: string;
  pageNo: number;
  invoiceNo: string;
  supplierName: string;
  date: string;
  amount: number;
  issueType: IssueType;
  affectedFields: string[];
  aiConfidence: number; // 0..100
  status: ReviewStatus;
};

function toReviewRow(inv: ApiInvoiceListItem): ReviewRow {
  const cur = (inv.current ?? inv.extracted ?? {}) as Record<string, unknown>;
  const missingFinancial = FINANCIAL_MANDATORY_FIELDS.filter((k) => {
    const v = cur[k];
    if (v === null || v === undefined) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (typeof v === 'number') return !Number.isFinite(v);
    return false;
  });

  const hasSupplierId = SUPPLIER_ID_FIELDS.some((k) => {
    const v = cur[k];
    return v !== null && v !== undefined && String(v).trim() !== '';
  });

  const missingSupplierIds = hasSupplierId ? [] : [...SUPPLIER_ID_FIELDS];
  const missingMandatory = [...missingFinancial, ...missingSupplierIds];

  const issueType: IssueType =
    missingMandatory.length > 0 ? 'missing-fields' : inv.needs_rescan ? 'blurry' : 'low-confidence';

  const affectedFields = Array.from(new Set([...(inv.unreadable_fields ?? []), ...missingMandatory]));
  const aiConfidence = Math.round(((inv.system_confidence ?? inv.model_avg_confidence ?? 0) as number) * 100);

  return {
    id: inv.id,
    documentId: inv.document_id,
    pageNo: inv.page_no,
    invoiceNo: String(cur?.Invoice_No ?? inv.id),
    supplierName: String(cur?.Supplier_Name ?? ''),
    date: String(cur?.Invoice_Date ?? ''),
    amount: Number(cur?.Net_Amount ?? 0),
    issueType,
    affectedFields,
    aiConfidence,
    status: inv.needs_rescan ? 'pending' : 'in-review',
  };
}

export function UploadPage({ onViewInvoice }: { onViewInvoice: (id: string) => void }) {
  const { files, stats, startUpload, removeFile, formatFileSize } = useUploadManager();
  const [isDragging, setIsDragging] = useState(false);

  const [reviewInvoices, setReviewInvoices] = useState<ReviewRow[]>([]);
  const [reviewTab, setReviewTab] = useState<'all' | IssueType>('all');
  const [reviewSearch, setReviewSearch] = useState('');
  const [loadingReview, setLoadingReview] = useState(false);
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});
  const [lastApprovedMsg, setLastApprovedMsg] = useState<string>('');

  const refreshReview = async () => {
    try {
      setLoadingReview(true);
      const data = await listAIReview();
      setReviewInvoices(data.map(toReviewRow));
    } catch {
      setReviewInvoices([]);
    } finally {
      setLoadingReview(false);
    }
  };

  useEffect(() => {
    void refreshReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statsReview = useMemo(() => {
    const all = reviewInvoices.length;
    const blurry = reviewInvoices.filter((i) => i.issueType === 'blurry').length;
    const missing = reviewInvoices.filter((i) => i.issueType === 'missing-fields').length;
    const low = reviewInvoices.filter((i) => i.issueType === 'low-confidence').length;
    return { all, blurry, missing, low };
  }, [reviewInvoices]);

  const norm = (v: unknown) =>
    String(v ?? '')
      .toLowerCase()
      .replace(/[\s,]+/g, ' ')
      .trim();

  const visibleReview = useMemo(() => {
    const q = norm(reviewSearch);
    const byTab =
      reviewTab === 'all' ? reviewInvoices : reviewInvoices.filter((r) => r.issueType === reviewTab);
    if (!q) return byTab;
    return byTab.filter((r) => norm([r.invoiceNo, r.supplierName, r.date, r.amount, ...(r.affectedFields ?? [])].join(' | ')).includes(q));
  }, [reviewInvoices, reviewSearch, reviewTab]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(
      Number.isFinite(amount) ? amount : 0
    );

  const approveFromUpload = (id: string) => {
    setApprovingIds((prev) => ({ ...prev, [id]: true }));
    updateInvoice(id, { status: 'approved' })
      .then(() => {
        // Remove from review list immediately; it will appear in approved invoices list.
        setReviewInvoices((prev) => prev.filter((x) => x.id !== id));
        setLastApprovedMsg('Invoice approved and moved to Invoices List.');
      })
      .catch(() => {
        alert('Approve failed. Is the backend running?');
      })
      .finally(() => {
        setApprovingIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      });
  };

  const openPdf = (row: ReviewRow) => {
    if (!row.documentId) return;
    const page = row.pageNo ? `#page=${row.pageNo}` : '';
    const url = `/api/documents/${row.documentId}/file${page}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    startUpload(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      startUpload(selectedFiles);
      // Allow selecting the same file again (otherwise onChange won't fire).
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Files</p>
            <p className="text-2xl">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Processing</p>
            <p className="text-2xl text-blue-600">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Needs Review</p>
            <p className="text-2xl text-orange-600">{stats.needsReview}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Failed</p>
            <p className="text-2xl text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Upload Invoice Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">Drag & drop PDF files here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse and select files
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button type="button" asChild>
                <span>Select Files</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-4">
              Supported format: PDF · Maximum file size: 12MB per file
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upload Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {file.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : file.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                              file.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : file.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : file.status === 'processing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {file.status === 'uploading'
                              ? 'Uploading'
                              : file.status === 'processing'
                              ? 'AI Processing'
                              : file.status === 'completed'
                              ? 'Completed'
                              : file.status === 'failed'
                              ? 'Failed'
                              : 'Needs Review'}
                          </span>
                          {file.status === 'completed' && file.needsReview && (
                            <span className="px-2 py-1 rounded text-xs whitespace-nowrap bg-orange-100 text-orange-700">
                              Needs Review
                            </span>
                          )}
                          {file.confidence !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              AI: {Math.round(file.confidence)}%
                            </span>
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <div>
                          <Progress value={file.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {file.progress}% complete
                          </p>
                        </div>
                      )}
                      {file.status === 'completed' && file.needsReview && (
                        <div className="mt-2 p-2 bg-orange-50 rounded text-sm text-orange-700">
                          <AlertTriangle className="w-4 h-4 inline mr-2" />
                          Processed, but some pages/invoices were flagged (missing mandatory fields or unclear values). Please review below.
                        </div>
                      )}
                      {file.status === 'failed' && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          <XCircle className="w-4 h-4 inline mr-2" />
                          Failed to process. {file.error ? `(${file.error})` : 'Please check the file and try again.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice List (Review & Approve) */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Invoice List</CardTitle>
          <Button variant="outline" size="sm" onClick={refreshReview} disabled={loadingReview}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {loadingReview ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastApprovedMsg && (
            <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-sm text-green-800 flex items-center justify-between gap-4">
              <span>{lastApprovedMsg}</span>
              <button
                className="text-xs text-green-800/80 hover:text-green-900 underline"
                onClick={() => setLastApprovedMsg('')}
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              placeholder="Search by invoice number or supplier..."
              className="pl-10"
            />
          </div>

          <Tabs value={reviewTab} onValueChange={(v) => setReviewTab(v as any)}>
            <TabsList className="mb-2">
              <TabsTrigger value="all">All ({statsReview.all})</TabsTrigger>
              <TabsTrigger value="blurry">Blurry ({statsReview.blurry})</TabsTrigger>
              <TabsTrigger value="missing-fields">Missing Fields ({statsReview.missing})</TabsTrigger>
              <TabsTrigger value="low-confidence">Low Confidence ({statsReview.low})</TabsTrigger>
            </TabsList>
            <TabsContent value={reviewTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead style={{ minWidth: '280px' }}>Affected Fields</TableHead>
                      <TableHead className="text-center">AI Confidence</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleReview.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium whitespace-nowrap">{row.invoiceNo}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.supplierName}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(row.amount)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={
                              row.issueType === 'missing-fields'
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                                : row.issueType === 'blurry'
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                            }
                          >
                            {row.issueType === 'missing-fields'
                              ? 'Missing Fields'
                              : row.issueType === 'blurry'
                              ? 'Blurry/Low Quality'
                              : 'Low AI Confidence'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(row.affectedFields ?? []).slice(0, 6).map((f) => (
                              <span key={f} className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded">
                                {f}
                              </span>
                            ))}
                            {(row.affectedFields ?? []).length > 6 && (
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                +{(row.affectedFields ?? []).length - 6} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={row.aiConfidence >= 90 ? 'default' : row.aiConfidence >= 75 ? 'secondary' : 'destructive'}
                            className={
                              row.aiConfidence >= 90
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : row.aiConfidence >= 75
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                                : ''
                            }
                          >
                            {row.aiConfidence}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={
                              row.status === 'pending'
                                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                            }
                          >
                            {row.status === 'pending' ? 'Pending' : 'In Review'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onViewInvoice(row.id)} title="View">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openPdf(row)} title="Open PDF">
                              <FileText className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground ml-1 whitespace-nowrap">
                              Page: {row.pageNo}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => approveFromUpload(row.id)}
                              disabled={Boolean(approvingIds[row.id])}
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {visibleReview.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                          No invoices to review right now.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
