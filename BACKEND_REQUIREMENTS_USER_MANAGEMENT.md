# Backend Requirements for Enhanced User Management

## Overview

The frontend has been updated to properly display and manage ALL users in the system (both staff and patients) in a unified admin dashboard. This document outlines the backend changes required to support this enhanced user management functionality.

## Current Frontend Changes Made

### 1. Enhanced AdminDashboard User Management
- **Separated Display**: Users are now displayed in two distinct sections:
  - **Staff Members**: Admin, Doctor, Nurse roles
  - **Patients**: Patient role users
- **Enhanced User Interface**: Added visual indicators, role-specific badges, and summary statistics
- **Role Conversion**: Admins can convert patients to staff members and vice versa
- **Additional Patient Fields**: Display phone, date of birth, address, emergency contact information

### 2. Updated User Interface
- **AdminUser Interface**: Extended to include patient-specific fields:
  - `phone?: string`
  - `dateOfBirth?: string`
  - `address?: string`
  - `emergencyContact?: string`
  - `emergencyPhone?: string`

## Required Backend Changes

### 1. Unified User Management Endpoints

#### GET /api/Admin/users
**Purpose**: Get all users (staff + patients) in a unified response
**Authentication**: Admin role required
**Response Format**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "admin|doctor|nurse|patient",
      "isActive": "boolean",
      "createdAt": "datetime",
      "phone": "string", // Optional for patients
      "dateOfBirth": "date", // Optional for patients
      "address": "string", // Optional for patients
      "emergencyContact": "string", // Optional for patients
      "emergencyPhone": "string" // Optional for patients
    }
  ],
  "totalCount": "number",
  "staffCount": "number",
  "patientCount": "number"
}
```

#### PUT /api/Admin/users/{userId}/role
**Purpose**: Update user role (including patient ↔ staff conversions)
**Authentication**: Admin role required
**Request Body**:
```json
{
  "role": "admin|doctor|nurse|patient",
  "additionalData": {
    // For patient → staff conversion
    "phone": "string",
    "specialization": "string", // For doctors
    "department": "string" // For nurses
  }
}
```

#### PUT /api/Admin/users/{userId}/status
**Purpose**: Activate/deactivate any user
**Authentication**: Admin role required
**Request Body**:
```json
{
  "isActive": "boolean"
}
```

### 2. Enhanced Patient Management

#### GET /api/Patients
**Purpose**: Get all patients with complete information
**Authentication**: Admin role required
**Response Format**:
```json
{
  "patients": [
    {
      "id": "uuid",
      "userId": "uuid", // Reference to Users table
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "dateOfBirth": "date",
      "address": "string",
      "emergencyContact": "string",
      "emergencyPhone": "string",
      "isActive": "boolean",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "totalCount": "number"
}
```

#### POST /api/Admin/patients
**Purpose**: Create new patient (for walk-ins)
**Authentication**: Admin role required
**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "dateOfBirth": "date",
  "address": "string",
  "emergencyContact": "string",
  "emergencyPhone": "string"
}
```

### 3. Database Schema Updates

#### Users Table
Ensure the Users table includes all necessary fields:
```sql
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('admin', 'doctor', 'nurse', 'patient')),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    Phone NVARCHAR(20), -- Optional for patients
    DateOfBirth DATE, -- Optional for patients
    Address NVARCHAR(500), -- Optional for patients
    EmergencyContact NVARCHAR(100), -- Optional for patients
    EmergencyPhone NVARCHAR(20) -- Optional for patients
);
```

#### Patients Table (if separate)
If using a separate Patients table, ensure proper relationship:
```sql
CREATE TABLE Patients (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Phone NVARCHAR(20),
    DateOfBirth DATE,
    Address NVARCHAR(500),
    EmergencyContact NVARCHAR(100),
    EmergencyPhone NVARCHAR(20),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);
```

### 4. Business Logic Requirements

#### Role Conversion Logic
When converting a patient to staff member:
1. **Validation**: Ensure required staff fields are provided
2. **Data Migration**: Move patient-specific data to appropriate staff fields
3. **Permission Update**: Update user permissions and access levels
4. **Audit Trail**: Log the role change for compliance

#### User Status Management
- **Soft Delete**: Use `IsActive` flag instead of hard deletion
- **Cascade Effects**: When deactivating a user:
  - Cancel future appointments
  - Notify relevant parties
  - Preserve historical data

### 5. Security Considerations

#### Authorization
- **Admin-Only Access**: All user management endpoints require admin role
- **Role Hierarchy**: Prevent admins from modifying other admin accounts
- **Audit Logging**: Log all user management actions

#### Data Validation
- **Email Uniqueness**: Ensure email uniqueness across all user types
- **Role Validation**: Validate role transitions are logical
- **Required Fields**: Enforce required fields based on user role

### 6. API Response Consistency

#### Unified User Response
All user-related endpoints should return consistent user objects:
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "isActive": "boolean",
  "createdAt": "datetime",
  "phone": "string", // Optional
  "dateOfBirth": "date", // Optional
  "address": "string", // Optional
  "emergencyContact": "string", // Optional
  "emergencyPhone": "string" // Optional
}
```

### 7. Error Handling

#### Standard Error Responses
```json
{
  "error": "string",
  "message": "string",
  "details": "object", // Optional
  "timestamp": "datetime"
}
```

#### Common Error Scenarios
- **User Not Found**: 404 with appropriate message
- **Invalid Role**: 400 with validation details
- **Permission Denied**: 403 with explanation
- **Email Already Exists**: 409 with conflict details

### 8. Performance Considerations

#### Database Indexes
```sql
-- Index for role-based queries
CREATE INDEX IX_Users_Role ON Users(Role);

-- Index for active user queries
CREATE INDEX IX_Users_IsActive ON Users(IsActive);

-- Composite index for admin queries
CREATE INDEX IX_Users_Role_IsActive ON Users(Role, IsActive);
```

#### Pagination Support
All list endpoints should support pagination:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 100)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: asc or desc (default: desc)

## Implementation Priority

### High Priority (Required for Frontend)
1. **GET /api/Admin/users** - Unified user listing
2. **PUT /api/Admin/users/{userId}/role** - Role management
3. **PUT /api/Admin/users/{userId}/status** - Status management

### Medium Priority (Enhanced Features)
1. **POST /api/Admin/patients** - Patient creation
2. **Enhanced error handling** - Better user experience
3. **Audit logging** - Compliance and tracking

### Low Priority (Optimization)
1. **Database indexes** - Performance optimization
2. **Advanced filtering** - Enhanced search capabilities
3. **Bulk operations** - Mass user management

## Testing Requirements

### Unit Tests
- User role conversion logic
- Permission validation
- Data validation rules

### Integration Tests
- API endpoint functionality
- Database operations
- Authentication/authorization

### End-to-End Tests
- Complete user management workflows
- Role conversion scenarios
- Error handling paths

## Migration Strategy

### Phase 1: Core Functionality
1. Implement unified user endpoints
2. Update database schema if needed
3. Test basic user management

### Phase 2: Enhanced Features
1. Add role conversion logic
2. Implement audit logging
3. Add advanced validation

### Phase 3: Optimization
1. Add database indexes
2. Implement caching
3. Performance tuning

---

**Note**: This document should be reviewed and updated as the backend implementation progresses. The frontend is ready to work with these endpoints and will gracefully handle any missing functionality.
