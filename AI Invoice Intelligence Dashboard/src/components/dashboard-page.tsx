import {
  FileText,
  DollarSign,
  Receipt,
  Wallet,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  AreaChart,
  Area,
} from 'recharts';

const kpiData = [
  {
    title: 'Total Invoices',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: FileText,
    color: 'blue',
  },
  {
    title: 'Total Invoice Amount',
    value: 'PKR 45.2M',
    change: '+8.2%',
    trend: 'up',
    icon: DollarSign,
    color: 'green',
  },
  {
    title: 'Total GST/Sales Tax',
    value: 'PKR 8.1M',
    change: '+5.4%',
    trend: 'up',
    icon: Receipt,
    color: 'purple',
  },
  {
    title: 'Total Net Amount',
    value: 'PKR 37.1M',
    change: '+9.1%',
    trend: 'up',
    icon: Wallet,
    color: 'indigo',
  },
  {
    title: 'Invoices with Issues',
    value: '127',
    change: '-3.2%',
    trend: 'down',
    icon: AlertTriangle,
    color: 'orange',
  },
  {
    title: 'AI Confidence Avg',
    value: '94.3%',
    change: '+2.1%',
    trend: 'up',
    icon: TrendingUp,
    color: 'teal',
  },
];

const monthlyData = [
  { month: 'Jul', value: 3.2 },
  { month: 'Aug', value: 3.8 },
  { month: 'Sep', value: 4.1 },
  { month: 'Oct', value: 3.9 },
  { month: 'Nov', value: 4.5 },
  { month: 'Dec', value: 4.2 },
  { month: 'Jan', value: 4.8 },
];

const monthlyPieData = [
  { month: 'Jul', value: 3.2, color: '#3b82f6' },
  { month: 'Aug', value: 3.8, color: '#8b5cf6' },
  { month: 'Sep', value: 4.1, color: '#06b6d4' },
  { month: 'Oct', value: 3.9, color: '#10b981' },
  { month: 'Nov', value: 4.5, color: '#f59e0b' },
  { month: 'Dec', value: 4.2, color: '#ef4444' },
  { month: 'Jan', value: 4.8, color: '#6366f1' },
];

const gstNetData = [
  { month: 'Jul', gst: 0.58, net: 2.62 },
  { month: 'Aug', gst: 0.68, net: 3.12 },
  { month: 'Sep', gst: 0.74, net: 3.36 },
  { month: 'Oct', gst: 0.70, net: 3.20 },
  { month: 'Nov', gst: 0.81, net: 3.69 },
  { month: 'Dec', gst: 0.76, net: 3.44 },
  { month: 'Jan', gst: 0.86, net: 3.94 },
];

const gstNetPieData = [
  { name: 'GST/Sales Tax', value: 5.13, color: '#8b5cf6' },
  { name: 'Net Amount', value: 23.37, color: '#3b82f6' },
];

const supplierData = [
  { name: 'Metro Cash & Carry', value: 12.5, color: '#3b82f6' },
  { name: 'Unilever Pakistan', value: 9.8, color: '#8b5cf6' },
  { name: 'Nestle Pakistan', value: 8.2, color: '#06b6d4' },
  { name: 'P&G Pakistan', value: 7.1, color: '#10b981' },
  { name: 'Coca-Cola', value: 6.4, color: '#f59e0b' },
  { name: 'Others', value: 11.2, color: '#6b7280' },
];

const recentInvoices = [
  {
    id: 'INV-2025-0234',
    supplier: 'Metro Cash & Carry',
    date: '2025-01-22',
    amount: 'PKR 234,500',
    status: 'auto-extracted',
    confidence: 98,
  },
  {
    id: 'INV-2025-0233',
    supplier: 'Unilever Pakistan',
    date: '2025-01-22',
    amount: 'PKR 189,200',
    status: 'needs-review',
    confidence: 76,
  },
  {
    id: 'INV-2025-0232',
    supplier: 'Nestle Pakistan',
    date: '2025-01-21',
    amount: 'PKR 156,800',
    status: 'approved',
    confidence: 95,
  },
  {
    id: 'INV-2025-0231',
    supplier: 'P&G Pakistan',
    date: '2025-01-21',
    amount: 'PKR 298,450',
    status: 'auto-extracted',
    confidence: 92,
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={kpi.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                    <h3 className="text-2xl mb-2">{kpi.value}</h3>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <TrendIcon className="w-4 h-4" />
                      <span>{kpi.change}</span>
                      <span className="text-muted-foreground ml-1">vs last month</span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      kpi.color === 'blue'
                        ? 'bg-blue-100'
                        : kpi.color === 'green'
                        ? 'bg-green-100'
                        : kpi.color === 'purple'
                        ? 'bg-purple-100'
                        : kpi.color === 'indigo'
                        ? 'bg-indigo-100'
                        : kpi.color === 'orange'
                        ? 'bg-orange-100'
                        : 'bg-teal-100'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        kpi.color === 'blue'
                          ? 'text-blue-600'
                          : kpi.color === 'green'
                          ? 'text-green-600'
                          : kpi.color === 'purple'
                          ? 'text-purple-600'
                          : kpi.color === 'indigo'
                          ? 'text-indigo-600'
                          : kpi.color === 'orange'
                          ? 'text-orange-600'
                          : 'text-teal-600'
                      }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Invoice Value */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Invoice Value (Millions PKR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={monthlyPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ month, value }) => `${month}: ${value}M`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {monthlyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `${value} Million PKR`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GST vs Net Amount */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>GST vs Net Amount Trend (Millions PKR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={gstNetData}>
                <defs>
                  <linearGradient id="colorGst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `${value} Million PKR`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="gst"
                  name="GST/Sales Tax"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGst)"
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net Amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Distribution */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Suppliers (Millions PKR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supplierData.map((supplier, index) => (
                <div key={supplier.name} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{supplier.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(supplier.value / 12.5) * 100}%`,
                            backgroundColor: supplier.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{supplier.value}M</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-sm font-medium">
                  {supplierData.reduce((acc, s) => acc + s.value, 0).toFixed(1)}M PKR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium">{invoice.id}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          invoice.status === 'auto-extracted'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'needs-review'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {invoice.status === 'auto-extracted'
                          ? 'Auto-Extracted'
                          : invoice.status === 'needs-review'
                          ? 'Needs Review'
                          : 'Approved'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium mb-1">{invoice.amount}</p>
                    <p className="text-xs text-muted-foreground">
                      AI: {invoice.confidence}% · {invoice.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}