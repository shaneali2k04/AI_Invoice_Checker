import { useState } from 'react';
import { Building2, Edit, Trash2, Eye, Package, TrendingUp, Mail, MapPin, FileText } from 'lucide-react';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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

const sampleSuppliers: Supplier[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
    id: '6',
    name: 'Colgate Palmolive',
    ntn: '6789012-3',
    gstNo: 'GST-006-789',
    registrationNo: 'REG-CP-006',
    contactPerson: 'Sara Ahmed',
    email: 'sara@colgate.com.pk',
    phone: '+92-21-5678901',
    address: 'Colgate House, DHA',
    city: 'Karachi',
    totalInvoices: 18,
    totalAmount: 2630000,
    avgConfidence: 62,
    status: 'active',
    lastInvoiceDate: '2025-01-19',
  },
  {
    id: '7',
    name: 'Engro Foods',
    ntn: '7890123-4',
    gstNo: 'GST-007-890',
    registrationNo: 'REG-EF-007',
    contactPerson: 'Bilal Sheikh',
    email: 'bilal@engrofoods.com.pk',
    phone: '+92-42-6789012',
    address: 'Engro Tower, Gulberg',
    city: 'Lahore',
    totalInvoices: 22,
    totalAmount: 4360000,
    avgConfidence: 71,
    status: 'active',
    lastInvoiceDate: '2025-01-18',
  },
  {
    id: '8',
    name: 'Fauji Foods',
    ntn: '8901234-5',
    gstNo: 'GST-008-901',
    registrationNo: 'REG-FF-008',
    contactPerson: 'Zainab Hussain',
    email: 'zainab@faujifoods.com.pk',
    phone: '+92-51-7890123',
    address: 'Fauji Complex, I-9',
    city: 'Islamabad',
    totalInvoices: 15,
    totalAmount: 3520000,
    avgConfidence: 58,
    status: 'active',
    lastInvoiceDate: '2025-01-17',
  },
  {
    id: '9',
    name: 'National Foods',
    ntn: '9012345-6',
    gstNo: 'GST-009-012',
    registrationNo: 'REG-NF-009',
    contactPerson: 'Ali Raza',
    email: 'ali@nationalfoods.com.pk',
    phone: '+92-21-8901234',
    address: 'National House, SITE',
    city: 'Karachi',
    totalInvoices: 20,
    totalAmount: 3360000,
    avgConfidence: 68,
    status: 'active',
    lastInvoiceDate: '2025-01-16',
  },
  {
    id: '10',
    name: 'Shan Foods',
    ntn: '0123456-7',
    gstNo: 'GST-010-123',
    registrationNo: 'REG-SF-010',
    contactPerson: 'Mariam Khan',
    email: 'mariam@shanfoods.com.pk',
    phone: '+92-42-9012345',
    address: 'Shan Centre, Johar Town',
    city: 'Lahore',
    totalInvoices: 12,
    totalAmount: 1480000,
    avgConfidence: 79,
    status: 'active',
    lastInvoiceDate: '2025-01-15',
  },
];

export function UsersPage({ onViewSupplier }: { onViewSupplier: (id: string) => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(sampleSuppliers);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ntn: '',
    gstNo: '',
    registrationNo: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    status: 'active' as 'active' | 'inactive',
  });

  const handleOpenAddDialog = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      ntn: '',
      gstNo: '',
      registrationNo: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      status: 'active',
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      ntn: supplier.ntn,
      gstNo: supplier.gstNo,
      registrationNo: supplier.registrationNo,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city,
      status: supplier.status,
    });
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleSaveSupplier = () => {
    if (editingSupplier) {
      // Update existing supplier
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id
            ? {
                ...s,
                ...formData,
              }
            : s
        )
      );
    } else {
      // Add new supplier (mock only)
      const newSupplier: Supplier = {
        id: String(suppliers.length + 1),
        ...formData,
        totalInvoices: 0,
        totalAmount: 0,
        avgConfidence: 0,
        lastInvoiceDate: new Date().toISOString().split('T')[0],
      };
      setSuppliers((prev) => [...prev, newSupplier]);
    }
    handleCloseDialog();
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.ntn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    totalAmount: suppliers.reduce((sum, s) => sum + s.totalAmount, 0),
    totalInvoices: suppliers.reduce((sum, s) => sum + s.totalInvoices, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Supplier Management</h2>
          <p className="text-sm text-muted-foreground">View and manage supplier information from invoice data</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Building2 className="w-4 h-4 mr-2" />
          Add New Supplier
        </Button>
      </div>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        {/* Compact modal like the original dashboard (not edge-to-edge) */}
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[560px] max-h-[85vh] overflow-hidden p-0">
          <div className="flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
              <DialogDescription>
                {editingSupplier ? 'Update supplier information' : 'Create a new supplier record with company and contact details'}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh]">
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                <Label htmlFor="new-name">Company Name</Label>
                <Input id="new-name" placeholder="Enter company name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-ntn">NTN</Label>
                <Input id="new-ntn" placeholder="1234567-8" value={formData.ntn} onChange={(e) => setFormData({ ...formData, ntn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-gst">GST No</Label>
                <Input id="new-gst" placeholder="GST-XXX-XXX" value={formData.gstNo} onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-reg">Registration No</Label>
                <Input id="new-reg" placeholder="REG-XXX-XXX" value={formData.registrationNo} onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-contact">Contact Person</Label>
                <Input id="new-contact" placeholder="Full name" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">Phone</Label>
                <Input id="new-phone" placeholder="+92-XX-XXXXXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-city">City</Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                  <SelectTrigger id="new-city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Karachi">Karachi</SelectItem>
                    <SelectItem value="Lahore">Lahore</SelectItem>
                    <SelectItem value="Islamabad">Islamabad</SelectItem>
                    <SelectItem value="Faisalabad">Faisalabad</SelectItem>
                    <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" placeholder="contact@company.com.pk" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-address">Address</Label>
                <Input id="new-address" placeholder="Full address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
                  <SelectTrigger id="new-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveSupplier}>{editingSupplier ? 'Update Supplier' : 'Create Supplier'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Suppliers</p>
            </div>
            <p className="text-2xl">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Active Suppliers</p>
            </div>
            <p className="text-2xl text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </div>
            <p className="text-2xl text-blue-600">{stats.totalInvoices}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Amount</p>
            </div>
            <p className="text-2xl text-purple-600">{formatCurrency(stats.totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>All Suppliers</CardTitle>
            <div className="w-full sm:w-64">
              <Input placeholder="Search suppliers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>NTN</TableHead>
                  <TableHead>GST No</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Total Invoices</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-center">Avg AI Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.ntn}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.gstNo}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{supplier.contactPerson}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="w-3 h-3" />
                          {supplier.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {supplier.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{supplier.totalInvoices}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(supplier.totalAmount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={supplier.avgConfidence >= 85 ? 'default' : 'secondary'}
                        className={
                          supplier.avgConfidence >= 85
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : supplier.avgConfidence >= 75
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }
                      >
                        {supplier.avgConfidence}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={supplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}>
                        {supplier.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onViewSupplier(supplier.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(supplier)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
