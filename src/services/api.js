import axios from 'axios';

const API_BASE_URL = 'https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate API instance for admin operations that doesn't auto-logout
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Admin API request interceptor (same as regular API)
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if not already on auth page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// Admin API response interceptor (NO auto-logout)
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-logout for admin operations - let components handle errors
    return Promise.reject(error);
  }
);

// Mock API for testing when backend is not available
const MOCK_MODE = false; // Set to false when backend is running

// Auth API
export const authAPI = {
  register: async (userData) => {
    if (MOCK_MODE) {
      // Mock successful registration
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: "User registered successfully." });
        }, 1000);
      });
    }
    
    try {
      console.log('Attempting registration to:', API_BASE_URL + '/Auth/register');
      console.log('Registration data:', userData);
      const response = await api.post('/Auth/register', userData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || error.message;
    }
  },

  login: async (credentials) => {
    if (MOCK_MODE) {
      // Mock successful login
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            token: "mock-jwt-token-" + Date.now(),
            user: {
              id: "mock-user-id",
              email: credentials.email,
              firstName: "Mock",
              lastName: "User",
              roles: ["patient"]
            }
          });
        }, 1000);
      });
    }
    
    try {
      console.log('Attempting login to:', API_BASE_URL + '/Auth/login');
      console.log('Credentials:', credentials);
      const response = await api.post('/Auth/login', credentials);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || error.message;
    }
  },

  logout: async () => {
    if (MOCK_MODE) {
      // Mock successful logout
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: "Logged out successfully" });
        }, 500);
      });
    }
    
    try {
      const response = await api.post('/Auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Services API
export const servicesAPI = {
  getAll: async () => {
    try {
      console.log('Fetching services from:', API_BASE_URL + '/Services');
      const response = await api.get('/Services');
      console.log('Services response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error.message;
    }
  },

  create: async (serviceData) => {
    try {
      const response = await api.post('/Services', serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  update: async (id, serviceData) => {
    try {
      const response = await api.put(`/Services/${id}`, serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  delete: async (id) => {
    try {
      console.log('Deleting service with ID:', id);
      const response = await api.delete(`/Services/${id}`);
      console.log('Delete service response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete service error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || error.message;
    }
  },
};

// Time Slots API
export const timeSlotsAPI = {
  getByDay: async (day) => {
    try {
      const response = await api.get(`/time-slots/by-day/${day}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAvailable: async (date) => {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/time-slots/available', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Staff API
export const staffAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/Staff');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/Staff/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getByRole: async (role) => {
    try {
      const response = await api.get(`/Staff/by-role/${role}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSchedule: async (id, startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get(`/Staff/${id}/schedule`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAvailability: async (id, date) => {
    try {
      const response = await api.get(`/Staff/${id}/availability`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  update: async (id, staffData) => {
    try {
      const response = await api.put(`/Staff/${id}`, staffData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateAvailability: async (id, availabilityData) => {
    try {
      const response = await api.post(`/Staff/${id}/availability`, availabilityData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/Appointments');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/Appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getByPatient: async (patientId) => {
    try {
      const response = await api.get(`/Appointments/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getToday: async () => {
    try {
      const response = await api.get('/Appointments/today');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAvailable: async (date) => {
    try {
      const response = await api.get('/Appointments/available-slots', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  create: async (appointmentData) => {
    try {
      console.log('Creating appointment with data:', appointmentData);
      const response = await api.post('/Appointments', appointmentData);
      console.log('Appointment created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Appointment creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || error.message;
    }
  },

  update: async (id, appointmentData) => {
    try {
      const response = await api.put(`/Appointments/${id}`, appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.put(`/Appointments/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/Appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  assignStaff: async (id, staffId) => {
    try {
      const response = await api.post(`/Appointments/${id}/assign-staff`, { staffId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  bookForPatient: async (appointmentData) => {
    try {
      const response = await api.post('/Appointments/book-for-patient', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDoctorsOnDuty: async (date, serviceId = null) => {
    try {
      const params = { date };
      if (serviceId) params.serviceId = serviceId;
      
      console.log('🔍 API: Getting doctors on duty for date:', date);
      const response = await api.get('/Booking/doctors-on-duty', { params });
      console.log('✅ API: Doctors on duty response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Error fetching doctors on duty:', error);
      console.error('❌ API: Error status:', error.response?.status);
      
      // Fallback to existing staff API if new endpoint returns 500 or doesn't exist
      if (error.response?.status === 500 || error.response?.status === 404) {
        try {
          console.log('🔄 API: Falling back to staff API...');
          const staffResponse = await api.get('/Staff/by-role/doctor');
          const doctors = staffResponse.data;
          
          // Filter doctors based on their shift schedule for the requested date
          const availableDoctors = await appointmentsAPI.filterDoctorsByAvailability(doctors, date);
          console.log('✅ API: Filtered available doctors:', availableDoctors.length);
          
          return { doctors: availableDoctors };
        } catch (fallbackError) {
          console.error('❌ API: Fallback also failed:', fallbackError);
          // Return empty array instead of throwing to prevent UI crashes
          console.log('⚠️ API: Returning empty doctors array due to API failures');
          return { doctors: [] };
        }
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Helper function to filter doctors by their availability on a specific date
  filterDoctorsByAvailability: async (doctors, date) => {
    try {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      console.log('🔍 API: Filtering doctors for:', { date, dayOfWeek });
      
      const availableDoctors = [];
      
      for (const doctor of doctors) {
        try {
          // Get doctor's shift schedule
          const shiftResponse = await api.get(`/Doctor/${doctor.id}/shifts`);
          const shiftSchedule = shiftResponse.data;
          
          // Check if doctor is available on this day
          const dayShift = shiftSchedule.find(shift => 
            shift.dayOfWeek === dayOfWeek && shift.isActive
          );
          
          if (dayShift) {
            console.log(`✅ API: Doctor ${doctor.firstName} ${doctor.lastName} is available on ${dayOfWeek} (${dayShift.startTime} - ${dayShift.endTime})`);
            availableDoctors.push({
              ...doctor,
              shiftStart: dayShift.startTime,
              shiftEnd: dayShift.endTime,
              isAvailable: true
            });
          } else {
            console.log(`❌ API: Doctor ${doctor.firstName} ${doctor.lastName} is not available on ${dayOfWeek}`);
          }
        } catch (shiftError) {
          console.log(`⚠️ API: Could not check shift schedule for doctor ${doctor.firstName} ${doctor.lastName}, including anyway`);
          // If we can't check shift schedule, include the doctor anyway
          availableDoctors.push({
            ...doctor,
            isAvailable: true
          });
        }
      }
      
      return availableDoctors;
    } catch (error) {
      console.error('❌ API: Error filtering doctors by availability:', error);
      // Return all doctors if filtering fails
      return doctors.map(doctor => ({ ...doctor, isAvailable: true }));
    }
  },

  getAvailableSlotsByDoctor: async (doctorId, date, serviceId = null) => {
    try {
      // Try the new doctor-specific endpoint first
      const params = { doctorId, date };
      if (serviceId) params.serviceId = serviceId;
      
      const response = await api.get('/Booking/available-slots-by-doctor', { params });
      return response.data;
    } catch (error) {
      console.error('Doctor-specific slots endpoint error:', error);
      console.error('Error status:', error.response?.status);
      
      // Fallback to existing available slots API with doctor filter
      if (error.response?.status === 500 || error.response?.status === 404) {
        try {
          console.log('Falling back to generic slots API...');
          const params = { date, doctorId };
          if (serviceId) params.serviceId = serviceId;
          
          const slotsResponse = await api.get('/Booking/available-slots', { params });
          return { availableSlots: slotsResponse.data };
        } catch (fallbackError) {
          console.error('Both slot endpoints failed:', fallbackError);
          // Return empty array instead of throwing to prevent UI crashes
          console.log('Returning empty slots array due to API failures');
          return { availableSlots: [] };
        }
      }
      
      throw error.response?.data || error.message;
    }
  },

  getByDoctorAndDate: async (doctorId, date) => {
    try {
      console.log('🔍 API: getByDoctorAndDate called with:', { doctorId, date });
      console.log('🔍 API: Full URL will be:', `${API_BASE_URL}/Appointments/doctor/${doctorId}/date/${date}`);
      
      // Validate doctor ID format
      if (!doctorId || doctorId.length !== 36) {
        console.error('❌ API: Invalid doctor ID format:', doctorId);
        throw new Error('Invalid doctor ID format');
      }
      
      // Validate date format
      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.error('❌ API: Invalid date format:', date);
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }
      
      const response = await api.get(`/Appointments/doctor/${doctorId}/date/${date}`);
      console.log('✅ API: Direct endpoint response:', response.data);
      console.log('✅ API: Response length:', response.data?.appointments?.length || response.data?.length || 0);
      
      // Handle the expected response format: { appointments: [...], totalAppointmentsFound: N }
      let appointments = [];
      if (response.data && response.data.appointments) {
        appointments = response.data.appointments;
        console.log('✅ API: Extracted appointments from response.appointments:', appointments.length);
      } else if (Array.isArray(response.data)) {
        appointments = response.data;
        console.log('✅ API: Response is direct array:', appointments.length);
      }
      
      // If the direct endpoint returns empty array, try the fallback anyway
      if (!appointments || appointments.length === 0) {
        console.log('⚠️ API: Direct endpoint returned empty array, trying fallback...');
        throw new Error('Direct endpoint returned empty array');
      }
      
      console.log('✅ API: Successfully retrieved appointments from direct endpoint:', appointments.length);
      return appointments;
    } catch (error) {
      console.error('❌ API: Doctor-specific date endpoint error:', error);
      console.error('❌ API: Error status:', error.response?.status);
      console.error('❌ API: Error response:', error.response?.data);
      
      // Fallback: Get all appointments and filter on the frontend
      if (error.response?.status === 404 || error.response?.status === 500 || error.message === 'Direct endpoint returned empty array') {
        try {
          console.log('🔄 API: Falling back to filtering all appointments...');
          console.log('🎯 API: Looking for doctor ID:', doctorId);
          console.log('📅 API: Looking for date:', date);
          
          // Use the new public endpoint instead of the authenticated one
          const allAppointments = await api.get('/Appointments/all-appointments');
          const appointments = allAppointments.data;
          
          console.log('📋 API: Total appointments fetched:', appointments.length);
          console.log('📋 API: Sample appointment structure:', appointments[0]);
          console.log('📋 API: Full appointment structure keys:', Object.keys(appointments[0]));
          
          // Let's examine all appointments on the target date to see their structure
          const appointmentsOnDate = appointments.filter(apt => {
            const appointmentDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
            return appointmentDate === date;
          });
          
          console.log('📅 API: Appointments on target date:', appointmentsOnDate.length);
          console.log('📅 API: Sample appointment on date:', appointmentsOnDate[0]);
          
          // Filter by doctor ID (check both staffId and doctorId fields)
          const doctorAppointments = appointmentsOnDate.filter(apt => {
            const matchesStaffId = apt.staffId === doctorId;
            const matchesDoctorId = apt.doctorId === doctorId;
            console.log(`🔍 API: Checking appointment ${apt.id}: staffId=${apt.staffId}, doctorId=${apt.doctorId}, matchesStaffId=${matchesStaffId}, matchesDoctorId=${matchesDoctorId}`);
            return matchesStaffId || matchesDoctorId;
          });
          
          console.log('👨‍⚕️ API: Doctor-specific appointments found:', doctorAppointments.length);
          console.log('👨‍⚕️ API: Doctor appointments:', doctorAppointments);
          
          return doctorAppointments;
        } catch (fallbackError) {
          console.error('❌ API: Fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error.response?.data || error.message;
    }
  },
};

// Patients API
export const patientsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/Patients');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/Patients/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getByUserId: async (userId) => {
    try {
      // Get all patients and find the one with matching userId
      const response = await api.get('/Patients');
      const patients = response.data;
      const patient = patients.find(p => p.userId === userId);
      if (!patient) {
        throw new Error('Patient not found for this user');
      }
      return patient;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  search: async (query) => {
    try {
      const response = await api.get('/Patients/search', { params: { query } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  update: async (id, patientData) => {
    try {
      const response = await api.put(`/Patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Doctor API
export const doctorAPI = {
  getPatients: async (doctorId) => {
    try {
      const response = await api.get(`/Doctor/${doctorId}/patients`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUpcomingAppointments: async (doctorId) => {
    try {
      const response = await api.get(`/Doctor/${doctorId}/appointments/upcoming`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllAppointments: async (doctorId) => {
    try {
      const response = await api.get(`/Doctor/${doctorId}/appointments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSchedule: async (doctorId, startDate, endDate) => {
    try {
      const response = await api.get(`/Doctor/${doctorId}/schedule`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  approveAppointment: async (appointmentId) => {
    try {
      const response = await api.put(`/Doctor/appointments/${appointmentId}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  rejectAppointment: async (appointmentId, reason) => {
    try {
      const response = await api.put(`/Doctor/appointments/${appointmentId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPatientDetails: async (patientId) => {
    try {
      const response = await api.get(`/Doctor/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createWalkinAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/Doctor/appointments/walkin', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getShiftSchedule: async (doctorId) => {
    try {
      const response = await api.get(`/Doctor/${doctorId}/shifts`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateShiftSchedule: async (doctorId, shiftData) => {
    try {
      const response = await api.put(`/Doctor/${doctorId}/shifts`, shiftData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin schedule management functions (using public endpoints)
  getShiftSchedulePublic: async (doctorId) => {
    try {
      const response = await api.get(`/DoctorSchedule/${doctorId}/shifts`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateShiftSchedulePublic: async (doctorId, shiftData) => {
    try {
      const response = await api.put(`/DoctorSchedule/${doctorId}/shifts`, shiftData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Admin API
export const adminAPI = {
  getUsers: async () => {
    try {
      const response = await api.get('/Admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRoles: async () => {
    try {
      const response = await api.get('/Admin/roles');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createStaff: async (staffData) => {
    try {
      const response = await api.post('/Admin/create-staff', staffData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateUserStatus: async (userId, isActive) => {
    try {
      const response = await api.put(`/Admin/users/${userId}`, { isActive });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateUserRole: async (userId, newRole) => {
    try {
      const response = await api.put(`/Admin/users/${userId}/role`, { newRole });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAppointmentStats: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get('/Admin/reports/appointment-stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRevenueReport: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get('/Admin/reports/revenue', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default api;
