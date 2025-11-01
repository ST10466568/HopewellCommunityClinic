# Backend Changes Required for Doctor Upcoming Appointments Feature

This document outlines the backend API changes needed to support the updated doctor dashboard where "Appointment History" has been changed to "Upcoming Appointments" showing only future confirmed appointments that can be edited or cancelled.

## Overview

The frontend has been updated to:
1. Display "Upcoming Appointments" instead of "Appointment History"
2. Show only appointments with:
   - `status === 'confirmed'`
   - Appointment date/time is in the future (today's future appointments or later dates)
3. Allow doctors to edit and cancel these upcoming appointments

## Current Frontend Implementation

### Frontend Filtering Logic

The frontend currently filters appointments as follows:

```typescript
// Filter for upcoming appointments only: confirmed status and appointment date >= today
const today = new Date();
today.setHours(0, 0, 0, 0); // Reset to start of day

const upcomingAppointments = appointments.filter(apt => {
  // Must be confirmed status
  if (apt.status !== 'confirmed') return false;
  
  // Check if appointment date is today or in the future
  const appointmentDate = new Date(apt.appointmentDate);
  appointmentDate.setHours(0, 0, 0, 0);
  
  // Also check appointment time if it's today
  if (appointmentDate.getTime() === today.getTime()) {
    // If it's today, check if the appointment time hasn't passed
    const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.startTime}`);
    return appointmentDateTime >= new Date();
  }
  
  // If it's a future date, include it
  return appointmentDate >= today;
});
```

### Frontend Endpoints Used

1. **Get All Appointments** - `GET /api/Appointments` (or doctor-specific endpoint)
   - Currently returns all appointments
   - Frontend filters client-side for upcoming appointments

2. **Update Appointment** - `PUT /api/Appointments/{appointmentId}`
   - Used when doctor edits an upcoming appointment
   - Expected to allow editing of date, time, notes, service

3. **Cancel Appointment** - `PUT /api/Appointments/{appointmentId}/status` or `DELETE /api/Appointments/{appointmentId}`
   - Used when doctor cancels an upcoming appointment
   - Expected to change status to 'cancelled'

## Recommended Backend Changes

### Option 1: Create Dedicated Endpoint for Upcoming Appointments (Recommended)

**New Endpoint**: `GET /api/Appointments/doctor/{staffId}/upcoming`

**Purpose**: Return only upcoming confirmed appointments for a specific doctor

**Request**:
- **Method**: `GET`
- **Path**: `/api/Appointments/doctor/{staffId}/upcoming`
- **Headers**: 
  - `Authorization: Bearer {JWT_TOKEN}`
- **Query Parameters** (optional):
  - `page`: Page number (default: 1)
  - `pageSize`: Items per page (default: 10)
  - `search`: Search term for patient name, email, or service (optional)

**Response**:
```json
{
  "data": [
    {
      "id": "appointment-id",
      "appointmentDate": "2024-12-20",
      "startTime": "14:00:00",
      "endTime": "14:30:00",
      "status": "confirmed",
      "notes": "Follow-up consultation",
      "patient": {
        "id": "patient-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "123-456-7890"
      },
      "service": {
        "id": "service-id",
        "name": "General Consultation",
        "durationMinutes": 30,
        "price": 150.00
      },
      "staffId": "staff-id",
      "createdAt": "2024-12-10T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRecords": 25,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

**Business Logic**:
- Filter appointments where:
  - `staffId` matches the requested doctor
  - `status === 'confirmed'`
  - Appointment date/time is in the future (relative to current server time)
  - Combine `appointmentDate` and `startTime` to check if appointment hasn't passed
- Sort by appointment date/time ascending (earliest first)
- Support search across patient name, email, and service name
- Include pagination support

**Authorization**:
- Doctor can only access their own upcoming appointments
- Admin can access any doctor's upcoming appointments (if needed)

### Option 2: Enhance Existing Endpoint with Query Parameters

**Existing Endpoint**: `GET /api/Appointments` (or doctor-specific endpoint)

**Enhancement**: Add query parameters to filter upcoming appointments

**Request**:
- **Method**: `GET`
- **Path**: `/api/Appointments` or `/api/Appointments/doctor/{staffId}`
- **Query Parameters**:
  - `filter`: `upcoming` (new option)
  - `status`: `confirmed` (can be combined with filter)
  - `page`: Page number (optional)
  - `pageSize`: Items per page (optional)
  - `search`: Search term (optional)

**Example**: `GET /api/Appointments/doctor/{staffId}?filter=upcoming&status=confirmed&page=1&pageSize=10`

**Response**: Same structure as Option 1

## Appointment Update Endpoint Requirements

### Update Appointment - `PUT /api/Appointments/{appointmentId}`

**Current Status**: Should already exist for doctor appointment editing

**Required Validation**:

1. **Authorization Check**:
   - Verify the logged-in doctor (`staffId` from JWT) owns the appointment
   - Or verify the appointment's `staffId` matches the doctor's `staffId`

2. **Appointment Status Check**:
   - Only allow editing if `status === 'confirmed'`
   - Prevent editing of cancelled or completed appointments

3. **Time Validation**:
   - Only allow editing if appointment date/time is in the future
   - Check both date and time: `appointmentDate + startTime >= currentDateTime`

4. **Date/Time Validation**:
   - New appointment date must be in the future
   - If rescheduling to today, new start time must be in the future
   - End time must be after start time

5. **Conflict Checking**:
   - Check for scheduling conflicts with doctor's other appointments
   - Check for conflicts with doctor's shift schedule
   - Return appropriate error if conflict exists

**Request Body**:
```json
{
  "appointmentDate": "2024-12-20",
  "startTime": "14:00:00",
  "endTime": "14:30:00",
  "notes": "Updated appointment notes",
  "serviceId": "service-id-here" (optional)
}
```

**Response**:
```json
{
  "id": "appointment-id",
  "appointmentDate": "2024-12-20",
  "startTime": "14:00:00",
  "endTime": "14:30:00",
  "status": "confirmed",
  "notes": "Updated appointment notes",
  "patient": { ... },
  "service": { ... },
  "staffId": "staff-id",
  "message": "Appointment updated successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid date/time format, validation failed, scheduling conflict
- `403 Forbidden`: Doctor doesn't own this appointment
- `404 Not Found`: Appointment not found
- `409 Conflict`: Scheduling conflict detected

## Appointment Cancellation Endpoint Requirements

### Cancel Appointment - `PUT /api/Appointments/{appointmentId}/status` or `DELETE /api/Appointments/{appointmentId}`

**Current Status**: Should already exist

**Required Validation**:

1. **Authorization Check**:
   - Verify the logged-in doctor owns the appointment

2. **Status Check**:
   - Only allow cancellation if `status === 'confirmed'`
   - Prevent cancelling already cancelled or completed appointments

3. **Time Validation**:
   - Only allow cancellation if appointment date/time is in the future
   - Optional: Allow cancellation of today's appointments even if time has passed

**Request Body** (if using status endpoint):
```json
{
  "status": "cancelled",
  "notes": "Cancelled by doctor - reason here" (optional)
}
```

**Response**:
```json
{
  "id": "appointment-id",
  "status": "cancelled",
  "cancelledAt": "2024-12-15T10:30:00Z",
  "cancelledBy": "doctor-id",
  "message": "Appointment cancelled successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid status transition (e.g., trying to cancel already cancelled appointment)
- `403 Forbidden`: Doctor doesn't own this appointment
- `404 Not Found`: Appointment not found

## Database Considerations

### Indexes Recommended

To optimize query performance for upcoming appointments:

```sql
-- Index on appointments table for efficient filtering
CREATE INDEX IX_Appointments_StaffId_Status_Date 
ON Appointments (StaffId, Status, AppointmentDate, StartTime);

-- Composite index for upcoming appointments query
CREATE INDEX IX_Appointments_Upcoming 
ON Appointments (StaffId, Status, AppointmentDate, StartTime) 
WHERE Status = 'confirmed';
```

### Date/Time Storage

Ensure:
- `AppointmentDate` is stored as `DATE` type
- `StartTime` and `EndTime` are stored as `TIME` type
- Use proper timezone handling (store in UTC or local timezone consistently)

## Error Handling

All endpoints should return consistent error formats:

```json
{
  "error": "Error message here",
  "details": {
    "field": "additional context" (optional)
  },
  "statusCode": 400
}
```

## Testing Checklist

### Upcoming Appointments Endpoint

- [ ] Returns only confirmed appointments
- [ ] Returns only future appointments (date/time in future)
- [ ] Filters out today's appointments that have already passed
- [ ] Returns appointments sorted by date/time (ascending)
- [ ] Supports pagination correctly
- [ ] Supports search functionality
- [ ] Doctor can only see their own appointments
- [ ] Returns empty array if no upcoming appointments
- [ ] Handles timezone correctly

### Update Appointment Endpoint

- [ ] Allows updating upcoming confirmed appointments
- [ ] Prevents updating past appointments
- [ ] Prevents updating cancelled/completed appointments
- [ ] Validates appointment ownership (doctor must own it)
- [ ] Validates date/time (must be in future)
- [ ] Checks for scheduling conflicts
- [ ] Updates all provided fields correctly
- [ ] Returns updated appointment object
- [ ] Handles invalid date/time formats gracefully

### Cancel Appointment Endpoint

- [ ] Allows cancelling upcoming confirmed appointments
- [ ] Prevents cancelling past appointments (optional)
- [ ] Prevents cancelling already cancelled/completed appointments
- [ ] Validates appointment ownership
- [ ] Updates status to 'cancelled'
- [ ] Records cancellation timestamp
- [ ] Records who cancelled it
- [ ] Returns updated appointment object
- [ ] Optionally sends notification to patient

## Performance Considerations

1. **Query Optimization**:
   - Use database indexes for efficient filtering
   - Limit query results with proper pagination
   - Avoid N+1 queries (use joins or eager loading for patient/service data)

2. **Caching** (Optional):
   - Consider caching doctor's upcoming appointments for short duration (e.g., 1-5 minutes)
   - Invalidate cache on appointment creation/update/cancellation

3. **Pagination**:
   - Default page size should be reasonable (10-20 items)
   - Support configurable page size with maximum limit

## Implementation Priority

### HIGH PRIORITY (Required for Feature)
1. **Upcoming Appointments Endpoint** - Allows efficient fetching of upcoming appointments
2. **Update Appointment Validation** - Ensure only future appointments can be edited
3. **Cancel Appointment Validation** - Ensure only future appointments can be cancelled

### MEDIUM PRIORITY (Performance Optimization)
4. **Database Indexes** - Improve query performance
5. **Pagination Support** - Handle large appointment lists
6. **Search Functionality** - Allow filtering by patient name, email, service

### LOW PRIORITY (Nice to Have)
7. **Caching** - Reduce database load for frequently accessed data
8. **Notification on Cancellation** - Automatically notify patient when doctor cancels
9. **Conflict Detection Enhancement** - More sophisticated scheduling conflict detection

## Migration Notes

If implementing Option 1 (new endpoint):

1. **Backward Compatibility**:
   - Existing `GET /api/Appointments` endpoint should continue to work
   - Frontend will gradually migrate to new endpoint
   - Old endpoint can be deprecated later

2. **Deployment**:
   - Deploy new endpoint first
   - Test thoroughly before frontend migration
   - Monitor API usage to ensure migration is complete

## Contact

For questions about frontend implementation, refer to:
- `src/components/DoctorDashboard.tsx` - Doctor dashboard component
- `src/App.tsx` - Appointment loading logic

For backend implementation questions, contact the backend development team.

---

**Note**: The frontend currently filters appointments client-side. Implementing these backend changes will improve performance by:
- Reducing data transfer (server filters before sending)
- Improving response times (database-level filtering is faster)
- Reducing client-side processing
- Better scalability for doctors with many appointments

