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
      // Mock successful registration with automatic login
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            message: "User registered successfully.",
            token: "mock-jwt-token-" + Date.now(),
            user: {
              id: "mock-user-id-" + Date.now(),
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              roles: ["patient"] // Automatically assign patient role
            }
          });
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

  forgotPassword: async (email) => {
    try {
      console.log('Attempting forgot password for:', email);
      const response = await api.post('/Auth/forgot-password', { email });
      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || error.message;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      console.log('Attempting password reset with token:', token);
      const response = await api.post('/Auth/reset-password', { 
        token, 
        newPassword 
      });
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (userId, profileData) => {
    try {
      console.log('Updating user profile:', userId, profileData);
      
      // Try user-specific endpoint first
      try {
        const response = await api.put(`/Auth/profile/${userId}`, profileData);
        console.log('Update profile response:', response.data);
        return response.data;
      } catch (userEndpointError) {
        console.log('User endpoint failed, trying role-specific endpoints...');
        
        // For patients, try to get patient record and use patient update endpoint
        try {
          // Get all patients and find the one with matching userId
          const patientsResponse = await api.get('/Patients');
          const patients = patientsResponse.data;
          const patient = patients.find(p => p.userId === userId);
          
          if (patient) {
            console.log('Found patient record:', patient);
            
            // Format data for patient update endpoint
            const patientUpdateData = {
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              email: profileData.email,
              phone: profileData.phone,
              ...(profileData.address && { address: profileData.address }),
              ...(profileData.emergencyContact && { emergencyContact: profileData.emergencyContact })
            };
            
            const response = await api.put(`/Patients/${patient.id}`, patientUpdateData);
            console.log('Patient update response:', response.data);
            return response.data;
          } else {
            throw new Error('Patient record not found');
          }
        } catch (patientError) {
          console.log('Patient endpoint failed, trying admin endpoint...');
          console.log('Patient error:', patientError);
          
          // Fallback to admin endpoint
          try {
            // Format data for admin endpoint - backend expects flat string fields
            // Based on AdminDashboard edit form, backend expects these fields:
            let adminUpdateData = {
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              email: profileData.email,
              phone: profileData.phone || '',
              // Include dateOfBirth if provided (optional)
              dateOfBirth: profileData.dateOfBirth || '',
              // Convert nested address object to string format
              address: '',
              // Convert nested emergencyContact object to string format
              emergencyContact: '',
              emergencyPhone: ''
            };
            
            // Convert nested address object to string format (backend expects string)
            if (profileData.address) {
              if (typeof profileData.address === 'object') {
                // Format address as comma-separated string
                const addressParts = [];
                if (profileData.address.street) addressParts.push(profileData.address.street);
                if (profileData.address.city) addressParts.push(profileData.address.city);
                if (profileData.address.state) addressParts.push(profileData.address.state);
                if (profileData.address.zipCode) addressParts.push(profileData.address.zipCode);
                if (profileData.address.country) addressParts.push(profileData.address.country);
                adminUpdateData.address = addressParts.join(', ') || '';
              } else {
                adminUpdateData.address = profileData.address;
              }
            }
            
            // Convert nested emergencyContact object to string format
            if (profileData.emergencyContact) {
              if (typeof profileData.emergencyContact === 'object') {
                // Format emergency contact as a string
                const contactParts = [];
                if (profileData.emergencyContact.name) contactParts.push(profileData.emergencyContact.name);
                if (profileData.emergencyContact.relationship) contactParts.push(`(${profileData.emergencyContact.relationship})`);
                if (profileData.emergencyContact.phone) contactParts.push(`Phone: ${profileData.emergencyContact.phone}`);
                if (profileData.emergencyContact.email) contactParts.push(`Email: ${profileData.emergencyContact.email}`);
                adminUpdateData.emergencyContact = contactParts.join(', ') || '';
                adminUpdateData.emergencyPhone = profileData.emergencyContact.phone || '';
              } else {
                adminUpdateData.emergencyContact = profileData.emergencyContact;
                adminUpdateData.emergencyPhone = profileData.emergencyContact.phone || '';
              }
            }
            
            // Don't include role in profile update - users shouldn't change their own role
            // role field is only for admin updates
            
            console.log('Formatted admin update data:', adminUpdateData);
            const response = await api.put(`/Admin/users/${userId}`, adminUpdateData);
            return response.data;
          } catch (adminError) {
            console.error('Update profile error:', adminError);
            console.error('Admin error response:', adminError.response?.data);
            
            // Extract validation errors if available
            if (adminError.response?.data?.errors) {
              const validationErrors = Object.entries(adminError.response.data.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ');
              throw new Error(`Validation failed: ${validationErrors}`);
            }
            
            const errorMessage = adminError.response?.data?.error || 
                               adminError.response?.data?.message || 
                               adminError.message || 
                               'Failed to update profile';
            throw new Error(errorMessage);
          }
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response?.data || error.message || error;
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
          const shiftResponse = await api.get(`/Booking/doctor/${doctor.id}/shifts`);
          
          // Check if the response has the expected structure
          let shiftSchedule = null;
          if (shiftResponse.data) {
            // Handle different response formats
            if (shiftResponse.data.success && shiftResponse.data.data && shiftResponse.data.data.shifts) {
              // Response format: { success: true, data: { shifts: [...] } }
              shiftSchedule = shiftResponse.data.data.shifts;
              console.log(`✅ API: Successfully retrieved shift schedule for doctor ${doctor.firstName} ${doctor.lastName}`);
            } else if (Array.isArray(shiftResponse.data)) {
              // Response format: [shift1, shift2, ...]
              shiftSchedule = shiftResponse.data;
              console.log(`✅ API: Successfully retrieved shift schedule for doctor ${doctor.firstName} ${doctor.lastName}`);
            } else if (shiftResponse.data.shifts) {
              // Response format: { shifts: [...] }
              shiftSchedule = shiftResponse.data.shifts;
              console.log(`✅ API: Successfully retrieved shift schedule for doctor ${doctor.firstName} ${doctor.lastName}`);
            } else {
              throw new Error('Invalid response structure - no shifts data found');
            }
          } else {
            throw new Error('No data in response');
          }
          
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
              isAvailable: true,
              isOnDuty: true
            });
          } else {
            console.log(`❌ API: Doctor ${doctor.firstName} ${doctor.lastName} is not available on ${dayOfWeek}`);
            // Add doctor as not on duty
            availableDoctors.push({
              ...doctor,
              isAvailable: false,
              isOnDuty: false,
              unavailabilityReason: "Not scheduled to work on this day"
            });
          }
        } catch (shiftError) {
          console.warn(`⚠️ API: Could not check shift schedule for doctor ${doctor.firstName} ${doctor.lastName}, including anyway`);
          console.error('Error details:', shiftError);
          // If we can't check shift schedule, include the doctor anyway
          availableDoctors.push({
            ...doctor,
            isAvailable: true,
            isOnDuty: true
          });
        }
      }
      
      return availableDoctors;
    } catch (error) {
      console.error('❌ API: Error filtering doctors by availability:', error);
      // Return all doctors if filtering fails
      return doctors.map(doctor => ({ ...doctor, isAvailable: true, isOnDuty: true }));
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
      const response = await api.get(`/Booking/doctor/${doctorId}/shifts`);
      
      // Handle different response formats
      if (response.data) {
        if (response.data.success && response.data.data && response.data.data.shifts) {
          // Response format: { success: true, data: { shifts: [...] } }
          console.log(`✅ API: Successfully retrieved shift schedule for doctor ${doctorId}`);
          return response.data.data.shifts;
        } else if (Array.isArray(response.data)) {
          // Response format: [shift1, shift2, ...]
          console.log(`✅ API: Successfully retrieved shift schedule for doctor ${doctorId}`);
          return response.data;
        } else if (response.data.shifts) {
          // Response format: { shifts: [...] }
          console.log(`✅ API: Successfully retrieved shift schedule for doctor ${doctorId}`);
          return response.data.shifts;
        } else {
          throw new Error('Invalid response structure - no shifts data found');
        }
      } else {
        throw new Error('No data in response');
      }
    } catch (error) {
      console.error(`❌ API: Error getting shift schedule for doctor ${doctorId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  updateShiftSchedule: async (doctorId, shiftData) => {
    try {
      console.log('🔄 [doctorAPI] updateShiftSchedule called');
      console.log('📋 Doctor ID:', doctorId);
      console.log('📅 Shift Data:', shiftData);
      console.log('📦 Request Payload:', { shifts: shiftData });
      
      const response = await api.put(`/Booking/doctor/${doctorId}/shifts`, { shifts: shiftData });
      
      console.log('✅ [doctorAPI] updateShiftSchedule success');
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [doctorAPI] updateShiftSchedule error');
      console.error('📊 Error Status:', error.response?.status);
      console.error('📊 Error Data:', error.response?.data);
      console.error('📊 Error Message:', error.message);
      throw error.response?.data || error.message;
    }
  },

  // Admin schedule management functions (using correct endpoints)
  getShiftSchedulePublic: async (doctorId) => {
    try {
      // Use the correct Booking endpoint
      const response = await axios.get(`${API_BASE_URL}/Booking/doctor/${doctorId}/shifts`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateShiftSchedulePublic: async (doctorId, shiftData) => {
    try {
      console.log('🔄 [doctorAPI] updateShiftSchedulePublic called');
      console.log('📋 Doctor ID:', doctorId);
      console.log('📅 Shift Data:', shiftData);
      console.log('📦 Request Payload:', { shifts: shiftData });
      
      // Use the correct Booking endpoint
      const response = await axios.put(`${API_BASE_URL}/Booking/doctor/${doctorId}/shifts`, { shifts: shiftData });
      
      console.log('✅ [doctorAPI] updateShiftSchedulePublic success');
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [doctorAPI] updateShiftSchedulePublic error');
      console.error('📊 Error Status:', error.response?.status);
      console.error('📊 Error Data:', error.response?.data);
      console.error('📊 Error Message:', error.message);
      throw error.response?.data || error.message;
    }
  },
};

// Admin API
export const adminAPI = {
  getUsers: async () => {
    console.log('🔔 [adminAPI] getUsers called');
    try {
      console.log('🔔 [adminAPI] Making API call to /Admin/users');
      const response = await api.get('/Admin/users');
      console.log('🔔 [adminAPI] API response:', response);
      console.log('🔔 [adminAPI] API response data:', response.data);
      console.log('🔔 [adminAPI] Response data type:', typeof response.data);
      console.log('🔔 [adminAPI] Response data is array:', Array.isArray(response.data));
      return response.data;
    } catch (error) {
      console.error('🔔 [adminAPI] API error:', error);
      console.error('🔔 [adminAPI] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
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
      console.log('🔔 [adminAPI] createStaff called with:', staffData);
      
      // Ensure all fields are included in the request
      const createData = {
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        password: staffData.password,
        role: staffData.role || 'patient',
        phone: staffData.phone || '',
        dateOfBirth: staffData.dateOfBirth || '',
        address: staffData.address || '',
        emergencyContact: staffData.emergencyContact || '',
        emergencyPhone: staffData.emergencyPhone || ''
      };
      
      console.log('🔔 [adminAPI] Sending create data:', createData);
      const response = await api.post('/Admin/create-staff', createData);
      console.log('🔔 [adminAPI] Create response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔔 [adminAPI] Create error:', error);
      console.error('🔔 [adminAPI] Error response:', error.response?.data);
      throw error.response?.data || error.message;
    }
  },

  updateUserStatus: async (userId, isActive) => {
    try {
      console.log('🔔 [adminAPI] updateUserStatus called with:', { userId, isActive });
      console.log('🔔 [adminAPI] Making request to: PUT /Admin/users/' + userId + '/status');
      console.log('🔔 [adminAPI] Request body:', { isActive });
      
      // Use the dedicated status endpoint
      const response = await api.put(`/Admin/users/${userId}/status`, { isActive });
      
      console.log('🔔 [adminAPI] Status update response:', response.data);
      console.log('🔔 [adminAPI] Response status:', response.status);
      
      // Verify the response contains isActive field
      if (response.data && response.data.isActive !== undefined) {
        const statusMatches = response.data.isActive === isActive;
        console.log('🔔 [adminAPI] Response isActive:', response.data.isActive);
        console.log('🔔 [adminAPI] Expected isActive:', isActive);
        console.log('🔔 [adminAPI] Status matches:', statusMatches);
        
        if (!statusMatches) {
          console.warn('⚠️ [adminAPI] Response isActive does not match expected value');
        }
      } else {
        console.warn('⚠️ [adminAPI] Response does not contain isActive field');
      }
      
      return response.data;
    } catch (error) {
      console.error('🔔 [adminAPI] updateUserStatus error:', error);
      console.error('🔔 [adminAPI] Error status:', error.response?.status);
      console.error('🔔 [adminAPI] Error response:', error.response?.data);
      
      // If status endpoint fails, throw error (don't fallback to main endpoint)
      // This ensures we know when the dedicated endpoint is not working
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

  updateUser: async (userId, userData) => {
    try {
      console.log('🔔 [adminAPI] updateUser called with:', { userId, userData });
      
      // Ensure all fields are included in the request, including isActive if provided
      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        address: userData.address || '',
        emergencyContact: userData.emergencyContact || '',
        emergencyPhone: userData.emergencyPhone || '',
        // Include role if provided (for admin updates)
        ...(userData.role && { role: userData.role }),
        // Include isActive if provided (for status updates via edit)
        ...(userData.isActive !== undefined && { isActive: userData.isActive })
      };
      
      console.log('🔔 [adminAPI] Sending update data:', updateData);
      const response = await api.put(`/Admin/users/${userId}`, updateData);
      console.log('🔔 [adminAPI] Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔔 [adminAPI] Update error:', error);
      console.error('🔔 [adminAPI] Error response:', error.response?.data);
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

  // Admin-specific doctor schedule management
  getDoctorShiftSchedule: async (doctorId) => {
    try {
      const response = await api.get(`/Booking/doctor/${doctorId}/shifts`);
      
      // Handle different response formats
      if (response.data) {
        if (response.data.success && response.data.data && response.data.data.shifts) {
          // Response format: { success: true, data: { shifts: [...] } }
          console.log(`✅ API: Successfully retrieved admin shift schedule for doctor ${doctorId}`);
          return response.data.data.shifts;
        } else if (Array.isArray(response.data)) {
          // Response format: [shift1, shift2, ...]
          console.log(`✅ API: Successfully retrieved admin shift schedule for doctor ${doctorId}`);
          return response.data;
        } else if (response.data.shifts) {
          // Response format: { shifts: [...] }
          console.log(`✅ API: Successfully retrieved admin shift schedule for doctor ${doctorId}`);
          return response.data.shifts;
        } else {
          throw new Error('Invalid response structure - no shifts data found');
        }
      } else {
        throw new Error('No data in response');
      }
    } catch (error) {
      console.error(`❌ API: Error getting admin shift schedule for doctor ${doctorId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  updateDoctorShiftSchedule: async (doctorId, shiftData) => {
    try {
      console.log('🔄 [adminAPI] updateDoctorShiftSchedule called');
      console.log('📋 Doctor ID:', doctorId);
      console.log('📅 Shift Data:', shiftData);
      console.log('📦 Request Payload:', { shifts: shiftData });
      
      const response = await api.put(`/Booking/doctor/${doctorId}/shifts`, { shifts: shiftData });
      
      console.log('✅ [adminAPI] updateDoctorShiftSchedule success');
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [adminAPI] updateDoctorShiftSchedule error');
      console.error('📊 Error Status:', error.response?.status);
      console.error('📊 Error Data:', error.response?.data);
      console.error('📊 Error Message:', error.message);
      throw error.response?.data || error.message;
    }
  },
};

// Notifications API
export const notificationsAPI = {
  // Get all scheduled notifications
  getScheduled: async () => {
    console.log('🔔 [notificationsAPI] getScheduled called');
    if (MOCK_MODE) {
      console.log('🔔 [notificationsAPI] Using MOCK_MODE for getScheduled');
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = [
            {
              id: 'notif-1',
              appointmentId: 'apt-1',
              patientId: 'patient-1',
              patientName: 'John Doe',
              patientEmail: 'john.doe@email.com',
              type: '24h_reminder',
              status: 'scheduled',
              scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              appointmentDate: '2024-01-15',
              appointmentTime: '10:00',
              serviceName: 'General Checkup',
              staffName: 'Dr. Smith'
            },
            {
              id: 'notif-2',
              appointmentId: 'apt-2',
              patientId: 'patient-2',
              patientName: 'Jane Smith',
              patientEmail: 'jane.smith@email.com',
              type: '2h_reminder',
              status: 'scheduled',
              scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              appointmentDate: '2024-01-15',
              appointmentTime: '14:30',
              serviceName: 'Dental Cleaning',
              staffName: 'Dr. Johnson'
            }
          ];
          console.log('🔔 [notificationsAPI] Returning mock scheduled data:', mockData);
          resolve(mockData);
        }, 500);
      });
    }
    
    try {
      console.log('🔔 [notificationsAPI] Making API call to /Notifications/scheduled');
      const response = await api.get('/Notifications/scheduled');
      console.log('🔔 [notificationsAPI] API response:', response);
      console.log('🔔 [notificationsAPI] API response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔔 [notificationsAPI] API error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get notification history
  getHistory: async (filters = {}) => {
    if (MOCK_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockHistory = [
            {
              id: 'hist-1',
              appointmentId: 'apt-1',
              patientId: 'patient-1',
              patientName: 'John Doe',
              patientEmail: 'john.doe@email.com',
              type: '24h_reminder',
              status: 'sent',
              sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              emailSubject: 'Appointment Reminder - Tomorrow at 10:00 AM',
              appointmentDate: '2024-01-13',
              appointmentTime: '10:00',
              serviceName: 'General Checkup',
              staffName: 'Dr. Smith'
            },
            {
              id: 'hist-2',
              appointmentId: 'apt-2',
              patientId: 'patient-2',
              patientName: 'Jane Smith',
              patientEmail: 'jane.smith@email.com',
              type: 'custom',
              status: 'sent',
              sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              emailSubject: 'Important: Insurance Update Required',
              appointmentDate: null,
              appointmentTime: null,
              serviceName: null,
              staffName: null
            },
            {
              id: 'hist-3',
              appointmentId: 'apt-3',
              patientId: 'patient-3',
              patientName: 'Bob Wilson',
              patientEmail: 'bob.wilson@email.com',
              type: '2h_reminder',
              status: 'failed',
              sentAt: null,
              emailSubject: 'URGENT: Your appointment is in 2 hours',
              appointmentDate: '2024-01-12',
              appointmentTime: '15:00',
              serviceName: 'Eye Exam',
              staffName: 'Dr. Brown',
              errorMessage: 'Invalid email address'
            }
          ];
          
          // Apply filters
          let filteredHistory = mockHistory;
          if (filters.type) {
            filteredHistory = filteredHistory.filter(n => n.type === filters.type);
          }
          if (filters.status) {
            filteredHistory = filteredHistory.filter(n => n.status === filters.status);
          }
          if (filters.patientId) {
            filteredHistory = filteredHistory.filter(n => n.patientId === filters.patientId);
          }
          
          resolve(filteredHistory);
        }, 500);
      });
    }
    
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.patientId) params.patientId = filters.patientId;
      
      const response = await api.get('/Notifications/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send custom email to a patient
  sendCustomEmail: async (patientId, subject, message) => {
    console.log('📧 [notificationsAPI] sendCustomEmail called');
    console.log('📧 [notificationsAPI] Parameters:', {
      patientId: patientId,
      subject: subject,
      messageLength: message?.length || 0,
      messagePreview: message ? message.substring(0, 100) + (message.length > 100 ? '...' : '') : 'None'
    });
    
    if (MOCK_MODE) {
      console.log('📧 [notificationsAPI] Using MOCK_MODE for sendCustomEmail');
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResult = {
            success: true,
            notificationId: 'notif-' + Date.now(),
            messageId: 'msg-' + Date.now(),
            message: 'Custom email sent successfully',
            previewUrl: 'https://ethereal.email/message/mock-preview'
          };
          console.log('📧 [notificationsAPI] Mock result generated:', mockResult);
          resolve(mockResult);
        }, 1000);
      });
    }
    
    try {
      console.log('📧 [notificationsAPI] Making API call to /Notifications/send-custom');
      const requestPayload = {
        PatientId: patientId,  // Fixed: Use PascalCase as expected by API
        Subject: subject,      // Fixed: Use PascalCase as expected by API
        Message: message      // Fixed: Use PascalCase as expected by API
      };
      console.log('📧 [notificationsAPI] Request payload:', requestPayload);
      
      const response = await api.post('/Notifications/send-custom', requestPayload);
      console.log('📧 [notificationsAPI] API response received:', response);
      console.log('📧 [notificationsAPI] Response data:', response.data);
      
      // Handle different response formats from backend
      const responseData = response.data;
      if (responseData.message && !responseData.success) {
        // Backend returned a message but no success field - assume success
        console.log('📧 [notificationsAPI] Backend returned message without success field, assuming success');
        return {
          success: true,
          messageId: `api-${Date.now()}`,
          message: responseData.message,
          previewUrl: 'https://ethereal.email/message/api-preview'
        };
      }
      
      return responseData;
    } catch (error) {
      console.error('📧 [notificationsAPI] API error:', error);
      console.error('📧 [notificationsAPI] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        },
        fullError: error
      });
      
      // Enhanced error handling with better error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Bad Request - Invalid data format';
        console.error('📧 [notificationsAPI] 400 Bad Request - Likely data format issue:', errorMessage);
        throw new Error(`Invalid request format: ${errorMessage}`);
      } else if (error.response?.status === 404) {
        console.error('📧 [notificationsAPI] 404 Not Found - Patient may not exist');
        throw new Error('Patient not found or notification endpoint unavailable');
      } else if (error.response?.status === 500) {
        console.error('📧 [notificationsAPI] 500 Internal Server Error - Backend issue');
        throw new Error('Server error occurred while sending notification');
      } else {
        console.error('📧 [notificationsAPI] Unexpected error:', error.message);
        throw error.response?.data || error.message;
      }
    }
  },

  // Send bulk emails to multiple patients
  sendBulkEmail: async (patientIds, subject, message) => {
    console.log('📧 [notificationsAPI] sendBulkEmail called');
    console.log('📧 [notificationsAPI] Bulk email parameters:', {
      patientCount: patientIds.length,
      patientIds: patientIds.map(p => typeof p === 'object' ? p.id : p),
      subject: subject,
      messageLength: message?.length || 0,
      messagePreview: message ? message.substring(0, 100) + (message.length > 100 ? '...' : '') : 'None'
    });
    
    if (MOCK_MODE) {
      console.log('📧 [notificationsAPI] Using MOCK_MODE for sendBulkEmail');
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('📧 [notificationsAPI] Generating mock bulk results...');
          const results = patientIds.map(patientId => {
            const patientObj = typeof patientId === 'object' ? patientId : { id: patientId };
            const success = Math.random() > 0.1; // 90% success rate for demo
            const result = {
              patientId: patientObj.id,
              success: success,
              notificationId: 'notif-' + Date.now() + '-' + patientObj.id,
              messageId: 'msg-' + Date.now() + '-' + patientObj.id,
              error: success ? null : 'Email delivery failed'
            };
            console.log(`📧 [notificationsAPI] Mock result for patient ${patientObj.id}:`, result);
            return result;
          });
          
          const mockResponse = {
            success: true,
            results,
            totalSent: results.filter(r => r.success).length,
            totalFailed: results.filter(r => !r.success).length,
            message: `Bulk email completed: ${results.filter(r => r.success).length}/${patientIds.length} sent successfully`
          };
          
          console.log('📧 [notificationsAPI] Mock bulk response generated:', mockResponse);
          resolve(mockResponse);
        }, 2000);
      });
    }
    
    try {
      console.log('📧 [notificationsAPI] Making API call to /Notifications/send-bulk');
      const requestPayload = {
        PatientIds: patientIds,  // Fixed: Use PascalCase as expected by API
        Subject: subject,         // Fixed: Use PascalCase as expected by API
        Message: message         // Fixed: Use PascalCase as expected by API
      };
      console.log('📧 [notificationsAPI] Request payload:', requestPayload);
      
      const response = await api.post('/Notifications/send-bulk', requestPayload);
      console.log('📧 [notificationsAPI] API response received:', response);
      console.log('📧 [notificationsAPI] Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('📧 [notificationsAPI] Bulk email API error:', error);
      console.error('📧 [notificationsAPI] Bulk email error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        },
        fullError: error
      });
      
      // Enhanced error handling for bulk emails
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Bad Request - Invalid bulk email data format';
        console.error('📧 [notificationsAPI] 400 Bad Request for bulk email:', errorMessage);
        throw new Error(`Invalid bulk email request format: ${errorMessage}`);
      } else if (error.response?.status === 404) {
        console.error('📧 [notificationsAPI] 404 Not Found - Bulk email endpoint unavailable');
        throw new Error('Bulk email endpoint not found');
      } else if (error.response?.status === 500) {
        console.error('📧 [notificationsAPI] 500 Internal Server Error - Backend bulk email issue');
        throw new Error('Server error occurred while sending bulk emails');
      } else {
        console.error('📧 [notificationsAPI] Unexpected bulk email error:', error.message);
        throw error.response?.data || error.message;
      }
    }
  },

  // Get patient's notification history
  getPatientNotifications: async (patientId) => {
    if (MOCK_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 'patient-notif-1',
              type: '24h_reminder',
              status: 'sent',
              sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              emailSubject: 'Appointment Reminder - Tomorrow at 2:00 PM',
              emailContent: 'This is a reminder that you have an appointment scheduled for tomorrow at 2:00 PM.',
              appointmentDate: '2024-01-10',
              appointmentTime: '14:00',
              serviceName: 'General Checkup',
              senderName: 'Hopewell Clinic',
              senderRole: 'admin',
              isRead: false,
              threadId: 'thread-1',
              replies: []
            },
            {
              id: 'patient-notif-2',
              type: 'custom',
              status: 'sent',
              sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              emailSubject: 'Test Results Available',
              emailContent: 'Your test results are now available. Please log in to view them.',
              appointmentDate: null,
              appointmentTime: null,
              serviceName: null,
              senderName: 'Dr. Smith',
              senderRole: 'doctor',
              isRead: false,
              threadId: 'thread-2',
              replies: []
            }
          ]);
        }, 500);
      });
    }
    
    try {
      const response = await api.get(`/Notifications/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get notification replies/thread
  getNotificationReplies: async (notificationId) => {
    try {
      const response = await api.get(`/Notifications/${notificationId}/replies`);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      if (error.response?.status === 404) {
        return [];
      }
      throw error.response?.data || error.message;
    }
  },

  // Reply to a notification
  replyToNotification: async (notificationId, senderId, content, senderRole) => {
    try {
      console.log('💬 [notificationsAPI] replyToNotification called:', {
        notificationId,
        senderId,
        content: content.substring(0, 50) + '...',
        senderRole
      });
      
      const response = await api.post(`/Notifications/${notificationId}/reply`, {
        senderId,
        content,
        senderRole
      });
      
      console.log('💬 [notificationsAPI] Reply sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('💬 [notificationsAPI] Reply error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/Notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, just return success
      if (error.response?.status === 404) {
        return { success: true };
      }
      throw error.response?.data || error.message;
    }
  },

  // Get staff notifications (for doctors)
  getStaffNotifications: async (staffId) => {
    try {
      const response = await api.get(`/Notifications/staff/${staffId}`);
      return response.data;
    } catch (error) {
      // Fallback to patient notifications if staff endpoint doesn't exist
      if (error.response?.status === 404) {
        return [];
      }
      throw error.response?.data || error.message;
    }
  },

  // Get all notifications (for admin)
  getAllNotifications: async () => {
    try {
      const response = await api.get('/Notifications/all');
      return response.data;
    } catch (error) {
      // Fallback to scheduled notifications if all endpoint doesn't exist
      if (error.response?.status === 404) {
        return await notificationsAPI.getScheduled();
      }
      throw error.response?.data || error.message;
    }
  },

  // Send message to patient/doctor
  sendMessage: async (recipientId, recipientRole, subject, content, senderId, senderRole) => {
    try {
      console.log('💬 [notificationsAPI] sendMessage called:', {
        recipientId,
        recipientRole,
        subject,
        content: content.substring(0, 50) + '...',
        senderId,
        senderRole
      });
      
      const response = await api.post('/Notifications/send-message', {
        recipientId,
        recipientRole,
        subject,
        content,
        senderId,
        senderRole
      });
      
      console.log('💬 [notificationsAPI] Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('💬 [notificationsAPI] Send message error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get conversation thread
  getConversationThread: async (threadId) => {
    try {
      const response = await api.get(`/Notifications/thread/${threadId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { messages: [] };
      }
      throw error.response?.data || error.message;
    }
  },

  // Request push notification permission
  requestPushPermission: async (userId, userRole) => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Get subscription
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
          });
          
          // Send subscription to backend
          const response = await api.post('/Notifications/push-subscribe', {
            userId,
            userRole,
            subscription: JSON.stringify(subscription)
          });
          
          return { success: true, subscription: response.data };
        }
        
        return { success: false, permission };
      }
      
      return { success: false, message: 'Notifications not supported' };
    } catch (error) {
      console.error('Error requesting push permission:', error);
      throw error.response?.data || error.message;
    }
  },

  // Toggle auto-reminders globally
  toggleAutoReminders: async (settings) => {
    console.log('🔔 [notificationsAPI] toggleAutoReminders called');
    console.log('🔔 [notificationsAPI] Settings to update:', settings);
    
    if (MOCK_MODE) {
      console.log('🔔 [notificationsAPI] Using MOCK_MODE for toggleAutoReminders');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            settings: {
              reminder24hEnabled: settings.reminder24hEnabled,
              reminder2hEnabled: settings.reminder2hEnabled,
              updatedAt: new Date().toISOString()
            },
            message: 'Auto-reminder settings updated successfully'
          });
        }, 500);
      });
    }
    
    try {
      console.log('🔔 [notificationsAPI] Making API call to /Notifications/settings');
      const response = await api.put('/Notifications/settings', settings);
      console.log('🔔 [notificationsAPI] Settings update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔔 [notificationsAPI] Settings update error:', error);
      console.error('🔔 [notificationsAPI] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        },
        fullError: error
      });
      
      // Enhanced error handling for settings updates
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Bad Request - Invalid settings format';
        console.error('🔔 [notificationsAPI] 400 Bad Request for settings update:', errorMessage);
        throw new Error(`Invalid settings format: ${errorMessage}`);
      } else if (error.response?.status === 404) {
        console.error('🔔 [notificationsAPI] 404 Not Found - Settings endpoint unavailable');
        throw new Error('Settings endpoint not found - please contact administrator');
      } else if (error.response?.status === 500) {
        console.error('🔔 [notificationsAPI] 500 Internal Server Error - Backend settings issue');
        throw new Error('Server error occurred while updating settings');
      } else {
        console.error('🔔 [notificationsAPI] Unexpected settings update error:', error.message);
        throw error.response?.data || error.message;
      }
    }
  },

  // Get current notification settings
  getNotificationSettings: async () => {
    console.log('🔔 [notificationsAPI] getNotificationSettings called');
    
    if (MOCK_MODE) {
      console.log('🔔 [notificationsAPI] Using MOCK_MODE for getNotificationSettings');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            reminder24hEnabled: true,
            reminder2hEnabled: true,
            defaultEmailTemplate: 'standard',
            clinicEmail: 'info@hopewellclinic.com',
            clinicPhone: '(555) 123-4567',
            clinicAddress: '123 Medical Drive, Healthcare City, HC 12345',
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }, 300);
      });
    }
    
    try {
      console.log('🔔 [notificationsAPI] Making API call to /Notifications/settings');
      const response = await api.get('/Notifications/settings');
      console.log('🔔 [notificationsAPI] Settings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔔 [notificationsAPI] Settings retrieval error:', error);
      console.error('🔔 [notificationsAPI] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method
        },
        fullError: error
      });
      
      // Enhanced error handling for settings retrieval
      if (error.response?.status === 404) {
        console.error('🔔 [notificationsAPI] 404 Not Found - Settings endpoint unavailable');
        // Return default settings if endpoint doesn't exist yet
        return {
          reminder24hEnabled: true,
          reminder2hEnabled: true,
          defaultEmailTemplate: 'standard',
          clinicEmail: 'info@hopewellclinic.com',
          clinicPhone: '(555) 123-4567',
          clinicAddress: '123 Medical Drive, Healthcare City, HC 12345',
          updatedAt: new Date().toISOString(),
          _warning: 'Settings endpoint not found - using default values'
        };
      } else if (error.response?.status === 500) {
        console.error('🔔 [notificationsAPI] 500 Internal Server Error - Backend settings issue');
        throw new Error('Server error occurred while retrieving settings');
      } else {
        console.error('🔔 [notificationsAPI] Unexpected settings retrieval error:', error.message);
        throw error.response?.data || error.message;
      }
    }
  },

  // Preview email template
  previewEmail: async (templateType, data) => {
    if (MOCK_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            subject: `Preview: ${templateType} reminder`,
            html: '<p>This is a preview of the email template.</p>',
            text: 'This is a preview of the email template.'
          });
        }, 300);
      });
    }
    
    try {
      const response = await api.post('/Notifications/preview', {
        templateType,
        data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Test email configuration
  testEmailConfiguration: async () => {
    if (MOCK_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Email configuration test successful',
            smtpStatus: 'connected',
            testEmailSent: true
          });
        }, 1000);
      });
    }
    
    try {
      const response = await api.post('/Notifications/test-configuration');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get patient by name (best practice for dynamic patient lookup)
  getPatientByName: async (firstName, lastName) => {
    console.log(`🔍 [notificationsAPI] Looking up patient: ${firstName} ${lastName}`);
    
    try {
      const response = await api.get('/Patients');
      const patients = response.data;
      
      const patient = patients.find(p => 
        p.firstName?.toLowerCase() === firstName.toLowerCase() && 
        p.lastName?.toLowerCase() === lastName.toLowerCase()
      );
      
      if (patient) {
        console.log(`✅ [notificationsAPI] Found patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
        return patient;
      } else {
        console.log(`❌ [notificationsAPI] Patient not found: ${firstName} ${lastName}`);
        return null;
      }
    } catch (error) {
      console.error('🔍 [notificationsAPI] Error fetching patients:', error);
      throw error;
    }
  },

  // Test notification integration with proper format
  testNotificationIntegration: async (patientId = null) => {
    console.log('🧪 [notificationsAPI] Testing notification integration...');
    
    // If no patient ID provided, try to find Vuyo Madikiza dynamically
    if (!patientId) {
      try {
        const vuyoPatient = await notificationsAPI.getPatientByName('Vuyo', 'Madikiza');
        if (vuyoPatient) {
          patientId = vuyoPatient.id;
          console.log('🧪 [notificationsAPI] Using dynamically found Vuyo Madikiza ID:', patientId);
        } else {
          // Fallback to known valid ID
          patientId = "d7434ca1-8e95-4f22-ba4e-870c2088e429";
          console.log('🧪 [notificationsAPI] Using fallback Vuyo Madikiza ID:', patientId);
        }
      } catch (error) {
        // Fallback to known valid ID if dynamic lookup fails
        patientId = "d7434ca1-8e95-4f22-ba4e-870c2088e429";
        console.log('🧪 [notificationsAPI] Dynamic lookup failed, using fallback ID:', patientId);
      }
    } else {
      console.log('🧪 [notificationsAPI] Using provided patient ID:', patientId);
    }
    
    const testData = {
      PatientId: patientId,
      Subject: "Frontend Integration Test",
      Message: "This is a test message from the frontend to verify the notification system is working correctly."
    };

    try {
      console.log('🧪 [notificationsAPI] Test request payload:', testData);
      
      const response = await api.post('/Notifications/send-custom', testData);
      console.log('✅ [notificationsAPI] Test successful:', response.data);
      
      return {
        success: true,
        message: 'Notification integration test passed',
        data: response.data
      };
    } catch (error) {
      console.error('❌ [notificationsAPI] Test failed:', error);
      console.error('❌ [notificationsAPI] Test error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        requestPayload: testData
      });
      
      return {
        success: false,
        message: 'Notification integration test failed',
        error: error.message,
        details: error.response?.data
      };
    }
  },

  // Comprehensive notification system test
  testNotificationSystem: async () => {
    console.log('🧪 [notificationsAPI] Starting comprehensive notification system test...');
    
    const testResults = {
      customEmail: { success: false, error: null },
      settings: { success: false, error: null },
      bulkEmail: { success: false, error: null },
      overall: { success: false, message: '' }
    };

    try {
      // Test 1: Custom Email
      console.log('🧪 [notificationsAPI] Test 1: Custom Email');
      try {
        // Try to find Vuyo Madikiza dynamically
        let testPatientId = null;
        try {
          const vuyoPatient = await notificationsAPI.getPatientByName('Vuyo', 'Madikiza');
          if (vuyoPatient) {
            testPatientId = vuyoPatient.id;
            console.log('🧪 [notificationsAPI] Using dynamically found Vuyo Madikiza for test:', testPatientId);
          }
        } catch (error) {
          console.log('🧪 [notificationsAPI] Dynamic lookup failed, using fallback');
        }
        
        const customResult = await notificationsAPI.testNotificationIntegration(testPatientId);
        testResults.customEmail = customResult;
        console.log('✅ [notificationsAPI] Custom email test:', customResult.success ? 'PASSED' : 'FAILED');
      } catch (error) {
        testResults.customEmail = { success: false, error: error.message };
        console.error('❌ [notificationsAPI] Custom email test failed:', error.message);
      }

      // Test 2: Settings Endpoint
      console.log('🧪 [notificationsAPI] Test 2: Settings Endpoint');
      try {
        const settings = await notificationsAPI.getNotificationSettings();
        testResults.settings = { success: true, data: settings };
        console.log('✅ [notificationsAPI] Settings test: PASSED');
      } catch (error) {
        testResults.settings = { success: false, error: error.message };
        console.error('❌ [notificationsAPI] Settings test failed:', error.message);
      }

      // Test 3: Bulk Email (if patients available)
      console.log('🧪 [notificationsAPI] Test 3: Bulk Email');
      try {
        // Try to find Vuyo Madikiza dynamically for bulk test
        let bulkPatientIds = [];
        try {
          const vuyoPatient = await notificationsAPI.getPatientByName('Vuyo', 'Madikiza');
          if (vuyoPatient) {
            bulkPatientIds = [vuyoPatient.id];
            console.log('🧪 [notificationsAPI] Using dynamically found Vuyo Madikiza for bulk test:', bulkPatientIds);
          }
        } catch (error) {
          console.log('🧪 [notificationsAPI] Dynamic lookup failed for bulk test, using fallback');
          bulkPatientIds = ["d7434ca1-8e95-4f22-ba4e-870c2088e429"]; // Fallback
        }
        
        const bulkResult = await notificationsAPI.sendBulkEmail(
          bulkPatientIds,
          "Bulk Test Email",
          "This is a bulk test message"
        );
        testResults.bulkEmail = { success: true, data: bulkResult };
        console.log('✅ [notificationsAPI] Bulk email test: PASSED');
      } catch (error) {
        testResults.bulkEmail = { success: false, error: error.message };
        console.error('❌ [notificationsAPI] Bulk email test failed:', error.message);
      }

      // Overall assessment
      const passedTests = Object.values(testResults).filter(result => result.success).length;
      const totalTests = Object.keys(testResults).length - 1; // Exclude overall
      
      testResults.overall = {
        success: passedTests === totalTests,
        message: `${passedTests}/${totalTests} tests passed`,
        details: testResults
      };

      console.log('🧪 [notificationsAPI] Comprehensive test completed:', testResults.overall);
      return testResults;

    } catch (error) {
      console.error('💥 [notificationsAPI] Comprehensive test failed:', error);
      testResults.overall = {
        success: false,
        message: 'Comprehensive test failed with exception',
        error: error.message
      };
      return testResults;
    }
  }
};

// Email Settings API
export const emailSettingsAPI = {
  // Get current email settings
  getSettings: async () => {
    console.log('📧 [emailSettingsAPI] Getting email settings...');
    try {
      const response = await api.get('/EmailSettings');
      console.log('📧 [emailSettingsAPI] Settings retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('📧 [emailSettingsAPI] Error getting settings:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update email settings
  updateSettings: async (settings) => {
    console.log('📧 [emailSettingsAPI] Updating email settings:', settings);
    try {
      const response = await api.put('/EmailSettings', settings);
      console.log('📧 [emailSettingsAPI] Settings updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('📧 [emailSettingsAPI] Error updating settings:', error);
      throw error.response?.data || error.message;
    }
  },

  // Test email configuration
  testEmail: async (testEmail) => {
    console.log('📧 [emailSettingsAPI] Testing email configuration with:', testEmail);
    try {
      const response = await api.post('/EmailSettings/test', { testEmail });
      console.log('📧 [emailSettingsAPI] Test email result:', response.data);
      return response.data;
    } catch (error) {
      console.error('📧 [emailSettingsAPI] Error testing email:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get email status
  getStatus: async () => {
    console.log('📧 [emailSettingsAPI] Getting email status...');
    try {
      const response = await api.get('/EmailSettings/status');
      console.log('📧 [emailSettingsAPI] Status retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('📧 [emailSettingsAPI] Error getting status:', error);
      throw error.response?.data || error.message;
    }
  }
};

export default api;
