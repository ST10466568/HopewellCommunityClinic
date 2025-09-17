import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import DoctorScheduleManager from './DoctorScheduleManager';
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
  X
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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
    phone?: string;
    dateOfBirth?: string;
    medicalHistory?: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
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

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    // Initialize shift schedule with current data
    if (shiftSchedule.length > 0) {
      setNewShiftSchedule(shiftSchedule);
    } else {
      // Initialize with empty schedule
      setNewShiftSchedule(daysOfWeek.map(day => ({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: false
      })));
    }
  }, [shiftSchedule]);

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

  const handleShiftChange = (dayIndex: number, field: keyof ShiftSchedule, value: any) => {
    setNewShiftSchedule(prev => prev.map((shift, index) => 
      index === dayIndex ? { ...shift, [field]: value } : shift
    ));
  };

  const handleSaveShiftSchedule = async () => {
    await onUpdateShiftSchedule(newShiftSchedule);
    setShowShiftModal(false);
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xl">💚</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Hopewell Community Clinic</h1>
                <p className="text-sm text-muted-foreground">Doctor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-foreground">Dr. {user.firstName} {user.lastName}</p>
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
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service.name}
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
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Appointment Management</span>
                </CardTitle>
                <CardDescription>
                  Review and manage patient appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No appointments to review</p>
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
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <FileText className="h-3 w-3 inline mr-1" />
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(appointment.status)}
                            {appointment.status === 'pending' && (
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
                            )}
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
            <DoctorScheduleManager 
              doctorId={user.id}
              onScheduleUpdate={(schedule) => {
                // Schedule update will be handled by the parent component
                console.log('Schedule updated:', schedule);
              }}
            />
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
          <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Reject Appointment</CardTitle>
              <CardDescription>
                Please provide a reason for rejecting this appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
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
    </div>
  );
};

export default DoctorDashboard;



