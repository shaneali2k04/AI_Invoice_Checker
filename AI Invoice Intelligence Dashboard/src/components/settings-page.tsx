import { Save, Bell, Lock, Database, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl mb-1">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage system preferences and configurations
        </p>
      </div>

      {/* Company Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Update your company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" defaultValue="Jalal Sons" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-ntn">NTN</Label>
              <Input id="company-ntn" defaultValue="9876543-2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-gst">GST Number</Label>
              <Input id="company-gst" defaultValue="GST-JS-789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-reg">Registration Number</Label>
              <Input id="company-reg" defaultValue="REG-JS-001" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Address</Label>
            <Input id="company-address" defaultValue="Main Boulevard, Karachi, Pakistan" />
          </div>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            AI Processing Settings
          </CardTitle>
          <CardDescription>Configure AI extraction parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-approve high confidence invoices</Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve invoices with AI confidence above threshold
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="confidence-threshold">Confidence Threshold (%)</Label>
            <Input
              id="confidence-threshold"
              type="number"
              min="0"
              max="100"
              defaultValue="90"
            />
            <p className="text-sm text-muted-foreground">
              Invoices below this threshold will be flagged for review
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable OCR enhancement</Label>
              <p className="text-sm text-muted-foreground">
                Improve text recognition for blurry or low-quality documents
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Flag missing fields</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect and flag invoices with missing required fields
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save AI Settings
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifications for new uploads</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new invoices are uploaded
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email alerts for low-confidence invoices</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts when invoices need manual review
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily summary reports</Label>
              <p className="text-sm text-muted-foreground">
                Get daily digest of invoice processing activity
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Monthly financial reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive monthly summary of financial analytics
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>Manage security and access settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-factor authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for all user accounts
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session timeout</Label>
              <p className="text-sm text-muted-foreground">
                Auto-logout after 30 minutes of inactivity
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="password-expiry">Password expiry (days)</Label>
            <Input id="password-expiry" type="number" defaultValue="90" />
            <p className="text-sm text-muted-foreground">
              Users will be required to change password after this period
            </p>
          </div>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* Data & Backup */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data & Backup
          </CardTitle>
          <CardDescription>Manage data retention and backup settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic daily backups</Label>
              <p className="text-sm text-muted-foreground">
                Create daily backups at 2:00 AM
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="retention-period">Data retention period (months)</Label>
            <Input id="retention-period" type="number" defaultValue="24" />
            <p className="text-sm text-muted-foreground">
              Invoices older than this will be archived
            </p>
          </div>
          <Separator />
          <div className="pt-2">
            <Button variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Export All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
