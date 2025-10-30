// Notification-related type definitions

import { Patient, PatientAppointment } from './patient';

export interface Notification {
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

export type NotificationType = 
  | 'appointment_reminder_24h'
  | 'appointment_reminder_2h'
  | 'appointment_confirmation'
  | 'appointment_cancellation'
  | 'custom'
  | 'bulk'
  | 'system_update'
  | 'insurance_reminder'
  | 'prescription_ready'
  | 'test_results';

export type NotificationStatus = 
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface NotificationSettings {
  id: string;
  autoReminder24h: boolean;
  autoReminder2h: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentConfirmations: boolean;
  prescriptionAlerts: boolean;
  testResultAlerts: boolean;
  insuranceReminders: boolean;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSendRequest {
  patientId: string;
  subject: string;
  message: string;
  templateId?: string;
  variables?: Record<string, any>;
}

export interface BulkEmailRequest {
  patientIds: string[];
  subject: string;
  message: string;
  templateId?: string;
  variables?: Record<string, any>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  details?: any;
}

export interface BulkEmailResult {
  success: boolean;
  results: EmailSendResult[];
  totalSent: number;
  totalFailed: number;
  successRate: number;
  message?: string;
}

export interface ScheduledNotification {
  id: string;
  patientId: string;
  patient: Patient;
  type: NotificationType;
  scheduledFor: string;
  emailSubject: string;
  emailContent: string;
  status: NotificationStatus;
  appointmentId?: string;
  appointment?: PatientAppointment;
  createdAt: string;
}

export interface NotificationHistory {
  id: string;
  patientId: string;
  patient: Patient;
  type: NotificationType;
  emailSubject: string;
  emailContent: string;
  status: NotificationStatus;
  sentAt: string;
  appointmentId?: string;
  appointment?: PatientAppointment;
  createdAt: string;
}

export interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  scheduledNotifications: number;
  successRate: number;
  notificationsToday: number;
  notificationsThisWeek: number;
  notificationsThisMonth: number;
}

export interface NotificationSearchFilters {
  patientId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  hasAppointment?: boolean;
}

// Constants
export const NOTIFICATION_TYPES: NotificationType[] = [
  'appointment_reminder_24h',
  'appointment_reminder_2h',
  'appointment_confirmation',
  'appointment_cancellation',
  'custom',
  'bulk',
  'system_update',
  'insurance_reminder',
  'prescription_ready',
  'test_results'
];

export const NOTIFICATION_STATUSES: NotificationStatus[] = [
  'pending',
  'scheduled',
  'sent',
  'delivered',
  'failed',
  'cancelled'
];

// Default values
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  id: '',
  autoReminder24h: true,
  autoReminder2h: true,
  emailNotifications: true,
  smsNotifications: false,
  appointmentConfirmations: true,
  prescriptionAlerts: true,
  testResultAlerts: true,
  insuranceReminders: true,
  updatedAt: new Date().toISOString()
};

// Type guards
export function isNotification(obj: any): obj is Notification {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.patientId === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.emailSubject === 'string' &&
    typeof obj.status === 'string' &&
    NOTIFICATION_TYPES.includes(obj.type) &&
    NOTIFICATION_STATUSES.includes(obj.status);
}

export function isScheduledNotification(obj: any): obj is ScheduledNotification {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.patientId === 'string' &&
    typeof obj.scheduledFor === 'string' &&
    typeof obj.type === 'string' &&
    NOTIFICATION_TYPES.includes(obj.type);
}

export function isNotificationHistory(obj: any): obj is NotificationHistory {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.patientId === 'string' &&
    typeof obj.sentAt === 'string' &&
    typeof obj.type === 'string' &&
    NOTIFICATION_TYPES.includes(obj.type);
}
