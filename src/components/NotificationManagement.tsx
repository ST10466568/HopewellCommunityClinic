import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Bell, 
  Send, 
  Users, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Settings,
  Filter,
  Search,
  Calendar,
  User,
  Phone,
  RefreshCw,
  TestTube
} from 'lucide-react';
import { notificationsAPI, adminAPI, patientsAPI } from '../services/api';
import { emailService } from '../services/emailService';

interface Notification {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  type: '24h_reminder' | '2h_reminder' | 'custom';
  status: 'scheduled' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  emailSubject: string;
  appointmentDate?: string;
  appointmentTime?: string;
  serviceName?: string;
  staffName?: string;
  errorMessage?: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface NotificationSettings {
  reminder24hEnabled: boolean;
  reminder2hEnabled: boolean;
  clinicEmail: string;
  clinicPhone: string;
  clinicAddress: string;
}

const NotificationManagement: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'scheduled' | 'history' | 'send' | 'bulk' | 'settings'>('scheduled');
  const [scheduledNotifications, setScheduledNotifications] = useState<Notification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    reminder24hEnabled: true,
    reminder2hEnabled: true,
    clinicEmail: 'info@hopewellclinic.com',
    clinicPhone: '(555) 123-4567',
    clinicAddress: '123 Medical Drive, Healthcare City, HC 12345'
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Form states
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<any[]>([]);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  
  // Filters
  const [historyFilters, setHistoryFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  
  // Preview state
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load data on component mount
  useEffect(() => {
    console.log('🔔 [NotificationManagement] Component mounted, loading initial data...');
    console.log('🔔 [NotificationManagement] Current active section:', activeSection);
    loadScheduledNotifications();
    loadNotificationHistory();
    loadPatients();
    loadSettings();
  }, []);

  const loadScheduledNotifications = async () => {
    console.log('🔔 [NotificationManagement] Starting to load scheduled notifications...');
    try {
      setIsLoading(true);
      console.log('🔔 [NotificationManagement] Calling notificationsAPI.getScheduled()...');
      const data = await notificationsAPI.getScheduled();
      console.log('🔔 [NotificationManagement] Received data from API:', data);
      console.log('🔔 [NotificationManagement] Data type:', typeof data);
      console.log('🔔 [NotificationManagement] Is array?', Array.isArray(data));
      
      // Ensure data is an array
      const notificationsArray = Array.isArray(data) ? data : [];
      console.log('🔔 [NotificationManagement] Setting scheduled notifications:', notificationsArray);
      setScheduledNotifications(notificationsArray);
      console.log('🔔 [NotificationManagement] Successfully loaded scheduled notifications');
    } catch (error) {
      console.error('🔔 [NotificationManagement] Error loading scheduled notifications:', error);
      console.error('🔔 [NotificationManagement] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      setScheduledNotifications([]);
    } finally {
      setIsLoading(false);
      console.log('🔔 [NotificationManagement] Finished loading scheduled notifications');
    }
  };

  const loadNotificationHistory = async () => {
    console.log('🔔 [NotificationManagement] Starting to load notification history...');
    console.log('🔔 [NotificationManagement] Current filters:', historyFilters);
    try {
      setIsLoading(true);
      console.log('🔔 [NotificationManagement] Calling notificationsAPI.getHistory()...');
      const data = await notificationsAPI.getHistory(historyFilters);
      console.log('🔔 [NotificationManagement] Received history data from API:', data);
      console.log('🔔 [NotificationManagement] History data type:', typeof data);
      console.log('🔔 [NotificationManagement] History is array?', Array.isArray(data));
      
      // Ensure data is an array
      const historyArray = Array.isArray(data) ? data : [];
      console.log('🔔 [NotificationManagement] Setting notification history:', historyArray);
      setNotificationHistory(historyArray);
      console.log('🔔 [NotificationManagement] Successfully loaded notification history');
    } catch (error) {
      console.error('🔔 [NotificationManagement] Error loading notification history:', error);
      console.error('🔔 [NotificationManagement] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      setNotificationHistory([]);
    } finally {
      setIsLoading(false);
      console.log('🔔 [NotificationManagement] Finished loading notification history');
    }
  };

  const loadPatients = async () => {
    console.log('🔔 [NotificationManagement] Starting to load patients...');
    try {
      console.log('🔔 [NotificationManagement] Calling patientsAPI.getAll()...');
      const data = await patientsAPI.getAll();
      console.log('🔔 [NotificationManagement] Received patients data from API:', data);
      console.log('🔔 [NotificationManagement] Patients data type:', typeof data);
      console.log('🔔 [NotificationManagement] Patients is array?', Array.isArray(data));
      
      // Handle paginated response - extract patients array from response object
      let patientsArray = [];
      if (Array.isArray(data)) {
        patientsArray = data;
      } else if (data && Array.isArray(data.patients)) {
        patientsArray = data.patients;
        console.log('🔔 [NotificationManagement] Extracted patients from paginated response');
      } else if (data && Array.isArray(data.data)) {
        patientsArray = data.data;
        console.log('🔔 [NotificationManagement] Extracted patients from data property');
      } else {
        console.log('🔔 [NotificationManagement] No patients array found in response');
        patientsArray = [];
      }
      
      console.log('🔔 [NotificationManagement] Patients array length:', patientsArray.length);
      console.log('🔔 [NotificationManagement] Patients:', patientsArray);
      
      setPatients(patientsArray);
      console.log('🔔 [NotificationManagement] Successfully loaded patients');
    } catch (error) {
      console.error('🔔 [NotificationManagement] Error loading patients:', error);
      console.error('🔔 [NotificationManagement] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      // Fallback to mock data if API fails
      console.log('🔔 [NotificationManagement] Using fallback mock data...');
      const mockPatients = [
        { id: 'd7434ca1-8e95-4f22-ba4e-870c2088e429', firstName: 'Vuyo', lastName: 'Madikiza', email: 'st10466568@rcconnect.edu.za' },
        { id: '1bb7bec4-7921-4640-b8e9-30f423b59be7', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith.test@email.com' },
        { id: '4341aefb-f5b6-4161-9762-62cd8017218b', firstName: 'John', lastName: 'Doe', email: 'john.doe.test@email.com' },
        { id: '550e8400-e29b-41d4-a716-446655442000', firstName: 'Nelson', lastName: 'Mandela', email: 'nelson.mandela@example.com' }
      ];
      console.log('🔔 [NotificationManagement] Setting mock patients:', mockPatients);
      setPatients(mockPatients);
    }
  };

  const loadSettings = async () => {
    console.log('🔔 [NotificationManagement] Starting to load settings...');
    try {
      console.log('🔔 [NotificationManagement] Calling notificationsAPI.getNotificationSettings()...');
      const data = await notificationsAPI.getNotificationSettings();
      console.log('🔔 [NotificationManagement] Received settings data from API:', data);
      console.log('🔔 [NotificationManagement] Settings data type:', typeof data);
      setSettings(data);
      console.log('🔔 [NotificationManagement] Successfully loaded settings');
    } catch (error) {
      console.error('🔔 [NotificationManagement] Error loading settings:', error);
      console.error('🔔 [NotificationManagement] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
    }
  };

  const handleSendCustomEmail = async () => {
    console.log('🔔 [NotificationManagement] ===== STARTING CUSTOM EMAIL SEND =====');
    console.log('🔔 [NotificationManagement] Input validation check:', {
      hasSelectedPatient: !!selectedPatient,
      hasEmailSubject: !!emailSubject,
      hasEmailMessage: !!emailMessage,
      selectedPatientId: typeof selectedPatient === 'object' ? selectedPatient?.id : selectedPatient,
      selectedPatientName: typeof selectedPatient === 'object' && selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'None',
      selectedPatientEmail: typeof selectedPatient === 'object' ? selectedPatient?.email : 'None',
      emailSubject: emailSubject,
      emailMessageLength: emailMessage?.length || 0,
      emailMessagePreview: emailMessage ? emailMessage.substring(0, 100) + (emailMessage.length > 100 ? '...' : '') : 'None'
    });
    
    if (!selectedPatient || !emailSubject || !emailMessage) {
      console.log('🔔 [NotificationManagement] ❌ VALIDATION FAILED - Missing required fields');
      console.log('🔔 [NotificationManagement] Missing fields:', {
        missingPatient: !selectedPatient,
        missingSubject: !emailSubject,
        missingMessage: !emailMessage
      });
      alert('Please fill in all fields');
      return;
    }

    console.log('🔔 [NotificationManagement] ✅ VALIDATION PASSED - All required fields present');
    
    try {
      console.log('🔔 [NotificationManagement] Setting isSending to true...');
      setIsSending(true);
      
      console.log('🔔 [NotificationManagement] Preparing API call parameters:', {
        patientId: typeof selectedPatient === 'object' ? selectedPatient?.id : selectedPatient,
        patientData: selectedPatient,
        subject: emailSubject,
        message: emailMessage
      });
      
      console.log('🔔 [NotificationManagement] Calling notificationsAPI.sendCustomEmail()...');
      const patientId = typeof selectedPatient === 'object' ? selectedPatient.id : selectedPatient;
      console.log('🔔 [NotificationManagement] Extracted patient ID:', patientId);
      const result = await notificationsAPI.sendCustomEmail(patientId, emailSubject, emailMessage);
      
      console.log('🔔 [NotificationManagement] 📧 EMAIL API RESPONSE RECEIVED:', result);
      console.log('🔔 [NotificationManagement] Response analysis:', {
        success: result.success,
        hasMessageId: !!result.messageId,
        hasError: !!result.error,
        hasPreviewUrl: !!result.previewUrl,
        messageId: result.messageId,
        error: result.error,
        previewUrl: result.previewUrl,
        fullResponse: result
      });
      
      if (result.success) {
        console.log('🔔 [NotificationManagement] ✅ EMAIL SENT SUCCESSFULLY!');
        console.log('🔔 [NotificationManagement] Success details:', {
          messageId: result.messageId,
          previewUrl: result.previewUrl,
          recipient: typeof selectedPatient === 'object' ? selectedPatient?.email : 'Unknown',
          subject: emailSubject
        });
        
        alert('Email sent successfully!');
        
        console.log('🔔 [NotificationManagement] Clearing form fields...');
        setSelectedPatient(null);
        setEmailSubject('');
        setEmailMessage('');
        
        console.log('🔔 [NotificationManagement] Refreshing notification history...');
        await loadNotificationHistory();
        console.log('🔔 [NotificationManagement] ✅ Notification history refreshed');
      } else {
        console.log('🔔 [NotificationManagement] ❌ EMAIL SEND FAILED:', result.error);
        console.log('🔔 [NotificationManagement] Failure details:', {
          error: result.error,
          recipient: typeof selectedPatient === 'object' ? selectedPatient?.email : 'Unknown',
          subject: emailSubject,
          fullResult: result
        });
        alert('Failed to send email: ' + result.error);
      }
    } catch (error) {
      console.error('🔔 [NotificationManagement] ❌ EXCEPTION DURING EMAIL SEND:', error);
      console.error('🔔 [NotificationManagement] Exception analysis:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown',
        type: typeof error,
        constructor: error?.constructor?.name,
        fullError: error
      });
      alert('Error sending email: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      console.log('🔔 [NotificationManagement] Setting isSending to false...');
      setIsSending(false);
      console.log('🔔 [NotificationManagement] ===== CUSTOM EMAIL SEND COMPLETED =====');
    }
  };

  const handleSendBulkEmail = async () => {
    console.log('🔔 [NotificationManagement] ===== STARTING BULK EMAIL SEND =====');
    console.log('🔔 [NotificationManagement] Bulk email validation check:', {
      selectedPatientsCount: selectedPatients.length,
      hasBulkSubject: !!bulkSubject,
      hasBulkMessage: !!bulkMessage,
      bulkSubject: bulkSubject,
      bulkMessageLength: bulkMessage?.length || 0,
      bulkMessagePreview: bulkMessage ? bulkMessage.substring(0, 100) + (bulkMessage.length > 100 ? '...' : '') : 'None',
      selectedPatientEmails: selectedPatients.map(p => typeof p === 'object' ? p.email : 'Unknown'),
      selectedPatientNames: selectedPatients.map(p => typeof p === 'object' ? `${p.firstName} ${p.lastName}` : 'Unknown')
    });
    
    if (selectedPatients.length === 0 || !bulkSubject || !bulkMessage) {
      console.log('🔔 [NotificationManagement] ❌ BULK EMAIL VALIDATION FAILED - Missing required fields');
      console.log('🔔 [NotificationManagement] Missing fields:', {
        missingPatients: selectedPatients.length === 0,
        missingSubject: !bulkSubject,
        missingMessage: !bulkMessage
      });
      alert('Please select patients and fill in all fields');
      return;
    }

    console.log('🔔 [NotificationManagement] ✅ BULK EMAIL VALIDATION PASSED - All required fields present');
    
    try {
      console.log('🔔 [NotificationManagement] Setting isSending to true...');
      setIsSending(true);
      
      console.log('🔔 [NotificationManagement] Preparing bulk email API call:', {
        patientCount: selectedPatients.length,
        patients: selectedPatients.map(p => ({
          id: typeof p === 'object' ? p.id : p,
          name: typeof p === 'object' ? `${p.firstName} ${p.lastName}` : 'Unknown',
          email: typeof p === 'object' ? p.email : 'Unknown'
        })),
        subject: bulkSubject,
        messageLength: bulkMessage.length
      });
      
      console.log('🔔 [NotificationManagement] Calling notificationsAPI.sendBulkEmail()...');
      console.log('🔔 [NotificationManagement] Selected patients (should be IDs):', selectedPatients);
      const result = await notificationsAPI.sendBulkEmail(selectedPatients, bulkSubject, bulkMessage);
      
      console.log('🔔 [NotificationManagement] 📧 BULK EMAIL API RESPONSE RECEIVED:', result);
      console.log('🔔 [NotificationManagement] Bulk response analysis:', {
        success: result.success,
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        successRate: result.successRate,
        hasResults: !!result.results,
        resultsCount: result.results?.length || 0,
        hasError: !!result.error,
        error: result.error,
        fullResponse: result
      });
      
      if (result.success) {
        console.log('🔔 [NotificationManagement] ✅ BULK EMAIL SENT SUCCESSFULLY!');
        console.log('🔔 [NotificationManagement] Bulk success details:', {
          totalSent: result.totalSent,
          totalFailed: result.totalFailed,
          successRate: result.successRate,
          totalPatients: selectedPatients.length,
          results: result.results
        });
        
        // Log individual results
        if (result.results && result.results.length > 0) {
          console.log('🔔 [NotificationManagement] Individual email results:');
          result.results.forEach((emailResult: any, index: number) => {
            console.log(`🔔 [NotificationManagement] Email ${index + 1}:`, {
              patientId: emailResult.patientId,
              success: emailResult.success,
              messageId: emailResult.messageId,
              error: emailResult.error
            });
          });
        }
        
        alert(`Bulk email completed: ${result.totalSent}/${selectedPatients.length} sent successfully`);
        
        console.log('🔔 [NotificationManagement] Clearing bulk form fields...');
        setSelectedPatients([]);
        setBulkSubject('');
        setBulkMessage('');
        
        console.log('🔔 [NotificationManagement] Refreshing notification history...');
        await loadNotificationHistory();
        console.log('🔔 [NotificationManagement] ✅ Notification history refreshed');
      } else {
        console.log('🔔 [NotificationManagement] ❌ BULK EMAIL SEND FAILED:', result.error);
        console.log('🔔 [NotificationManagement] Bulk failure details:', {
          error: result.error,
          totalPatients: selectedPatients.length,
          fullResult: result
        });
        alert('Failed to send bulk email: ' + result.error);
      }
    } catch (error) {
      console.error('🔔 [NotificationManagement] ❌ EXCEPTION DURING BULK EMAIL SEND:', error);
      console.error('🔔 [NotificationManagement] Bulk exception analysis:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown',
        type: typeof error,
        constructor: error?.constructor?.name,
        fullError: error
      });
      alert('Error sending bulk email: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      console.log('🔔 [NotificationManagement] Setting isSending to false...');
      setIsSending(false);
      console.log('🔔 [NotificationManagement] ===== BULK EMAIL SEND COMPLETED =====');
    }
  };

  const handleToggleReminder = async (reminderType: '24h' | '2h', enabled: boolean) => {
    try {
      const newSettings = {
        ...settings,
        [`reminder${reminderType}Enabled`]: enabled
      };
      
      await notificationsAPI.toggleAutoReminders(newSettings);
      setSettings(newSettings);
      alert(`${reminderType}h reminders ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings: ' + error);
    }
  };

  const handleTestIntegration = async () => {
    console.log('🧪 [NotificationManagement] Starting integration test...');
    setIsTesting(true);
    
    try {
      const result = await notificationsAPI.testNotificationIntegration();
      
      if (result.success) {
        console.log('✅ [NotificationManagement] Integration test passed:', result);
        alert('✅ Integration test passed! Notification system is working correctly.');
      } else {
        console.error('❌ [NotificationManagement] Integration test failed:', result);
        alert(`❌ Integration test failed: ${result.message}\n\nError: ${result.error}\n\nDetails: ${JSON.stringify(result.details, null, 2)}`);
      }
    } catch (error) {
      console.error('💥 [NotificationManagement] Integration test exception:', error);
      alert(`💥 Integration test failed with exception: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
      console.log('🧪 [NotificationManagement] Integration test completed');
    }
  };

  const handleComprehensiveTest = async () => {
    console.log('🧪 [NotificationManagement] Starting comprehensive notification system test...');
    setIsTesting(true);
    
    try {
      const results = await notificationsAPI.testNotificationSystem();
      
      console.log('🧪 [NotificationManagement] Comprehensive test results:', results);
      
      if (results.overall.success) {
        alert(`✅ All notification tests passed! (${results.overall.message})\n\nCustom Email: ✅ PASSED\nSettings: ✅ PASSED\nBulk Email: ✅ PASSED`);
      } else {
        const failedTests = Object.entries(results)
          .filter(([key, result]) => key !== 'overall' && !result.success)
          .map(([key, result]) => `${key}: ❌ ${(result as any).error || 'Failed'}`)
          .join('\n');
          
        alert(`❌ Some notification tests failed (${results.overall.message})\n\nFailed tests:\n${failedTests}\n\nCheck console for detailed logs.`);
      }
    } catch (error) {
      console.error('💥 [NotificationManagement] Comprehensive test exception:', error);
      alert(`💥 Comprehensive test failed with exception: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
      console.log('🧪 [NotificationManagement] Comprehensive test completed');
    }
  };

  const handleTestEmailConfiguration = async () => {
    try {
      setIsTesting(true);
      const result = await notificationsAPI.testEmailConfiguration();
      
      if (result.success) {
        alert('Email configuration test successful!');
      } else {
        alert('Email configuration test failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error testing email configuration:', error);
      alert('Error testing email configuration: ' + error);
    } finally {
      setIsTesting(false);
    }
  };

  const handlePreviewEmail = async (templateType: string) => {
    try {
      const previewData = {
        patient: { firstName: 'John', lastName: 'Doe' },
        appointment: { appointmentDate: '2024-01-15', startTime: '10:00', endTime: '10:30' },
        service: { name: 'General Checkup', durationMinutes: 30 },
        staff: { firstName: 'Jane', lastName: 'Smith' },
        clinic: settings
      };
      
      const preview = await notificationsAPI.previewEmail(templateType, previewData);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing email:', error);
      alert('Error previewing email: ' + error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case '24h_reminder':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">24h Reminder</Badge>;
      case '2h_reminder':
        return <Badge variant="outline" className="text-red-600 border-red-600">2h Reminder</Badge>;
      case 'custom':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Custom</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Log render state for debugging
  console.log('🔔 [NotificationManagement] Rendering component with state:', {
    activeSection,
    isLoading,
    scheduledNotificationsCount: scheduledNotifications.length,
    notificationHistoryCount: notificationHistory.length,
    patientsCount: patients.length
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Notification Management</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={loadScheduledNotifications}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleTestEmailConfiguration}
            disabled={isTesting}
          >
            <TestTube className={`h-4 w-4 mr-2 ${isTesting ? 'animate-pulse' : ''}`} />
            Test Email
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'scheduled', label: 'Scheduled', icon: Clock },
          { id: 'history', label: 'History', icon: Mail },
          { id: 'send', label: 'Send Email', icon: Send },
          { id: 'bulk', label: 'Bulk Email', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              console.log('🔔 [NotificationManagement] Switching to section:', id);
              setActiveSection(id as any);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeSection === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Scheduled Notifications */}
      {activeSection === 'scheduled' && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Scheduled Notifications</span>
            </CardTitle>
            <CardDescription>
              View and manage upcoming appointment reminder notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading scheduled notifications...</p>
              </div>
            ) : scheduledNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No scheduled notifications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledNotifications.map((notification) => (
                  <div key={notification.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-foreground">{notification.patientName}</h4>
                          {getTypeBadge(notification.type)}
                          {getStatusBadge(notification.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.patientEmail}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Scheduled:</span>
                            <p className="text-muted-foreground">
                              {notification.scheduledFor ? new Date(notification.scheduledFor).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                          {notification.appointmentDate && (
                            <div>
                              <span className="font-medium">Appointment:</span>
                              <p className="text-muted-foreground">
                                {notification.appointmentDate} at {notification.appointmentTime}
                              </p>
                            </div>
                          )}
                          {notification.serviceName && (
                            <div>
                              <span className="font-medium">Service:</span>
                              <p className="text-muted-foreground">{notification.serviceName}</p>
                            </div>
                          )}
                          {notification.staffName && (
                            <div>
                              <span className="font-medium">Provider:</span>
                              <p className="text-muted-foreground">{notification.staffName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification History */}
      {activeSection === 'history' && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Notification History</span>
            </CardTitle>
            <CardDescription>
              View all sent notifications and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-history">Search</Label>
                  <Input
                    id="search-history"
                    type="text"
                    placeholder="Search by patient name or email..."
                    value={historyFilters.search}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
                  />
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="filter-type">Type</Label>
                  <select
                    id="filter-type"
                    value={historyFilters.type}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, type: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">All Types</option>
                    <option value="24h_reminder">24h Reminder</option>
                    <option value="2h_reminder">2h Reminder</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="filter-status">Status</Label>
                  <select
                    id="filter-status"
                    value={historyFilters.status}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <Button onClick={loadNotificationHistory} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading notification history...</p>
              </div>
            ) : notificationHistory.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notification history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notificationHistory.map((notification) => (
                  <div key={notification.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-foreground">{notification.patientName}</h4>
                          {getTypeBadge(notification.type)}
                          {getStatusBadge(notification.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.patientEmail}</p>
                        <p className="text-sm font-medium mb-2">{notification.emailSubject}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Sent:</span>
                            <p className="text-muted-foreground">
                              {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Not sent'}
                            </p>
                          </div>
                          {notification.appointmentDate && (
                            <div>
                              <span className="font-medium">Appointment:</span>
                              <p className="text-muted-foreground">
                                {notification.appointmentDate} at {notification.appointmentTime}
                              </p>
                            </div>
                          )}
                          {notification.serviceName && (
                            <div>
                              <span className="font-medium">Service:</span>
                              <p className="text-muted-foreground">{notification.serviceName}</p>
                            </div>
                          )}
                          {notification.errorMessage && (
                            <div>
                              <span className="font-medium text-red-600">Error:</span>
                              <p className="text-red-600">{notification.errorMessage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Send Custom Email */}
      {activeSection === 'send' && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-primary" />
              <span>Send Custom Email</span>
            </CardTitle>
            <CardDescription>
              Send a personalized email to a specific patient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-select">Select Patient</Label>
                <select
                  id="patient-select"
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const patient = patients.find(p => p.id === e.target.value);
                    setSelectedPatient(patient || null);
                  }}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  type="text"
                  placeholder="Enter email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="email-message">Message</Label>
                <textarea
                  id="email-message"
                  rows={6}
                  placeholder="Enter your message here..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleSendCustomEmail}
                  disabled={isSending || !selectedPatient || !emailSubject || !emailMessage}
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPatient(null);
                    setEmailSubject('');
                    setEmailMessage('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Email */}
      {activeSection === 'bulk' && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Bulk Email</span>
            </CardTitle>
            <CardDescription>
              Send the same email to multiple patients at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Select Patients</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {patients.map((patient) => (
                    <label key={patient.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPatients.includes(patient.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPatients([...selectedPatients, patient.id]);
                          } else {
                            setSelectedPatients(selectedPatients.filter(id => id !== patient.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {patient.firstName} {patient.lastName} ({patient.email})
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedPatients.length} patient(s) selected
                </p>
              </div>
              
              <div>
                <Label htmlFor="bulk-subject">Subject</Label>
                <Input
                  id="bulk-subject"
                  type="text"
                  placeholder="Enter email subject..."
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="bulk-message">Message</Label>
                <textarea
                  id="bulk-message"
                  rows={6}
                  placeholder="Enter your message here..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleSendBulkEmail}
                  disabled={isSending || selectedPatients.length === 0 || !bulkSubject || !bulkMessage}
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Send to {selectedPatients.length} Patient(s)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPatients([]);
                    setBulkSubject('');
                    setBulkMessage('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      {activeSection === 'settings' && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>
              Configure automatic reminder settings and email preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Auto-reminder Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Automatic Reminders</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">24-Hour Reminders</h4>
                      <p className="text-sm text-muted-foreground">
                        Send appointment reminders 24 hours before scheduled time
                      </p>
                    </div>
                    <Button
                      variant={settings.reminder24hEnabled ? "default" : "outline"}
                      onClick={() => handleToggleReminder('24h', !settings.reminder24hEnabled)}
                    >
                      {settings.reminder24hEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">2-Hour Reminders</h4>
                      <p className="text-sm text-muted-foreground">
                        Send urgent appointment reminders 2 hours before scheduled time
                      </p>
                    </div>
                    <Button
                      variant={settings.reminder2hEnabled ? "default" : "outline"}
                      onClick={() => handleToggleReminder('2h', !settings.reminder2hEnabled)}
                    >
                      {settings.reminder2hEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email Templates Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Email Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handlePreviewEmail('24h')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">24-Hour Reminder</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">
                      Preview the standard 24-hour appointment reminder template
                    </p>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePreviewEmail('2h')}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">2-Hour Reminder</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">
                      Preview the urgent 2-hour appointment reminder template
                    </p>
                  </Button>
                </div>
              </div>

              {/* Integration Test */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Integration Test</h3>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-4">
                    Test the notification system integration to verify it's working correctly.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleTestIntegration}
                      disabled={isTesting}
                      className="flex items-center space-x-2 w-full"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>{isTesting ? 'Testing...' : 'Test Custom Email'}</span>
                    </Button>
                    <Button
                      onClick={handleComprehensiveTest}
                      disabled={isTesting}
                      variant="outline"
                      className="flex items-center space-x-2 w-full"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>{isTesting ? 'Testing...' : 'Test All Notification Features'}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Clinic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={settings.clinicEmail} disabled />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={settings.clinicPhone} disabled />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={settings.clinicAddress} disabled />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Clinic information is used in email templates. Contact your system administrator to update this information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4">
                <Label className="font-medium">Subject:</Label>
                <p className="text-sm text-muted-foreground">{previewData.subject}</p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
