// Patient-related type definitions for Hopewell Clinic

import { AppointmentStatus } from './appointment';
import { NotificationType, NotificationStatus } from './notification';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalHistory?: MedicalHistory;
  insurance?: Insurance;
  role: 'patient';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  surgeries: string[];
  familyHistory: string[];
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  effectiveDate: string;
  expirationDate?: string;
}

export interface PatientAppointment {
  id: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: Doctor;
  serviceId: string;
  service: Service;
  appointmentDate: string;
  appointmentTime: string;
  duration: number; // in minutes
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  licenseNumber: string;
  role: 'doctor';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// AppointmentStatus is defined in appointment.ts

export interface PatientNotification {
  id: string;
  patientId: string;
  patient: Patient;
  type: NotificationType;
  emailSubject: string;
  emailContent: string;
  status: NotificationStatus;
  scheduledFor?: string;
  sentAt?: string;
  appointmentId?: string;
  appointment?: PatientAppointment;
  createdAt: string;
  updatedAt: string;
}

// NotificationType and NotificationStatus are defined in notification.ts

// NotificationSettings is defined in notification.ts

export interface PatientDashboardData {
  patient: Patient;
  upcomingAppointments: PatientAppointment[];
  recentAppointments: PatientAppointment[];
  notifications: PatientNotification[];
  notificationsUnread: number;
  nextAppointment?: PatientAppointment;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

export interface PatientSearchFilters {
  searchTerm?: string;
  status?: 'active' | 'inactive' | 'all';
  dateRange?: {
    start: string;
    end: string;
  };
  hasUpcomingAppointments?: boolean;
  hasUnreadNotifications?: boolean;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: PatientSearchFilters;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Partial<Address>;
  emergencyContact?: Partial<EmergencyContact>;
  medicalHistory?: Partial<MedicalHistory>;
  insurance?: Partial<Insurance>;
}

export interface PatientUpdateData extends Partial<PatientFormData> {
  id: string;
  isActive?: boolean;
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newPatientsThisMonth: number;
  patientsWithUpcomingAppointments: number;
  patientsWithUnreadNotifications: number;
  averageAppointmentsPerPatient: number;
}

// Utility types for form handling
export type PatientFormField = keyof PatientFormData;
export type PatientRequiredField = 'firstName' | 'lastName' | 'email';

// Type guards
export function isPatient(obj: any): obj is Patient {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.email === 'string' &&
    obj.role === 'patient';
}

export function isPatientAppointment(obj: any): obj is PatientAppointment {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.patientId === 'string' &&
    typeof obj.doctorId === 'string' &&
    typeof obj.appointmentDate === 'string' &&
    typeof obj.appointmentTime === 'string';
}

export function isPatientNotification(obj: any): obj is PatientNotification {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.patientId === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.emailSubject === 'string' &&
    typeof obj.status === 'string';
}

// Constants
export const PATIENT_ROLES = ['patient'] as const;

// Default values
export const DEFAULT_PATIENT_FORM_DATA: PatientFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  emergencyContact: {
    name: '',
    relationship: '',
    phone: '',
    email: ''
  },
  medicalHistory: {
    allergies: [],
    medications: [],
    conditions: [],
    surgeries: [],
    familyHistory: []
  },
  insurance: {
    provider: '',
    policyNumber: '',
    groupNumber: '',
    effectiveDate: '',
    expirationDate: ''
  }
};

// DEFAULT_NOTIFICATION_SETTINGS is defined in notification.ts
