# Types Directory

This directory contains TypeScript type definitions for the Hopewell Clinic application. The types are organized by domain and provide comprehensive type safety throughout the application.

## File Structure

```
src/types/
├── index.ts          # Main export file - imports all types
├── patient.ts        # Patient-related types and interfaces
├── appointment.ts    # Appointment and scheduling types
├── notification.ts   # Notification and email types
└── README.md         # This documentation file
```

## Usage

### Importing Types

```typescript
// Import specific types
import { Patient, PatientAppointment } from '../types/patient';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { Notification, NotificationType } from '../types/notification';

// Import all types from the main index
import { 
  Patient, 
  Appointment, 
  Notification,
  ApiResponse,
  PaginatedResponse 
} from '../types';
```

### Type Guards

Use the provided type guards to ensure runtime type safety:

```typescript
import { isPatient, isAppointment, isNotification } from '../types';

function processUser(user: unknown) {
  if (isPatient(user)) {
    // user is now typed as Patient
    console.log(user.firstName, user.lastName);
  }
}
```

### Constants

Use the exported constants for validation and UI rendering:

```typescript
import { 
  APPOINTMENT_STATUSES, 
  NOTIFICATION_TYPES, 
  APP_ROLES 
} from '../types';

// Validate appointment status
if (APPOINTMENT_STATUSES.includes(status)) {
  // Valid status
}

// Render status options in UI
<Select>
  {APPOINTMENT_STATUSES.map(status => (
    <Option key={status} value={status}>{status}</Option>
  ))}
</Select>
```

## Type Categories

### Patient Types (`patient.ts`)

- **Patient**: Core patient information
- **PatientAppointment**: Patient's appointment data
- **PatientNotification**: Patient's notification history
- **PatientDashboardData**: Dashboard summary data
- **PatientFormData**: Form input data
- **PatientStats**: Statistics and metrics

### Appointment Types (`appointment.ts`)

- **Appointment**: Core appointment information
- **AppointmentSlot**: Available time slots
- **AppointmentRequest**: New appointment request
- **AppointmentConfirmation**: Confirmation details
- **DoctorSchedule**: Doctor's working schedule
- **ScheduleException**: Schedule modifications

### Notification Types (`notification.ts`)

- **Notification**: Core notification data
- **EmailTemplate**: Email template structure
- **EmailSendRequest**: Email sending parameters
- **BulkEmailRequest**: Bulk email parameters
- **EmailSendResult**: Email sending results
- **NotificationSettings**: User notification preferences

### Common Types (`index.ts`)

- **ApiResponse**: Standard API response format
- **PaginatedResponse**: Paginated data response
- **User**: User authentication data
- **AuthUser**: Authenticated user with tokens
- **FormState**: Form state management
- **TableColumn**: Table column configuration
- **ModalProps**: Modal component props

## Best Practices

### 1. Use Type Guards

Always use type guards when dealing with unknown data:

```typescript
// Good
if (isPatient(data)) {
  // Safe to access patient properties
  console.log(data.firstName);
}

// Avoid
console.log(data.firstName); // TypeScript error if data is unknown
```

### 2. Leverage Utility Types

Use the provided utility types for common patterns:

```typescript
// Make all fields optional except ID
type PatientUpdate = Optional<Patient, 'id'>;

// Make specific fields required
type PatientWithEmail = RequiredFields<Patient, 'email'>;

// Partial except for specific fields
type PatientForm = PartialExcept<Patient, 'firstName' | 'lastName'>;
```

### 3. Use Constants for Validation

```typescript
// Good - use constants
if (NOTIFICATION_TYPES.includes(type)) {
  // Valid notification type
}

// Avoid - hardcoded strings
if (type === 'appointment_reminder_24h') {
  // Fragile and error-prone
}
```

### 4. Default Values

Use the provided default objects for form initialization:

```typescript
import { DEFAULT_PATIENT_FORM_DATA } from '../types';

const [formData, setFormData] = useState(DEFAULT_PATIENT_FORM_DATA);
```

## Extending Types

When adding new types:

1. **Add to appropriate domain file** (patient.ts, appointment.ts, etc.)
2. **Export from index.ts** if it's a common type
3. **Add type guards** for runtime validation
4. **Add constants** for enum-like values
5. **Update this README** with documentation

### Example Extension

```typescript
// In patient.ts
export interface PatientInsurance {
  provider: string;
  policyNumber: string;
  coverageType: 'primary' | 'secondary' | 'tertiary';
}

// Add to constants
export const COVERAGE_TYPES = ['primary', 'secondary', 'tertiary'] as const;

// Add type guard
export function isPatientInsurance(obj: any): obj is PatientInsurance {
  return obj &&
    typeof obj.provider === 'string' &&
    typeof obj.policyNumber === 'string' &&
    COVERAGE_TYPES.includes(obj.coverageType);
}
```

## Migration Guide

When updating existing code to use these types:

1. **Replace any types** with specific interfaces
2. **Add type guards** for runtime validation
3. **Use constants** instead of magic strings
4. **Leverage utility types** for common patterns
5. **Update imports** to use centralized types

This type system provides comprehensive type safety, better developer experience, and improved code maintainability throughout the Hopewell Clinic application.
