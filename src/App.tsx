import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import NurseDashboard from './components/NurseDashboard';
import LoadingSpinner from './components/LoadingSpinner';

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
        setAppointments(appointmentsData);
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
        notes: updateData.notes || ''
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

      // Get all appointments
      try {
        const appointmentsData = await appointmentsAPI.getAll();
        setAppointments(appointmentsData);
      } catch (appointmentsError) {
        console.log('No appointments endpoint available yet');
        setAppointments([]);
      }

      // Get all patients
      try {
        const patientsData = await patientsAPI.getAll();
        setPatients(patientsData);
      } catch (patientsError) {
        console.log('No patients endpoint available yet');
        setPatients([]);
      }

      // Load shift schedule from localStorage or use defaults
      const loadShiftScheduleFromStorage = () => {
        try {
          const currentStaffId = staffId || user.staffId;
          const storageKey = `shiftSchedule_${currentStaffId}`;
          const savedSchedule = localStorage.getItem(storageKey);
          
          if (savedSchedule) {
            console.log('🔧 Loading saved shift schedule from localStorage');
            const parsedSchedule = JSON.parse(savedSchedule);
            setShiftSchedule(parsedSchedule);
            return;
          }
        } catch (error) {
          console.log('⚠️ Error loading from localStorage:', error);
        }
        
        // Fall back to default schedule
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
      
      loadShiftScheduleFromStorage();
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

  const handleUpdateShiftSchedule = async (shiftData: any[]) => {
    try {
      setIsProcessing(true);
      setError('');
      
      const currentStaffId = staffId || user.staffId;
      if (!currentStaffId) {
        throw new Error('No staff ID available');
      }
      
      console.log('Updating shift schedule for staff ID:', currentStaffId);
      console.log('Shift data:', shiftData);
      
      // Try to call the API, but don't fail if it doesn't exist yet
      try {
        await doctorAPI.updateShiftSchedule(currentStaffId, shiftData);
        console.log('✅ Shift schedule updated successfully via API');
      } catch (apiError) {
        console.log('⚠️ API update failed, storing locally:', apiError);
        // If API fails, just store locally for now
      }
      
      // Always update local state regardless of API success/failure
      setShiftSchedule(shiftData);
      
      // Save to localStorage for persistence across page reloads
      try {
        const storageKey = `shiftSchedule_${currentStaffId}`;
        localStorage.setItem(storageKey, JSON.stringify(shiftData));
        console.log('✅ Shift schedule saved to localStorage');
      } catch (storageError) {
        console.log('⚠️ Error saving to localStorage:', storageError);
      }
      
      console.log('✅ Shift schedule updated locally');
    } catch (error: any) {
      console.error('Error updating shift schedule:', error);
      setError(error.response?.data?.error || error.message || 'Failed to update shift schedule');
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
    onUpdateShiftSchedule: handleUpdateShiftSchedule,
    onViewPatientDetails: handleViewPatientDetails
  });
};

// Nurse Dashboard wrapper component that handles nurse-specific data loading
const NurseDashboardWrapper: React.FC<{ 
  children: (props: any) => React.ReactNode;
  user: any;
}> = ({ children, user }) => {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [doctors, setDoctors] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load appointments
      try {
        const appointmentsData = await appointmentsAPI.getAll();
        setAppointments(appointmentsData);
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

      // Load doctors (staff with doctor role)
      try {
        const staffData = await staffAPI.getAll();
        const doctorsData = staffData.filter((staff: any) => staff.role === 'doctor');
        setDoctors(doctorsData);
      } catch (staffError) {
        console.log('No staff endpoint available yet');
        setDoctors([]);
      }
    } catch (error: any) {
      console.error('Error loading nurse dashboard data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const handleBookWalkInAppointment = async (appointmentData: any) => {
    try {
      setIsProcessing(true);
      setError('');
      
      // Create a walk-in appointment with immediate scheduling
      const walkInAppointment = {
        ...appointmentData,
        appointmentDate: new Date().toISOString().split('T')[0], // Today
        startTime: new Date().toTimeString().slice(0, 5), // Current time
        status: 'walkin',
        notes: `Walk-in appointment: ${appointmentData.notes || 'No additional notes'}`
      };

      await appointmentsAPI.create(walkInAppointment);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error booking walk-in appointment:', error);
      setError(error.response?.data?.error || error.message || 'Failed to book walk-in appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAppointmentForDoctor = async (appointmentId: string, doctorId: string) => {
    try {
      setIsProcessing(true);
      setError('');
      
      // Update appointment with doctor assignment and approval
      await appointmentsAPI.update(appointmentId, {
        staffId: doctorId,
        status: 'confirmed'
      });
      
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error approving appointment for doctor:', error);
      setError(error.response?.data?.error || error.message || 'Failed to approve appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAppointment = async (appointmentId: string, reason: string) => {
    try {
      setIsProcessing(true);
      setError('');
      
      await appointmentsAPI.update(appointmentId, {
        status: 'cancelled',
        notes: `Rejected by nurse: ${reason}`
      });
      
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      setError(error.response?.data?.error || error.message || 'Failed to reject appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  return children({
    user,
    appointments,
    services,
    doctors,
    isLoading,
    isProcessing,
    error,
    onBookWalkInAppointment: handleBookWalkInAppointment,
    onApproveAppointmentForDoctor: handleApproveAppointmentForDoctor,
    onRejectAppointment: handleRejectAppointment,
    onLogout: () => {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
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
        allUsers.push(...staffData);
      } catch (staffError) {
        console.log('No staff endpoint available, falling back to admin users');
        try {
          const usersData = await adminAPI.getUsers();
          console.log('📊 Admin users data received:', usersData);
          allUsers.push(...usersData);
        } catch (adminError) {
          console.error('Failed to load staff/users:', adminError);
        }
      }

      // Get all patients
      try {
        const patientsData = await patientsAPI.getAll();
        console.log('👥 Patients data received:', patientsData);
        
        // Normalize patient data to match staff structure
        const normalizedPatients = patientsData.map((patient: any) => ({
          ...patient,
          role: 'patient',
          isActive: true,
          // Ensure consistent field names
          firstName: patient.firstName || patient.first_name,
          lastName: patient.lastName || patient.last_name,
          email: patient.email,
          phone: patient.phone,
          id: patient.id,
          userId: patient.userId || patient.id
        }));
        
        console.log('👥 Normalized patients:', normalizedPatients);
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
        setAppointments(appointmentsData);
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
      await adminAPI.updateUserStatus(userId, isActive);
      await loadDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating user status:', error);
      setError(error.response?.data?.error || error.message || 'Failed to update user status');
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
    onCreateStaff: handleCreateStaff,
    onCreateService: handleCreateService,
    onUpdateService: handleUpdateService,
    onDeleteService: handleDeleteService,
    onRefreshAppointments: loadDashboardData,
    onLogout: () => {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
  });
};

// Main App Routes component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, login, register, logout, isLoading, error, clearError } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const handleRegister = async (userData: any) => {
    try {
      await register(userData);
    } catch (err) {
      // Error is handled by AuthContext
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
              user?.roles?.includes('nurse') ? '/nurse-dashboard' :
              '/patient-dashboard'
            } replace />
          ) : (
            <AuthPage
              onLogin={handleLogin}
              onRegister={handleRegister}
              isLoading={isLoading}
              error={error}
              clearError={clearError}
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
        path="/nurse-dashboard"
        element={
          <ProtectedRoute allowedRoles={['nurse']}>
            <NurseDashboardWrapper user={user}>
              {(props) => <NurseDashboard {...props} onLogout={handleLogout} />}
            </NurseDashboardWrapper>
          </ProtectedRoute>
        }
      />

      {/* Fallback Routes */}
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Unauthorized</h1>
            <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Sign Out
            </button>
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
