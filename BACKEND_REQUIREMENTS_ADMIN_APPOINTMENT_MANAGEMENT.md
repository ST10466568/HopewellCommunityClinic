# Backend Requirements for Admin Appointment Approval/Rejection

## Overview

The frontend has been updated to provide admins with the same appointment management capabilities as doctors, including the ability to approve or reject appointments. This document outlines the backend changes required to support this enhanced admin appointment management functionality.

## Current Frontend Changes Made

### 1. Enhanced AppointmentManagement Component
- **Added Approval/Rejection Props**: `onApproveAppointment` and `onRejectAppointment` optional props
- **Approval Button**: Green checkmark button for pending appointments
- **Rejection Button**: Red X button for pending appointments with reason modal
- **Rejection Modal**: Modal with textarea for rejection reason
- **Conditional Display**: Approval/rejection buttons only show for pending appointments when props are provided

### 2. Updated AdminDashboard Integration
- **AdminDashboardWrapper**: Added `handleApproveAppointment` and `handleRejectAppointment` functions
- **Props Passing**: AdminDashboard now passes approval/rejection functions to AppointmentManagement
- **Consistent Interface**: Same approval/rejection functionality as doctor dashboard

### 3. API Integration
- **Approval**: Uses `appointmentsAPI.updateStatus(appointmentId, 'confirmed')`
- **Rejection**: Uses `appointmentsAPI.updateStatus(appointmentId, 'cancelled')` + `appointmentsAPI.update(appointmentId, { notes: 'Rejected by admin: {reason}' })`

## Required Backend Changes

### 1. Appointment Status Management Endpoints

#### PUT /api/Appointments/{id}/status
**Purpose**: Update appointment status (approve/reject)
**Authentication**: Admin or Doctor role required
**Request Body**:
```json
{
  "status": "confirmed|cancelled|pending"
}
```
**Response**:
```json
{
  "id": "uuid",
  "status": "confirmed|cancelled|pending",
  "updatedAt": "datetime",
  "message": "Appointment status updated successfully"
}
```

#### PUT /api/Appointments/{id}
**Purpose**: Update appointment details (including notes with rejection reason)
**Authentication**: Admin or Doctor role required
**Request Body**:
```json
{
  "notes": "string",
  "appointmentDate": "date",
  "startTime": "time",
  "endTime": "time",
  "staffId": "uuid",
  "serviceId": "uuid"
}
```

### 2. Authorization Requirements

#### Admin Access to All Appointments
- **GET /api/Appointments**: Admins should be able to view ALL appointments (not just their own)
- **PUT /api/Appointments/{id}**: Admins should be able to modify ANY appointment
- **PUT /api/Appointments/{id}/status**: Admins should be able to change status of ANY appointment

#### Role-Based Permissions
```csharp
[Authorize(Roles = "Admin,Doctor")]
public async Task<IActionResult> UpdateAppointmentStatus(string id, [FromBody] UpdateStatusRequest request)
{
    // Admin can update any appointment
    // Doctor can only update their own appointments
    if (User.IsInRole("Admin") || IsAppointmentAssignedToDoctor(id, GetCurrentUserId()))
    {
        // Update logic
    }
    else
    {
        return Forbid();
    }
}
```

### 3. Database Schema Updates

#### Appointments Table
Ensure the Appointments table supports status updates and audit logging:
```sql
CREATE TABLE Appointments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER NOT NULL REFERENCES Patients(Id),
    StaffId UNIQUEIDENTIFIER REFERENCES Staff(Id), -- Can be NULL for unassigned
    ServiceId UNIQUEIDENTIFIER NOT NULL REFERENCES Services(Id),
    AppointmentDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Status NVARCHAR(50) NOT NULL CHECK (Status IN ('pending', 'confirmed', 'cancelled', 'completed', 'walkin')),
    Notes NVARCHAR(1000),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy UNIQUEIDENTIFIER REFERENCES Users(Id),
    UpdatedBy UNIQUEIDENTIFIER REFERENCES Users(Id)
);
```

#### Audit Logging Table (Optional but Recommended)
```sql
CREATE TABLE AppointmentAuditLog (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AppointmentId UNIQUEIDENTIFIER NOT NULL REFERENCES Appointments(Id),
    Action NVARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'cancelled'
    OldStatus NVARCHAR(50),
    NewStatus NVARCHAR(50),
    Reason NVARCHAR(500), -- For rejections
    PerformedBy UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    PerformedAt DATETIME2 DEFAULT GETUTCDATE(),
    Details NVARCHAR(1000) -- Additional context
);
```

### 4. Business Logic Requirements

#### Status Transition Rules
```csharp
public class AppointmentStatusValidator
{
    public static bool IsValidTransition(string currentStatus, string newStatus, string userRole)
    {
        var validTransitions = new Dictionary<string, string[]>
        {
            ["pending"] = new[] { "confirmed", "cancelled" },
            ["confirmed"] = new[] { "cancelled", "completed" },
            ["cancelled"] = new[] { "pending" }, // Allow rescheduling
            ["completed"] = new[] { } // No transitions from completed
        };

        return validTransitions.ContainsKey(currentStatus) && 
               validTransitions[currentStatus].Contains(newStatus);
    }
}
```

#### Notification Requirements
When appointment status changes:
1. **Email Notification**: Send email to patient
2. **SMS Notification**: Optional SMS for urgent changes
3. **Audit Trail**: Log the change with reason and user

### 5. API Response Consistency

#### Standard Appointment Response
All appointment endpoints should return consistent format:
```json
{
  "id": "uuid",
  "patient": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  },
  "staff": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "role": "doctor|nurse"
  },
  "service": {
    "id": "uuid",
    "name": "string",
    "durationMinutes": "number"
  },
  "appointmentDate": "date",
  "startTime": "time",
  "endTime": "time",
  "status": "pending|confirmed|cancelled|completed|walkin",
  "notes": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### 6. Error Handling

#### Standard Error Responses
```json
{
  "error": "string",
  "message": "string",
  "details": "object",
  "timestamp": "datetime"
}
```

#### Common Error Scenarios
- **Appointment Not Found**: 404 with appropriate message
- **Invalid Status Transition**: 400 with validation details
- **Permission Denied**: 403 with explanation
- **Concurrent Modification**: 409 with conflict details

### 7. Performance Considerations

#### Database Indexes
```sql
-- Index for status-based queries
CREATE INDEX IX_Appointments_Status ON Appointments(Status);

-- Index for date-based queries
CREATE INDEX IX_Appointments_AppointmentDate ON Appointments(AppointmentDate);

-- Composite index for admin queries
CREATE INDEX IX_Appointments_Status_AppointmentDate ON Appointments(Status, AppointmentDate);

-- Index for staff-specific queries
CREATE INDEX IX_Appointments_StaffId ON Appointments(StaffId);
```

#### Caching Strategy
- **Appointment Lists**: Cache for 5 minutes
- **Status Updates**: Invalidate cache immediately
- **Patient/Staff Data**: Cache for 15 minutes

### 8. Security Considerations

#### Input Validation
```csharp
public class UpdateStatusRequest
{
    [Required]
    [RegularExpression("^(pending|confirmed|cancelled|completed|walkin)$", 
        ErrorMessage = "Invalid status")]
    public string Status { get; set; }
    
    [MaxLength(500)]
    public string Reason { get; set; }
}
```

#### Authorization Checks
- **Admin Override**: Admins can modify any appointment
- **Doctor Restrictions**: Doctors can only modify their assigned appointments
- **Audit Logging**: Log all status changes with user information

### 9. Testing Requirements

#### Unit Tests
- Status transition validation
- Permission checks
- Input validation
- Error handling

#### Integration Tests
- API endpoint functionality
- Database operations
- Authentication/authorization

#### End-to-End Tests
- Complete approval workflow
- Rejection with reason
- Admin vs Doctor permissions
- Error scenarios

## Implementation Priority

### High Priority (Required for Frontend)
1. **PUT /api/Appointments/{id}/status** - Status update endpoint
2. **PUT /api/Appointments/{id}** - Notes update for rejection reasons
3. **Admin Authorization** - Allow admins to modify any appointment

### Medium Priority (Enhanced Features)
1. **Audit Logging** - Track all status changes
2. **Email Notifications** - Notify patients of status changes
3. **Enhanced Error Handling** - Better user experience

### Low Priority (Optimization)
1. **Database Indexes** - Performance optimization
2. **Caching Strategy** - Reduce database load
3. **Advanced Notifications** - SMS, push notifications

## Migration Strategy

### Phase 1: Core Functionality
1. Implement status update endpoints
2. Add admin authorization
3. Test basic approval/rejection workflow

### Phase 2: Enhanced Features
1. Add audit logging
2. Implement email notifications
3. Add comprehensive error handling

### Phase 3: Optimization
1. Add database indexes
2. Implement caching
3. Performance tuning

## API Endpoints Summary

### Required Endpoints
```
PUT /api/Appointments/{id}/status
PUT /api/Appointments/{id}
GET /api/Appointments (admin access to all)
```

### Optional Endpoints
```
GET /api/Appointments/{id}/audit-log
POST /api/Appointments/{id}/notify
GET /api/Appointments/stats (for admin dashboard)
```

---

**Note**: This document should be reviewed and updated as the backend implementation progresses. The frontend is ready to work with these endpoints and will gracefully handle any missing functionality.

**Current Status**: Frontend implementation complete and tested. Ready for backend integration.
