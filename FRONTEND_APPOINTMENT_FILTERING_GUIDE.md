# Frontend Appointment Filtering Guide

## Overview

This document outlines the checks and validation that the frontend must perform to ensure doctors only see and can only interact with their own appointments.

## Background

Previously, the `GET /api/Appointments` endpoint returned **all appointments** without filtering by doctor. This caused:

- Doctors seeing appointments from other doctors in their dashboard
- Doctors attempting to update appointments that don't belong to them
- Authorization errors (403 Forbidden) when trying to update appointments

## Backend Changes

The backend has been updated to:

1. **Filter appointments by doctor** - When a doctor calls `GET /api/Appointments`, they only receive appointments assigned to them (via `StaffId` or `DoctorId`)

2. **Admin access preserved** - Admins can still see ALL appointments regardless of which doctor they're assigned to

3. **Authorization checks** - The update endpoint validates that doctors can only update appointments assigned to them

## Frontend Checks Required

### 1. Use Doctor-Specific Endpoints (Recommended)

**Preferred Approach**: Use dedicated doctor-specific endpoints instead of the general appointments endpoint.

#### For Upcoming Appointments:

```javascript
// ✅ RECOMMENDED: Use the doctor-specific upcoming appointments endpoint
GET /api/Doctor/{doctorId}/appointments/upcoming?page=1&pageSize=10&search={optional}

// This endpoint:
// - Only returns confirmed, future appointments for the specific doctor
// - Supports pagination
// - Supports search functionality
// - Automatically filters by doctor
```

#### For All Doctor Appointments:

```javascript
// ✅ RECOMMENDED: Use the doctor-specific appointments endpoint
GET /api/Doctor/{doctorId}/appointments

// This endpoint:
// - Returns all appointments for the specific doctor
// - Includes approval status and other doctor-specific details
```

### 2. Verify StaffId Before Fetching Appointments

**IMPORTANT**: Always verify the doctor's `staffId` is available before making appointment requests.

```javascript
// ✅ Check if staffId is available
if (!user.staffId || !doctorStaffId) {
  console.error('StaffId not found. Cannot load appointments.');
  // Option 1: Load staffId from user lookup
  // Option 2: Show error to user
  return;
}

// Use the staffId to fetch appointments
const upcomingAppointments = await fetch(
  `/api/Doctor/${doctorStaffId}/appointments/upcoming?page=1&pageSize=10`
);
```

### 3. Client-Side Filtering (If Using General Endpoint)

**NOTE**: This is now **OPTIONAL** since the backend filters appointments, but it's still a good practice for extra safety.

If you must use `GET /api/Appointments` (general endpoint), apply client-side filtering:

```javascript
// ⚠️ LESS RECOMMENDED: General endpoint with client-side filtering
const allAppointments = await fetch('/api/Appointments');
const appointments = await allAppointments.json();

// ✅ Filter appointments on client-side as well
const doctorAppointments = appointments.filter(apt => {
  const doctorStaffId = user.staffId; // Get from authenticated user
  
  // Check if appointment belongs to this doctor
  const belongsToDoctor = 
    apt.staffId === doctorStaffId || 
    apt.doctorId === doctorStaffId;
  
  // Additional filters for upcoming appointments
  const isConfirmed = apt.status === 'confirmed';
  const isFuture = new Date(`${apt.appointmentDate}T${apt.startTime}`) > new Date();
  
  return belongsToDoctor && isConfirmed && isFuture;
});
```

### 4. Update Appointment Authorization Check

**CRITICAL**: Always check appointment ownership before allowing updates.

```javascript
// ✅ Before updating an appointment, verify ownership
async function updateAppointment(appointmentId, updateData) {
  // 1. Verify appointment belongs to current doctor
  const appointment = await fetch(`/api/Appointments/${appointmentId}/diagnostic`);
  const diagnostic = await appointment.json();
  
  const doctorStaffId = user.staffId;
  const belongsToDoctor = 
    diagnostic.appointment.staffId === doctorStaffId ||
    diagnostic.appointment.doctorId === doctorStaffId;
  
  if (!belongsToDoctor) {
    // ❌ Don't allow update - appointment doesn't belong to doctor
    showError('You can only update appointments assigned to you');
    return;
  }
  
  // 2. Verify appointment is confirmed and in the future
  const appointmentDate = new Date(`${diagnostic.appointment.appointmentDate}T${diagnostic.appointment.startTime}`);
  const isConfirmed = diagnostic.appointment.status === 'confirmed';
  const isFuture = appointmentDate > new Date();
  
  if (!isConfirmed || !isFuture) {
    // ❌ Don't allow update - appointment is not confirmed or in the past
    showError('Only future confirmed appointments can be updated');
    return;
  }
  
  // 3. Proceed with update
  const response = await fetch(`/api/Appointments/${appointmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  
  // 4. Handle errors
  if (response.status === 403) {
    const error = await response.json();
    // Error will include details about why update failed
    showError(error.error);
    if (error.details) {
      console.error('Authorization details:', error.details);
    }
  }
}
```

### 5. Handle 403 Forbidden Errors Gracefully

When a doctor tries to update an appointment that doesn't belong to them:

```javascript
// ✅ Handle 403 errors with helpful messages
try {
  const response = await fetch(`/api/Appointments/${appointmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  
  if (response.status === 403) {
    const error = await response.json();
    
    // Show user-friendly error message
    if (error.error === 'You can only update appointments assigned to you') {
      showError('This appointment belongs to another doctor. You cannot update it.');
      
      // Optional: Log diagnostic details for debugging
      if (error.details) {
        console.warn('Update rejected:', {
          doctorStaffId: error.details.doctorStaffId,
          appointmentStaffId: error.details.appointmentStaffId,
          appointmentDoctorId: error.details.appointmentDoctorId
        });
        
        // Remove the appointment from the UI if it doesn't belong to this doctor
        removeAppointmentFromUI(appointmentId);
      }
    } else {
      showError(error.error);
    }
    
    return;
  }
  
  // Handle other errors...
} catch (error) {
  console.error('Update failed:', error);
  showError('Failed to update appointment. Please try again.');
}
```

### 6. Remove Invalid Appointments from UI

If you detect an appointment doesn't belong to the current doctor, remove it from the UI:

```javascript
// ✅ Clean up invalid appointments
function removeInvalidAppointments(appointments, doctorStaffId) {
  return appointments.filter(apt => {
    const belongsToDoctor = 
      apt.staffId === doctorStaffId || 
      apt.doctorId === doctorStaffId;
    
    if (!belongsToDoctor) {
      console.warn(`Removing invalid appointment ${apt.id} - doesn't belong to doctor`);
      return false;
    }
    
    return true;
  });
}

// Apply this filter when loading appointments
const doctorAppointments = removeInvalidAppointments(
  allAppointments, 
  user.staffId
);
```

### 7. Verify StaffId Consistency

Ensure the `staffId` used in API calls matches the authenticated user:

```javascript
// ✅ Verify staffId consistency
function verifyStaffId(user, appointments) {
  const doctorStaffId = user.staffId;
  
  if (!doctorStaffId) {
    console.error('StaffId not found for doctor');
    return false;
  }
  
  // Verify all appointments belong to this doctor
  const invalidAppointments = appointments.filter(apt => {
    return apt.staffId !== doctorStaffId && apt.doctorId !== doctorStaffId;
  });
  
  if (invalidAppointments.length > 0) {
    console.warn(`Found ${invalidAppointments.length} appointments that don't belong to doctor`);
    console.warn('Invalid appointments:', invalidAppointments);
    return false;
  }
  
  return true;
}
```

## Checklist for Frontend Implementation

- [ ] **Use doctor-specific endpoints** (`/api/Doctor/{doctorId}/appointments/upcoming`) instead of general endpoint
- [ ] **Verify `staffId` is available** before fetching appointments
- [ ] **Filter appointments client-side** (if using general endpoint) as an extra safety measure
- [ ] **Check appointment ownership** before allowing updates
- [ ] **Verify appointment status** (confirmed) and date (future) before update
- [ ] **Handle 403 errors gracefully** with user-friendly messages
- [ ] **Remove invalid appointments** from UI if detected
- [ ] **Log diagnostic details** when authorization fails for debugging
- [ ] **Verify `staffId` consistency** across all appointment operations
- [ ] **Show clear error messages** when doctors try to update appointments that don't belong to them

## API Endpoints Reference

### Recommended Endpoints (Doctor-Specific)

1. **Get Upcoming Appointments**
   ```
   GET /api/Doctor/{doctorId}/appointments/upcoming?page=1&pageSize=10&search={optional}
   ```
   - Returns only confirmed, future appointments for the doctor
   - Supports pagination and search
   - Automatically filtered by doctor

2. **Get All Doctor Appointments**
   ```
   GET /api/Doctor/{doctorId}/appointments
   ```
   - Returns all appointments for the doctor
   - Includes approval status and detailed information

### General Endpoint (Use with Caution)

3. **Get All Appointments**
   ```
   GET /api/Appointments
   ```
   - **For doctors**: Returns only their appointments (backend filters)
   - **For admins**: Returns all appointments
   - Requires JWT authentication
   - **RECOMMENDATION**: Use doctor-specific endpoints instead

### Diagnostic Endpoint

4. **Get Appointment Diagnostic Info**
   ```
   GET /api/Appointments/{appointmentId}/diagnostic
   ```
   - Returns appointment ownership details
   - Useful for debugging authorization issues
   - Shows StaffId, DoctorId, and match status

## Error Handling Examples

### Example 1: Authorization Error

```json
{
  "error": "You can only update appointments assigned to you",
  "details": {
    "doctorStaffId": "42f78af2-c1c5-486c-9de5-0e7e44a8f0da",
    "appointmentStaffId": "550e8400-e29b-41d4-a716-446655441002",
    "appointmentDoctorId": "null",
    "staffIdMatch": false,
    "doctorIdMatch": false
  }
}
```

**Frontend Action**: 
- Show error message to user
- Remove appointment from UI if it doesn't belong to doctor
- Log diagnostic details for debugging

### Example 2: Invalid Status Error

```json
{
  "error": "Only confirmed appointments can be updated"
}
```

**Frontend Action**:
- Show error message
- Disable update button for non-confirmed appointments

### Example 3: Past Appointment Error

```json
{
  "error": "Cannot update past appointments. Only future appointments can be edited."
}
```

**Frontend Action**:
- Show error message
- Disable update button for past appointments

## Testing Checklist

- [ ] Verify doctors only see their own appointments in dashboard
- [ ] Verify doctors cannot update appointments from other doctors
- [ ] Verify error messages are displayed correctly
- [ ] Verify invalid appointments are removed from UI
- [ ] Verify admins can still see all appointments
- [ ] Verify appointment filtering works with StaffId
- [ ] Verify appointment filtering works with DoctorId
- [ ] Verify upcoming appointments endpoint returns correct data
- [ ] Test with appointments that have only StaffId set
- [ ] Test with appointments that have only DoctorId set
- [ ] Test with appointments that have both StaffId and DoctorId set

## Notes

1. **StaffId vs DoctorId**: Appointments can have either `StaffId` or `DoctorId` (or both). The backend checks both fields when determining ownership.

2. **Admin Access**: Admins bypass all doctor-specific filtering and can see/modify all appointments.

3. **Auto-Sync**: If an appointment has `DoctorId` but not `StaffId`, the backend automatically syncs `StaffId = DoctorId` when the appointment is updated.

4. **Diagnostic Endpoint**: Use `/api/Appointments/{id}/diagnostic` to debug ownership issues. This endpoint shows the exact StaffId/DoctorId values and match status.

## Contact

For questions or issues with appointment filtering, refer to:
- Backend API documentation
- Backend team for endpoint questions
- This guide for frontend implementation details

