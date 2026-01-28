import { useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  List,
  BarChart3,
  Settings,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import logo from '../assets/ab84fcc124e17a236bcdf390a8ca15ba8e52d4b7.png';
import { AlertBanner } from './alert-banner';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', name: 'Upload Invoices', icon: Upload },
  { id: 'invoices', name: 'Invoices List', icon: List },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'users', name: 'Supplier List', icon: Building2 },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export function AppLayout({ children, currentPage, onNavigate, onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="relative px-6 py-4 border-b border-slate-200 h-[73px]">
            <div className="w-full h-full flex items-center justify-center">
              <img src={logo} alt="Jalal Sons" className="h-12 w-auto" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 flex items-center gap-4 h-[73px]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl">
              {navigation.find((item) => item.id === currentPage)?.name || 'Dashboard'}
            </h1>
          </div>
          
          {/* User Profile in Top Bar */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="font-medium text-blue-700 text-sm">AS</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            
            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-muted-foreground">admin@jalalsons.com</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Floating Alert Notifications */}
      <AlertBanner />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}