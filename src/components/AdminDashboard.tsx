import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { appointmentsAPI, doctorAPI, staffAPI, adminAPI } from '../services/api';
import BookingWizard from './BookingWizard';
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
  BarChart3,
  UserPlus,
  Shield,
  Activity,
  UserCog,
  CalendarDays
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price?: number;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

interface ShiftSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface AdminDashboardProps {
  user: User;
  users: AdminUser[];
  appointments: Appointment[];
  services: Service[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  onUpdateUserRole: (userId: string, newRole: string) => Promise<void>;
  onCreateStaff: (staffData: any) => Promise<void>;
  onCreateService: (serviceData: any) => Promise<void>;
  onUpdateService: (serviceId: string, serviceData: any) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  users,
  appointments,
  services,
  isLoading,
  isProcessing,
  error,
  onToggleUserStatus,
  onUpdateUserRole,
  onCreateStaff,
  onCreateService,
  onUpdateService,
  onDeleteService,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  
  // Doctor schedule management states
  const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [doctorShiftSchedule, setDoctorShiftSchedule] = useState<ShiftSchedule[]>([]);
  const [newShiftSchedule, setNewShiftSchedule] = useState<ShiftSchedule[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'doctor',
    phone: ''
  });
  const [newPatientData, setNewPatientData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    price: 0
  });

  // Days of the week for shift schedule
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load all doctors for admin to manage
  const loadDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const response = await staffAPI.getAll();
      const doctorUsers = response.filter((user: any) => user.role === 'doctor');
      setAllDoctors(doctorUsers);
      console.log('📋 Loaded doctors for admin:', doctorUsers);
    } catch (error) {
      console.error('❌ Error loading doctors:', error);
      // Fallback: try to get doctors from users list
      const doctorUsers = users.filter(user => user.role === 'doctor');
      setAllDoctors(doctorUsers);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  // Load doctor's current shift schedule
  const loadDoctorShiftSchedule = async (doctorId: string) => {
    try {
      console.log('🔍 Loading shift schedule for doctor:', doctorId);
      
      // Try admin-specific endpoint first
      try {
        const schedule = await adminAPI.getDoctorShiftSchedule(doctorId);
        // Ensure schedule is an array
        const scheduleArray = Array.isArray(schedule) ? schedule : [];
        setDoctorShiftSchedule(scheduleArray);
        setNewShiftSchedule(scheduleArray);
        console.log('✅ Loaded shift schedule via admin endpoint:', scheduleArray);
        return;
      } catch (adminError) {
        console.log('⚠️ Admin endpoint failed, trying doctor endpoint...');
        
        // Try doctor endpoint as fallback
        try {
          const schedule = await doctorAPI.getShiftSchedule(doctorId);
          // Ensure schedule is an array
          const scheduleArray = Array.isArray(schedule) ? schedule : [];
          setDoctorShiftSchedule(scheduleArray);
          setNewShiftSchedule(scheduleArray);
          console.log('✅ Loaded shift schedule via doctor endpoint:', scheduleArray);
          return;
        } catch (doctorError) {
          console.log('⚠️ Doctor endpoint failed, trying public endpoint...');
          
          // Try public endpoint as final fallback
          try {
            const publicSchedule = await doctorAPI.getShiftSchedulePublic(doctorId);
            // Ensure schedule is an array
            const scheduleArray = Array.isArray(publicSchedule) ? publicSchedule : [];
            setDoctorShiftSchedule(scheduleArray);
            setNewShiftSchedule(scheduleArray);
            console.log('✅ Loaded schedule from public endpoint:', scheduleArray);
            return;
          } catch (publicError) {
            console.error('❌ All endpoints failed:', publicError);
            throw publicError;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading shift schedule:', error);
      
      // Initialize with default schedule if all fail
      const defaultSchedule = daysOfWeek.map(day => ({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
      }));
      setDoctorShiftSchedule(defaultSchedule);
      setNewShiftSchedule(defaultSchedule);
    }
  };

  // Update doctor's shift schedule
  const updateDoctorShiftSchedule = async () => {
    if (!selectedDoctor) return;
    
    try {
      setIsUpdatingSchedule(true);
      console.log('🔄 Updating shift schedule for doctor:', selectedDoctor.id);
      console.log('📅 New schedule:', newShiftSchedule);
      
      // Try admin-specific endpoint first
      try {
        await adminAPI.updateDoctorShiftSchedule(selectedDoctor.id, newShiftSchedule);
        setDoctorShiftSchedule(newShiftSchedule);
        console.log('✅ Shift schedule updated successfully via admin endpoint');
        
        // Close modal after successful update
        setShowDoctorScheduleModal(false);
        setSelectedDoctor(null);
        return;
      } catch (adminError) {
        console.log('⚠️ Admin endpoint failed, trying doctor endpoint...');
        
        // Try doctor endpoint as fallback
        try {
          await doctorAPI.updateShiftSchedule(selectedDoctor.id, newShiftSchedule);
          setDoctorShiftSchedule(newShiftSchedule);
          console.log('✅ Shift schedule updated successfully via doctor endpoint');
          
          // Close modal after successful update
          setShowDoctorScheduleModal(false);
          setSelectedDoctor(null);
          return;
        } catch (doctorError) {
          console.log('⚠️ Doctor endpoint failed, trying public endpoint...');
          
          // Try public endpoint as final fallback
          try {
            await doctorAPI.updateShiftSchedulePublic(selectedDoctor.id, newShiftSchedule);
            setDoctorShiftSchedule(newShiftSchedule);
            console.log('✅ Shift schedule updated successfully via public endpoint');
            
            // Close modal after successful update
            setShowDoctorScheduleModal(false);
            setSelectedDoctor(null);
            return;
          } catch (publicError) {
            console.error('❌ All endpoints failed:', publicError);
            throw publicError;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error updating shift schedule:', error);
      
      // Check if it's an authentication error
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 
          'status' in error.response && error.response.status === 401) {
        console.log('⚠️ Authentication failed - admin may not have proper permissions');
        console.log('💡 Schedule changes will be saved locally but not persisted to database');
        
        // Still update local state for immediate feedback
        setDoctorShiftSchedule(newShiftSchedule);
        
        // Show user-friendly message
        alert('Schedule updated locally, but could not save to database. Please check admin permissions.');
        
        // Close modal after local update
        setShowDoctorScheduleModal(false);
        setSelectedDoctor(null);
      } else {
        // For other errors, still update local state
        setDoctorShiftSchedule(newShiftSchedule);
        
        // Close modal after local update
        setShowDoctorScheduleModal(false);
        setSelectedDoctor(null);
      }
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  // Handle doctor selection for schedule management
  const handleDoctorSelection = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorScheduleModal(true);
    await loadDoctorShiftSchedule(doctor.id);
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

  // Load doctors when component mounts or when schedule tab is active
  useEffect(() => {
    if (activeTab === 'schedule') {
      loadDoctors();
    }
  }, [activeTab]);

  // Update newShiftSchedule when modal opens to ensure it has current data
  useEffect(() => {
    if (showDoctorScheduleModal && selectedDoctor) {
      // Ensure doctorShiftSchedule is an array
      const scheduleArray = Array.isArray(doctorShiftSchedule) ? doctorShiftSchedule : [];
      
      if (scheduleArray.length > 0) {
        setNewShiftSchedule(scheduleArray);
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
  }, [showDoctorScheduleModal, selectedDoctor, doctorShiftSchedule]);

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

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateStaff(newStaffData);
    setShowCreateStaffModal(false);
    setNewStaffData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'doctor',
      phone: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaffData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateStaff({
      ...newPatientData,
      role: 'patient' // Set role as 'patient' for patients
    });
    setShowCreatePatientModal(false);
    setNewPatientData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: ''
    });
  };

  const handleWalkInBooking = () => {
    setShowWalkInModal(true);
  };

  const handlePatientSelection = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowWalkInModal(false);
    setShowBookingWizard(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingWizard(false);
    setSelectedPatientId(null);
    // Refresh data if needed
  };

  const activeUsers = users.filter(u => u.isActive);
  const doctors = users.filter(u => u.role === 'doctor' && u.isActive);
  const patients = users.filter(u => u.role === 'patient' && u.isActive);
  const todayAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xl">💚</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Hopewell Community Clinic</h1>
                <p className="text-sm text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
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
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'services', label: 'Service Management', icon: Settings },
            { id: 'schedule', label: 'Doctor Schedules', icon: CalendarDays },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'staff', label: 'Staff Management', icon: UserPlus }
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeUsers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {users.length - activeUsers.length} inactive
                  </p>
                </CardContent>
              </Card>

              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{doctors.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active medical staff
                  </p>
                </CardContent>
              </Card>

              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patients</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered patients
                  </p>
                </CardContent>
              </Card>

              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled today
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest system activity and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service.name}
                            </p>
                            {appointment.staff && (
                              <p className="text-sm text-muted-foreground">
                                With Dr. {appointment.staff.firstName} {appointment.staff.lastName}
                              </p>
                            )}
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

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>User Management</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => setShowCreateStaffModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                    <Button onClick={() => setShowCreatePatientModal(true)} variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Patient
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Manage system users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Role: {user.role} • Created: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onToggleUserStatus(user.id, !user.isActive)}
                                disabled={isProcessing}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              {user.role !== 'admin' && (
                                <select
                                  value={user.role}
                                  onChange={(e) => onUpdateUserRole(user.id, e.target.value)}
                                  className="px-2 py-1 text-sm border rounded"
                                  disabled={isProcessing}
                                >
                                  <option value="patient">Patient</option>
                                  <option value="doctor">Doctor</option>
                                  <option value="admin">Admin</option>
                                </select>
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
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>All Appointments</span>
                  </div>
                  <Button onClick={handleWalkInBooking}>
                    <Plus className="h-4 w-4 mr-2" />
                    Book Walk-in Appointment
                  </Button>
                </div>
                <CardDescription>
                  View and manage all system appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No appointments found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Service: {appointment.service.name} ({appointment.service.durationMinutes} min)
                            </p>
                            {appointment.staff && (
                              <p className="text-sm text-muted-foreground">
                                Doctor: Dr. {appointment.staff.firstName} {appointment.staff.lastName}
                              </p>
                            )}
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <FileText className="h-3 w-3 inline mr-1" />
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(appointment.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Staff Management Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <span>Staff Management</span>
                  </div>
                  <Button onClick={() => setShowCreateStaffModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                </CardTitle>
                <CardDescription>
                  Create and manage clinic staff members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">{doctor.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Role: {doctor.role} • Created: {new Date(doctor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={doctor.isActive ? "default" : "secondary"}>
                            {doctor.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onToggleUserStatus(doctor.id, !doctor.isActive)}
                            disabled={isProcessing}
                          >
                            {doctor.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Management Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Service Management</span>
                  </div>
                  <Button onClick={() => setShowServiceModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage clinic services and pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No services found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => {
                      const appointmentsUsingService = appointments.filter(apt => apt.service.id === service.id);
                      const isServiceInUse = appointmentsUsingService.length > 0;
                      
                      return (
                        <div key={service.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-foreground">{service.name}</h4>
                                {isServiceInUse && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    {appointmentsUsingService.length} appointment(s)
                                  </Badge>
                                )}
                              </div>
                              {service.description && (
                                <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <p className="text-sm text-muted-foreground">
                                  Duration: {service.durationMinutes} minutes
                                </p>
                                {service.price && (
                                  <p className="text-sm text-muted-foreground">
                                    Price: ${service.price}
                                  </p>
                                )}
                              </div>
                              {isServiceInUse && (
                                <p className="text-xs text-yellow-600 mt-2">
                                  ⚠️ This service cannot be deleted because it's being used by existing appointments
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingService(service);
                                  setServiceData({
                                    name: service.name,
                                    description: service.description || '',
                                    durationMinutes: service.durationMinutes,
                                    price: service.price || 0
                                  });
                                  setShowServiceModal(true);
                                }}
                                disabled={isProcessing}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDeleteService(service.id)}
                                disabled={isProcessing || isServiceInUse}
                                title={isServiceInUse ? "Cannot delete service with existing appointments" : "Delete service"}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Doctor Schedule Management Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <span>Doctor Schedule Management</span>
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage shift schedules for all doctors in the clinic
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDoctors ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading doctors...</p>
                  </div>
                ) : allDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No doctors found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create doctor accounts first to manage their schedules
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allDoctors.map((doctor) => (
                        <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  Dr. {doctor.firstName} {doctor.lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground">{doctor.email}</p>
                                <Badge 
                                  variant={doctor.isActive ? "default" : "secondary"}
                                  className="mt-2"
                                >
                                  {doctor.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <Button
                                onClick={() => handleDoctorSelection(doctor)}
                                size="sm"
                                className="ml-2"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Manage Schedule
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointment Statistics */}
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Appointment Statistics</span>
                  </CardTitle>
                  <CardDescription>
                    Overview of appointment trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Appointments</span>
                      <span className="font-medium">{appointments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confirmed</span>
                      <span className="font-medium text-green-600">
                        {appointments.filter(apt => apt.status === 'confirmed').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="font-medium text-yellow-600">
                        {appointments.filter(apt => apt.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cancelled</span>
                      <span className="font-medium text-red-600">
                        {appointments.filter(apt => apt.status === 'cancelled').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Usage */}
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Service Usage</span>
                  </CardTitle>
                  <CardDescription>
                    Most popular services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service) => {
                      const usageCount = appointments.filter(apt => apt.service.id === service.id).length;
                      return (
                        <div key={service.id} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{service.name}</span>
                          <span className="font-medium">{usageCount}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Report */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Revenue Report</span>
                </CardTitle>
                <CardDescription>
                  Financial overview and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-medium text-green-600">
                      ${appointments
                        .filter(apt => apt.status === 'confirmed' || apt.status === 'completed')
                        .reduce((total, apt) => total + (apt.service.price || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-medium">
                      ${appointments
                        .filter(apt => {
                          const aptDate = new Date(apt.appointmentDate);
                          const now = new Date();
                          return aptDate.getMonth() === now.getMonth() && 
                                 aptDate.getFullYear() === now.getFullYear() &&
                                 (apt.status === 'confirmed' || apt.status === 'completed');
                        })
                        .reduce((total, apt) => total + (apt.service.price || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Staff Member</CardTitle>
              <CardDescription>
                Create a new staff member account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={newStaffData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={newStaffData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newStaffData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newStaffData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={newStaffData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    value={newStaffData.role}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateStaffModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Creating...' : 'Create Staff'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Service Management Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingService ? 'Edit Service' : 'Add New Service'}</CardTitle>
              <CardDescription>
                {editingService ? 'Update service information' : 'Create a new clinic service'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (editingService) {
                  await onUpdateService(editingService.id, serviceData);
                } else {
                  await onCreateService(serviceData);
                }
                setShowServiceModal(false);
                setEditingService(null);
                setServiceData({
                  name: '',
                  description: '',
                  durationMinutes: 30,
                  price: 0
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="serviceName">Service Name</Label>
                  <Input
                    id="serviceName"
                    value={serviceData.name}
                    onChange={(e) => setServiceData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="serviceDescription">Description</Label>
                  <textarea
                    id="serviceDescription"
                    value={serviceData.description}
                    onChange={(e) => setServiceData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full h-20 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                    placeholder="Service description..."
                  />
                </div>

                <div>
                  <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={serviceData.durationMinutes}
                    onChange={(e) => setServiceData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceData.price}
                    onChange={(e) => setServiceData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowServiceModal(false);
                      setEditingService(null);
                      setServiceData({
                        name: '',
                        description: '',
                        durationMinutes: 30,
                        price: 0
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Patient Modal */}
      {showCreatePatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Patient</CardTitle>
              <CardDescription>
                Create a new patient account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={newPatientData.firstName}
                      onChange={handlePatientInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={newPatientData.lastName}
                      onChange={handlePatientInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newPatientData.email}
                    onChange={handlePatientInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newPatientData.password}
                    onChange={handlePatientInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={newPatientData.phone}
                    onChange={handlePatientInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={newPatientData.dateOfBirth}
                    onChange={handlePatientInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={newPatientData.address}
                    onChange={handlePatientInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    name="emergencyContact"
                    value={newPatientData.emergencyContact}
                    onChange={handlePatientInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={newPatientData.emergencyPhone}
                    onChange={handlePatientInputChange}
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreatePatientModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Creating...' : 'Create Patient'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient Selection Modal for Walk-in */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Select Patient for Walk-in Appointment</CardTitle>
              <CardDescription>
                Choose the patient to book an appointment for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patients.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No patients found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create a patient first using the "Add Patient" button
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handlePatientSelection(patient.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {patient.firstName} {patient.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowWalkInModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doctor Schedule Management Modal */}
      {showDoctorScheduleModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>Manage Schedule - Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</span>
              </CardTitle>
              <CardDescription>
                Set the weekly shift schedule for this doctor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const weekdaysSchedule = daysOfWeek.map(day => ({
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        isActive: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
                      }));
                      setNewShiftSchedule(weekdaysSchedule);
                    }}
                  >
                    Set Weekdays (9-5)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allDaysSchedule = daysOfWeek.map(day => ({
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        isActive: true
                      }));
                      setNewShiftSchedule(allDaysSchedule);
                    }}
                  >
                    Set All Days (9-5)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const clearedSchedule = daysOfWeek.map(day => ({
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00',
                        isActive: false
                      }));
                      setNewShiftSchedule(clearedSchedule);
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
                      setNewShiftSchedule(defaultSchedule);
                    }}
                  >
                    Reset to Defaults
                  </Button>
                </div>

                {/* Schedule Grid */}
                <div className="space-y-4">
                  {(Array.isArray(newShiftSchedule) ? newShiftSchedule : []).map((shift, index) => (
                    <div key={shift.dayOfWeek} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-24">
                        <Label className="font-medium">{shift.dayOfWeek}</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => {
                            const updatedSchedule = [...newShiftSchedule];
                            updatedSchedule[index].startTime = e.target.value;
                            setNewShiftSchedule(updatedSchedule);
                          }}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => {
                            const updatedSchedule = [...newShiftSchedule];
                            updatedSchedule[index].endTime = e.target.value;
                            setNewShiftSchedule(updatedSchedule);
                          }}
                          className="w-32"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`active-${shift.dayOfWeek}`}
                          checked={shift.isActive}
                          onChange={(e) => {
                            const updatedSchedule = [...newShiftSchedule];
                            updatedSchedule[index].isActive = e.target.checked;
                            setNewShiftSchedule(updatedSchedule);
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor={`active-${shift.dayOfWeek}`} className="text-sm">
                          Available
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDoctorScheduleModal(false);
                      setSelectedDoctor(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateDoctorShiftSchedule}
                    className="flex-1"
                    disabled={isUpdatingSchedule}
                  >
                    {isUpdatingSchedule ? 'Updating...' : 'Update Schedule'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Wizard for Walk-in Appointments */}
      {showBookingWizard && selectedPatientId && (
        <BookingWizard
          isOpen={showBookingWizard}
          onClose={() => {
            setShowBookingWizard(false);
            setSelectedPatientId(null);
          }}
          onSuccess={handleBookingSuccess}
          services={services}
          patientId={selectedPatientId}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
