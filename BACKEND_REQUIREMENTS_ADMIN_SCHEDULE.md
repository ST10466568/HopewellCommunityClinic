# Backend Requirements for Admin Doctor Schedule Management

This document outlines the backend changes required to support the new admin functionality for managing any doctor's schedule.

## Overview

The frontend now includes admin functionality that allows administrators to:
- View all doctors in the clinic
- Manage any doctor's shift schedule
- Set weekly availability for doctors
- Use quick action buttons for common schedule patterns

## Required Backend Changes

### 1. Enhanced Doctor API Endpoints

#### 1.1 Get All Doctors (Admin Only)
**Endpoint:** `GET /api/Admin/doctors`
**Purpose:** Allow admins to retrieve all doctors for schedule management
**Authentication:** Admin role required
**Response:**
```json
[
  {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string", 
    "email": "string",
    "role": "doctor",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### 1.2 Get Doctor Shift Schedule (Admin Access)
**Endpoint:** `GET /api/Doctor/{doctorId}/shifts`
**Purpose:** Allow admins to view any doctor's current shift schedule
**Authentication:** Admin or Doctor (own schedule) role required
**Response:**
```json
[
  {
    "dayOfWeek": "Monday",
    "startTime": "09:00",
    "endTime": "17:00", 
    "isActive": true
  }
]
```

#### 1.3 Update Doctor Shift Schedule (Admin Access)
**Endpoint:** `PUT /api/Doctor/{doctorId}/shifts`
**Purpose:** Allow admins to update any doctor's shift schedule
**Authentication:** Admin role required
**Request Body:**
```json
[
  {
    "dayOfWeek": "Monday",
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true
  },
  {
    "dayOfWeek": "Tuesday", 
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true
  }
]
```
**Response:** Success confirmation with updated schedule

### 2. Database Schema Changes

#### 2.1 ShiftSchedules Table
Create a new table to store doctor shift schedules:

```sql
CREATE TABLE ShiftSchedules (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    DoctorId UNIQUEIDENTIFIER NOT NULL,
    DayOfWeek NVARCHAR(20) NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_ShiftSchedules_DoctorId 
        FOREIGN KEY (DoctorId) REFERENCES Staff(Id) ON DELETE CASCADE,
    
    CONSTRAINT CK_ShiftSchedules_DayOfWeek 
        CHECK (DayOfWeek IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    
    CONSTRAINT CK_ShiftSchedules_TimeRange 
        CHECK (EndTime > StartTime),
    
    CONSTRAINT UQ_ShiftSchedules_DoctorId_DayOfWeek 
        UNIQUE (DoctorId, DayOfWeek)
);
```

#### 2.2 Indexes for Performance
```sql
-- Index for quick doctor schedule lookups
CREATE INDEX IX_ShiftSchedules_DoctorId ON ShiftSchedules(DoctorId);

-- Index for active schedules only
CREATE INDEX IX_ShiftSchedules_DoctorId_IsActive ON ShiftSchedules(DoctorId, IsActive) 
WHERE IsActive = 1;
```

### 3. Authorization Changes

#### 3.1 Role-Based Access Control
Update authorization logic to allow:
- **Admins:** Full access to all doctor schedules
- **Doctors:** Access only to their own schedule
- **Patients/Nurses:** No access to schedule management

#### 3.2 Permission Checks
Implement permission checks in the following scenarios:
- Admin accessing any doctor's schedule
- Doctor accessing their own schedule
- Preventing unauthorized schedule modifications

### 4. API Controller Updates

#### 4.1 Admin Controller
Add new endpoints to the Admin controller:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    [HttpGet("doctors")]
    public async Task<ActionResult<IEnumerable<DoctorDto>>> GetAllDoctors()
    {
        // Implementation to get all doctors
    }
}
```

#### 4.2 Doctor Controller Updates
Enhance existing Doctor controller with admin access:

```csharp
[HttpGet("{doctorId}/shifts")]
[Authorize(Roles = "Admin,Doctor")]
public async Task<ActionResult<IEnumerable<ShiftScheduleDto>>> GetShiftSchedule(
    Guid doctorId)
{
    // Check if user is admin or accessing own schedule
    // Implementation to get shift schedule
}

[HttpPut("{doctorId}/shifts")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult> UpdateShiftSchedule(
    Guid doctorId, 
    [FromBody] IEnumerable<ShiftScheduleDto> shiftData)
{
    // Implementation to update shift schedule
}
```

### 5. Service Layer Updates

#### 5.1 Doctor Service
Add methods for admin schedule management:

```csharp
public interface IDoctorService
{
    Task<IEnumerable<DoctorDto>> GetAllDoctorsForAdminAsync();
    Task<IEnumerable<ShiftScheduleDto>> GetShiftScheduleAsync(Guid doctorId);
    Task UpdateShiftScheduleAsync(Guid doctorId, IEnumerable<ShiftScheduleDto> shiftData);
}
```

#### 5.2 Admin Service
Create admin-specific service methods:

```csharp
public interface IAdminService
{
    Task<IEnumerable<DoctorDto>> GetAllDoctorsAsync();
    Task<bool> CanManageDoctorScheduleAsync(Guid adminId, Guid doctorId);
}
```

### 6. Data Transfer Objects (DTOs)

#### 6.1 Doctor DTO
```csharp
public class DoctorDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

#### 6.2 Shift Schedule DTO
```csharp
public class ShiftScheduleDto
{
    public string DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsActive { get; set; }
}
```

### 7. Validation and Business Rules

#### 7.1 Schedule Validation
- Ensure start time is before end time
- Validate day of week values
- Check for overlapping schedules (if needed)
- Validate time formats (HH:MM)

#### 7.2 Business Rules
- Default schedule: Monday-Friday 9:00-17:00
- Minimum shift duration: 1 hour
- Maximum shift duration: 12 hours
- Prevent scheduling outside business hours (if applicable)

### 8. Error Handling

#### 8.1 Common Error Responses
- **404 Not Found:** Doctor not found
- **403 Forbidden:** Insufficient permissions
- **400 Bad Request:** Invalid schedule data
- **500 Internal Server Error:** Database or system errors

#### 8.2 Error Response Format
```json
{
  "error": "Doctor not found",
  "details": "The specified doctor ID does not exist",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 9. Testing Requirements

#### 9.1 Unit Tests
- Test schedule validation logic
- Test permission checks
- Test data transformation

#### 9.2 Integration Tests
- Test admin access to doctor schedules
- Test doctor access to own schedule
- Test schedule update operations

#### 9.3 API Tests
- Test all new endpoints
- Test authorization scenarios
- Test error handling

### 10. Migration Strategy

#### 10.1 Database Migration
1. Create ShiftSchedules table
2. Add indexes
3. Migrate existing schedule data (if any)
4. Update foreign key constraints

#### 10.2 API Deployment
1. Deploy new endpoints
2. Update authorization policies
3. Test admin functionality
4. Monitor for errors

### 11. Performance Considerations

#### 11.1 Caching
- Cache doctor lists for admin interface
- Cache active schedules for booking system
- Implement cache invalidation on schedule updates

#### 11.2 Database Optimization
- Use appropriate indexes
- Consider partitioning for large datasets
- Optimize queries for schedule lookups

### 12. Security Considerations

#### 12.1 Input Validation
- Sanitize all input data
- Validate doctor IDs (UUID format)
- Check time format validation

#### 12.2 Audit Logging
- Log all schedule modifications
- Track who made changes and when
- Maintain audit trail for compliance

## Implementation Priority

1. **High Priority:**
   - Database schema changes
   - Basic API endpoints
   - Authorization updates

2. **Medium Priority:**
   - Validation and business rules
   - Error handling
   - Testing

3. **Low Priority:**
   - Performance optimizations
   - Advanced caching
   - Audit logging

## Dependencies

- Existing Staff/Doctor management system
- Authentication and authorization system
- Database migration tools
- API testing framework

## Notes

- The frontend expects specific response formats as shown above
- All time values should be in HH:MM format
- Consider timezone handling for multi-location clinics
- Ensure backward compatibility with existing doctor schedule functionality
