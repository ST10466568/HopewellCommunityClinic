# Backend Requirements for Admin Doctor Schedule Management

## Test Results Summary

**Date:** $(date)  
**Frontend Version:** Updated to match backend API specification  
**Test Status:** ❌ FAILED - Backend endpoints returning 500 errors  

## Current Issues Identified

### 1. CORS Policy Issues
- **Problem:** `Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin' header`
- **Expected:** Backend should allow requests from `http://localhost:3000` (development) and production domains
- **Current Behavior:** All API requests are blocked by CORS policy
- **Impact:** Frontend cannot communicate with backend API

### 2. Authentication Issues
- **Problem:** All authenticated endpoints return 500 Internal Server Error
- **Expected:** Should return 401 Unauthorized if authentication fails
- **Current Behavior:** Server error instead of proper authentication handling
- **Root Cause:** Endpoints exist but have authentication/authorization implementation issues

### 3. Endpoint Status
| Endpoint | Status | Error Code | Analysis |
|----------|--------|------------|----------|
| `GET /api/Admin/doctors/{doctorId}/shifts` | ❌ FAILED | 500 | **Endpoint exists but has server issues** |
| `PUT /api/Admin/doctors/{doctorId}/shifts` | ❌ FAILED | 500 | **Endpoint exists but has server issues** |
| `GET /api/Doctor/{doctorId}/shifts` | ❌ FAILED | 500 | **Endpoint exists but has server issues** |
| `PUT /api/Doctor/{doctorId}/shifts` | ❌ FAILED | 500 | **Endpoint exists but has server issues** |
| `GET /api/DoctorSchedule/{doctorId}/shifts` | ✅ WORKING | 200 | **Public endpoint works correctly** |

**🔍 Key Finding:** All authenticated endpoints return 500 Internal Server Error, indicating they exist but have implementation issues (likely authentication/authorization problems).

## Required Backend Fixes

### 1. Fix CORS Configuration (CRITICAL - Blocks all frontend requests)
**Priority:** CRITICAL - Frontend cannot communicate with backend

**🔍 Analysis:** CORS policy is blocking all requests from `http://localhost:3000`

**Required Fix:**
```csharp
// In Startup.cs or Program.cs - Add CORS configuration
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins(
                "http://localhost:3000",        // Development
                "https://localhost:3000",        // Development HTTPS
                "https://hopewell-clinic-frontend.azurewebsites.net", // Production
                "https://hopewellclinic.azurewebsites.net"            // Alternative production
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Required for JWT authentication
    });
});

// In Configure method (Startup.cs) or after app.Build() (Program.cs)
app.UseCors("AllowFrontend");
```

**Alternative CORS Configuration (if above doesn't work):**
```csharp
// More permissive CORS for development
services.AddCors(options =>
{
    options.AddPolicy("Development", builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Use in development only
if (app.Environment.IsDevelopment())
{
    app.UseCors("Development");
}
```

### 2. Fix Authentication/Authorization Issues
**Priority:** CRITICAL - All authenticated endpoints are failing with 500 errors

**🔍 Analysis:** The endpoints exist (not 404) but return 500 errors, indicating:
- Authentication middleware is not properly configured
- Authorization attributes are causing exceptions
- JWT token validation is failing internally
- Role-based access control is throwing unhandled exceptions

**Required Fixes:**

#### A. Fix Authentication Middleware
```csharp
// In Startup.cs or Program.cs - Ensure proper JWT configuration
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Configuration["Jwt:Issuer"],
            ValidAudience = Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["Jwt:Key"]))
        };
        
        // Add proper error handling
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                var result = JsonSerializer.Serialize(new { error = "Authentication failed" });
                return context.Response.WriteAsync(result);
            },
            OnChallenge = context =>
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                var result = JsonSerializer.Serialize(new { error = "Authentication required" });
                return context.Response.WriteAsync(result);
            }
        };
    });
```

#### B. Fix Authorization Configuration
```csharp
// In Startup.cs or Program.cs
services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("AdminOrDoctor", policy => policy.RequireRole("Admin", "Doctor"));
});
```

#### C. Implement Admin-Specific Endpoints (After fixing auth)
```csharp
// In AdminController.cs - Add these endpoints AFTER fixing authentication
[HttpGet("doctors/{doctorId}/shifts")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetDoctorShifts(string doctorId)
{
    try 
    {
        // Validate doctorId format
        if (!Guid.TryParse(doctorId, out var doctorGuid))
        {
            return BadRequest(new { error = "Invalid doctor ID format" });
        }
        
        // Get doctor's shift schedule
        var shifts = await _shiftService.GetDoctorShifts(doctorGuid);
        return Ok(shifts);
    }
    catch (UnauthorizedAccessException)
    {
        return Unauthorized(new { error = "Authentication required" });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting doctor shifts for {DoctorId}", doctorId);
        return StatusCode(500, new { error = "Internal server error" });
    }
}

[HttpPut("doctors/{doctorId}/shifts")]
[Authorize(Roles = "Admin")]
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
        
        // Update doctor's shift schedule
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

### 2. Fix Authentication Handling
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

### Admin-Specific Endpoints (Preferred)

#### GET Request
```
GET /api/Admin/doctors/{doctorId}/shifts
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

#### PUT Request
```
PUT /api/Admin/doctors/{doctorId}/shifts
Headers: Authorization: Bearer <admin_jwt_token>
Body: { "shifts": [shiftData] }
Response: 200 OK
{
  "message": "Doctor shifts updated successfully"
}
```

### Doctor Endpoints (Fallback)

#### GET Request
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

#### PUT Request
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

### CORS Configuration (Priority 1 - CRITICAL)
- [ ] Frontend can make requests to backend without CORS errors
- [ ] Development environment (`http://localhost:3000`) is allowed
- [ ] Production environment is configured
- [ ] JWT authentication headers are accepted
- [ ] All HTTP methods (GET, POST, PUT, DELETE) are allowed

### Admin-Specific Endpoints (Priority 2)
- [ ] `GET /api/Admin/doctors/{doctorId}/shifts` returns 200 with proper shift array
- [ ] `PUT /api/Admin/doctors/{doctorId}/shifts` accepts `{ "shifts": [...] }` format
- [ ] `PUT /api/Admin/doctors/{doctorId}/shifts` returns `{ "message": "Doctor shifts updated successfully" }`
- [ ] Admin role has access to admin-specific endpoints
- [ ] Non-admin users get 403 Forbidden for admin endpoints

### Doctor Endpoints (Priority 3)
- [ ] `GET /api/Doctor/{doctorId}/shifts` returns 200 with proper shift array
- [ ] `PUT /api/Doctor/{doctorId}/shifts` accepts `{ "shifts": [...] }` format
- [ ] `PUT /api/Doctor/{doctorId}/shifts` returns `{ "message": "Doctor shifts updated successfully" }`
- [ ] Both admin and doctor roles have access to doctor endpoints

### General Requirements
- [ ] 401 error for invalid/missing tokens
- [ ] 403 error for insufficient permissions
- [ ] 400 error for invalid request format
- [ ] Database updates persist correctly
- [ ] Frontend fallback mechanism works correctly

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
