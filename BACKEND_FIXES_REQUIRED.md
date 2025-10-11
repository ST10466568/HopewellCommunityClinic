# Backend Requirements for Admin Doctor Schedule Management

## Test Results Summary

**Date:** $(date)  
**Frontend Version:** Updated to match backend API specification  
**Test Status:** ❌ FAILED - Backend endpoints returning 500 errors  

## Current Issues Identified

### 1. Authentication Issues
- **Problem:** Both GET and PUT endpoints return 500 Internal Server Error
- **Expected:** Should return 401 Unauthorized if authentication fails
- **Current Behavior:** Server error instead of proper authentication handling

### 2. Endpoint Status
| Endpoint | Status | Error Code | Expected Behavior |
|----------|--------|------------|-------------------|
| `GET /api/Doctor/{doctorId}/shifts` | ❌ FAILED | 500 | Should return array of shift objects |
| `PUT /api/Doctor/{doctorId}/shifts` | ❌ FAILED | 500 | Should return success message |
| `GET /api/DoctorSchedule/{doctorId}/shifts` | ✅ WORKING | 200 | Public endpoint works correctly |

## Required Backend Fixes

### 1. Fix Authentication Handling
**Current Issue:** 500 Internal Server Error instead of proper authentication responses

**Required Fix:**
```csharp
// In DoctorController.cs - Add proper authentication handling
[HttpGet("{doctorId}/shifts")]
[Authorize(Roles = "Admin,Doctor")] // Ensure this is properly configured
public async Task<IActionResult> GetDoctorShifts(string doctorId)
{
    try 
    {
        // Add proper authentication check
        var currentUser = User.Identity.Name;
        var userRoles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value);
        
        // Validate doctorId format
        if (!Guid.TryParse(doctorId, out var doctorGuid))
        {
            return BadRequest(new { error = "Invalid doctor ID format" });
        }
        
        // Your existing logic here...
        var shifts = await _shiftService.GetDoctorShifts(doctorGuid);
        return Ok(shifts);
    }
    catch (UnauthorizedAccessException)
    {
        return Unauthorized(new { error = "Authentication required" });
    }
    catch (Exception ex)
    {
        // Log the actual error
        _logger.LogError(ex, "Error getting doctor shifts for {DoctorId}", doctorId);
        return StatusCode(500, new { error = "Internal server error" });
    }
}
```

### 2. Fix Request Body Validation
**Current Issue:** PUT endpoint not accepting the correct request format

**Required Fix:**
```csharp
// Create proper DTO for the request
public class UpdateDoctorShiftsRequest
{
    public List<ShiftScheduleDto> Shifts { get; set; }
}

public class ShiftScheduleDto
{
    public string DayOfWeek { get; set; }
    public string StartTime { get; set; }
    public string EndTime { get; set; }
    public bool IsActive { get; set; }
}

[HttpPut("{doctorId}/shifts")]
[Authorize(Roles = "Admin,Doctor")]
public async Task<IActionResult> UpdateDoctorShifts(string doctorId, UpdateDoctorShiftsRequest request)
{
    try
    {
        // Validate doctorId
        if (!Guid.TryParse(doctorId, out var doctorGuid))
        {
            return BadRequest(new { error = "Invalid doctor ID format" });
        }
        
        // Validate request
        if (request?.Shifts == null || !request.Shifts.Any())
        {
            return BadRequest(new { error = "Shifts data is required" });
        }
        
        // Validate each shift
        foreach (var shift in request.Shifts)
        {
            if (string.IsNullOrEmpty(shift.DayOfWeek) || 
                string.IsNullOrEmpty(shift.StartTime) || 
                string.IsNullOrEmpty(shift.EndTime))
            {
                return BadRequest(new { error = "All shift fields are required" });
            }
        }
        
        // Your existing update logic here...
        await _shiftService.UpdateDoctorShifts(doctorGuid, request.Shifts);
        
        return Ok(new { message = "Doctor shifts updated successfully" });
    }
    catch (UnauthorizedAccessException)
    {
        return Unauthorized(new { error = "Authentication required" });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating doctor shifts for {DoctorId}", doctorId);
        return StatusCode(500, new { error = "Internal server error" });
    }
}
```

### 3. Database Schema Validation
**Verify the following database structure exists:**

```sql
-- Ensure ShiftSchedules table exists with correct structure
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
        CHECK (DayOfWeek IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
);
```

### 4. Role-Based Access Control
**Ensure admin users have proper roles:**

```csharp
// Verify admin role assignment
// Check that admin users have "Admin" role in the database
// Ensure JWT tokens include the correct role claims
```

## Expected API Behavior

### GET Request
```
GET /api/Doctor/{doctorId}/shifts
Headers: Authorization: Bearer <admin_jwt_token>
Response: 200 OK
[
  {
    "id": "guid",
    "dayOfWeek": "Monday", 
    "startTime": "08:00",
    "endTime": "16:00",
    "isActive": true,
    "doctorId": "doctor-guid"
  }
]
```

### PUT Request
```
PUT /api/Doctor/{doctorId}/shifts
Headers: Authorization: Bearer <admin_jwt_token>
Body: { "shifts": [shiftData] }
Response: 200 OK
{
  "message": "Doctor shifts updated successfully"
}
```

## Error Handling Requirements

### Authentication Errors
- **401 Unauthorized:** Invalid or missing JWT token
- **403 Forbidden:** Valid token but insufficient permissions

### Validation Errors  
- **400 Bad Request:** Invalid doctor ID format or missing required fields
- **404 Not Found:** Doctor not found

### Server Errors
- **500 Internal Server Error:** Only for unexpected server issues (not authentication)

## Testing Checklist

After implementing fixes, verify:

- [ ] GET endpoint returns 200 with proper shift array
- [ ] PUT endpoint accepts `{ "shifts": [...] }` format
- [ ] PUT endpoint returns `{ "message": "Doctor shifts updated successfully" }`
- [ ] 401 error for invalid/missing tokens
- [ ] 403 error for insufficient permissions
- [ ] 400 error for invalid request format
- [ ] Database updates persist correctly
- [ ] Admin role has access to all doctor schedules

## Frontend Status

✅ **Frontend is ready and properly configured:**
- Correct API request format implemented
- Proper error handling in place
- Authentication headers configured
- UI components ready for testing

**Frontend will work immediately once backend issues are resolved.**

---

**Priority:** HIGH - This is blocking admin schedule management functionality  
**Estimated Fix Time:** 2-4 hours for experienced backend developer  
**Dependencies:** Database schema, authentication system, role management
