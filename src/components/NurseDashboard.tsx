import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  UserPlus,
  Activity,
  Stethoscope
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
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
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
  isActive: boolean;
}

interface NurseDashboardProps {
  user: User;
  appointments: Appointment[];
  services: Service[];
  doctors: Doctor[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string;
  onBookWalkInAppointment: (appointmentData: any) => Promise<void>;
  onApproveAppointmentForDoctor: (appointmentId: string, doctorId: string) => Promise<void>;
  onRejectAppointment: (appointmentId: string, reason: string) => Promise<void>;
  onLogout: () => void;
}

const NurseDashboard: React.FC<NurseDashboardProps> = ({
  user,
  appointments,
  services,
  doctors,
  isLoading,
  isProcessing,
  error,
  onBookWalkInAppointment,
  onApproveAppointmentForDoctor,
  onRejectAppointment,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  
  const [walkInData, setWalkInData] = useState({
    patientFirstName: '',
    patientLastName: '',
    patientEmail: '',
    patientPhone: '',
    serviceId: '',
    doctorId: '',
    notes: ''
  });

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
      completed: { variant: 'outline' as const, icon: CheckCircle, className: 'bg-blue-100 text-blue-800' },
      walkin: { variant: 'default' as const, icon: UserPlus, className: 'bg-purple-100 text-purple-800' }
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

  const handleWalkInInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWalkInData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await onBookWalkInAppointment(walkInData);
    setShowWalkInModal(false);
    setWalkInData({
      patientFirstName: '',
      patientLastName: '',
      patientEmail: '',
      patientPhone: '',
      serviceId: '',
      doctorId: '',
      notes: ''
    });
  };

  const handleApproveForDoctor = async (appointmentId: string, doctorId: string) => {
    await onApproveAppointmentForDoctor(appointmentId, doctorId);
    setShowApprovalModal(false);
    setSelectedAppointment(null);
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
  const walkInAppointments = appointments.filter(apt => apt.status === 'walkin');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading nurse dashboard...</p>
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
                <p className="text-sm text-muted-foreground">Nurse Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-foreground">Nurse {user.firstName} {user.lastName}</p>
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
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'walkin', label: 'Walk-in Appointments', icon: UserPlus },
            { id: 'approvals', label: 'Doctor Approvals', icon: CheckCircle },
            { id: 'appointments', label: 'All Appointments', icon: Calendar }
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
                    Awaiting doctor approval
                  </p>
                </CardContent>
              </Card>

              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Walk-in Appointments</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{walkInAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Today's walk-ins
                  </p>
                </CardContent>
              </Card>

              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Doctors</CardTitle>
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{doctors.filter(d => d.isActive).length}</div>
                  <p className="text-xs text-muted-foreground">
                    On duty today
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
                  Latest appointment requests and updates
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

        {/* Walk-in Appointments Tab */}
        {activeTab === 'walkin' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <span>Walk-in Appointments</span>
                  </div>
                  <Button onClick={() => setShowWalkInModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Book Walk-in
                  </Button>
                </CardTitle>
                <CardDescription>
                  Book immediate appointments for walk-in patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {walkInAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No walk-in appointments today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {walkInAppointments.map((appointment) => (
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

        {/* Doctor Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Approve on Behalf of Doctor</span>
                </CardTitle>
                <CardDescription>
                  Approve pending appointments for doctors who are unavailable
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAppointments.map((appointment) => (
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
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowApprovalModal(true);
                                }}
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
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* All Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>All Appointments</span>
                </CardTitle>
                <CardDescription>
                  View and manage all clinic appointments
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
      </div>

      {/* Walk-in Appointment Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Book Walk-in Appointment</CardTitle>
              <CardDescription>
                Create an immediate appointment for a walk-in patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookWalkIn} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientFirstName">First Name</Label>
                    <Input
                      id="patientFirstName"
                      name="patientFirstName"
                      value={walkInData.patientFirstName}
                      onChange={handleWalkInInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientLastName">Last Name</Label>
                    <Input
                      id="patientLastName"
                      name="patientLastName"
                      value={walkInData.patientLastName}
                      onChange={handleWalkInInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="patientEmail">Email</Label>
                  <Input
                    id="patientEmail"
                    name="patientEmail"
                    type="email"
                    value={walkInData.patientEmail}
                    onChange={handleWalkInInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="patientPhone">Phone</Label>
                  <Input
                    id="patientPhone"
                    name="patientPhone"
                    value={walkInData.patientPhone}
                    onChange={handleWalkInInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="serviceId">Service</Label>
                  <select
                    id="serviceId"
                    name="serviceId"
                    value={walkInData.serviceId}
                    onChange={handleWalkInInputChange}
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

                <div>
                  <Label htmlFor="doctorId">Doctor</Label>
                  <select
                    id="doctorId"
                    name="doctorId"
                    value={walkInData.doctorId}
                    onChange={handleWalkInInputChange}
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.filter(d => d.isActive).map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={walkInData.notes}
                    onChange={handleWalkInInputChange}
                    className="w-full h-20 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                    placeholder="Any specific concerns or requests..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowWalkInModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Booking...' : 'Book Walk-in'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doctor Approval Modal */}
      {showApprovalModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Approve for Doctor</CardTitle>
              <CardDescription>
                Select which doctor to approve this appointment for
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Patient: {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Service: {selectedAppointment.service.name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Date: {formatDate(selectedAppointment.appointmentDate)} at {formatTime(selectedAppointment.startTime)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="approval-doctor">Select Doctor</Label>
                  <select
                    id="approval-doctor"
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApproveForDoctor(selectedAppointment.id, e.target.value);
                      }
                    }}
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.filter(d => d.isActive).map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedAppointment(null);
                  }}
                >
                  Cancel
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

export default NurseDashboard;



