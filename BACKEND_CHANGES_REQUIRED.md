# Backend Changes Required for Frontend Improvements

This document outlines the backend API changes needed to support the frontend improvements implemented for the Hopewell Clinic application.

## Overview of Frontend Changes

The frontend has been enhanced with three major features:
1. **Pagination and Search** for doctor appointments
2. **Enhanced Shift Schedule Management** for doctors and admins
3. **Doctor Availability Checking** for booking functionality

## Required Backend API Changes

### 1. Appointment Management API Enhancements

#### 1.1 Enhanced Doctor-Specific Appointment Endpoint

**Current Endpoint:**
```
GET /api/Appointments/doctor/{doctorId}/date/{date}
```

**Required Response Format:**
```json
{
  "appointments": [
    {
      "id": "uuid",
      "appointmentDate": "2025-10-15T00:00:00",
      "startTime": "09:30:00",
      "endTime": "10:30:00",
      "status": "pending|confirmed|cancelled|completed",
      "notes": "string",
      "staffId": "uuid",
      "doctorId": "uuid",
      "patient": {
        "id": "uuid",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string"
      },
      "service": {
        "id": "uuid",
        "name": "string",
        "durationMinutes": 60,
        "price": 150.00
      },
      "staff": {
        "id": "uuid",
        "staffId": "uuid",
        "userId": "uuid",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "role": "doctor"
      }
    }
  ],
  "totalAppointmentsFound": 5,
  "doctorId": "uuid",
  "requestedDate": "2025-10-15"
}
```

**Key Requirements:**
- Return appointments with proper `staffId` and `doctorId` assignments
- Include complete patient and service information
- Ensure `staff` object is properly populated
- Return structured response with metadata

#### 1.2 Public Appointments Endpoint (Fallback)

**New Endpoint:**
```
GET /api/Appointments/all-appointments
```

**Purpose:** Anonymous access endpoint for frontend fallback when doctor-specific endpoint fails

**Response Format:**
```json
[
  {
    "id": "uuid",
    "appointmentDate": "2025-10-15T00:00:00",
    "startTime": "09:30:00",
    "endTime": "10:30:00",
    "status": "pending",
    "staffId": "uuid",
    "doctorId": "uuid",
    "patient": { /* patient object */ },
    "service": { /* service object */ },
    "staff": { /* staff object */ }
  }
]
```

**Security Considerations:**
- No JWT authentication required
- Return only basic appointment information
- Consider rate limiting for this endpoint

### 2. Shift Schedule Management API

#### 2.1 Get Doctor Shift Schedule

**Endpoint:**
```
GET /api/Doctor/{doctorId}/shifts
```

**Response Format:**
```json
[
  {
    "id": "uuid",
    "dayOfWeek": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true,
    "doctorId": "uuid"
  }
]
```

#### 2.2 Update Doctor Shift Schedule

**Endpoint:**
```
PUT /api/Doctor/{doctorId}/shifts
```

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
  // ... for all 7 days
]
```

**Response Format:**
```json
{
  "success": true,
  "message": "Shift schedule updated successfully",
  "updatedShifts": [
    {
      "id": "uuid",
      "dayOfWeek": "Monday",
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true,
      "doctorId": "uuid"
    }
  ]
}
```

#### 2.3 Default Shift Schedule Initialization

**Required Logic:**
- When a new doctor is created, initialize with default schedule:
  - Monday-Friday: 09:00-17:00 (isActive: true)
  - Saturday-Sunday: 09:00-17:00 (isActive: false)

### 3. Doctor Availability Checking API

#### 3.1 Enhanced Doctors on Duty Endpoint

**Endpoint:**
```
GET /api/Booking/doctors-on-duty?date=2025-10-15&serviceId=uuid
```

**Required Logic:**
1. Get all active doctors
2. Check each doctor's shift schedule for the requested date
3. Filter out doctors who are not available on that day of week
4. Return only available doctors with their shift times

**Response Format:**
```json
{
  "doctors": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Smith",
      "email": "doctor@hopewell.com",
      "specialty": "General Practice",
      "rating": 4.8,
      "shiftStart": "09:00",
      "shiftEnd": "17:00",
      "isAvailable": true
    }
  ],
  "requestedDate": "2025-10-15",
  "totalAvailableDoctors": 3
}
```

#### 3.2 Doctor Availability Validation

**Required Validation Logic:**
```csharp
public async Task<bool> IsDoctorAvailable(string doctorId, DateTime date)
{
    var dayOfWeek = date.DayOfWeek.ToString();
    var shift = await GetDoctorShift(doctorId, dayOfWeek);
    
    return shift != null && shift.IsActive;
}
```

### 4. Database Schema Changes

#### 4.1 Shift Schedule Table

**Required Table Structure:**
```sql
CREATE TABLE ShiftSchedules (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    DoctorId UNIQUEIDENTIFIER NOT NULL,
    DayOfWeek NVARCHAR(10) NOT NULL, -- Monday, Tuesday, etc.
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (DoctorId) REFERENCES Staff(Id),
    UNIQUE(DoctorId, DayOfWeek)
);
```

#### 4.2 Appointment Table Updates

**Ensure Proper Foreign Key Relationships:**
```sql
-- Ensure appointments have proper doctor assignment
ALTER TABLE Appointments 
ADD CONSTRAINT FK_Appointments_Staff 
FOREIGN KEY (StaffId) REFERENCES Staff(Id);

-- Ensure appointments have proper doctor assignment
ALTER TABLE Appointments 
ADD CONSTRAINT FK_Appointments_Doctor 
FOREIGN KEY (DoctorId) REFERENCES Staff(Id);
```

### 5. Business Logic Requirements

#### 5.1 Appointment Assignment Logic

**Required Logic:**
- When appointments are created, ensure they are properly assigned to doctors
- Update existing appointments that have `staffId` or `doctorId` as NULL
- Implement data migration script to fix existing unassigned appointments

#### 5.2 Availability Checking Logic

**Required Implementation:**
```csharp
public async Task<List<Doctor>> GetAvailableDoctors(DateTime date, string serviceId = null)
{
    var dayOfWeek = date.DayOfWeek.ToString();
    var doctors = await GetAllActiveDoctors();
    
    var availableDoctors = new List<Doctor>();
    
    foreach (var doctor in doctors)
    {
        var shift = await GetDoctorShift(doctor.Id, dayOfWeek);
        
        if (shift != null && shift.IsActive)
        {
            // Check if doctor has capacity for the requested service
            var hasCapacity = await CheckDoctorCapacity(doctor.Id, date, serviceId);
            
            if (hasCapacity)
            {
                availableDoctors.Add(new Doctor
                {
                    Id = doctor.Id,
                    FirstName = doctor.FirstName,
                    LastName = doctor.LastName,
                    Email = doctor.Email,
                    Specialty = doctor.Specialty,
                    Rating = doctor.Rating,
                    ShiftStart = shift.StartTime,
                    ShiftEnd = shift.EndTime,
                    IsAvailable = true
                });
            }
        }
    }
    
    return availableDoctors;
}
```

### 6. Error Handling Requirements

#### 6.1 Graceful Degradation

**Required Behavior:**
- If shift schedule check fails, include doctor anyway (don't block booking)
- If doctor-specific appointment endpoint fails, fallback to public endpoint
- Log all availability check failures for debugging

#### 6.2 Error Response Format

**Standard Error Response:**
```json
{
  "error": "string",
  "message": "string",
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 7. Performance Considerations

#### 7.1 Caching Requirements

**Recommended Caching:**
- Cache doctor shift schedules (TTL: 1 hour)
- Cache available doctors for each date (TTL: 30 minutes)
- Cache appointment counts for pagination

#### 7.2 Database Indexing

**Required Indexes:**
```sql
-- For shift schedule lookups
CREATE INDEX IX_ShiftSchedules_DoctorId_DayOfWeek 
ON ShiftSchedules(DoctorId, DayOfWeek);

-- For appointment filtering
CREATE INDEX IX_Appointments_StaffId_Date 
ON Appointments(StaffId, AppointmentDate);

CREATE INDEX IX_Appointments_DoctorId_Date 
ON Appointments(DoctorId, AppointmentDate);

-- For availability checking
CREATE INDEX IX_Appointments_Date_Status 
ON Appointments(AppointmentDate, Status);
```

### 8. Testing Requirements

#### 8.1 Unit Tests Required

- Test shift schedule CRUD operations
- Test doctor availability checking logic
- Test appointment filtering by doctor and date
- Test pagination and search functionality

#### 8.2 Integration Tests Required

- Test complete booking flow with availability checking
- Test appointment management with proper doctor assignment
- Test shift schedule updates and their effect on availability

### 9. Migration Scripts

#### 9.1 Data Migration for Existing Appointments

**Required Script:**
```sql
-- Fix appointments with missing doctor assignments
UPDATE Appointments 
SET StaffId = (
    SELECT TOP 1 s.Id 
    FROM Staff s 
    WHERE s.Role = 'doctor' 
    AND s.IsActive = 1
    ORDER BY s.CreatedAt
)
WHERE StaffId IS NULL;

-- Ensure all appointments have proper doctor assignment
UPDATE Appointments 
SET DoctorId = StaffId 
WHERE DoctorId IS NULL AND StaffId IS NOT NULL;
```

#### 9.2 Default Shift Schedule Creation

**Required Script:**
```sql
-- Create default shift schedules for existing doctors
INSERT INTO ShiftSchedules (DoctorId, DayOfWeek, StartTime, EndTime, IsActive)
SELECT 
    s.Id,
    'Monday',
    '09:00',
    '17:00',
    1
FROM Staff s 
WHERE s.Role = 'doctor' 
AND s.IsActive = 1
AND NOT EXISTS (
    SELECT 1 FROM ShiftSchedules ss 
    WHERE ss.DoctorId = s.Id AND ss.DayOfWeek = 'Monday'
);

-- Repeat for all days of the week
-- Set weekends as inactive by default
```

### 10. Security Considerations

#### 10.1 Authentication Requirements

- Doctor-specific endpoints require JWT authentication
- Admin endpoints require admin role verification
- Public endpoints should have rate limiting

#### 10.2 Data Validation

- Validate shift schedule times (start < end)
- Validate appointment date ranges
- Sanitize search input for appointment filtering

## Implementation Priority

1. **High Priority:**
   - Fix appointment assignment logic
   - Implement shift schedule CRUD operations
   - Create doctor availability checking endpoint

2. **Medium Priority:**
   - Add pagination support to appointment endpoints
   - Implement search functionality
   - Add caching for performance

3. **Low Priority:**
   - Add comprehensive logging
   - Implement advanced error handling
   - Add performance monitoring

## Conclusion

These backend changes will enable the frontend improvements to function properly, providing a better user experience for both doctors and patients. The key focus should be on ensuring proper doctor assignment in appointments and implementing robust availability checking based on shift schedules.
