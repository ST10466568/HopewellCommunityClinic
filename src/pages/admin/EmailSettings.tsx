import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Loader2, Mail, Settings, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { emailSettingsAPI } from '../../services/api';

interface EmailSettings {
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  enableSsl: boolean;
  enableTls: boolean;
}

interface EmailStatus {
  isConfigured: boolean;
  status: string;
  message: string;
  lastTested?: string;
}

const EmailSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [status, setStatus] = useState<EmailStatus | null>(null);

  // Form state
  const [formData, setFormData] = useState<EmailSettings>({
    provider: 'SMTP',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: 'Hopewell Clinic',
    enableSsl: false,
    enableTls: true
  });

  useEffect(() => {
    loadSettings();
    loadStatus();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('📧 [EmailSettings] Loading email settings...');
      const data = await emailSettingsAPI.getSettings();
      setSettings(data);
      setFormData(data);
      console.log('📧 [EmailSettings] Settings loaded:', data);
    } catch (error) {
      console.error('📧 [EmailSettings] Error loading settings:', error);
      setMessage({type: 'error', text: 'Failed to load email settings'});
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      console.log('📧 [EmailSettings] Loading email status...');
      const data = await emailSettingsAPI.getStatus();
      setStatus(data);
      console.log('📧 [EmailSettings] Status loaded:', data);
    } catch (error) {
      console.error('📧 [EmailSettings] Error loading status:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      console.log('📧 [EmailSettings] Saving email settings:', formData);
      await emailSettingsAPI.updateSettings(formData);
      setMessage({type: 'success', text: 'Email settings updated successfully!'});
      await loadSettings(); // Reload settings
      await loadStatus(); // Reload status
    } catch (error) {
      console.error('📧 [EmailSettings] Error saving settings:', error);
      setMessage({type: 'error', text: 'Failed to update email settings'});
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    if (!testEmail) {
      setMessage({type: 'error', text: 'Please enter a test email address'});
      return;
    }

    setTesting(true);
    try {
      console.log('📧 [EmailSettings] Testing email configuration with:', testEmail);
      await emailSettingsAPI.testEmail(testEmail);
      setMessage({type: 'success', text: 'Test email sent successfully!'});
      await loadStatus(); // Reload status
    } catch (error) {
      console.error('📧 [EmailSettings] Error testing email:', error);
      setMessage({type: 'error', text: 'Failed to send test email'});
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof EmailSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading email settings...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Email Settings</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'border-green-500 bg-green-50 text-green-700' 
            : 'border-red-500 bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Email Settings Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Email Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure SMTP settings for sending emails from the clinic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={formData.smtpHost}
                onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                placeholder="smtp-relay.brevo.com"
              />
            </div>

            <div>
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={formData.smtpPort}
                onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                placeholder="587"
              />
            </div>

            <div>
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={formData.smtpUser}
                onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                placeholder="your-smtp-user@domain.com"
              />
            </div>

            <div>
              <Label htmlFor="smtpPass">SMTP Password</Label>
              <Input
                id="smtpPass"
                type="password"
                value={formData.smtpPass}
                onChange={(e) => handleInputChange('smtpPass', e.target.value)}
                placeholder="Enter SMTP password"
              />
            </div>

            <div>
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                value={formData.fromEmail}
                onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                placeholder="your-smtp-user@domain.com"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Must match your SMTP username or be a verified domain
              </p>
            </div>

            <div>
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => handleInputChange('fromName', e.target.value)}
                placeholder="Hopewell Clinic"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.enableSsl}
                onCheckedChange={(checked) => handleInputChange('enableSsl', checked)}
              />
              <Label htmlFor="enableSsl">Enable SSL</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.enableTls}
                onCheckedChange={(checked) => handleInputChange('enableTls', checked)}
              />
              <Label htmlFor="enableTls">Enable TLS (Recommended for port 587)</Label>
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Settings...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-primary" />
            <span>Test Email Configuration</span>
          </CardTitle>
          <CardDescription>
            Send a test email to verify your configuration is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={testEmailConfig}
              disabled={testing || !testEmail}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Send Test Email'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>Email Status</span>
          </CardTitle>
          <CardDescription>
            Current status of the email configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${
                  status.isConfigured 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {status.isConfigured ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>{status.status}</span>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Message:</span>
                <p className="text-muted-foreground">{status.message}</p>
              </div>
              
              {status.lastTested && (
                <div>
                  <span className="font-medium">Last Tested:</span>
                  <p className="text-muted-foreground">
                    {new Date(status.lastTested).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No status information available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettingsPage;
