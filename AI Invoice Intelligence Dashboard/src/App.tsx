import { useState } from 'react';
import { LoginPage } from './components/login-page';
import { AppLayout } from './components/app-layout';
import { DashboardPage } from './components/dashboard-page';
import { UploadPage } from './components/upload-page';
import { InvoicesPage } from './components/invoices-page';
import { InvoiceDetailPage } from './components/invoice-detail-page';
import { ReportsPage } from './components/reports-page';
import { UsersPage } from './components/users-page';
import { SupplierDetailPage } from './components/supplier-detail-page';
import { SettingsPage } from './components/settings-page';
import { UploadManagerProvider } from './contexts/upload-manager';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
    setSelectedInvoiceId(null);
    setSelectedSupplierId(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedInvoiceId(null);
    setSelectedSupplierId(null);
  };

  const handleViewInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentPage('invoice-detail');
  };

  const handleBackFromInvoice = () => {
    setSelectedInvoiceId(null);
    setCurrentPage('invoices');
  };

  const handleViewSupplier = (id: string) => {
    setSelectedSupplierId(id);
    setCurrentPage('supplier-detail');
  };

  const handleBackFromSupplier = () => {
    setSelectedSupplierId(null);
    setCurrentPage('users');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <UploadManagerProvider>
      <AppLayout currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout}>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'upload' && <UploadPage onViewInvoice={handleViewInvoice} />}
        {currentPage === 'invoices' && <InvoicesPage onViewInvoice={handleViewInvoice} />}
        {currentPage === 'invoice-detail' && selectedInvoiceId && (
          <InvoiceDetailPage invoiceId={selectedInvoiceId} onBack={handleBackFromInvoice} />
        )}
        {currentPage === 'reports' && <ReportsPage />}
        {currentPage === 'users' && <UsersPage onViewSupplier={handleViewSupplier} />}
        {currentPage === 'supplier-detail' && selectedSupplierId && (
          <SupplierDetailPage supplierId={selectedSupplierId} onBack={handleBackFromSupplier} />
        )}
        {currentPage === 'settings' && <SettingsPage />}
      </AppLayout>
    </UploadManagerProvider>
  );
}
