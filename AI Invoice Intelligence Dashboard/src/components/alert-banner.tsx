import { AlertTriangle, X, TrendingUp, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  count?: number;
}

const currentAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Price Variance Detected',
    message: '23 invoices have price increases above 15% compared to previous orders',
    count: 23,
  },
  {
    id: '2',
    type: 'error',
    title: 'Critical Price Alert',
    message: '5 suppliers have abnormal price spikes requiring immediate review',
    count: 5,
  },
];

export function AlertBanner() {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Show alerts one by one with delay
    currentAlerts.forEach((alert, index) => {
      setTimeout(() => {
        if (!dismissedAlerts.includes(alert.id)) {
          setVisibleAlerts((prev) => [...prev, alert]);
        }
      }, index * 500);
    });
  }, []);

  const activeAlerts = visibleAlerts.filter(
    (alert) => !dismissedAlerts.includes(alert.id)
  );

  const dismissAlert = (id: string) => {
    setDismissedAlerts([...dismissedAlerts, id]);
    setVisibleAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-md">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`bg-white rounded-lg shadow-lg border-l-4 overflow-hidden animate-slide-in ${
            alert.type === 'error'
              ? 'border-red-500'
              : alert.type === 'warning'
              ? 'border-orange-500'
              : 'border-blue-500'
          }`}
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div className="flex items-start gap-3 p-4">
            <div
              className={`p-2 rounded-lg flex-shrink-0 ${
                alert.type === 'error'
                  ? 'bg-red-100'
                  : alert.type === 'warning'
                  ? 'bg-orange-100'
                  : 'bg-blue-100'
              }`}
            >
              {alert.type === 'error' || alert.type === 'warning' ? (
                <AlertTriangle
                  className={`w-5 h-5 ${
                    alert.type === 'error' ? 'text-red-600' : 'text-orange-600'
                  }`}
                />
              ) : (
                <TrendingUp className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className={`font-medium text-sm ${
                    alert.type === 'error'
                      ? 'text-red-900'
                      : alert.type === 'warning'
                      ? 'text-orange-900'
                      : 'text-blue-900'
                  }`}
                >
                  {alert.title}
                </h4>
                {alert.count && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      alert.type === 'error'
                        ? 'bg-red-100 text-red-800'
                        : alert.type === 'warning'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {alert.count}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3">
                {alert.message}
              </p>
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  alert.type === 'error'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : alert.type === 'warning'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Review Now
              </button>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}