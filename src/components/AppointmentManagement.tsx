import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { appointmentsAPI, staffAPI, servicesAPI } from '../services/api';

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

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
}

interface AppointmentManagementProps {
  appointments: Appointment[];
  onRefresh: () => void;
  onApproveAppointment?: (appointmentId: string) => Promise<void>;
  onRejectAppointment?: (appointmentId: string, reason: string) => Promise<void>;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ 
  appointments, 
  onRefresh,
  onApproveAppointment,
  onRejectAppointment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [appointmentToReject, setAppointmentToReject] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Form state for editing
  const [editForm, setEditForm] = useState({
    appointmentDate: '',
    startTime: '',
    endTime: '',
    status: '',
    doctorId: '',
    serviceId: '',
    notes: ''
  });

  useEffect(() => {
    loadDoctorsAndServices();
  }, []);

  const loadDoctorsAndServices = async () => {
    try {
      setIsLoading(true);
      const [doctorsData, servicesData] = await Promise.all([
        staffAPI.getAll(),
        servicesAPI.getAll()
      ]);
      
      // Filter for active doctors only
      const activeDoctors = doctorsData.filter((staff: any) => 
        staff.role === 'doctor' && staff.isActive
      );
      
      setDoctors(activeDoctors);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading doctors and services:', error);
      setError('Failed to load doctors and services');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter appointments based on search term and status
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.staff && 
        `${appointment.staff.firstName} ${appointment.staff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Business rules validation (same as booking wizard)
  const validateAppointmentData = (data: any): {[key: string]: string} => {
    const errors: {[key: string]: string} = {};

    // Date validation
    if (!data.appointmentDate) {
      errors.appointmentDate = 'Appointment date is required';
    } else {
      const selectedDate = new Date(data.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 30);
      
      if (selectedDate < today) {
        errors.appointmentDate = 'Cannot book appointments in the past';
      } else if (selectedDate > maxDate) {
        errors.appointmentDate = 'Cannot book appointments more than 30 days in advance';
      }
    }

    // Time validation
    if (!data.startTime) {
      errors.startTime = 'Start time is required';
    }
    if (!data.endTime) {
      errors.endTime = 'End time is required';
    }
    if (data.startTime && data.endTime) {
      const startTime = new Date(`2000-01-01T${data.startTime}`);
      const endTime = new Date(`2000-01-01T${data.endTime}`);
      if (endTime <= startTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    // Doctor validation
    if (!data.doctorId) {
      errors.doctorId = 'Doctor is required';
    }

    // Service validation
    if (!data.serviceId) {
      errors.serviceId = 'Service is required';
    }

    // Status validation
    if (!data.status) {
      errors.status = 'Status is required';
    }

    return errors;
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditForm({
      appointmentDate: appointment.appointmentDate.split('T')[0], // Convert to YYYY-MM-DD format
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      doctorId: appointment.staff?.id || '',
      serviceId: appointment.service.id,
      notes: appointment.notes || ''
    });
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleSaveAppointment = async () => {
    if (!editingAppointment) return;

    // Validate form data
    const errors = validateAppointmentData(editForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Prepare update data
      const updateData = {
        appointmentDate: editForm.appointmentDate,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        status: editForm.status,
        staffId: editForm.doctorId,
        serviceId: editForm.serviceId,
        notes: editForm.notes
      };

      await appointmentsAPI.update(editingAppointment.id, updateData);
      
      // Close modal and refresh data
      setIsEditModalOpen(false);
      setEditingAppointment(null);
      onRefresh();
      
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      setError(error.message || 'Failed to update appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      setIsLoading(true);
      setError('');

      await appointmentsAPI.delete(appointmentToDelete.id);
      
      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setAppointmentToDelete(null);
      onRefresh();
      
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      setError(error.message || 'Failed to delete appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    if (onApproveAppointment) {
      try {
        setIsLoading(true);
        setError('');
        await onApproveAppointment(appointmentId);
        onRefresh();
      } catch (error: any) {
        console.error('Error approving appointment:', error);
        setError(error.message || 'Failed to approve appointment');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRejectAppointment = (appointment: Appointment) => {
    setAppointmentToReject(appointment);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const confirmRejectAppointment = async () => {
    if (!appointmentToReject || !onRejectAppointment) return;

    try {
      setIsLoading(true);
      setError('');
      await onRejectAppointment(appointmentToReject.id, rejectReason);
      
      // Close modal and refresh data
      setIsRejectModalOpen(false);
      setAppointmentToReject(null);
      setRejectReason('');
      onRefresh();
      
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      setError(error.message || 'Failed to reject appointment');
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Appointment Management</h2>
          <p className="text-muted-foreground">
            Manage all appointments with search, pagination, and editing capabilities
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, email, service, or doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <div className="space-y-4">
        {currentAppointments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No appointments match your search criteria' 
                    : 'No appointments found'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          currentAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(appointment.appointmentDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-muted-foreground">
                          <strong>Service:</strong> {appointment.service.name} ({appointment.service.durationMinutes} min)
                        </span>
                        {appointment.staff && (
                          <span className="text-muted-foreground">
                            <strong>Doctor:</strong> Dr. {appointment.staff.firstName} {appointment.staff.lastName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          <strong>Email:</strong> {appointment.patient.email}
                        </span>
                      </div>
                      {appointment.notes && (
                        <div className="flex items-start space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {appointment.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(appointment.status)}
                    <div className="flex space-x-1">
                      {/* Approval/Rejection buttons for pending appointments */}
                      {appointment.status === 'pending' && onApproveAppointment && onRejectAppointment && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveAppointment(appointment.id)}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectAppointment(appointment)}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAppointment(appointment)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAppointment(appointment)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of {filteredAppointments.length} appointments
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Appointment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Patient Info (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient Name</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {editingAppointment?.patient.firstName} {editingAppointment?.patient.lastName}
                </div>
              </div>
              <div>
                <Label>Patient Email</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {editingAppointment?.patient.email}
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointmentDate">Appointment Date *</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={editForm.appointmentDate}
                  onChange={(e) => setEditForm({...editForm, appointmentDate: e.target.value})}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className={validationErrors.appointmentDate ? 'border-destructive' : ''}
                />
                {validationErrors.appointmentDate && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.appointmentDate}</p>
                )}
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={editForm.status} onValueChange={(value: string) => setEditForm({...editForm, status: value})}>
                  <SelectTrigger className={validationErrors.status ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.status && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.status}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                  className={validationErrors.startTime ? 'border-destructive' : ''}
                />
                {validationErrors.startTime && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.startTime}</p>
                )}
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                  className={validationErrors.endTime ? 'border-destructive' : ''}
                />
                {validationErrors.endTime && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.endTime}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorId">Doctor *</Label>
                <Select value={editForm.doctorId} onValueChange={(value: string) => setEditForm({...editForm, doctorId: value})}>
                  <SelectTrigger className={validationErrors.doctorId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.doctorId && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.doctorId}</p>
                )}
              </div>
              <div>
                <Label htmlFor="serviceId">Service *</Label>
                <Select value={editForm.serviceId} onValueChange={(value: string) => setEditForm({...editForm, serviceId: value})}>
                  <SelectTrigger className={validationErrors.serviceId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.durationMinutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.serviceId && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.serviceId}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveAppointment} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this appointment? This action cannot be undone.
            </p>
            
            {appointmentToDelete && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="font-medium">
                    {appointmentToDelete.patient.firstName} {appointmentToDelete.patient.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(appointmentToDelete.appointmentDate)} at {formatTime(appointmentToDelete.startTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appointmentToDelete.service.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteAppointment} 
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? 'Deleting...' : 'Delete Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Appointment Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this appointment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {appointmentToReject && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">
                  {appointmentToReject.patient.firstName} {appointmentToReject.patient.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(appointmentToReject.appointmentDate)} at {formatTime(appointmentToReject.startTime)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Service: {appointmentToReject.service.name}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="reject-reason">Reason for rejection *</Label>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRejectAppointment} 
              disabled={!rejectReason.trim() || isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              {isLoading ? 'Rejecting...' : 'Reject Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentManagement;
