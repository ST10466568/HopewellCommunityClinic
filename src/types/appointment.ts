// Appointment-related type definitions

import { Patient, Doctor, Service } from './patient';

export interface Appointment {
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

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'rescheduled';

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  isBooked: boolean;
  appointmentId?: string;
}

export interface AppointmentRequest {
  patientId: string;
  doctorId: string;
  serviceId: string;
  preferredDate: string;
  preferredTime?: string;
  notes?: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface AppointmentConfirmation {
  appointmentId: string;
  confirmationCode: string;
  confirmationMethod: 'email' | 'sms' | 'phone';
  confirmedAt: string;
}

export interface AppointmentReschedule {
  appointmentId: string;
  newDate: string;
  newTime: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
}

export interface AppointmentSearchFilters {
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface AppointmentStats {
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageDuration: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctor: Doctor;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleException {
  id: string;
  doctorId: string;
  date: string;
  type: 'unavailable' | 'modified_hours' | 'emergency';
  startTime?: string;
  endTime?: string;
  reason: string;
  createdAt: string;
}

// Constants
export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'in-progress',
  'completed',
  'cancelled',
  'no-show',
  'rescheduled'
];

export const URGENCY_LEVELS = ['low', 'medium', 'high'] as const;
export const CONFIRMATION_METHODS = ['email', 'sms', 'phone'] as const;

// Type guards
export function isAppointment(obj: any): obj is Appointment {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.patientId === 'string' &&
    typeof obj.doctorId === 'string' &&
    typeof obj.appointmentDate === 'string' &&
    typeof obj.appointmentTime === 'string' &&
    APPOINTMENT_STATUSES.includes(obj.status);
}

export function isAppointmentSlot(obj: any): obj is AppointmentSlot {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.doctorId === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.startTime === 'string' &&
    typeof obj.endTime === 'string' &&
    typeof obj.isAvailable === 'boolean';
}
