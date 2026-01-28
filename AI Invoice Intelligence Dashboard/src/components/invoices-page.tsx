import { useEffect, useState } from 'react';
import { Search, Filter, Download, Edit, Eye, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import type { Invoice } from '@/types/models';
import { exportInvoicesXlsx, listInvoices } from '@/services/api';

export function InvoicesPage({ onViewInvoice }: { onViewInvoice: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listInvoices()
      .then((data) => {
        if (cancelled) return;
        // Backend returns a different shape; map it into the UI Invoice model.
        setInvoices(
          data.map((inv) => ({
            id: inv.id,
            documentId: inv.document_id,
            pageNo: inv.page_no,
            Invoice_Date: String((inv.current ?? inv.extracted)?.Invoice_Date ?? ''),
            Invoice_No: String((inv.current ?? inv.extracted)?.Invoice_No ?? ''),
            Supplier_Name: String((inv.current ?? inv.extracted)?.Supplier_Name ?? ''),
            Supplier_NTN: String((inv.current ?? inv.extracted)?.Supplier_NTN ?? ''),
            Supplier_GST_No: String((inv.current ?? inv.extracted)?.Supplier_GST_No ?? ''),
            Supplier_Registration_No: String((inv.current ?? inv.extracted)?.Supplier_Registration_No ?? ''),
            Buyer_Name: String((inv.current ?? inv.extracted)?.Buyer_Name ?? ''),
            Buyer_NTN: String((inv.current ?? inv.extracted)?.Buyer_NTN ?? ''),
            Buyer_GST_No: String((inv.current ?? inv.extracted)?.Buyer_GST_No ?? ''),
            Buyer_Registration_No: String((inv.current ?? inv.extracted)?.Buyer_Registration_No ?? ''),
            Exclusive_Value: Number((inv.current ?? inv.extracted)?.Exclusive_Value ?? 0),
            GST_Sales_Tax: Number((inv.current ?? inv.extracted)?.GST_Sales_Tax ?? 0),
            Inclusive_Value: Number((inv.current ?? inv.extracted)?.Inclusive_Value ?? 0),
            Advance_Tax: Number((inv.current ?? inv.extracted)?.Advance_Tax ?? 0),
            Net_Amount: Number((inv.current ?? inv.extracted)?.Net_Amount ?? 0),
            Return: Number((inv.current ?? inv.extracted)?.Return ?? 0),
            Discount: Number((inv.current ?? inv.extracted)?.Discount ?? 0),
            Incentive: Number((inv.current ?? inv.extracted)?.Incentive ?? 0),
            Location: String((inv.current ?? inv.extracted)?.Location ?? ''),
            GRN: String((inv.current ?? inv.extracted)?.GRN ?? ''),
            // Prefer the system-computed confidence (post "no-guess" gating + validations),
            // fall back to model-reported avg confidence. Both are 0..1.
            aiConfidence: Math.round(
              ((inv.system_confidence ?? inv.model_avg_confidence ?? 0) as number) * 100
            ),
            status: (inv.status as any) ?? 'needs-review',
            hasIssues: Boolean(inv.needs_rescan) || (inv.unreadable_fields?.length ?? 0) > 0,
            priceVariance: undefined,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setInvoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const norm = (v: unknown) =>
    String(v ?? '')
      .toLowerCase()
      .replace(/[\s,]+/g, ' ')
      .trim();
  const normNum = (n: number) => {
    if (!Number.isFinite(n)) return '';
    // Support searching both "234500" and "234,500"
    const raw = String(Math.trunc(n));
    return `${raw} ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(n)}`;
  };

  const q = norm(searchTerm);
  const filteredInvoices = invoices
    // Show invoices that are OK or approved.
    // Backend uses:
    // - auto-extracted => extracted cleanly (OK)
    // - needs-review  => requires human review
    // - approved      => explicitly approved by user
    .filter((inv) => inv.status === 'approved' || inv.status === 'auto-extracted')
    .filter((inv) => {
    if (!q) return true;
    const haystack = norm(
      [
        inv.Invoice_No,
        inv.Invoice_Date,
        inv.Supplier_Name,
        inv.Supplier_NTN,
        inv.Supplier_Registration_No,
        inv.Buyer_Name,
        inv.Buyer_NTN,
        inv.Location,
        inv.GRN,
        normNum(inv.Exclusive_Value),
        normNum(inv.GST_Sales_Tax),
        normNum(inv.Inclusive_Value),
        normNum(inv.Advance_Tax),
        normNum(inv.Net_Amount),
        normNum(inv.Return),
        normNum(inv.Discount),
        normNum(inv.Incentive),
      ].join(' | ')
    );
    return haystack.includes(q);
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const openPdf = (invoice: Invoice) => {
    if (!invoice.documentId) return;
    const page = invoice.pageNo ? `#page=${invoice.pageNo}` : '';
    const url = `/api/documents/${invoice.documentId}/file${page}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { blob, filename } = await exportInvoicesXlsx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Export failed. ${String((e as any)?.message ?? e)}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Invoice Management</h2>
          <p className="text-sm text-muted-foreground">
            {filteredInvoices.length} invoices found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by invoice, party, GRN, or amount (e.g., 198728, 5000)..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Supplier NTN</TableHead>
                  <TableHead>Supplier GST No</TableHead>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead className="text-right">Exclusive Value</TableHead>
                  <TableHead className="text-right">GST/Sales Tax</TableHead>
                  <TableHead className="text-right">Inclusive Value</TableHead>
                  <TableHead className="text-right">Advance Tax</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead className="text-center">Price Variance</TableHead>
                  <TableHead className="text-right">Return</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Incentive</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>GRN</TableHead>
                  <TableHead className="text-center">AI</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className={invoice.hasIssues ? 'bg-orange-50/50' : ''}
                  >
                    <TableCell>
                      {invoice.status === 'auto-extracted' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : invoice.status === 'needs-review' ? (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{invoice.Invoice_Date}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {invoice.Invoice_No}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{invoice.Supplier_Name}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {invoice.Supplier_NTN}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {invoice.Supplier_GST_No}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{invoice.Buyer_Name}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(invoice.Exclusive_Value)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(invoice.GST_Sales_Tax)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap font-medium">
                      {formatCurrency(invoice.Inclusive_Value)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(invoice.Advance_Tax)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap font-medium text-blue-700">
                      {formatCurrency(invoice.Net_Amount)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums whitespace-nowrap">
                      {invoice.priceVariance !== undefined ? (
                        <Badge
                          variant={
                            invoice.priceVariance > 0
                              ? 'secondary'
                              : 'default'
                          }
                          className={
                            invoice.priceVariance > 0
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                              : 'bg-green-100 text-green-700 hover:bg-green-100'
                          }
                        >
                          {invoice.priceVariance > 0 ? '+' : ''}
                          {invoice.priceVariance}%
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="bg-gray-100 text-gray-700 hover:bg-gray-100"
                        >
                          N/A
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(invoice.Return)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(invoice.Discount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(invoice.Incentive)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{invoice.Location}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {invoice.GRN}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          invoice.aiConfidence >= 90
                            ? 'default'
                            : invoice.aiConfidence >= 75
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          invoice.aiConfidence >= 90
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : invoice.aiConfidence >= 75
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                            : ''
                        }
                      >
                        {invoice.aiConfidence}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewInvoice(invoice.id)}
                          title="Open invoice details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdf(invoice)}
                          disabled={!invoice.documentId}
                          title="Open PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        {invoice.documentId && invoice.pageNo ? (
                          <span className="text-xs text-muted-foreground ml-1 whitespace-nowrap">
                            Page: {invoice.pageNo}
                          </span>
                        ) : null}
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {filteredInvoices.length} of {filteredInvoices.length} results
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}