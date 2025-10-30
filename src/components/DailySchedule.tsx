import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Calendar, Clock, User, Phone, MapPin, ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { appointmentsAPI, staffAPI } from '../services/api';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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
  createdAt?: string; // Add createdAt field for sorting
  staff?: {
    id?: string;
    staffId?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  };
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
    price?: number;
  };
}

interface DailyScheduleProps {
  doctorId?: string;
  isAdmin?: boolean;
  onBookAppointment?: () => void;
}

const DailySchedule: React.FC<DailyScheduleProps> = ({ 
  doctorId: initialDoctorId, 
  isAdmin = false,
  onBookAppointment 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load doctors list for admin
  useEffect(() => {
    console.log('🔍 DailySchedule useEffect - isAdmin:', isAdmin, 'initialDoctorId:', initialDoctorId);
    if (isAdmin) {
      loadDoctors();
    } else if (initialDoctorId) {
      console.log('✅ Setting selectedDoctorId to:', initialDoctorId);
      setSelectedDoctorId(initialDoctorId);
    } else {
      console.log('❌ No initialDoctorId provided');
    }
  }, [isAdmin, initialDoctorId]);

  // Load appointments when doctor or date changes
  useEffect(() => {
    console.log('🔄 DailySchedule useEffect - selectedDoctorId:', selectedDoctorId, 'selectedDate:', selectedDate);
    if (selectedDoctorId) {
      loadAppointments();
    } else {
      console.log('❌ No selectedDoctorId, cannot load appointments');
      setAppointments([]);
    }
  }, [selectedDoctorId, selectedDate]);

  const loadDoctors = async () => {
    try {
      const staffData = await staffAPI.getAll();
      // Filter for doctors only
      const doctorsData = staffData.filter((staff: any) => staff.role === 'doctor' && staff.isActive);
      setDoctors(doctorsData);
      if (doctorsData.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(doctorsData[0].id);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('Failed to load doctors list');
    }
  };

  const loadAppointments = async () => {
    if (!selectedDoctorId) {
      console.log('❌ No doctor ID selected, cannot load appointments');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      console.log('📅 Loading appointments for:', {
        doctorId: selectedDoctorId,
        date: dateStr,
        selectedDate: selectedDate
      });
      
      const appointmentsData = await appointmentsAPI.getByDoctorAndDate(selectedDoctorId, dateStr);
      console.log('📋 Appointments loaded:', appointmentsData);
      
      setAppointments(appointmentsData);
    } catch (error: any) {
      console.error('❌ Error loading appointments:', error);
      setError('Failed to load appointments');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={`${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </Badge>
    );
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Schedule</CardTitle>
            <CardDescription>
              {isAdmin && selectedDoctor 
                ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}'s appointments`
                : 'Your appointments for the day'}
            </CardDescription>
          </div>
          {onBookAppointment && (
            <Button onClick={onBookAppointment} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Doctor Selector for Admin */}
        {isAdmin && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Label htmlFor="doctor-select" className="text-sm font-medium">
                Select Doctor
              </Label>
              <select
                id="doctor-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Date Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{formatDate(selectedDate)}</span>
            </div>
            {!isToday && (
              <Button
                variant="link"
                size="sm"
                onClick={goToToday}
                className="text-xs"
              >
                Go to Today
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Appointments List */}
        {!isLoading && (
          <div className="space-y-3">
            {!selectedDoctorId ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">Doctor ID not found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your account may not be properly linked to a doctor record. Please contact support.
                </p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments scheduled for this day</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {appointments
                  .sort((a, b) => {
                    // First sort by createdAt date (newest first), then by startTime
                    const dateA = new Date(a.createdAt || a.appointmentDate);
                    const dateB = new Date(b.createdAt || b.appointmentDate);
                    const dateComparison = dateB.getTime() - dateA.getTime();
                    
                    // If dates are the same, sort by startTime
                    if (dateComparison === 0) {
                      return a.startTime.localeCompare(b.startTime);
                    }
                    
                    return dateComparison;
                  })
                  .map((appointment) => (
                    <Card key={appointment.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {formatTime(appointment.startTime)}
                              {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(appointment.status)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {/* Patient Info */}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {appointment.patient.email}
                              </span>
                            </div>
                          </div>

                          {/* Phone if available */}
                          {appointment.patient.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{appointment.patient.phone}</span>
                            </div>
                          )}

                          {/* Service Info */}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {appointment.service.name}
                              <span className="text-muted-foreground ml-2">
                                ({appointment.service.durationMinutes} min)
                              </span>
                            </span>
                          </div>

                          {/* Notes */}
                          {appointment.notes && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <span className="font-medium">Notes: </span>
                              {appointment.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailySchedule;

