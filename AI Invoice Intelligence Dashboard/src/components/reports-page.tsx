import { useState } from 'react';
import { Download, Calendar, Filter, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const supplierWiseData = [
  { supplier: 'Metro Cash & Carry', totalAmount: 12500000, invoiceCount: 245, gst: 2250000, net: 10250000 },
  { supplier: 'Unilever Pakistan', totalAmount: 9800000, invoiceCount: 198, gst: 1764000, net: 8036000 },
  { supplier: 'Nestle Pakistan', totalAmount: 8200000, invoiceCount: 167, gst: 1476000, net: 6724000 },
  { supplier: 'P&G Pakistan', totalAmount: 7100000, invoiceCount: 143, gst: 1278000, net: 5822000 },
  { supplier: 'Coca-Cola Pakistan', totalAmount: 6400000, invoiceCount: 129, gst: 1152000, net: 5248000 },
];

const gstSummaryData = [
  { month: 'Jul', gst: 580000, salesTax: 120000 },
  { month: 'Aug', gst: 680000, salesTax: 140000 },
  { month: 'Sep', gst: 740000, salesTax: 150000 },
  { month: 'Oct', gst: 700000, salesTax: 145000 },
  { month: 'Nov', gst: 810000, salesTax: 165000 },
  { month: 'Dec', gst: 760000, salesTax: 155000 },
  { month: 'Jan', gst: 860000, salesTax: 175000 },
];

const locationWiseData = [
  { location: 'Karachi', value: 18500000, color: '#3b82f6' },
  { location: 'Lahore', value: 14200000, color: '#8b5cf6' },
  { location: 'Islamabad', value: 8900000, color: '#06b6d4' },
  { location: 'Faisalabad', value: 6700000, color: '#10b981' },
  { location: 'Multan', value: 5200000, color: '#f59e0b' },
  { location: 'Others', value: 4700000, color: '#6b7280' },
];

const discountIncentiveData = [
  { month: 'Jul', discounts: 45000, incentives: 22500, returns: 8000 },
  { month: 'Aug', discounts: 52000, incentives: 26000, returns: 9500 },
  { month: 'Sep', discounts: 58000, incentives: 29000, returns: 7200 },
  { month: 'Oct', discounts: 54000, incentives: 27000, returns: 8800 },
  { month: 'Nov', discounts: 61000, incentives: 30500, returns: 6500 },
  { month: 'Dec', discounts: 57000, incentives: 28500, returns: 9100 },
  { month: 'Jan', discounts: 64000, incentives: 32000, returns: 7800 },
];

export function ReportsPage() {
  const [startDate, setStartDate] = useState('2024-07-01');
  const [endDate, setEndDate] = useState('2025-01-23');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Financial insights and data analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="supplier" className="space-y-6">
        <TabsList>
          <TabsTrigger value="supplier">Supplier Analysis</TabsTrigger>
          <TabsTrigger value="gst">GST/Tax Summary</TabsTrigger>
          <TabsTrigger value="location">Location Breakdown</TabsTrigger>
          <TabsTrigger value="discounts">Discounts & Returns</TabsTrigger>
        </TabsList>

        {/* Supplier Analysis */}
        <TabsContent value="supplier" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Suppliers</p>
                    <p className="text-2xl">147</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl">PKR 58.2M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Invoice</p>
                    <p className="text-2xl">PKR 67K</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top 5 Suppliers by Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Supplier Name</TableHead>
                      <TableHead className="text-right">Invoice Count</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">GST/Tax</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierWiseData.map((supplier, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{supplier.supplier}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {supplier.invoiceCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(supplier.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(supplier.gst)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-blue-700">
                          {formatCurrency(supplier.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST/Tax Summary */}
        <TabsContent value="gst" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total GST</p>
                <p className="text-2xl mb-2">PKR 5.13M</p>
                <p className="text-xs text-green-600">+8.2% vs last period</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Sales Tax</p>
                <p className="text-2xl mb-2">PKR 1.05M</p>
                <p className="text-xs text-green-600">+6.5% vs last period</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Combined Tax</p>
                <p className="text-2xl mb-2">PKR 6.18M</p>
                <p className="text-xs text-green-600">+7.8% vs last period</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Monthly GST & Sales Tax Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={gstSummaryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="gst"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="GST"
                  />
                  <Line
                    type="monotone"
                    dataKey="salesTax"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Sales Tax"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Breakdown */}
        <TabsContent value="location" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Location-wise Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={locationWiseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ location, percent }) =>
                        `${location} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {locationWiseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Location Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationWiseData.map((location, idx) => {
                        const total = locationWiseData.reduce((sum, l) => sum + l.value, 0);
                        const percentage = ((location.value / total) * 100).toFixed(1);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{location.location}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(location.value)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {percentage}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discounts & Returns */}
        <TabsContent value="discounts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Discounts</p>
                <p className="text-2xl mb-2">PKR 391K</p>
                <p className="text-xs text-muted-foreground">7-month total</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Incentives</p>
                <p className="text-2xl mb-2">PKR 195.5K</p>
                <p className="text-xs text-muted-foreground">7-month total</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Returns</p>
                <p className="text-2xl mb-2">PKR 56.9K</p>
                <p className="text-xs text-muted-foreground">7-month total</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Monthly Discounts, Incentives & Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={discountIncentiveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="discounts" fill="#3b82f6" name="Discounts" />
                  <Bar dataKey="incentives" fill="#10b981" name="Incentives" />
                  <Bar dataKey="returns" fill="#f59e0b" name="Returns" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
