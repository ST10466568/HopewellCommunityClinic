import axios from 'axios';

const API_BASE_URL = 'https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net/api';

// Create axios instance with default config
const api = axios.create({
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

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only logout if this is an authentication-related endpoint or if we're in mock mode
      const isAuthEndpoint = error.config?.url?.includes('/Auth/');
      const isLoginEndpoint = error.config?.url?.includes('/login');
      const isRegisterEndpoint = error.config?.url?.includes('/register');
      
      // Real API mode - be more careful about when to logout
      if (isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Real API only - no mock mode

// Auth API
export const authAPI = {
  register: async (userData) => {
    
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

  getDoctorsOnDuty: async (date, serviceId = null) => {
    
    try {
      const params = { date };
      if (serviceId) params.serviceId = serviceId;
      
      const response = await api.get('/Booking/doctors-on-duty', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors on duty:', error);
      console.error('Error status:', error.response?.status);
      
      // Fallback to existing staff API if new endpoint returns 500 or doesn't exist
      if (error.response?.status === 500 || error.response?.status === 404) {
        try {
          console.log('Falling back to staff API...');
          const staffResponse = await api.get('/Staff/by-role/doctor');
          return { doctors: staffResponse.data };
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          // Return empty array instead of throwing to prevent UI crashes
          console.log('Returning empty doctors array due to API failures');
          return { doctors: [] };
        }
      }
      
      throw error.response?.data || error.message;
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

  updateShiftSchedule: async (doctorId, shiftData) => {
    try {
      const response = await api.put(`/Doctor/${doctorId}/shifts`, shiftData);
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
