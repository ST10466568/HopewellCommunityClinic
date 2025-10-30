// Centralized type exports for Hopewell Clinic

// Patient types
export * from './patient';

// Appointment types
export * from './appointment';

// Notification types
export * from './notification';

// Common utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// User authentication types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'patient' | 'doctor' | 'nurse';
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Generic component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Search and filter types
export interface SearchFilters {
  searchTerm?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  category?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Dashboard data types
export interface DashboardStats {
  totalUsers: number;
  totalAppointments: number;
  totalNotifications: number;
  activeUsers: number;
  pendingAppointments: number;
  unreadNotifications: number;
}

// Notification management types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

// API endpoint types
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  requiresAuth: boolean;
  allowedRoles?: string[];
}

// Environment configuration types
export interface AppConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentScheduling: boolean;
    patientPortal: boolean;
    adminDashboard: boolean;
  };
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// Modal and dialog types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Table and list types
export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string | number;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  pagination?: PaginatedResponse<T>['pagination'];
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

// Theme and styling types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Event handler types
export type EventHandler<T = void> = (event: T) => void;
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

// Generic state management types
export interface StateAction<T> {
  type: string;
  payload?: T;
}

export interface StateReducer<T, A extends StateAction<any>> {
  (state: T, action: A): T;
}

// Constants
export const APP_ROLES = ['patient', 'doctor', 'nurse', 'admin'] as const;
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
export const ENVIRONMENTS = ['development', 'staging', 'production'] as const;

// Type guards
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj.success === 'boolean';
}

export function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T> {
  return obj && Array.isArray(obj.data) && obj.pagination;
}

export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.email === 'string' &&
    APP_ROLES.includes(obj.role);
}
