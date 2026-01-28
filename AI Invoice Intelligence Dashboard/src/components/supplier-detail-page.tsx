import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Package, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface SupplierDetailPageProps {
  supplierId: string;
  onBack: () => void;
}

interface Supplier {
  id: string;
  name: string;
  ntn: string;
  gstNo: string;
  registrationNo: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalInvoices: number;
  totalAmount: number;
  avgConfidence: number;
  status: 'active' | 'inactive';
  lastInvoiceDate: string;
}

interface Invoice {
  id: string;
  Invoice_Date: string;
  Invoice_No: string;
  Supplier_Name: string;
  Exclusive_Value: number;
  GST_Sales_Tax: number;
  Inclusive_Value: number;
  Net_Amount: number;
  Location: string;
  GRN: string;
  aiConfidence: number;
  status: 'auto-extracted' | 'needs-review' | 'approved';
}

const supplierData: Record<string, Supplier> = {
  '1': {
    id: '1',
    name: 'Metro Cash & Carry',
    ntn: '1234567-8',
    gstNo: 'GST-001-234',
    registrationNo: 'REG-MC-001',
    contactPerson: 'Ahmed Raza',
    email: 'ahmed@metro.com.pk',
    phone: '+92-21-1234567',
    address: 'Plot 123, Industrial Area',
    city: 'Karachi',
    totalInvoices: 45,
    totalAmount: 8950000,
    avgConfidence: 98,
    status: 'active',
    lastInvoiceDate: '2025-01-22',
  },
  '2': {
    id: '2',
    name: 'Unilever Pakistan',
    ntn: '2345678-9',
    gstNo: 'GST-002-345',
    registrationNo: 'REG-UP-002',
    contactPerson: 'Fatima Khan',
    email: 'fatima@unilever.com.pk',
    phone: '+92-42-9876543',
    address: 'Unilever House, Main Boulevard',
    city: 'Lahore',
    totalInvoices: 38,
    totalAmount: 7200000,
    avgConfidence: 76,
    status: 'active',
    lastInvoiceDate: '2025-01-22',
  },
  '3': {
    id: '3',
    name: 'Nestle Pakistan',
    ntn: '3456789-0',
    gstNo: 'GST-003-456',
    registrationNo: 'REG-NP-003',
    contactPerson: 'Hassan Ali',
    email: 'hassan@nestle.com.pk',
    phone: '+92-51-2345678',
    address: 'Nestle Business Centre, F-7',
    city: 'Islamabad',
    totalInvoices: 32,
    totalAmount: 5020000,
    avgConfidence: 95,
    status: 'active',
    lastInvoiceDate: '2025-01-21',
  },
  '4': {
    id: '4',
    name: 'P&G Pakistan',
    ntn: '4567890-1',
    gstNo: 'GST-004-567',
    registrationNo: 'REG-PG-004',
    contactPerson: 'Ayesha Malik',
    email: 'ayesha@pg.com.pk',
    phone: '+92-21-8765432',
    address: 'P&G Plaza, Clifton',
    city: 'Karachi',
    totalInvoices: 28,
    totalAmount: 8360000,
    avgConfidence: 92,
    status: 'active',
    lastInvoiceDate: '2025-01-21',
  },
  '5': {
    id: '5',
    name: 'Coca-Cola Pakistan',
    ntn: '5678901-2',
    gstNo: 'GST-005-678',
    registrationNo: 'REG-CC-005',
    contactPerson: 'Usman Tariq',
    email: 'usman@cocacola.com.pk',
    phone: '+92-41-3456789',
    address: 'Industrial Estate, Main Road',
    city: 'Faisalabad',
    totalInvoices: 25,
    totalAmount: 4290000,
    avgConfidence: 88,
    status: 'active',
    lastInvoiceDate: '2025-01-20',
  },
};

// Sample invoices for each supplier
const invoicesBySupplier: Record<string, Invoice[]> = {
  '1': [
    {
      id: '1',
      Invoice_Date: '2025-01-22',
      Invoice_No: 'INV-2025-0234',
      Supplier_Name: 'Metro Cash & Carry',
      Exclusive_Value: 198728,
      GST_Sales_Tax: 35772,
      Inclusive_Value: 234500,
      Net_Amount: 234500,
      Location: 'Karachi',
      GRN: 'GRN-2025-0456',
      aiConfidence: 98,
      status: 'auto-extracted',
    },
    {
      id: '11',
      Invoice_Date: '2025-01-20',
      Invoice_No: 'INV-2025-0224',
      Supplier_Name: 'Metro Cash & Carry',
      Exclusive_Value: 175500,
      GST_Sales_Tax: 31590,
      Inclusive_Value: 207090,
      Net_Amount: 207090,
      Location: 'Karachi',
      GRN: 'GRN-2025-0446',
      aiConfidence: 97,
      status: 'approved',
    },
    {
      id: '12',
      Invoice_Date: '2025-01-18',
      Invoice_No: 'INV-2025-0214',
      Supplier_Name: 'Metro Cash & Carry',
      Exclusive_Value: 189200,
      GST_Sales_Tax: 34056,
      Inclusive_Value: 223256,
      Net_Amount: 223256,
      Location: 'Lahore',
      GRN: 'GRN-2025-0436',
      aiConfidence: 99,
      status: 'approved',
    },
  ],
  '2': [
    {
      id: '2',
      Invoice_Date: '2025-01-22',
      Invoice_No: 'INV-2025-0233',
      Supplier_Name: 'Unilever Pakistan',
      Exclusive_Value: 160170,
      GST_Sales_Tax: 29030,
      Inclusive_Value: 189200,
      Net_Amount: 187308,
      Location: 'Lahore',
      GRN: 'GRN-2025-0457',
      aiConfidence: 76,
      status: 'needs-review',
    },
    {
      id: '13',
      Invoice_Date: '2025-01-19',
      Invoice_No: 'INV-2025-0223',
      Supplier_Name: 'Unilever Pakistan',
      Exclusive_Value: 145600,
      GST_Sales_Tax: 26208,
      Inclusive_Value: 171808,
      Net_Amount: 171808,
      Location: 'Karachi',
      GRN: 'GRN-2025-0443',
      aiConfidence: 78,
      status: 'approved',
    },
  ],
  '3': [
    {
      id: '3',
      Invoice_Date: '2025-01-21',
      Invoice_No: 'INV-2025-0232',
      Supplier_Name: 'Nestle Pakistan',
      Exclusive_Value: 132880,
      GST_Sales_Tax: 23920,
      Inclusive_Value: 156800,
      Net_Amount: 156800,
      Location: 'Islamabad',
      GRN: 'GRN-2025-0458',
      aiConfidence: 95,
      status: 'approved',
    },
    {
      id: '14',
      Invoice_Date: '2025-01-17',
      Invoice_No: 'INV-2025-0212',
      Supplier_Name: 'Nestle Pakistan',
      Exclusive_Value: 128500,
      GST_Sales_Tax: 23130,
      Inclusive_Value: 151630,
      Net_Amount: 151630,
      Location: 'Islamabad',
      GRN: 'GRN-2025-0432',
      aiConfidence: 96,
      status: 'approved',
    },
  ],
  '4': [
    {
      id: '4',
      Invoice_Date: '2025-01-21',
      Invoice_No: 'INV-2025-0231',
      Supplier_Name: 'P&G Pakistan',
      Exclusive_Value: 252840,
      GST_Sales_Tax: 45510,
      Inclusive_Value: 298450,
      Net_Amount: 295466,
      Location: 'Karachi',
      GRN: 'GRN-2025-0459',
      aiConfidence: 92,
      status: 'auto-extracted',
    },
    {
      id: '15',
      Invoice_Date: '2025-01-16',
      Invoice_No: 'INV-2025-0211',
      Supplier_Name: 'P&G Pakistan',
      Exclusive_Value: 235000,
      GST_Sales_Tax: 42300,
      Inclusive_Value: 277300,
      Net_Amount: 274316,
      Location: 'Karachi',
      GRN: 'GRN-2025-0431',
      aiConfidence: 93,
      status: 'approved',
    },
  ],
  '5': [
    {
      id: '5',
      Invoice_Date: '2025-01-20',
      Invoice_No: 'INV-2025-0230',
      Supplier_Name: 'Coca-Cola Pakistan',
      Exclusive_Value: 145200,
      GST_Sales_Tax: 26300,
      Inclusive_Value: 171500,
      Net_Amount: 171500,
      Location: 'Faisalabad',
      GRN: 'GRN-2025-0460',
      aiConfidence: 88,
      status: 'auto-extracted',
    },
    {
      id: '16',
      Invoice_Date: '2025-01-15',
      Invoice_No: 'INV-2025-0210',
      Supplier_Name: 'Coca-Cola Pakistan',
      Exclusive_Value: 138900,
      GST_Sales_Tax: 25002,
      Inclusive_Value: 163902,
      Net_Amount: 163902,
      Location: 'Faisalabad',
      GRN: 'GRN-2025-0430',
      aiConfidence: 89,
      status: 'approved',
    },
  ],
};

export function SupplierDetailPage({ supplierId, onBack }: SupplierDetailPageProps) {
  const supplier = supplierData[supplierId];
  const invoices = invoicesBySupplier[supplierId] || [];

  if (!supplier) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Supplier not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'auto-extracted':
        return <Badge className="bg-blue-100 text-blue-700">Auto Extracted</Badge>;
      case 'needs-review':
        return <Badge className="bg-orange-100 text-orange-700">Needs Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Suppliers
      </Button>

      {/* Supplier Overview */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-8 h-8 text-blue-700" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl">{supplier.name}</h2>
            <Badge
              className={
                supplier.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-200 text-slate-700'
              }
            >
              {supplier.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {supplier.totalInvoices} invoices • Last invoice: {supplier.lastInvoiceDate}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </div>
            <p className="text-2xl">{supplier.totalInvoices}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Amount</p>
            </div>
            <p className="text-2xl text-blue-600">{formatCurrency(supplier.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Avg AI Confidence</p>
            </div>
            <p className="text-2xl text-green-600">{supplier.avgConfidence}%</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Last Invoice</p>
            </div>
            <p className="text-lg">{supplier.lastInvoiceDate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Details Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                <p className="font-medium">{supplier.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">NTN</p>
                <p className="font-medium">{supplier.ntn}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">GST No</p>
                <p className="font-medium">{supplier.gstNo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Registration No</p>
                <p className="font-medium">{supplier.registrationNo}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                <p className="font-medium">{supplier.contactPerson}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{supplier.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{supplier.address}</p>
                    <p className="text-sm text-muted-foreground">{supplier.city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Invoices from {supplier.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>GRN</TableHead>
                  <TableHead className="text-right">Exclusive Value</TableHead>
                  <TableHead className="text-right">GST/Sales Tax</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead className="text-center">AI Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No invoices found for this supplier
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.Invoice_No}</TableCell>
                      <TableCell>{invoice.Invoice_Date}</TableCell>
                      <TableCell>{invoice.Location}</TableCell>
                      <TableCell className="text-muted-foreground">{invoice.GRN}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(invoice.Exclusive_Value)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(invoice.GST_Sales_Tax)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatCurrency(invoice.Net_Amount)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={invoice.aiConfidence >= 85 ? 'default' : 'secondary'}
                          className={
                            invoice.aiConfidence >= 85
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : invoice.aiConfidence >= 75
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                              : 'bg-red-100 text-red-700 hover:bg-red-100'
                          }
                        >
                          {invoice.aiConfidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

