import { Building2, Lock, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">Jalal Sons</h1>
          <p className="text-muted-foreground">AI Invoice Intelligence System (Demo)</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Demo Access</CardTitle>
            <CardDescription>Click below to access the demo dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">Demo Mode - No Authentication Required</p>
                <p className="text-xs text-blue-700">
                  All data is stored in session memory and will be cleared on server restart.
                  This is a demonstration environment for testing purposes only.
                </p>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Enter Demo Dashboard
              </Button>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  Full-featured demo with AI-powered invoice extraction
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 Jalal Sons. All rights reserved. · Powered by AI
        </p>
      </div>
    </div>
  );
}