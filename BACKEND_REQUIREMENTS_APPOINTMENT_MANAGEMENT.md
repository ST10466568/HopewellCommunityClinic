# Backend Requirements for Admin Appointment Management

## Overview

This document outlines the backend changes required to support the new admin appointment management features implemented in the frontend.

## New Features Implemented

### 1. Admin Appointment Editing
- **Feature**: Admins can edit existing appointments
- **Business Rules**: Same validation as appointment creation
- **Fields Editable**: Date, time, doctor, service, status, notes

### 2. Admin Appointment Deletion
- **Feature**: Admins can delete appointments
- **Safety**: Confirmation dialog before deletion
- **Audit**: Should log deletion events

### 3. Search and Pagination
- **Feature**: Search appointments by patient name, email, service, or doctor
- **Feature**: Filter by appointment status
- **Feature**: Pagination (10 items per page)

### 4. Business Rules Validation
- **Date Validation**: Cannot book appointments in the past or more than 30 days in advance
- **Time Validation**: End time must be after start time
- **Doctor Availability**: Must check doctor's shift schedule
- **Service Validation**: Service must exist and be active

## Required Backend Endpoints

### 1. Update Appointment (PUT)
```
PUT /api/Appointments/{id}
Headers: Authorization: Bearer <admin_jwt_token>
Body: {
  "appointmentDate": "2025-10-15",
  "startTime": "09:00",
  "endTime": "10:00",
  "status": "confirmed",
  "staffId": "doctor-guid",
  "serviceId": "service-guid",
  "notes": "Updated notes"
}
Response: 200 OK
{
  "id": "appointment-guid",
  "message": "Appointment updated successfully"
}
```

### 2. Delete Appointment (DELETE)
```
DELETE /api/Appointments/{id}
Headers: Authorization: Bearer <admin_jwt_token>
Response: 200 OK
{
  "message": "Appointment deleted successfully"
}
```

### 3. Get All Appointments with Search/Pagination (GET)
```
GET /api/Appointments?search={term}&status={status}&page={page}&limit={limit}
Headers: Authorization: Bearer <admin_jwt_token>
Response: 200 OK
{
  "appointments": [...],
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 15,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## Business Rules Implementation

### 1. Date Validation
```csharp
public bool ValidateAppointmentDate(DateTime appointmentDate)
{
    var today = DateTime.Today;
    var maxDate = today.AddDays(30);
    
    return appointmentDate >= today && appointmentDate <= maxDate;
}
```

### 2. Time Validation
```csharp
public bool ValidateAppointmentTime(TimeSpan startTime, TimeSpan endTime)
{
    return endTime > startTime;
}
```

### 3. Doctor Availability Check
```csharp
public async Task<bool> IsDoctorAvailable(string doctorId, DateTime appointmentDate, TimeSpan startTime, TimeSpan endTime)
{
    // Check doctor's shift schedule
    var shiftSchedule = await _shiftService.GetDoctorShifts(doctorId);
    var dayOfWeek = appointmentDate.DayOfWeek.ToString();
    
    var daySchedule = shiftSchedule.FirstOrDefault(s => s.DayOfWeek == dayOfWeek && s.IsActive);
    if (daySchedule == null) return false;
    
    // Check if appointment time falls within doctor's working hours
    return startTime >= daySchedule.StartTime && endTime <= daySchedule.EndTime;
}
```

### 4. Conflict Detection
```csharp
public async Task<bool> HasAppointmentConflict(string doctorId, DateTime appointmentDate, TimeSpan startTime, TimeSpan endTime, string? excludeAppointmentId = null)
{
    var existingAppointments = await _appointmentRepository.GetByDoctorAndDate(doctorId, appointmentDate);
    
    return existingAppointments.Any(apt => 
        apt.Id != excludeAppointmentId && // Exclude current appointment when updating
        !(endTime <= apt.StartTime || startTime >= apt.EndTime) // Check for overlap
    );
}
```

## Database Schema Requirements

### 1. Appointments Table
Ensure the following fields exist:
```sql
CREATE TABLE Appointments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AppointmentDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    Notes NVARCHAR(MAX),
    PatientId UNIQUEIDENTIFIER NOT NULL,
    StaffId UNIQUEIDENTIFIER,
    ServiceId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Appointments_PatientId FOREIGN KEY (PatientId) REFERENCES Patients(Id),
    CONSTRAINT FK_Appointments_StaffId FOREIGN KEY (StaffId) REFERENCES Staff(Id),
    CONSTRAINT FK_Appointments_ServiceId FOREIGN KEY (ServiceId) REFERENCES Services(Id),
    CONSTRAINT CK_Appointments_Status CHECK (Status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    CONSTRAINT CK_Appointments_Time CHECK (EndTime > StartTime)
);
```

### 2. Audit Log Table (Optional but Recommended)
```sql
CREATE TABLE AppointmentAuditLog (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AppointmentId UNIQUEIDENTIFIER NOT NULL,
    Action NVARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
    ChangedBy UNIQUEIDENTIFIER NOT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    OldValues NVARCHAR(MAX), -- JSON of old values
    NewValues NVARCHAR(MAX), -- JSON of new values
    
    CONSTRAINT FK_AppointmentAuditLog_AppointmentId FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id),
    CONSTRAINT FK_AppointmentAuditLog_ChangedBy FOREIGN KEY (ChangedBy) REFERENCES Staff(Id)
);
```

## Controller Implementation

### 1. AppointmentController Updates
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Doctor")]
public class AppointmentsController : ControllerBase
{
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAppointment(string id, UpdateAppointmentRequest request)
    {
        try
        {
            // Validate appointment exists
            var existingAppointment = await _appointmentService.GetById(id);
            if (existingAppointment == null)
            {
                return NotFound(new { error = "Appointment not found" });
            }

            // Validate business rules
            var validationResult = await _appointmentService.ValidateAppointmentUpdate(id, request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { errors = validationResult.Errors });
            }

            // Update appointment
            var updatedAppointment = await _appointmentService.UpdateAppointment(id, request);
            
            // Log audit trail
            await _auditService.LogAppointmentChange(id, "updated", User.Identity.Name, existingAppointment, updatedAppointment);

            return Ok(new { 
                id = updatedAppointment.Id,
                message = "Appointment updated successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating appointment {AppointmentId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAppointment(string id)
    {
        try
        {
            // Validate appointment exists
            var existingAppointment = await _appointmentService.GetById(id);
            if (existingAppointment == null)
            {
                return NotFound(new { error = "Appointment not found" });
            }

            // Delete appointment
            await _appointmentService.DeleteAppointment(id);
            
            // Log audit trail
            await _auditService.LogAppointmentChange(id, "deleted", User.Identity.Name, existingAppointment, null);

            return Ok(new { message = "Appointment deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting appointment {AppointmentId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        try
        {
            var result = await _appointmentService.GetAppointmentsWithPagination(search, status, page, limit);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting appointments");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
```

## Service Layer Implementation

### 1. AppointmentService Updates
```csharp
public class AppointmentService
{
    public async Task<ValidationResult> ValidateAppointmentUpdate(string appointmentId, UpdateAppointmentRequest request)
    {
        var errors = new List<string>();

        // Date validation
        if (!ValidateAppointmentDate(request.AppointmentDate))
        {
            errors.Add("Cannot book appointments in the past or more than 30 days in advance");
        }

        // Time validation
        if (!ValidateAppointmentTime(request.StartTime, request.EndTime))
        {
            errors.Add("End time must be after start time");
        }

        // Doctor availability
        if (!await IsDoctorAvailable(request.StaffId, request.AppointmentDate, request.StartTime, request.EndTime))
        {
            errors.Add("Doctor is not available at the selected time");
        }

        // Conflict detection
        if (await HasAppointmentConflict(request.StaffId, request.AppointmentDate, request.StartTime, request.EndTime, appointmentId))
        {
            errors.Add("Doctor has a conflicting appointment at this time");
        }

        // Service validation
        var service = await _serviceRepository.GetById(request.ServiceId);
        if (service == null || !service.IsActive)
        {
            errors.Add("Selected service is not available");
        }

        return new ValidationResult { IsValid = errors.Count == 0, Errors = errors };
    }

    public async Task<PagedResult<Appointment>> GetAppointmentsWithPagination(string? search, string? status, int page, int limit)
    {
        var query = _appointmentRepository.GetQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(a => 
                a.Patient.FirstName.Contains(search) ||
                a.Patient.LastName.Contains(search) ||
                a.Patient.Email.Contains(search) ||
                a.Service.Name.Contains(search) ||
                (a.Staff != null && (a.Staff.FirstName.Contains(search) || a.Staff.LastName.Contains(search)))
            );
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            query = query.Where(a => a.Status == status);
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply pagination
        var appointments = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .Include(a => a.Patient)
            .Include(a => a.Staff)
            .Include(a => a.Service)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenBy(a => a.StartTime)
            .ToListAsync();

        return new PagedResult<Appointment>
        {
            Items = appointments,
            TotalCount = totalCount,
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling((double)totalCount / limit),
            HasNextPage = page < (int)Math.Ceiling((double)totalCount / limit),
            HasPreviousPage = page > 1
        };
    }
}
```

## Error Handling

### 1. Validation Errors
- Return 400 Bad Request with specific validation messages
- Include field-specific error messages for frontend display

### 2. Authorization Errors
- Return 401 Unauthorized for missing/invalid tokens
- Return 403 Forbidden for insufficient permissions

### 3. Not Found Errors
- Return 404 Not Found for non-existent appointments

### 4. Conflict Errors
- Return 409 Conflict for appointment time conflicts
- Include details about conflicting appointments

## Testing Requirements

### 1. Unit Tests
- Test all validation methods
- Test pagination logic
- Test search functionality
- Test conflict detection

### 2. Integration Tests
- Test complete appointment update flow
- Test appointment deletion
- Test search and pagination endpoints
- Test authorization requirements

### 3. End-to-End Tests
- Test admin editing appointments
- Test admin deleting appointments
- Test search functionality
- Test pagination navigation

## Security Considerations

### 1. Authorization
- Only admins can edit/delete appointments
- Doctors can only edit their own appointments
- Patients cannot edit appointments

### 2. Input Validation
- Sanitize all input data
- Validate all date/time formats
- Prevent SQL injection attacks

### 3. Audit Trail
- Log all appointment changes
- Track who made changes
- Store old and new values

## Performance Considerations

### 1. Database Indexing
```sql
-- Index for search functionality
CREATE INDEX IX_Appointments_Search ON Appointments (PatientId, StaffId, ServiceId);

-- Index for date-based queries
CREATE INDEX IX_Appointments_Date ON Appointments (AppointmentDate, StartTime);

-- Index for status filtering
CREATE INDEX IX_Appointments_Status ON Appointments (Status);
```

### 2. Caching
- Cache doctor availability data
- Cache service information
- Use Redis for session data

### 3. Pagination
- Implement efficient pagination with proper indexing
- Limit maximum page size to prevent performance issues

## Migration Scripts

### 1. Add Audit Log Table
```sql
-- Create audit log table
CREATE TABLE AppointmentAuditLog (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AppointmentId UNIQUEIDENTIFIER NOT NULL,
    Action NVARCHAR(20) NOT NULL,
    ChangedBy UNIQUEIDENTIFIER NOT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    OldValues NVARCHAR(MAX),
    NewValues NVARCHAR(MAX),
    
    CONSTRAINT FK_AppointmentAuditLog_AppointmentId FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id),
    CONSTRAINT FK_AppointmentAuditLog_ChangedBy FOREIGN KEY (ChangedBy) REFERENCES Staff(Id)
);
```

### 2. Add Indexes
```sql
-- Add performance indexes
CREATE INDEX IX_Appointments_Search ON Appointments (PatientId, StaffId, ServiceId);
CREATE INDEX IX_Appointments_Date ON Appointments (AppointmentDate, StartTime);
CREATE INDEX IX_Appointments_Status ON Appointments (Status);
```

## Summary

The backend needs to implement:

1. **PUT /api/Appointments/{id}** - Update appointment with validation
2. **DELETE /api/Appointments/{id}** - Delete appointment with audit logging
3. **GET /api/Appointments** - Get appointments with search/pagination
4. **Business Rules Validation** - Same as appointment creation
5. **Audit Logging** - Track all changes
6. **Database Indexes** - For performance optimization

The frontend is ready and will work immediately once these backend endpoints are implemented.
