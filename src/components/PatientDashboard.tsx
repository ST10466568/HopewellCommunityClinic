import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  User, 
  Phone, 
  MapPin, 
  LogOut,
  Bell,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import BookingWizard from './BookingWizard';
import { appointmentsAPI, notificationsAPI, authAPI } from '../services/api';
import Logo from './Logo';
import ProfileModal from './ProfileModal';
import NotificationCenter from './NotificationCenter';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  service: Service;
  staff?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface PatientDashboardProps {
  user: User;
  appointments: Appointment[];
  services: Service[];
  availableSlots: any[];
  doctors: any[];
  patientId: string | null;
  isLoading: boolean;
  isBooking: boolean;
  bookingError: string;
  error: string;
  onBookAppointment: (data: any) => Promise<void>;
  onUpdateAppointment: (id: string, data: any) => Promise<void>;
  onCancelAppointment: (id: string) => Promise<void>;
  onLogout: () => void;
  onLoadAvailableSlots: (date: string) => Promise<void>;
  onRefreshAppointments: () => Promise<void>;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  appointments,
  services,
  availableSlots,
  doctors,
  patientId,
  isLoading,
  isBooking,
  bookingError,
  error,
  onBookAppointment,
  onUpdateAppointment,
  onCancelAppointment,
  onLogout,
  onLoadAvailableSlots,
  onRefreshAppointments
}) => {
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [editData, setEditData] = useState({
    serviceId: '',
    staffId: '',
    appointmentDate: '',
    startTime: '',
    notes: ''
  });
  const [editDoctors, setEditDoctors] = useState<any[]>([]);
  const [editTimeSlots, setEditTimeSlots] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handleUpdateProfile = async (userId: string, profileData: any) => {
    try {
      await authAPI.updateProfile(userId, profileData);
      // Update local user state
      setCurrentUser((prev: any) => ({
        ...prev,
        ...profileData,
        address: profileData.address || prev.address,
        emergencyContact: profileData.emergencyContact || prev.emergencyContact
      }));
      // Refresh page data by reloading
      await onRefreshAppointments();
    } catch (error: any) {
      throw error;
    }
  };

  const handleBookingSuccess = async () => {
    setShowBookingWizard(false);
    // Refresh appointments after successful booking
    await onRefreshAppointments();
  };

  const loadEditDoctors = async (date: string) => {
    if (!date) return;
    
    setEditLoading(true);
    setEditError('');
    
    try {
      const response = await appointmentsAPI.getDoctorsOnDuty(date);
      setEditDoctors(response.doctors || response || []);
    } catch (error: any) {
      console.error('Error loading doctors for edit:', error);
      
      // If API fails, use fallback doctors from the main doctors list
      if (error.response?.status === 500 || error.response?.status === 404) {
        console.log('API failed, using fallback doctors');
        setEditDoctors(doctors || []);
      } else if (error.response?.status !== 401) {
        setEditError('Failed to load available doctors. Using all doctors as fallback.');
        setEditDoctors(doctors || []);
      }
    } finally {
      setEditLoading(false);
    }
  };

  const loadEditTimeSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) {
      console.log('loadEditTimeSlots: Missing doctorId or date', { doctorId, date });
      return;
    }
    
    console.log('loadEditTimeSlots: Loading time slots for', { doctorId, date });
    setEditLoading(true);
    setEditError('');
    
    try {
      const response = await appointmentsAPI.getAvailableSlotsByDoctor(doctorId, date);
      console.log('loadEditTimeSlots: API response', response);
      
      // Handle different response formats
      let slots = [];
      if (response.availableSlots) {
        slots = response.availableSlots;
      } else if (Array.isArray(response)) {
        slots = response;
      } else if (response && typeof response === 'object') {
        // Try to find any array property
        const arrayProps = Object.values(response).filter(Array.isArray);
        if (arrayProps.length > 0) {
          slots = arrayProps[0];
        }
      }
      
      console.log('loadEditTimeSlots: Processed slots', slots);
      setEditTimeSlots(slots);
      
      // If no slots from API, generate some fallback slots
      if (slots.length === 0) {
        console.log('No slots from API, generating fallback slots');
        const fallbackSlots = generateFallbackTimeSlots();
        setEditTimeSlots(fallbackSlots);
      }
    } catch (error: any) {
      console.error('Error loading time slots for edit:', error);
      
      // Generate fallback slots on any error
      console.log('API failed, generating fallback slots');
      const fallbackSlots = generateFallbackTimeSlots();
      setEditTimeSlots(fallbackSlots);
      
      // Only show error for non-500/404 errors (authentication issues)
      if (error.response?.status !== 500 && error.response?.status !== 404) {
        setEditError('Using fallback time slots due to API issues.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const generateFallbackTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        slots.push({
          id: `fallback-${timeString}`,
          startTime: timeString,
          endTime: minute === 30 ? `${(hour + 1).toString().padStart(2, '0')}:00:00` : `${hour.toString().padStart(2, '0')}:30:00`
        });
      }
    }
    
    return slots;
  };

  const handleEditAppointment = async (appointment: any) => {
    setEditingAppointment(appointment);
    const appointmentDate = appointment.appointmentDate.split('T')[0];
    setEditData({
      serviceId: appointment.service.id,
      staffId: appointment.staff?.id || '',
      appointmentDate: appointmentDate,
      startTime: appointment.startTime,
      notes: appointment.notes || ''
    });
    
    // Load doctors for the appointment date
    await loadEditDoctors(appointmentDate);
    
    // If we have a staff ID, load time slots for that doctor
    if (appointment.staff?.id) {
      await loadEditTimeSlots(appointment.staff.id, appointmentDate);
    }
    
    setShowEditModal(true);
  };

  const handleEditInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'appointmentDate' && value) {
      // Clear the start time and staff when date changes
      setEditData(prev => ({ ...prev, [name]: value, startTime: '', staffId: '' }));
      setEditTimeSlots([]);
      // Load doctors for the new date
      await loadEditDoctors(value);
    } else if (name === 'staffId' && value) {
      console.log('Doctor changed:', { value, currentDate: editData.appointmentDate });
      // Clear the start time when doctor changes
      setEditData(prev => ({ ...prev, [name]: value, startTime: '' }));
      // Load time slots for the selected doctor and date
      if (editData.appointmentDate) {
        await loadEditTimeSlots(value, editData.appointmentDate);
      } else {
        console.log('No appointment date available for time slot loading');
      }
    } else {
      // For other fields, just update the state
      setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    
    try {
      await onUpdateAppointment(editingAppointment.id, editData);
      setShowEditModal(false);
      setEditingAppointment(null);
      setEditData({ serviceId: '', staffId: '', appointmentDate: '', startTime: '', notes: '' });
      setEditDoctors([]);
      setEditTimeSlots([]);
      setEditError('');
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
    setEditData({ serviceId: '', staffId: '', appointmentDate: '', startTime: '', notes: '' });
    setEditDoctors([]);
    setEditTimeSlots([]);
    setEditError('');
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      await onCancelAppointment(appointmentId);
    } catch (error) {
      console.error('Error canceling appointment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      pending: { variant: 'secondary' as const, icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, className: 'bg-red-100 text-red-800' },
      completed: { variant: 'default' as const, icon: CheckCircle, className: 'bg-blue-100 text-blue-800' },
      walkin: { variant: 'secondary' as const, icon: Clock, className: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn('status-badge', config.className)}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) >= new Date() && apt.status !== 'cancelled'
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) < new Date() || apt.status === 'completed'
  );

  // Load notifications when component mounts
  useEffect(() => {
    if (patientId) {
      loadNotifications();
    }
  }, [patientId]);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadNotificationCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    if (!patientId) return;
    
    try {
      setIsLoadingNotifications(true);
      const data = await notificationsAPI.getPatientNotifications(patientId);
      // Ensure data is an array
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case '24h_reminder':
        return '24h Reminder';
      case '2h_reminder':
        return '2h Reminder';
      case 'custom':
        return 'Custom Message';
      default:
        return type;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case '24h_reminder':
        return <Calendar className="h-4 w-4" />;
      case '2h_reminder':
        return <AlertCircle className="h-4 w-4" />;
      case 'custom':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const displayedNotifications = showAllNotifications ? notifications : notifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="lg" variant="with-text" textSize="xl" />
            <div className="flex items-center space-x-4">
              <div className="text-right flex items-center space-x-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
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
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your appointments and health information
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                Next appointment {upcomingAppointments.length > 0 ? formatDate(upcomingAppointments[0].appointmentDate) : 'Not scheduled'}
              </p>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                Completed appointments
              </p>
            </CardContent>
          </Card>

          <Card className="medical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => setShowBookingWizard(true)}
                disabled={!patientId}
                title={!patientId ? "Patient account not properly linked. Please contact support." : ""}
              >
                <Plus className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
              {!patientId && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  ⚠️ Your account is not properly linked to a patient record. Please contact support.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointments Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Upcoming Appointments</span>
              </CardTitle>
              <CardDescription>
                Your scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowBookingWizard(true)}
                    disabled={!patientId}
                    title={!patientId ? "Patient account not properly linked. Please contact support." : ""}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                  {!patientId && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      ⚠️ Your account is not properly linked to a patient record. Please contact support.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{appointment.service.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                          </p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                      {appointment.staff && (
                        <p className="text-sm text-muted-foreground mb-2">
                          With {appointment.staff.firstName} {appointment.staff.lastName}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground">
                          <FileText className="h-3 w-3 inline mr-1" />
                          {appointment.notes}
                        </p>
                      )}
                      <div className="flex space-x-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment)}
                          disabled={appointment.status === 'cancelled' || appointment.status === 'completed'}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={appointment.status === 'cancelled' || appointment.status === 'completed'}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment History */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Appointment History</span>
              </CardTitle>
              <CardDescription>
                Your past appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No appointment history</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{appointment.service.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                          </p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                      {appointment.staff && (
                        <p className="text-sm text-muted-foreground">
                          With {appointment.staff.firstName} {appointment.staff.lastName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notification History Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Notification History</span>
            </CardTitle>
            <CardDescription>
              View your recent email notifications from the clinic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingNotifications ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You'll receive email notifications for appointment reminders and important updates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedNotifications.map((notification) => (
                  <div key={notification.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">
                              {notification.emailSubject}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Sent: {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Not sent'}
                          </p>
                          {notification.appointmentDate && (
                            <p className="text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Appointment: {notification.appointmentDate} at {notification.appointmentTime}
                              {notification.serviceName && ` - ${notification.serviceName}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {notification.status === 'sent' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : notification.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 5 && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllNotifications(!showAllNotifications)}
                    >
                      {showAllNotifications ? 'Show Less' : `Show All ${notifications.length} Notifications`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Booking Wizard */}
      <BookingWizard
        isOpen={showBookingWizard}
        onClose={() => setShowBookingWizard(false)}
        onSuccess={handleBookingSuccess}
        services={services}
        patientId={patientId}
      />

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Edit Appointment</CardTitle>
              <CardDescription>
                Update your appointment details
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdateAppointment} className="space-y-4">
                {/* Error Display */}
                {editError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {editError}
                  </div>
                )}

                {/* Service Selection */}
                <div>
                  <Label htmlFor="edit-serviceId">Service</Label>
                  <select
                    id="edit-serviceId"
                    name="serviceId"
                    value={editData.serviceId}
                    onChange={handleEditInputChange}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.durationMinutes} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection */}
                <div>
                  <Label htmlFor="edit-staffId">Doctor *</Label>
                  <select
                    id="edit-staffId"
                    name="staffId"
                    value={editData.staffId}
                    onChange={handleEditInputChange}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                    disabled={!editData.appointmentDate || editLoading}
                  >
                    <option value="">Select a doctor</option>
                    {editDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                  {editLoading && editData.appointmentDate && (
                    <p className="text-sm text-muted-foreground mt-1">Loading doctors...</p>
                  )}
                </div>

                {/* Date Selection */}
                <div>
                  <Label htmlFor="edit-appointmentDate">Date</Label>
                  <Input
                    id="edit-appointmentDate"
                    name="appointmentDate"
                    type="date"
                    value={editData.appointmentDate}
                    onChange={handleEditInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <Label htmlFor="edit-startTime">Available Time</Label>
                  <select
                    id="edit-startTime"
                    name="startTime"
                    value={editData.startTime}
                    onChange={handleEditInputChange}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                    disabled={!editData.appointmentDate || !editData.staffId || editLoading}
                  >
                    <option value="">Select a time</option>
                    {editTimeSlots.map((slot, index) => (
                      <option key={slot.id || `${slot.startTime}-${index}`} value={slot.startTime}>
                        {formatTime(slot.startTime)}
                      </option>
                    ))}
                  </select>
                  {editLoading && editData.staffId && editData.appointmentDate && (
                    <p className="text-sm text-muted-foreground mt-1">Loading time slots...</p>
                  )}
                  {!editLoading && editData.staffId && editData.appointmentDate && editTimeSlots.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">No available time slots for this doctor on this date</p>
                  )}
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Debug: {editTimeSlots.length} slots loaded
                      {editTimeSlots.length > 0 && (
                        <div>First slot: {JSON.stringify(editTimeSlots[0])}</div>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          console.log('Manual time slot test');
                          const testSlots = generateFallbackTimeSlots();
                          setEditTimeSlots(testSlots);
                        }}
                        className="text-blue-500 underline"
                      >
                        Test Load Slots
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="edit-notes">Notes (Optional)</Label>
                  <textarea
                    id="edit-notes"
                    name="notes"
                    value={editData.notes}
                    onChange={handleEditInputChange}
                    className="w-full h-20 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                    placeholder="Any specific concerns or requests..."
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCloseEditModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isBooking || editLoading}
                  >
                    {isBooking || editLoading ? 'Updating...' : 'Update Appointment'}
                  </Button>
                </div>
              </form>
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
        role="patient"
      />
      
      {/* Notification Center */}
      <NotificationCenter
        userId={user.id}
        userRole="patient"
        patientId={patientId || undefined}
        isOpen={showNotificationCenter}
        onClose={() => {
          setShowNotificationCenter(false);
          // Reload notifications to update unread count
          loadNotifications();
        }}
      />
    </div>
  );
};

export default PatientDashboard;
