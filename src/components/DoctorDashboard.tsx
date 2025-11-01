import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import DailySchedule from './DailySchedule';
import Logo from './Logo';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  FileText, 
  Settings,
  LogOut,
  Plus,
  Eye,
  Check,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Bell,
  MessageSquare
} from 'lucide-react';
import { authAPI, staffAPI, notificationsAPI } from '../services/api';
import ProfileModal from './ProfileModal';
import NotificationCenter from './NotificationCenter';
import SendMessageModal from './SendMessageModal';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  staffId?: string;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  staffId?: string;
  doctorId?: string;
  staff?: {
    id?: string;
    staffId?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  };
  patient?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    medicalHistory?: string;
  };
  service?: {
    id?: string;
    name?: string;
    durationMinutes?: number;
    price?: number;
  };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  medicalHistory?: string;
  userId: string;
}

interface ShiftSchedule {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DoctorDashboardProps {
  user: User;
  appointments: Appointment[];
  patients: Patient[];
  shiftSchedule: ShiftSchedule[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string;
  onApproveAppointment: (appointmentId: string) => Promise<void>;
  onRejectAppointment: (appointmentId: string, reason: string) => Promise<void>;
  onCancelAppointment: (appointmentId: string) => Promise<void>;
  onUpdateAppointment: (appointmentId: string, updateData: any) => Promise<void>;
  onUpdateShiftSchedule: (shiftData: ShiftSchedule[]) => Promise<void>;
  onViewPatientDetails: (patientId: string) => Promise<void>;
  onLogout: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  user,
  appointments,
  patients,
  shiftSchedule,
  isLoading,
  isProcessing,
  error,
  onApproveAppointment,
  onRejectAppointment,
  onCancelAppointment,
  onUpdateAppointment,
  onUpdateShiftSchedule,
  onViewPatientDetails,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [newShiftSchedule, setNewShiftSchedule] = useState<ShiftSchedule[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    appointmentDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    serviceId: ''
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    // Load staff list for messaging
    const loadStaff = async () => {
      try {
        const staffData = await staffAPI.getAll();
        setStaffList(staffData || []);
      } catch (error) {
        console.error('Error loading staff for messaging:', error);
        setStaffList([]);
      }
    };
    loadStaff();
  }, []);

  // Load notifications and calculate unread count
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const staffId = user.staffId || user.id;
        if (staffId) {
          const data = await notificationsAPI.getStaffNotifications(staffId);
          const notificationsArray = Array.isArray(data) ? data : [];
          setNotifications(notificationsArray);
          const unread = notificationsArray.filter((n: any) => !n.isRead).length;
          setUnreadNotificationCount(unread);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setUnreadNotificationCount(0);
      }
    };

    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user.staffId, user.id]);

  const handleUpdateProfile = async (userId: string, profileData: any) => {
    try {
      await authAPI.updateProfile(userId, profileData);
      setCurrentUser((prev: any) => ({
        ...prev,
        ...profileData,
        address: profileData.address || prev.address,
        emergencyContact: profileData.emergencyContact || prev.emergencyContact
      }));
    } catch (error: any) {
      throw error;
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper function to sort schedule by day order
  const sortScheduleByDay = (scheduleArray: ShiftSchedule[]) => {
    return scheduleArray.sort((a, b) => {
      return daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek);
    });
  };

  useEffect(() => {
    // Initialize shift schedule with current data or defaults
    if (shiftSchedule.length > 0) {
      setNewShiftSchedule(sortScheduleByDay(shiftSchedule));
    } else {
      // Initialize with default schedule (09:00-17:00, Monday-Friday active)
      setNewShiftSchedule(sortScheduleByDay(daysOfWeek.map(day => ({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
      }))));
    }
  }, [shiftSchedule]);

  // Update newShiftSchedule when modal opens to ensure it has current data
  useEffect(() => {
    if (showShiftModal) {
      if (shiftSchedule.length > 0) {
        setNewShiftSchedule(shiftSchedule);
      } else {
        // Use defaults when no schedule exists
        setNewShiftSchedule(daysOfWeek.map(day => ({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isActive: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
        })));
      }
    }
  }, [showShiftModal, shiftSchedule]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      pending: { variant: 'secondary' as const, icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, className: 'bg-red-100 text-red-800' },
      completed: { variant: 'outline' as const, icon: CheckCircle, className: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Pagination and search helper functions
  const filterAppointments = (appointments: Appointment[], searchTerm: string) => {
    if (!searchTerm) return appointments;
    
    const searchLower = searchTerm.toLowerCase();
    
    return appointments.filter(appointment => {
      // Safe string checking with null/undefined protection
      const firstName = appointment.patient?.firstName || '';
      const lastName = appointment.patient?.lastName || '';
      const email = appointment.patient?.email || '';
      const serviceName = appointment.service?.name || '';
      const status = appointment.status || '';
      
      return firstName.toLowerCase().includes(searchLower) ||
             lastName.toLowerCase().includes(searchLower) ||
             email.toLowerCase().includes(searchLower) ||
             serviceName.toLowerCase().includes(searchLower) ||
             status.toLowerCase().includes(searchLower);
    });
  };

  const paginateAppointments = (appointments: Appointment[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return appointments.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number, itemsPerPage: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const handleShiftChange = (dayIndex: number, field: keyof ShiftSchedule, value: any) => {
    const updatedSchedule = newShiftSchedule.map((shift, index) => 
      index === dayIndex ? { ...shift, [field]: value } : shift
    );
    setNewShiftSchedule(sortScheduleByDay(updatedSchedule));
  };

  const handleSaveShiftSchedule = async () => {
    try {
      // ✅ DETAILED LOGGING: Log before saving
      console.group('💾 [Saving Shift Schedule]');
      console.log('📅 Shift Schedule to Save:', newShiftSchedule);
      console.log('📊 Number of Days:', newShiftSchedule?.length);
      console.log('👤 User:', user);
      console.groupEnd();
      
      await onUpdateShiftSchedule(newShiftSchedule);
      setShowShiftModal(false);
    } catch (error: any) {
      console.error('❌ Error saving shift schedule:', error);
      // Error is already shown in alert by onUpdateShiftSchedule
      // Don't close modal if save failed
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
    await onViewPatientDetails(patient.id);
  };

  const handleRejectAppointment = async () => {
    if (rejectReason.trim()) {
      await onRejectAppointment(selectedAppointmentId, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedAppointmentId('');
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    // ✅ DETAILED LOGGING: Log appointment being edited
    console.group('📝 [Edit Appointment Clicked]');
    console.log('📅 Full Appointment Object:', appointment);
    console.log('📅 Appointment ID:', appointment.id);
    console.log('📅 Appointment Date (raw):', appointment.appointmentDate);
    console.log('⏰ Start Time (raw):', appointment.startTime);
    console.log('📊 End Time (raw):', appointment.endTime);
    console.log('✅ Status:', appointment.status);
    console.log('👤 Staff ID:', appointment.staffId);
    console.log('👨‍⚕️ Doctor ID:', appointment.doctorId);
    
    // Parse dates for logging
    if (appointment.appointmentDate && appointment.startTime) {
      // ✅ FIX: Extract date part only (remove time if present)
      const datePart = appointment.appointmentDate.split('T')[0];
      const dateTimeString = `${datePart}T${appointment.startTime}`;
      const appointmentDateTime = new Date(dateTimeString);
      const currentDateTime = new Date();
      
      console.log('🔗 Combined DateTime String:', dateTimeString);
      console.log('📅 Parsed Appointment DateTime:', appointmentDateTime.toLocaleString());
      console.log('🕐 Current DateTime:', currentDateTime.toLocaleString());
      console.log('⏱️ Time Until Appointment:', 
        Math.round((appointmentDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60)) + ' minutes'
      );
    }
    
    console.groupEnd();
    
    setEditingAppointment(appointment);
    setEditForm({
      appointmentDate: appointment.appointmentDate.split('T')[0],
      startTime: appointment.startTime.substring(0, 5), // Format as HH:mm
      endTime: appointment.endTime.substring(0, 5),
      notes: appointment.notes || '',
      serviceId: appointment.service?.id || ''
    });
    setShowEditModal(true);
  };

  const handleSaveAppointment = async () => {
    if (!editingAppointment) return;
    
    // ✅ CRITICAL: Verify appointment ownership before allowing update
    const userStaffId = user.staffId;
    if (userStaffId) {
      const belongsToDoctor = 
        editingAppointment.staffId === userStaffId || 
        editingAppointment.doctorId === userStaffId ||
        editingAppointment.staff?.id === userStaffId ||
        editingAppointment.staff?.staffId === userStaffId;
      
      if (!belongsToDoctor) {
        alert('You can only update appointments assigned to you');
        setShowEditModal(false);
        return;
      }
      
      // Verify appointment is confirmed and in the future
      // ✅ DETAILED LOGGING: Log all appointment data for debugging
      console.group('🔍 [Appointment Update Validation]');
      console.log('📅 Editing Appointment Object:', editingAppointment);
      console.log('📅 Raw appointmentDate:', editingAppointment.appointmentDate);
      console.log('⏰ Raw startTime:', editingAppointment.startTime);
      console.log('📊 Raw endTime:', editingAppointment.endTime);
      console.log('✅ Raw status:', editingAppointment.status);
      
      // Build the date string for parsing
      // ✅ FIX: Extract date part only (remove time if present in appointmentDate)
      const datePart = editingAppointment.appointmentDate.split('T')[0];
      const dateTimeString = `${datePart}T${editingAppointment.startTime}`;
      console.log('🔗 Combined dateTime string:', dateTimeString);
      console.log('📅 Extracted date part:', datePart);
      
      const appointmentDate = new Date(dateTimeString);
      const currentDate = new Date();
      
      console.log('📅 Parsed appointmentDate:', appointmentDate);
      console.log('📅 Parsed appointmentDate ISO:', appointmentDate.toISOString());
      console.log('📅 Parsed appointmentDate local:', appointmentDate.toLocaleString());
      console.log('📅 Parsed appointmentDate timestamp:', appointmentDate.getTime());
      
      console.log('🕐 Current date:', currentDate);
      console.log('🕐 Current date ISO:', currentDate.toISOString());
      console.log('🕐 Current date local:', currentDate.toLocaleString());
      console.log('🕐 Current date timestamp:', currentDate.getTime());
      
      const timeDifference = appointmentDate.getTime() - currentDate.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      const minutesDifference = timeDifference / (1000 * 60);
      
      console.log('⏱️ Time difference (ms):', timeDifference);
      console.log('⏱️ Time difference (hours):', hoursDifference.toFixed(2));
      console.log('⏱️ Time difference (minutes):', minutesDifference.toFixed(2));
      
      const isConfirmed = editingAppointment.status === 'confirmed';
      const isFuture = appointmentDate > currentDate;
      
      console.log('✅ Is Confirmed:', isConfirmed);
      console.log('⏭️ Is Future:', isFuture);
      console.log('🔍 Comparison (appointmentDate > currentDate):', appointmentDate > currentDate);
      console.log('🔍 Comparison (appointmentDate.getTime() > currentDate.getTime()):', appointmentDate.getTime() > currentDate.getTime());
      
      if (!isConfirmed) {
        console.warn('❌ Validation failed: Appointment is not confirmed');
        console.groupEnd();
        alert('Only confirmed appointments can be updated');
        setShowEditModal(false);
        return;
      }
      
      if (!isFuture) {
        console.warn('❌ Validation failed: Appointment is in the past');
        console.warn('❌ Appointment time:', appointmentDate.toLocaleString());
        console.warn('❌ Current time:', currentDate.toLocaleString());
        console.warn('❌ Difference:', `${hoursDifference.toFixed(2)} hours (${minutesDifference.toFixed(2)} minutes)`);
        console.groupEnd();
        alert('Cannot update past appointments. Only future appointments can be edited.');
        setShowEditModal(false);
        return;
      }
      
      console.log('✅ Validation passed: Appointment is confirmed and in the future');
      console.groupEnd();
    }
    
    try {
      // ✅ DETAILED LOGGING: Log update data being sent
      console.group('📤 [Sending Appointment Update]');
      console.log('📋 Edit Form Data:', editForm);
      console.log('📅 Appointment ID:', editingAppointment.id);
      
      // Format time to HH:mm:ss if needed
      const startTimeFormatted = editForm.startTime.includes(':') && editForm.startTime.split(':').length === 2 
        ? editForm.startTime + ':00' 
        : editForm.startTime;
      
      const updateData = {
        ...editForm,
        startTime: startTimeFormatted
      };
      
      console.log('📤 Update Payload:', updateData);
      console.log('📅 Updated Appointment Date:', updateData.appointmentDate);
      console.log('⏰ Updated Start Time:', updateData.startTime);
      console.log('📊 Updated End Time:', updateData.endTime);
      console.groupEnd();
      
      await onUpdateAppointment(editingAppointment.id, updateData);
      setShowEditModal(false);
      setEditingAppointment(null);
      setEditForm({
        appointmentDate: '',
        startTime: '',
        endTime: '',
        notes: '',
        serviceId: ''
      });
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      
      // ✅ Handle 403 errors gracefully
      if (error.response?.status === 403) {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.error || 'You do not have permission to update this appointment';
        
        if (errorMsg.includes('assigned to you') || errorMsg.includes('appointment')) {
          alert('This appointment belongs to another doctor. You cannot update it.');
          
          // Log diagnostic details for debugging
          if (errorData.details) {
            console.warn('❌ Update rejected - diagnostic details:', errorData.details);
          }
        } else {
          alert(`Failed to update appointment: ${errorMsg}`);
        }
      } else {
        // Show error to user
        alert(`Failed to update appointment: ${error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancelClick = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    
    // ✅ CRITICAL: Verify appointment ownership before allowing cancel
    const userStaffId = user.staffId;
    if (userStaffId) {
      const appointment = appointments.find((apt: any) => apt.id === appointmentToCancel);
      
      if (appointment) {
        const belongsToDoctor = 
          appointment.staffId === userStaffId || 
          appointment.doctorId === userStaffId ||
          appointment.staff?.id === userStaffId ||
          appointment.staff?.staffId === userStaffId;
        
        if (!belongsToDoctor) {
          alert('You can only cancel appointments assigned to you');
          setShowCancelConfirm(false);
          setAppointmentToCancel(null);
          return;
        }
        
        // Verify appointment is confirmed
        if (appointment.status !== 'confirmed') {
          alert('Only confirmed appointments can be cancelled');
          setShowCancelConfirm(false);
          setAppointmentToCancel(null);
          return;
        }
      }
    }
    
    try {
      await onCancelAppointment(appointmentToCancel);
      setShowCancelConfirm(false);
      setAppointmentToCancel(null);
    } catch (error: any) {
      // Error handling is done in onCancelAppointment
      setShowCancelConfirm(false);
      setAppointmentToCancel(null);
    }
  };

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const todayAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Logo size="lg" variant="icon-only" />
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-foreground">Hopewell Community Clinic</h1>
                <p className="text-sm text-muted-foreground">Doctor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right flex items-center space-x-2">
                <div>
                  <p className="font-medium text-foreground">Dr. {currentUser.firstName} {currentUser.lastName}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSendMessageModal(true)}
                  className="h-8 w-8 p-0"
                  title="Send Message"
                >
                  <MessageSquare className="h-5 w-5 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotificationCenter(true)}
                  className="h-8 w-8 p-0 relative"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-primary" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileModal(true)}
                  className="h-8 w-8 p-0"
                  title="Edit Profile"
                >
                  <UserCircle className="h-5 w-5 text-primary" />
                </Button>
              </div>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Calendar },
            { id: 'appointments', label: 'Appointments', icon: Clock },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'schedule', label: 'Schedule', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {todayAppointments.filter(apt => apt.status === 'confirmed').length} confirmed
                  </p>
                </CardContent>
              </Card>

              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting your approval
                  </p>
                </CardContent>
              </Card>

              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Under your care
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Appointments */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Recent Appointments</span>
                </CardTitle>
                <CardDescription>
                  Your latest appointment requests and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No appointments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {appointment.patient?.firstName || 'Unknown'} {appointment.patient?.lastName || 'Patient'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service?.name || 'Unknown Service'}
                            </p>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground">
                            <FileText className="h-3 w-3 inline mr-1" />
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <Card className="medical-card">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search appointments by patient name, email, service, or status..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pending Appointments */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Pending Appointments</span>
                </CardTitle>
                <CardDescription>
                  Review and approve pending appointment requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
                  const filteredPending = filterAppointments(pendingAppointments, searchTerm);
                  const paginatedPending = paginateAppointments(filteredPending, currentPage, itemsPerPage);
                  const totalPendingPages = getTotalPages(filteredPending.length, itemsPerPage);

                  return filteredPending.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No pending appointments match your search' : 'No pending appointments to review'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {paginatedPending.map((appointment) => (
                          <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">
                                  {appointment.patient?.firstName || 'Unknown'} {appointment.patient?.lastName || 'Patient'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Service: {appointment.service?.name || 'Unknown Service'} ({appointment.service?.durationMinutes || 0} min)
                                </p>
                                {appointment.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    <FileText className="h-3 w-3 inline mr-1" />
                                    {appointment.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                {getStatusBadge(appointment.status)}
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => onApproveAppointment(appointment.id)}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedAppointmentId(appointment.id);
                                      setShowRejectModal(true);
                                    }}
                                    disabled={isProcessing}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination for Pending */}
                      {totalPendingPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPending.length)} of {filteredPending.length} pending appointments
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPendingPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPendingPages))}
                              disabled={currentPage === totalPendingPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Upcoming Appointments</span>
                </CardTitle>
                <CardDescription>
                  Manage your upcoming confirmed appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Filter for upcoming appointments only: confirmed status and appointment date >= today
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Reset to start of day
                  
                  const upcomingAppointments = appointments.filter(apt => {
                    // Must be confirmed status
                    if (apt.status !== 'confirmed') return false;
                    
                    // Check if appointment date is today or in the future
                    const appointmentDate = new Date(apt.appointmentDate);
                    appointmentDate.setHours(0, 0, 0, 0);
                    
                    // Also check appointment time if it's today
                    if (appointmentDate.getTime() === today.getTime()) {
                      // If it's today, check if the appointment time hasn't passed
                      // ✅ FIX: Extract date part only (remove time if present in appointmentDate)
                      const datePart = apt.appointmentDate.split('T')[0];
                      const appointmentDateTime = new Date(`${datePart}T${apt.startTime}`);
                      return appointmentDateTime >= new Date();
                    }
                    
                    // If it's a future date, include it
                    return appointmentDate >= today;
                  });
                  
                  const filteredUpcoming = filterAppointments(upcomingAppointments, searchTerm);
                  const paginatedUpcoming = paginateAppointments(filteredUpcoming, currentPage, itemsPerPage);
                  const totalUpcomingPages = getTotalPages(filteredUpcoming.length, itemsPerPage);

                  return filteredUpcoming.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No upcoming appointments match your search' : 'No upcoming appointments found'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {paginatedUpcoming
                          .sort((a, b) => {
                            // Sort by date and time (ascending - earliest first)
                            // ✅ FIX: Extract date part only (remove time if present in appointmentDate)
                            const datePartA = a.appointmentDate.split('T')[0];
                            const datePartB = b.appointmentDate.split('T')[0];
                            const dateA = new Date(`${datePartA}T${a.startTime}`);
                            const dateB = new Date(`${datePartB}T${b.startTime}`);
                            return dateA.getTime() - dateB.getTime();
                          })
                          .map((appointment) => (
                          <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">
                                  {appointment.patient?.firstName || 'Unknown'} {appointment.patient?.lastName || 'Patient'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Service: {appointment.service?.name || 'Unknown Service'} ({appointment.service?.durationMinutes || 0} min)
                                </p>
                                {appointment.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    <FileText className="h-3 w-3 inline mr-1" />
                                    {appointment.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                {getStatusBadge(appointment.status)}
                                {/* Show Edit and Cancel buttons for all upcoming confirmed appointments */}
                                <div className="flex space-x-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAppointment(appointment)}
                                    disabled={isProcessing}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelClick(appointment.id)}
                                    disabled={isProcessing}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination for Upcoming */}
                      {totalUpcomingPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUpcoming.length)} of {filteredUpcoming.length} upcoming appointments
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <span className="text-sm">
                              Page {currentPage} of {totalUpcomingPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalUpcomingPages))}
                              disabled={currentPage === totalUpcomingPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Patient Management</span>
                </CardTitle>
                <CardDescription>
                  View and manage your patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No patients assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patients.map((patient) => (
                      <div key={patient.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {patient.firstName} {patient.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                            {patient.phone && (
                              <p className="text-sm text-muted-foreground">Phone: {patient.phone}</p>
                            )}
                            {patient.dateOfBirth && (
                              <p className="text-sm text-muted-foreground">
                                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPatient(patient)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Daily Schedule View */}
            {(() => {
              const doctorId = user.staffId || user.id;
              console.log('🔍 DoctorDashboard Schedule Tab - user:', user);
              console.log('🔍 DoctorDashboard Schedule Tab - doctorId:', doctorId);
              console.log('🔍 DoctorDashboard Schedule Tab - user.staffId:', user.staffId);
              console.log('🔍 DoctorDashboard Schedule Tab - user.id:', user.id);
              
              // Ensure we're using the staff ID, not the user ID
              if (!user.staffId) {
                console.error('❌ DoctorDashboard: No staffId found in user object!');
                console.log('❌ DoctorDashboard: User object keys:', Object.keys(user));
                console.log('❌ DoctorDashboard: Using fallback staff ID for testing');
                // TEMPORARY: Use a known valid staff ID for testing
                const fallbackStaffId = '42f78af2-c1c5-486c-9de5-0e7e44a8f0da'; // Dr. John Smith
                return (
                  <DailySchedule 
                    doctorId={fallbackStaffId}
                  />
                );
              }
              
              return (
                <DailySchedule 
                  doctorId={user.staffId}
                />
              );
            })()}
            
            {/* Shift Schedule Management */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Shift Schedule</span>
                  </div>
                  <Button onClick={() => setShowShiftModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Shifts
                  </Button>
                </CardTitle>
                <CardDescription>
                  Set your availability for patient appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shiftSchedule.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No shift schedule set</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click "Manage Shifts" to set your availability
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shiftSchedule.map((shift) => (
                      <div key={shift.dayOfWeek} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-24">
                            <span className="font-medium">{shift.dayOfWeek}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </span>
                          </div>
                        </div>
                        <Badge variant={shift.isActive ? "default" : "secondary"}>
                          {shift.isActive ? "Available" : "Off"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Shift Management Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Manage Shift Schedule</CardTitle>
              <CardDescription>
                Set your availability for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="flex space-x-2 pb-4 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewShiftSchedule(sortScheduleByDay(daysOfWeek.map(day => ({
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        isActive: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
                      }))));
                    }}
                  >
                    Set Weekdays (9-5)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewShiftSchedule(sortScheduleByDay(daysOfWeek.map(day => ({
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        isActive: true
                      }))));
                    }}
                  >
                    Set All Days (9-5)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewShiftSchedule(sortScheduleByDay(daysOfWeek.map(day => ({
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        isActive: false
                      }))));
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const defaultSchedule = daysOfWeek.map(day => ({
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        isActive: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
                      }));
                      setNewShiftSchedule(sortScheduleByDay(defaultSchedule));
                    }}
                  >
                    Reset to Defaults
                  </Button>
                </div>

                {/* Individual Day Settings */}
                {newShiftSchedule.map((shift, index) => (
                  <div key={shift.dayOfWeek} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="w-24">
                      <span className="font-medium">{shift.dayOfWeek}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shift.isActive}
                        onChange={(e) => handleShiftChange(index, 'isActive', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Available</span>
                    </div>
                    {shift.isActive && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`start-${index}`} className="text-sm">From:</Label>
                          <Input
                            id={`start-${index}`}
                            type="time"
                            value={shift.startTime}
                            onChange={(e) => handleShiftChange(index, 'startTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`end-${index}`} className="text-sm">To:</Label>
                          <Input
                            id={`end-${index}`}
                            type="time"
                            value={shift.endTime}
                            onChange={(e) => handleShiftChange(index, 'endTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex space-x-3 pt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowShiftModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveShiftSchedule}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Patient Details</span>
              </CardTitle>
              <CardDescription>
                Complete patient information and medical history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">First Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedPatient.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedPatient.lastName}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>
                </div>
                {selectedPatient.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                  </div>
                )}
                {selectedPatient.dateOfBirth && (
                  <div>
                    <Label className="text-sm font-medium">Date of Birth</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedPatient.medicalHistory && (
                  <div>
                    <Label className="text-sm font-medium">Medical History</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedPatient.medicalHistory}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-6">
                <Button onClick={() => setShowPatientModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Appointment Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Appointment</CardTitle>
              <CardDescription>
                Please provide a reason for rejecting this appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reject-reason">Reason for rejection</Label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full h-20 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                    placeholder="Please explain why this appointment is being rejected..."
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedAppointmentId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRejectAppointment}
                  disabled={!rejectReason.trim() || isProcessing}
                >
                  {isProcessing ? 'Rejecting...' : 'Reject Appointment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onUpdateProfile={handleUpdateProfile}
        role="doctor"
      />
      
      {/* Notification Center */}
      <NotificationCenter
        userId={user.id}
        userRole="doctor"
        staffId={user.staffId || user.id}
        isOpen={showNotificationCenter}
        onClose={() => {
          setShowNotificationCenter(false);
          // Reload notifications to update unread count
          const loadNotifications = async () => {
            try {
              const staffId = user.staffId || user.id;
              if (staffId) {
                const data = await notificationsAPI.getStaffNotifications(staffId);
                const notificationsArray = Array.isArray(data) ? data : [];
                setNotifications(notificationsArray);
                const unread = notificationsArray.filter((n: any) => !n.isRead).length;
                setUnreadNotificationCount(unread);
              }
            } catch (error) {
              console.error('Error loading notifications:', error);
            }
          };
          loadNotifications();
        }}
      />
      
      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={showSendMessageModal}
        onClose={() => setShowSendMessageModal(false)}
        senderId={user.id}
        senderRole="doctor"
        senderName={`Dr. ${currentUser.firstName} ${currentUser.lastName}`}
        existingPatients={patients}
        existingStaff={staffList}
      />

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Appointment</CardTitle>
              <CardDescription>
                Update appointment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-date">Appointment Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editForm.appointmentDate}
                    onChange={(e) => setEditForm({ ...editForm, appointmentDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-start-time">Start Time</Label>
                  <Input
                    id="edit-start-time"
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <textarea
                    id="edit-notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full h-20 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAppointment(null);
                    setEditForm({
                      appointmentDate: '',
                      startTime: '',
                      endTime: '',
                      notes: '',
                      serviceId: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveAppointment}
                  disabled={isProcessing || !editForm.appointmentDate || !editForm.startTime}
                >
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Appointment Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cancel Appointment</CardTitle>
              <CardDescription>
                Are you sure you want to cancel this appointment?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setAppointmentToCancel(null);
                  }}
                >
                  No, Keep It
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirmCancel}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;



