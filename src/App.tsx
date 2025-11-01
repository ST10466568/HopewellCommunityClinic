import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import EmailSettingsPage from './pages/admin/EmailSettings';
import LoadingSpinner from './components/LoadingSpinner';
import { usePushNotifications } from './hooks/usePushNotifications';

// Import the existing API functions
import { appointmentsAPI, servicesAPI, patientsAPI, staffAPI, doctorAPI, adminAPI } from './services/api';

// Protected Route component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}> = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Dashboard wrapper component that handles data loading
const DashboardWrapper: React.FC<{ 
  children: (props: any) => React.ReactNode;
  user: any;
}> = ({ children, user }) => {
  const [appointments, setAppointments] = React.useState([]);
  const [services, setServices] = React.useState([]);
  const [doctors, setDoctors] = React.useState([]);
  const [availableSlots, setAvailableSlots] = React.useState([]);
  const [patientId, setPatientId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBooking, setIsBooking] = React.useState(false);
  const [bookingError, setBookingError] = React.useState('');

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get the Patient ID from the ApplicationUser ID
      console.log('🔍 Loading dashboard data for user:', user);
      console.log('🔍 User ID:', user.id);
      
      try {
        const patient = await patientsAPI.getByUserId(user.id);
        console.log('✅ Found patient record:', patient);
        setPatientId(patient.id);
        
        const [appointmentsData, servicesData, doctorsData] = await Promise.all([
          appointmentsAPI.getByPatient(patient.id),
          servicesAPI.getAll(),
          staffAPI.getByRole('doctor')
        ]);
        
        // Sort appointments by created date (newest first)
        const sortedAppointments = appointmentsData.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.appointmentDate);
          const dateB = new Date(b.createdAt || b.appointmentDate);
          return dateB.getTime() - dateA.getTime();
        });
        
        setAppointments(sortedAppointments);
        setServices(servicesData);
        setDoctors(doctorsData);
      } catch (patientError) {
        console.error('❌ Error finding patient record:', patientError);
        console.log('⚠️ Patient not found for user ID:', user.id);
        
        // Set patientId to null to trigger the error in BookingWizard
        setPatientId(null);
        
        // Still try to load other data
        try {
          const [servicesData, doctorsData] = await Promise.all([
            servicesAPI.getAll(),
            staffAPI.getByRole('doctor')
          ]);
          setServices(servicesData);
          setDoctors(doctorsData);
          setAppointments([]); // No appointments without patient
        } catch (otherError) {
          console.error('❌ Error loading other dashboard data:', otherError);
        }
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async (date: string) => {
    try {
      console.log('Loading available slots for date:', date);
      const slots = await appointmentsAPI.getAvailable(date);
      console.log('Available slots received:', slots);
      
      // Calculate the day of the week for the requested date
      const requestedDate = new Date(date);
      const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Filter slots to only include the correct day of the week
      const filteredSlots = slots.filter((slot: any) => slot.dayOfWeek === dayOfWeek);
      console.log('Filtered slots for day', dayOfWeek, ':', filteredSlots);
      
      setAvailableSlots(filteredSlots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleBookAppointment = async (bookingData: any) => {
    try {
      setIsBooking(true);
      setBookingError('');
      
      // Calculate end time based on service duration
      const selectedService = services.find((s: any) => s.id === bookingData.serviceId) as any;
      
      // Ensure startTime is in HH:mm:ss format
      const startTimeFormatted = bookingData.startTime.includes(':') && bookingData.startTime.split(':').length === 2 
        ? bookingData.startTime + ':00' 
        : bookingData.startTime;
      
      const startTime = new Date(`2000-01-01T${startTimeFormatted}`);
      const endTime = new Date(startTime.getTime() + (selectedService?.durationMinutes || 30) * 60000);
      
      const endTimeString = endTime.toTimeString().slice(0, 8); // Format as HH:mm:ss
      
      await appointmentsAPI.create({
        patientId: patientId,
        serviceId: bookingData.serviceId,
        staffId: bookingData.staffId,
        appointmentDate: bookingData.appointmentDate,
        startTime: startTimeFormatted,
        endTime: endTimeString,
        notes: bookingData.notes || ''
      });

      // Refresh appointments
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      setBookingError(error.response?.data?.error || error.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, updateData: any) => {
    try {
      setIsBooking(true);
      setBookingError('');
      
      // Calculate end time based on service duration
      const selectedService = services.find((s: any) => s.id === updateData.serviceId) as any;
      
      // Ensure startTime is in HH:mm:ss format
      const startTimeFormatted = updateData.startTime.includes(':') && updateData.startTime.split(':').length === 2 
        ? updateData.startTime + ':00' 
        : updateData.startTime;
      
      const startTime = new Date(`2000-01-01T${startTimeFormatted}`);
      const endTime = new Date(startTime.getTime() + (selectedService?.durationMinutes || 30) * 60000);
      
      const endTimeString = endTime.toTimeString().slice(0, 8); // Format as HH:mm:ss
      
      await appointmentsAPI.update(appointmentId, {
        appointmentDate: updateData.appointmentDate,
        startTime: startTimeFormatted,
        endTime: endTimeString,
        notes: updateData.notes || '',
        serviceId: updateData.serviceId,
        staffId: updateData.staffId || null
      });

      // Refresh appointments
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      setBookingError(error.response?.data?.error || error.message || 'Failed to update appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setIsBooking(true);
      setBookingError('');
      
      await appointmentsAPI.delete(appointmentId);

      // Refresh appointments
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      setBookingError(error.response?.data?.error || error.message || 'Failed to cancel appointment');
    } finally {
      setIsBooking(false);
    }
  };

  React.useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  // Call children as a function with props
  return children({
    user,
    appointments,
    services,
    doctors,
    availableSlots,
    patientId,
    isLoading,
    isBooking,
    bookingError,
    onBookAppointment: handleBookAppointment,
    onUpdateAppointment: handleUpdateAppointment,
    onCancelAppointment: handleCancelAppointment,
    onLoadAvailableSlots: loadAvailableSlots,
    onRefreshAppointments: loadDashboardData
  });
};

// Doctor Dashboard wrapper component that handles doctor-specific data loading
const DoctorDashboardWrapper: React.FC<{ 
  children: (props: any) => React.ReactNode;
  user: any;
}> = ({ children, user }) => {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [shiftSchedule, setShiftSchedule] = React.useState<any[]>([]);
  const [staffId, setStaffId] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get the Staff record for this user
      try {
        console.log('🔍 Looking up staff record for user:', user);
        console.log('User ID to match:', user.id);
        console.log('User email to match:', user.email);
        
        const allStaff = await staffAPI.getAll();
        console.log('📋 All staff records:', allStaff);
        
        // Try to find by userId first
        let staffRecord = allStaff.find((s: any) => s.userId === user.id);
        
        // If not found, try by email
        if (!staffRecord) {
          console.log('⚠️ No match by userId, trying email match...');
          staffRecord = allStaff.find((s: any) => s.email?.toLowerCase() === user.email?.toLowerCase());
        }
        
        // If still not found, try by role='doctor' and similar name
        if (!staffRecord && user.role === 'doctor') {
          console.log('⚠️ No match by email, trying name match for doctors...');
          staffRecord = allStaff.find((s: any) => 
            s.role === 'doctor' && 
            s.firstName?.toLowerCase() === user.firstName?.toLowerCase() &&
            s.lastName?.toLowerCase() === user.lastName?.toLowerCase()
          );
        }
        
        if (staffRecord) {
          console.log('✅ Found staff record:', staffRecord);
          console.log('✅ Staff ID to use:', staffRecord.id);
          console.log('✅ Staff ID type:', typeof staffRecord.id);
          console.log('✅ Staff ID length:', staffRecord.id.length);
          setStaffId(staffRecord.id);
          
          // Update the user object with the staff ID
          user.staffId = staffRecord.id;
          console.log('✅ Updated user.staffId to:', user.staffId);
        } else {
          console.error('❌ NO STAFF RECORD FOUND!');
          console.log('User details:', { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
          console.log('Available staff records:', allStaff.map((s: any) => ({
            id: s.id,
            userId: s.userId,
            email: s.email,
            firstName: s.firstName,
            lastName: s.lastName,
            role: s.role
          })));
        }
      } catch (staffError) {
        console.error('❌ Error fetching staff record:', staffError);
      }

      // Get appointments using doctor-specific endpoint
      // ✅ RECOMMENDED: Use doctor-specific endpoint instead of general endpoint
      const currentStaffId = staffId || user.staffId;
      
      if (!currentStaffId) {
        console.error('❌ StaffId not found. Cannot load appointments.');
        setError('Staff ID not found. Please contact administrator.');
        setAppointments([]);
      } else {
        try {
          // ✅ Use doctor-specific endpoint for better security and filtering
          console.log('📋 Loading appointments for doctor:', currentStaffId);
          const appointmentsData = await doctorAPI.getAllAppointments(currentStaffId);
          
          // ✅ Client-side filtering as extra safety measure
          const doctorAppointments = Array.isArray(appointmentsData) ? appointmentsData.filter((apt: any) => {
            // Verify appointment belongs to this doctor
            const belongsToDoctor = 
              apt.staffId === currentStaffId || 
              apt.doctorId === currentStaffId ||
              apt.staff?.id === currentStaffId ||
              apt.staff?.staffId === currentStaffId;
            
            if (!belongsToDoctor) {
              console.warn(`⚠️ Filtering out appointment ${apt.id} - doesn't belong to doctor ${currentStaffId}`);
              return false;
            }
            
            return true;
          }) : [];
          
          // Sort appointments by created date (newest first)
          const sortedAppointments = doctorAppointments.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.appointmentDate);
            const dateB = new Date(b.createdAt || b.appointmentDate);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log(`✅ Loaded ${sortedAppointments.length} appointments for doctor`);
          setAppointments(sortedAppointments);
        } catch (appointmentsError: any) {
          console.error('❌ Error loading appointments:', appointmentsError);
          // If doctor-specific endpoint fails, fall back to general endpoint with client-side filtering
          if (currentStaffId) {
            try {
              console.log('⚠️ Doctor-specific endpoint failed, trying general endpoint with filtering...');
              const allAppointments = await appointmentsAPI.getAll();
              
              // ✅ Client-side filtering as fallback safety measure
              const filteredAppointments = Array.isArray(allAppointments) ? allAppointments.filter((apt: any) => {
                const belongsToDoctor = 
                  apt.staffId === currentStaffId || 
                  apt.doctorId === currentStaffId ||
                  apt.staff?.id === currentStaffId ||
                  apt.staff?.staffId === currentStaffId;
                
                return belongsToDoctor;
              }) : [];
              
              const sortedAppointments = filteredAppointments.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.appointmentDate);
                const dateB = new Date(b.createdAt || b.appointmentDate);
                return dateB.getTime() - dateA.getTime();
              });
              
              setAppointments(sortedAppointments);
              console.log(`✅ Loaded ${sortedAppointments.length} appointments using fallback method`);
            } catch (fallbackError) {
              console.error('❌ Fallback endpoint also failed:', fallbackError);
              setAppointments([]);
              setError('Failed to load appointments. Please try again.');
            }
          } else {
            setAppointments([]);
          }
        }
      }

      // Get all patients
      try {
        const patientsData = await patientsAPI.getAll();
        setPatients(patientsData);
      } catch (patientsError) {
        console.log('No patients endpoint available yet');
        setPatients([]);
      }

      // Load shift schedule from API instead of localStorage
      const loadShiftScheduleFromAPI = async () => {
        try {
          const currentStaffId = staffId || user.staffId;
          if (currentStaffId) {
            console.log('🔧 Loading shift schedule from API for staff ID:', currentStaffId);
            const schedule = await doctorAPI.getShiftSchedule(currentStaffId);
            if (schedule && schedule.length > 0) {
              console.log('✅ Loaded shift schedule from API:', schedule);
              setShiftSchedule(schedule);
              return;
            }
          }
        } catch (error) {
          console.log('⚠️ Error loading shift schedule from API:', error);
        }
        
        // Fall back to default schedule if API fails
        console.log('🔧 Using default shift schedule');
        const defaultSchedule = [
          { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 'Friday', startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '17:00', isActive: false },
          { dayOfWeek: 'Sunday', startTime: '09:00', endTime: '17:00', isActive: false }
        ];
        setShiftSchedule(defaultSchedule);
      };
      
      await loadShiftScheduleFromAPI();
    } catch (error: any) {
      console.error('Error loading doctor dashboard data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      setIsProcessing(true);
      setError('');
      // For now, just update the appointment status using existing endpoint
      await appointmentsAPI.updateStatus(appointmentId, 'confirmed');
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error approving appointment:', error);
      setError(error.response?.data?.error || error.message || 'Failed to approve appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAppointment = async (appointmentId: string, reason: string) => {
    try {
      setIsProcessing(true);
      setError('');
      // For now, just update the appointment status using existing endpoint
      await appointmentsAPI.updateStatus(appointmentId, 'cancelled');
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      setError(error.response?.data?.error || error.message || 'Failed to reject appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setIsProcessing(true);
      setError('');
      
      const currentStaffId = staffId || user.staffId;
      
      // ✅ CRITICAL: Verify appointment ownership before allowing cancel
      if (currentStaffId) {
        const appointment = appointments.find((apt: any) => apt.id === appointmentId);
        
        if (appointment) {
          const belongsToDoctor = 
            appointment.staffId === currentStaffId || 
            appointment.doctorId === currentStaffId ||
            appointment.staff?.id === currentStaffId ||
            appointment.staff?.staffId === currentStaffId;
          
          if (!belongsToDoctor) {
            const errorMsg = 'You can only cancel appointments assigned to you';
            setError(errorMsg);
            alert(`Failed to cancel appointment: ${errorMsg}`);
            return;
          }
          
          // Verify appointment is confirmed and in the future (optional - can allow cancelling past appointments)
          const appointmentDate = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
          const isConfirmed = appointment.status === 'confirmed';
          const isFuture = appointmentDate > new Date();
          
          if (!isConfirmed) {
            const errorMsg = 'Only confirmed appointments can be cancelled';
            setError(errorMsg);
            alert(`Failed to cancel appointment: ${errorMsg}`);
            return;
          }
        }
      }
      
      await appointmentsAPI.updateStatus(appointmentId, 'cancelled');
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      
      // ✅ Handle 403 errors gracefully
      if (error.response?.status === 403) {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.error || 'You do not have permission to cancel this appointment';
        
        if (errorMsg.includes('assigned to you') || errorMsg.includes('appointment')) {
          const userFriendlyMsg = 'This appointment belongs to another doctor. You cannot cancel it.';
          setError(userFriendlyMsg);
          alert(`Failed to cancel appointment: ${userFriendlyMsg}`);
          
          // Log diagnostic details for debugging
          if (errorData.details) {
            console.warn('❌ Cancel rejected - diagnostic details:', errorData.details);
          }
          
          // Remove appointment from UI if it doesn't belong to this doctor
          setAppointments((prev: any[]) => prev.filter((apt: any) => apt.id !== appointmentId));
        } else {
          setError(errorMsg);
          alert(`Failed to cancel appointment: ${errorMsg}`);
        }
      } else {
        setError(error.response?.data?.error || error.message || 'Failed to cancel appointment');
        alert(`Failed to cancel appointment: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, updateData: any) => {
    try {
      setIsProcessing(true);
      setError('');
      
      const currentStaffId = staffId || user.staffId;
      
      // ✅ CRITICAL: Verify appointment ownership before allowing update
      if (currentStaffId) {
        try {
          // Find the appointment in our local data to verify ownership
          const appointment = appointments.find((apt: any) => apt.id === appointmentId);
          
          if (appointment) {
            // Verify appointment belongs to current doctor
            const belongsToDoctor = 
              appointment.staffId === currentStaffId || 
              appointment.doctorId === currentStaffId ||
              appointment.staff?.id === currentStaffId ||
              appointment.staff?.staffId === currentStaffId;
            
            if (!belongsToDoctor) {
              const errorMsg = 'You can only update appointments assigned to you';
              setError(errorMsg);
              alert(`Failed to update appointment: ${errorMsg}`);
              console.warn('❌ Update rejected - appointment does not belong to doctor:', {
                appointmentId,
                doctorStaffId: currentStaffId,
                appointmentStaffId: appointment.staffId,
                appointmentDoctorId: appointment.doctorId
              });
              return;
            }
            
            // Verify appointment is confirmed and in the future
            // ✅ DETAILED LOGGING: Log all appointment data for debugging
            console.group('🔍 [Appointment Update Validation - App.tsx]');
            console.log('📅 Appointment Object:', appointment);
            console.log('📅 Raw appointmentDate:', appointment.appointmentDate);
            console.log('⏰ Raw startTime:', appointment.startTime);
            console.log('📊 Raw endTime:', appointment.endTime);
            console.log('✅ Raw status:', appointment.status);
            
            // Build the date string for parsing
            // ✅ FIX: Extract date part only (remove time if present in appointmentDate)
            const datePart = appointment.appointmentDate.split('T')[0];
            const dateTimeString = `${datePart}T${appointment.startTime}`;
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
            
            const isConfirmed = appointment.status === 'confirmed';
            const isFuture = appointmentDate > currentDate;
            
            console.log('✅ Is Confirmed:', isConfirmed);
            console.log('⏭️ Is Future:', isFuture);
            console.log('🔍 Comparison (appointmentDate > currentDate):', appointmentDate > currentDate);
            console.log('🔍 Comparison (appointmentDate.getTime() > currentDate.getTime()):', appointmentDate.getTime() > currentDate.getTime());
            
            if (!isConfirmed) {
              console.warn('❌ Validation failed: Appointment is not confirmed');
              console.groupEnd();
              const errorMsg = 'Only confirmed appointments can be updated';
              setError(errorMsg);
              alert(`Failed to update appointment: ${errorMsg}`);
              return;
            }
            
            if (!isFuture) {
              console.warn('❌ Validation failed: Appointment is in the past');
              console.warn('❌ Appointment time:', appointmentDate.toLocaleString());
              console.warn('❌ Current time:', currentDate.toLocaleString());
              console.warn('❌ Difference:', `${hoursDifference.toFixed(2)} hours (${minutesDifference.toFixed(2)} minutes)`);
              console.groupEnd();
              const errorMsg = 'Cannot update past appointments. Only future appointments can be edited.';
              setError(errorMsg);
              alert(`Failed to update appointment: ${errorMsg}`);
              return;
            }
            
            console.log('✅ Validation passed: Appointment is confirmed and in the future');
            console.groupEnd();
          }
        } catch (verifyError) {
          console.warn('⚠️ Could not verify appointment ownership, proceeding with update (backend will validate)');
        }
      }
      
      // Calculate end time based on service duration if serviceId is provided
      let endTimeString = updateData.endTime;
      if (updateData.serviceId) {
        const servicesData = await servicesAPI.getAll();
        const selectedService = servicesData.find((s: any) => s.id === updateData.serviceId);
        
        if (selectedService && updateData.startTime) {
          const startTimeFormatted = updateData.startTime.includes(':') && updateData.startTime.split(':').length === 2 
            ? updateData.startTime + ':00' 
            : updateData.startTime;
          const startTime = new Date(`2000-01-01T${startTimeFormatted}`);
          const endTime = new Date(startTime.getTime() + (selectedService.durationMinutes || 30) * 60000);
          endTimeString = endTime.toTimeString().slice(0, 8);
        }
      }
      
      // Ensure startTime is in HH:mm:ss format
      const startTimeFormatted = updateData.startTime.includes(':') && updateData.startTime.split(':').length === 2 
        ? updateData.startTime + ':00' 
        : updateData.startTime;
      
      const updatePayload = {
        appointmentDate: updateData.appointmentDate,
        startTime: startTimeFormatted,
        endTime: endTimeString,
        notes: updateData.notes || '',
        ...(updateData.serviceId && { serviceId: updateData.serviceId }),
        ...(updateData.staffId && { staffId: updateData.staffId })
      };
      
      console.log('Doctor updating appointment with payload:', updatePayload);
      await appointmentsAPI.update(appointmentId, updatePayload);
      
      await loadDashboardData(); // Refresh data
      alert('Appointment updated successfully!');
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      
      // ✅ Handle 403 errors gracefully with helpful messages
      if (error.response?.status === 403) {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.error || 'You do not have permission to update this appointment';
        
        if (errorMsg.includes('assigned to you') || errorMsg.includes('appointment')) {
          const userFriendlyMsg = 'This appointment belongs to another doctor. You cannot update it.';
          setError(userFriendlyMsg);
          alert(`Failed to update appointment: ${userFriendlyMsg}`);
          
          // Log diagnostic details for debugging
          if (errorData.details) {
            console.warn('❌ Update rejected - diagnostic details:', errorData.details);
          }
          
          // Remove appointment from UI if it doesn't belong to this doctor
          setAppointments((prev: any[]) => prev.filter((apt: any) => apt.id !== appointmentId));
        } else {
          setError(errorMsg);
          alert(`Failed to update appointment: ${errorMsg}`);
        }
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update appointment';
        setError(errorMessage);
        alert(`Failed to update appointment: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateShiftSchedule = async (shiftData: any[]) => {
    try {
      setIsProcessing(true);
      setError('');
      
      const currentStaffId = staffId || user.staffId;
      if (!currentStaffId) {
        throw new Error('No staff ID available');
      }
      
      // ✅ DETAILED LOGGING: Log all update details
      console.group('🔄 [Shift Schedule Update]');
      console.log('👤 Staff ID:', currentStaffId);
      console.log('📅 Shift Data:', shiftData);
      console.log('📊 Shift Data Length:', shiftData?.length);
      console.log('📦 Request Payload:', { shifts: shiftData });
      
      // ✅ FIX: Actually save to database, don't just update local state
      try {
        console.log('📤 Sending update request to API...');
        const response = await doctorAPI.updateShiftSchedule(currentStaffId, shiftData);
        console.log('✅ API Response:', response);
        console.log('✅ Shift schedule updated successfully in database');
        
        // Only update local state if API call was successful
        setShiftSchedule(shiftData);
        console.log('✅ Local state updated');
        
        // Show success message
        alert('Shift schedule updated successfully!');
        console.groupEnd();
        return;
      } catch (apiError: any) {
        console.error('❌ API update failed:', apiError);
        console.error('📊 Error Status:', apiError.response?.status);
        console.error('📊 Error Data:', apiError.response?.data);
        console.error('📊 Error Message:', apiError.message);
        console.groupEnd();
        
        // Re-throw the error so it's handled by the outer catch
        const errorMessage = apiError.response?.data?.error || 
                            apiError.response?.data?.message || 
                            apiError.message || 
                            'Failed to update shift schedule in database';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error updating shift schedule:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update shift schedule';
      setError(errorMessage);
      alert(`Failed to update shift schedule: ${errorMessage}`);
      throw error; // Re-throw to prevent silent failures
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewPatientDetails = async (patientId: string) => {
    try {
      setError('');
      // For now, just log the request (backend not implemented yet)
      console.log('View patient details requested for:', patientId);
    } catch (error: any) {
      console.error('Error loading patient details:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load patient details');
    }
  };

  React.useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  // Call children as a function with props
  const userWithStaffId = {
    ...user,
    staffId: staffId // Ensure staffId is included
  };
  
  console.log('🔍 DoctorDashboardWrapper returning user:', userWithStaffId);
  console.log('🔍 DoctorDashboardWrapper staffId:', staffId);
  console.log('🔍 DoctorDashboardWrapper user.staffId:', user.staffId);
  
  return children({
    user: userWithStaffId,
    appointments,
    patients,
    shiftSchedule,
    isLoading,
    isProcessing,
    error,
    onApproveAppointment: handleApproveAppointment,
    onRejectAppointment: handleRejectAppointment,
    onCancelAppointment: handleCancelAppointment,
    onUpdateAppointment: handleUpdateAppointment,
    onUpdateShiftSchedule: handleUpdateShiftSchedule,
    onViewPatientDetails: handleViewPatientDetails
  });
};


// Admin Dashboard wrapper component that handles admin-specific data loading
const AdminDashboardWrapper: React.FC<{ 
  children: (props: any) => React.ReactNode;
  user: any;
}> = ({ children, user }) => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Combine staff and patients into a single users array
      const allUsers: any[] = [];

      // Get all staff members
      try {
        const staffData = await staffAPI.getAll();
        console.log('📊 Staff data received:', staffData);
        
        // Normalize staff data to ensure createdAt field and consistent ID
        const normalizedStaff = staffData.map((staff: any) => ({
          ...staff,
          // Ensure createdAt field is properly handled
          createdAt: staff.createdAt || staff.created_at || staff.dateCreated || new Date().toISOString(),
          // Ensure consistent ID field
          id: staff.id || staff.userId || staff.staffId,
          userId: staff.userId || staff.id || staff.staffId,
          // Preserve all user fields
          firstName: staff.firstName || staff.first_name || '',
          lastName: staff.lastName || staff.last_name || '',
          email: staff.email || '',
          phone: staff.phone || null,
          dateOfBirth: staff.dateOfBirth || staff.date_of_birth || null,
          address: staff.address || null,
          emergencyContact: staff.emergencyContact || staff.emergency_contact || null,
          emergencyPhone: staff.emergencyPhone || staff.emergency_phone || null,
          role: staff.role || ''
        }));
        
        allUsers.push(...normalizedStaff);
      } catch (staffError) {
        console.log('No staff endpoint available, falling back to admin users');
        try {
          const usersData = await adminAPI.getUsers();
          console.log('📊 Admin users data received:', usersData);
          
          // Normalize admin users data to ensure createdAt field and consistent ID
          const normalizedAdminUsers = usersData.map((user: any) => ({
            ...user,
            // Ensure createdAt field is properly handled
            createdAt: user.createdAt || user.created_at || user.dateCreated || new Date().toISOString(),
            // Ensure consistent ID field
            id: user.id || user.userId,
            userId: user.userId || user.id,
            // Preserve all user fields
            firstName: user.firstName || user.first_name || '',
            lastName: user.lastName || user.last_name || '',
            email: user.email || '',
            phone: user.phone || null,
            dateOfBirth: user.dateOfBirth || user.date_of_birth || null,
            address: user.address || null,
            emergencyContact: user.emergencyContact || user.emergency_contact || null,
            emergencyPhone: user.emergencyPhone || user.emergency_phone || null,
            role: user.role || ''
          }));
          
          allUsers.push(...normalizedAdminUsers);
        } catch (adminError) {
          console.error('Failed to load staff/users:', adminError);
        }
      }

      // Get all users from admin endpoint to get isActive status for all users
      let usersWithStatus: any[] = [];
      try {
        const usersData = await adminAPI.getUsers();
        console.log('👥 Admin users data (for status):', usersData);
        usersWithStatus = Array.isArray(usersData) ? usersData : [];
      } catch (usersError) {
        console.log('⚠️ Could not load user status data, will default to patient data');
      }

      // Get all patients
      try {
        const patientsData = await patientsAPI.getAll();
        console.log('👥 Patients data received:', patientsData);
        
        // Normalize patient data to match staff structure
        const normalizedPatients = patientsData.map((patient: any) => {
          // Find matching user in usersWithStatus to get correct isActive status
          const matchingUser = usersWithStatus.find((u: any) => 
            (u.id === patient.userId) || (u.userId === patient.userId) || 
            (u.id === patient.id && patient.userId === u.id)
          );
          
          // Use user's isActive status if available, otherwise use patient's isActive or default to true
          const userIsActive = matchingUser?.isActive !== undefined 
            ? matchingUser.isActive 
            : (patient.isActive !== undefined ? patient.isActive : true);
          
          console.log('🔍 Patient:', patient.firstName, patient.lastName, 'userId:', patient.userId, 'isActive from user:', matchingUser?.isActive, 'final isActive:', userIsActive);
          
          return {
            ...patient,
            role: 'patient',
            isActive: userIsActive, // Use actual user status, not hardcoded true
            // Ensure consistent field names
            firstName: patient.firstName || patient.first_name || '',
            lastName: patient.lastName || patient.last_name || '',
            email: patient.email || '',
            phone: patient.phone || null,
            dateOfBirth: patient.dateOfBirth || patient.date_of_birth || null,
            address: patient.address || null,
            emergencyContact: patient.emergencyContact || patient.emergency_contact || null,
            emergencyPhone: patient.emergencyPhone || patient.emergency_phone || null,
            // Ensure consistent ID field
            id: patient.id || patient.userId || patient.patientId,
            userId: patient.userId || patient.id || patient.patientId,
            // Ensure createdAt field is properly handled
            createdAt: patient.createdAt || patient.created_at || patient.dateCreated || new Date().toISOString()
          };
        });
        
        console.log('👥 Normalized patients with status:', normalizedPatients);
        allUsers.push(...normalizedPatients);
      } catch (patientsError) {
        console.error('❌ Failed to load patients:', patientsError);
        console.log('No patients endpoint available or no patients in database');
      }

      console.log('✅ Combined users data:', allUsers);
      setUsers(allUsers);

      // Get all appointments
      try {
        const appointmentsData = await appointmentsAPI.getAll();
        // Sort appointments by created date (newest first)
        const sortedAppointments = appointmentsData.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.appointmentDate);
          const dateB = new Date(b.createdAt || b.appointmentDate);
          return dateB.getTime() - dateA.getTime();
        });
        setAppointments(sortedAppointments);
      } catch (appointmentsError) {
        console.log('No appointments endpoint available yet');
        setAppointments([]);
      }

      // Load services
      try {
        const servicesData = await servicesAPI.getAll();
        setServices(servicesData);
      } catch (servicesError) {
        console.log('No services endpoint available yet');
        setServices([]);
      }
    } catch (error: any) {
      console.error('Error loading admin dashboard data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      setIsProcessing(true);
      setError('');
      console.log('🔄 [App] Toggling user status:', { userId, isActive });
      
      // Find the user in our local data to get the correct ID
      const user = users.find(u => u.id === userId || u.userId === userId);
      if (!user) {
        throw new Error('User not found in local data');
      }
      
      // For patients, use the userId (from ApplicationUser table) not the patient ID
      // For staff, use the userId as well
      // The API endpoint expects the ApplicationUser ID, not the Patient/Staff ID
      const correctUserId = user.userId || user.id || userId;
      console.log('🔄 [App] Using user ID:', correctUserId, 'for user:', user);
      console.log('🔄 [App] User record:', { id: user.id, userId: user.userId, role: user.role });
      
      // Call the API to update user status using the ApplicationUser ID
      const response = await adminAPI.updateUserStatus(correctUserId, isActive);
      
      // Verify the response
      if (response && response.isActive !== undefined) {
        const statusMatches = response.isActive === isActive;
        console.log('✅ [App] Response received - isActive:', response.isActive, 'Expected:', isActive, 'Matches:', statusMatches);
        
        if (!statusMatches) {
          console.warn('⚠️ [App] Response isActive does not match expected value');
          // Still continue but log warning
        }
      } else {
        console.warn('⚠️ [App] Response does not contain isActive field');
      }
      
      // Refresh data to get updated user list from backend
      console.log('🔄 [App] Refreshing dashboard data...');
      await loadDashboardData();
      
      // Verify the change persisted by checking the updated users list
      // Note: loadDashboardData updates the users state, but we need to wait for the state update
      // For now, we trust the API response and show success
      
      // Show success message
      alert(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
      
      console.log('✅ [App] User status update completed successfully');
      console.log('✅ [App] Verified response.isActive === requested isActive:', response.isActive === isActive);
    } catch (error: any) {
      console.error('❌ [App] Error updating user status:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update user status';
      setError(errorMessage);
      alert(`Failed to ${isActive ? 'activate' : 'deactivate'} user: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setIsProcessing(true);
      setError('');
      await adminAPI.updateUserRole(userId, newRole);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setError(error.response?.data?.error || error.message || 'Failed to update user role');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      setIsProcessing(true);
      setError('');
      console.log('Updating user:', { userId, userData });
      
      // Find the user in our local data to get the correct ID
      const user = users.find(u => u.id === userId || u.userId === userId);
      if (!user) {
        throw new Error('User not found in local data');
      }
      
      // Use the correct ID field - try multiple possible ID fields
      const correctUserId = user.id || user.userId || userId;
      console.log('Using user ID:', correctUserId, 'for user:', user);
      
      await adminAPI.updateUser(correctUserId, userData);
      await loadDashboardData(); // Refresh data
      
      // Show success message
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update user';
      setError(errorMessage);
      alert(`Failed to update user: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateStaff = async (staffData: any) => {
    try {
      setIsProcessing(true);
      setError('');
      await adminAPI.createStaff(staffData);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error creating staff:', error);
      setError(error.response?.data?.error || error.message || 'Failed to create staff member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateService = async (serviceData: any) => {
    try {
      setIsProcessing(true);
      setError('');
      await servicesAPI.create(serviceData);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error creating service:', error);
      setError(error.response?.data?.error || error.message || 'Failed to create service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateService = async (serviceId: string, serviceData: any) => {
    try {
      setIsProcessing(true);
      setError('');
      await servicesAPI.update(serviceId, serviceData);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating service:', error);
      setError(error.response?.data?.error || error.message || 'Failed to update service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      setIsProcessing(true);
      setError('');
      
      // Check if service is being used by any appointments
      const appointmentsUsingService = appointments.filter(apt => apt.service.id === serviceId);
      if (appointmentsUsingService.length > 0) {
        setError(`Cannot delete service. It is currently being used by ${appointmentsUsingService.length} appointment(s). Please cancel or reschedule these appointments first.`);
        return;
      }
      
      console.log('Attempting to delete service:', serviceId);
      const deleteResult = await servicesAPI.delete(serviceId);
      console.log('Delete result:', deleteResult);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting service:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to delete service';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for common database constraint errors
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint') || errorMessage.includes('reference')) {
        errorMessage = 'Cannot delete service. It is currently being used by existing appointments. Please cancel or reschedule these appointments first.';
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      setIsProcessing(true);
      setError('');
      // Update the appointment status to confirmed
      await appointmentsAPI.updateStatus(appointmentId, 'confirmed');
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error approving appointment:', error);
      setError(error.response?.data?.error || error.message || 'Failed to approve appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAppointment = async (appointmentId: string, reason: string) => {
    try {
      setIsProcessing(true);
      setError('');
      // Update the appointment status to cancelled with reason
      await appointmentsAPI.updateStatus(appointmentId, 'cancelled');
      // Optionally update notes with rejection reason
      await appointmentsAPI.update(appointmentId, {
        notes: `Rejected by admin: ${reason}`
      });
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      setError(error.response?.data?.error || error.message || 'Failed to reject appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  // Call children as a function with props
  return children({
    user,
    users,
    appointments,
    services,
    isLoading,
    isProcessing,
    error,
    onToggleUserStatus: handleToggleUserStatus,
    onUpdateUserRole: handleUpdateUserRole,
    onUpdateUser: handleUpdateUser,
    onCreateStaff: handleCreateStaff,
    onCreateService: handleCreateService,
    onUpdateService: handleUpdateService,
    onDeleteService: handleDeleteService,
    onRefreshAppointments: loadDashboardData,
    onApproveAppointment: handleApproveAppointment,
    onRejectAppointment: handleRejectAppointment,
    onLogout: () => {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
  });
};

// Main App Routes component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, login, register, logout, forgotPassword, isLoading, error, message, clearError, clearMessage } = useAuth();
  
  // Initialize push notifications if user is authenticated
  usePushNotifications(user?.id || null, user?.roles?.[0] || null);

  // Debug logging for auth state
  console.log('AppRoutes: Auth state:', {
    isAuthenticated,
    isLoading,
    error,
    message,
    hasMessage: !!message
  });

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const handleRegister = async (userData: any) => {
    try {
      const result = await register(userData);
      return result;
    } catch (err) {
      // Error is handled by AuthContext
      return { success: false, error: 'Registration failed' };
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/auth" 
        element={
          isAuthenticated ? (
            <Navigate to={
              user?.roles?.includes('admin') ? '/admin-dashboard' :
              user?.roles?.includes('doctor') ? '/doctor-dashboard' :
              '/patient-dashboard'
            } replace />
          ) : (
            <AuthPage
              onLogin={handleLogin}
              onRegister={handleRegister}
              onForgotPassword={async (email) => {
                try {
                  return await forgotPassword(email);
                } catch (err) {
                  return { success: false, error: 'Failed to send password reset email' };
                }
              }}
              isLoading={isLoading}
              error={error}
              message={message}
              clearError={clearError}
              clearMessage={clearMessage}
            />
          )
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/patient-dashboard"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <DashboardWrapper user={user}>
              {(props) => <PatientDashboard {...props} onLogout={handleLogout} />}
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor-dashboard"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboardWrapper user={user}>
              {(props) => <DoctorDashboard {...props} onLogout={handleLogout} />}
            </DoctorDashboardWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardWrapper user={user}>
              {(props) => <AdminDashboard {...props} onLogout={handleLogout} />}
            </AdminDashboardWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/email-settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EmailSettingsPage />
          </ProtectedRoute>
        }
      />


      {/* Fallback Routes */}
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You don't have permission to access this page. Please contact your administrator if you believe this is an error.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign Out
              </button>
              <button 
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
