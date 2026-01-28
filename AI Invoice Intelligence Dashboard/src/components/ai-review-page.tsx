import { useEffect, useState } from 'react';
import { AlertTriangle, Eye, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { ProblematicInvoice } from '@/types/models';
import { listAIReview, updateInvoice } from '@/services/api';

const MANDATORY_FIELDS: ReadonlyArray<string> = [
  'Invoice_Date',
  'Invoice_No',
  'Supplier_Name',
  'Supplier_NTN',
  'Supplier_GST_No',
  'Supplier_Registration_No',
  'Buyer_Name',
  'Buyer_NTN',
  'Buyer_GST_No',
  'Buyer_Registration_No',
  'Exclusive_Value',
  'GST_Sales_Tax',
  'Inclusive_Value',
  'Net_Amount',
];

export function AIReviewPage({ onViewInvoice }: { onViewInvoice: (id: string) => void }) {
  const [invoices, setInvoices] = useState<ProblematicInvoice[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    listAIReview()
      .then((data) => (!cancelled ? setInvoices(
        data.map((inv) => ({
          id: inv.id,
          invoiceNo: String((inv.current ?? inv.extracted)?.Invoice_No ?? inv.id),
          supplierName: String((inv.current ?? inv.extracted)?.Supplier_Name ?? ''),
          date: String((inv.current ?? inv.extracted)?.Invoice_Date ?? ''),
          amount: Number((inv.current ?? inv.extracted)?.Net_Amount ?? 0),
          issueType: (() => {
            const cur = (inv.current ?? inv.extracted ?? {}) as Record<string, unknown>;
            const missingMandatory = MANDATORY_FIELDS.filter((k) => {
              const v = cur[k];
              if (v === null || v === undefined) return true;
              if (typeof v === 'string') return v.trim() === '';
              if (typeof v === 'number') return !Number.isFinite(v);
              return false;
            });
            if (missingMandatory.length > 0) return 'missing-fields';
            if (inv.needs_rescan) return 'blurry';
            return 'low-confidence';
          })(),
          affectedFields: [
            ...(inv.unreadable_fields ?? []),
          ],
          aiConfidence: Math.round(((inv.model_avg_confidence ?? 0) as number) * 100),
          status: inv.needs_rescan ? 'pending' : 'in-review', // kept for now (not shown in UI)
        }))
      ) : undefined))
      .catch(() => {
        if (!cancelled) setInvoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const approveInvoice = (id: string) => {
    setApprovingIds((prev) => ({ ...prev, [id]: true }));
    updateInvoice(id, { status: 'approved' })
      .then(() => {
        // Remove from AI review queue immediately (bulk workflow)
        setInvoices((prev) => prev.filter((x) => x.id !== id));
      })
      .catch(() => {
        // keep row and let user retry
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

  const filteredInvoices = invoices.filter((inv) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'blurry') return inv.issueType === 'blurry';
    if (activeTab === 'missing') return inv.issueType === 'missing-fields';
    if (activeTab === 'low-confidence') return inv.issueType === 'low-confidence';
    return true;
  });

  const norm = (v: unknown) =>
    String(v ?? '')
      .toLowerCase()
      .replace(/[\s,]+/g, ' ')
      .trim();
  const q = norm(searchTerm);
  const visibleInvoices = filteredInvoices.filter((inv) => {
    if (!q) return true;
    const haystack = norm(
      [inv.invoiceNo, inv.supplierName, inv.date, inv.amount, ...(inv.affectedFields ?? [])].join(' | ')
    );
    return haystack.includes(q);
  });

  const stats = {
    total: invoices.length,
    blurry: invoices.filter((i) => i.issueType === 'blurry').length,
    missing: invoices.filter((i) => i.issueType === 'missing-fields').length,
    lowConfidence: invoices.filter((i) => i.issueType === 'low-confidence').length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl mb-1">AI Readability & Error Review</h2>
        <p className="text-sm text-muted-foreground">
          Review and correct invoices flagged by the AI system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Issues</p>
                <p className="text-2xl">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blurry</p>
                <p className="text-2xl">{stats.blurry}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missing Fields</p>
                <p className="text-2xl">{stats.missing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Confidence</p>
                <p className="text-2xl">{stats.lowConfidence}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Problematic Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="blurry">Blurry ({stats.blurry})</TabsTrigger>
              <TabsTrigger value="missing">Missing Fields ({stats.missing})</TabsTrigger>
              <TabsTrigger value="low-confidence">Low Confidence ({stats.lowConfidence})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="mb-4">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoice no, supplier, amount (e.g., 234500, 5000)..."
                />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead style={{ minWidth: '280px' }}>Affected Fields</TableHead>
                      <TableHead className="text-center">AI Confidence</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                        <TableCell>{invoice.supplierName}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {invoice.affectedFields.map((field, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              invoice.aiConfidence >= 75 ? 'secondary' : 'destructive'
                            }
                            className={
                              invoice.aiConfidence >= 75
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
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => approveInvoice(invoice.id)}
                              disabled={Boolean(approvingIds[invoice.id])}
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="shadow-sm border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">AI Review Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Blurry documents:</strong> May require manual re-upload with better quality</li>
                <li>• <strong>Missing fields:</strong> Check if information is available elsewhere in the document</li>
                <li>• <strong>Low confidence:</strong> Verify AI-extracted data against the original document</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}