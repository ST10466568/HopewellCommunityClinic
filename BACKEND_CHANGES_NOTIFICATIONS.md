# Backend Changes for Notifications System

## Overview
This document outlines the backend changes required to support the notifications system, based on errors observed in production.

## 🔴 Critical Issues to Fix

### Issue 1: GET `/api/Notifications/patient/{patientId}` - 500 Internal Server Error

**Error Log:**
```
GET /api/Notifications/patient/2bedf976-52ef-4269-a163-93d949a5c6d7
Status: 500 (Internal Server Error)
```

**Required Implementation:**
- **Endpoint**: `GET /api/Notifications/patient/{patientId}`
- **Response Format**:
```json
[
  {
    "id": "string",
    "type": "string",
    "status": "string",
    "sentAt": "2024-01-15T10:30:00Z",
    "emailSubject": "string",
    "emailContent": "string",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "14:00",
    "serviceName": "string",
    "senderId": "string",
    "senderName": "string",
    "senderRole": "string",
    "isRead": false,
    "threadId": "string",
    "replies": []
  }
]
```

**Backend Tasks:**
- [ ] Verify `PatientId` exists in database before querying
- [ ] Handle null/empty results gracefully (return empty array `[]` instead of 500)
- [ ] Ensure all nullable fields are handled (senderId, senderName, senderRole can be null)
- [ ] Add error logging to identify root cause of 500 error
- [ ] Return 404 if patient not found (instead of 500)

---

### Issue 2: POST `/api/Notifications/send-custom` - 400 Bad Request

**Error Log:**
```
POST /api/Notifications/send-custom
Status: 400 (Bad Request)
Error: "An error occurred while saving the entity changes. See the inner exception for details."
Request Payload: {
  "PatientId": "2bedf976-52ef-4269-a163-93d949a5c6d7",
  "Subject": "madikizavuyo@gmail.com",
  "Message": "test"
}
```

**Root Cause:** Database entity save operation failing, likely due to:
1. Missing required fields in database schema
2. Null constraint violations
3. Foreign key constraint violations
4. Data type mismatches

**Required Implementation:**
- **Endpoint**: `POST /api/Notifications/send-custom`
- **Request Format (PascalCase)**:
```json
{
  "PatientId": "string (GUID, required)",
  "Subject": "string (required, max 200 chars)",
  "Message": "string (required, max 5000 chars)"
}
```

**Backend Tasks:**
- [ ] **Verify Database Schema** - Ensure `Notifications` table has these columns:
  - `Id` UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID()
  - `PatientId` UNIQUEIDENTIFIER NULL (for patient notifications)
  - `StaffId` UNIQUEIDENTIFIER NULL (for staff notifications - **REQUIRED for doctor messaging feature**)
  - `Type` NVARCHAR(50) NOT NULL DEFAULT 'custom'
  - `Status` NVARCHAR(20) NOT NULL DEFAULT 'sent'
  - `SentAt` DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  - `EmailSubject` NVARCHAR(200) NULL (or NOT NULL if required)
  - `EmailContent` NVARCHAR(MAX) NULL (or NOT NULL if required)
  - `IsRead` BIT NOT NULL DEFAULT 0
  - `ThreadId` UNIQUEIDENTIFIER NULL
  - `SenderId` UNIQUEIDENTIFIER NULL
  - `SenderName` NVARCHAR(255) NULL
  - `SenderRole` NVARCHAR(50) NULL
  - `CreatedAt` DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  - `UpdatedAt` DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  
  **Note:** Either `PatientId` OR `StaffId` should be set (not both). For patient notifications, set `PatientId` and leave `StaffId` NULL. For staff notifications, set `StaffId` and leave `PatientId` NULL.

- [ ] **Fix Database Constraints** - Make the following nullable (if they cause issues):
  - `SenderId`, `SenderName`, `SenderRole` → NULL
  - `ThreadId` → NULL (or generate NEWID() if required)
  - `EmailSubject`, `EmailContent` → NULL (if you want to allow partial saves)

- [ ] **Validation**:
  - Verify `PatientId` exists before inserting
  - Validate `Subject` length (1-200 chars)
  - Validate `Message` length (1-5000 chars)
  - Return clear error messages instead of generic "entity changes" error

- [ ] **Response Format**:
```json
{
  "success": true,
  "notificationId": "guid",
  "messageId": "provider-id",
  "message": "Notification sent successfully"
}
```

- [ ] **Error Handling**:
  - 400 Bad Request: Return validation errors
  - 404 Not Found: Patient not found
  - 500 Internal Server Error: Log actual exception details

**Example Implementation Logic:**
```csharp
// 1. Validate PatientId exists
var patient = await _context.Patients.FindAsync(request.PatientId);
if (patient == null)
    return NotFound(new { error = "Patient not found" });

// 2. Create notification entity with all defaults
var notification = new Notification
{
    Id = Guid.NewGuid(),
    PatientId = request.PatientId,
    Type = "custom",
    Status = "sent",
    SentAt = DateTime.UtcNow,
    EmailSubject = request.Subject ?? string.Empty,
    EmailContent = request.Message ?? string.Empty,
    IsRead = false,
    ThreadId = Guid.NewGuid(), // Generate thread ID for replies
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
    // SenderId, SenderName, SenderRole can remain null for now
};

// 3. Save to database
_context.Notifications.Add(notification);
await _context.SaveChangesAsync();

// 4. Send email (if email service available)
// Handle email failures gracefully - don't fail the notification creation

// 5. Return success
return Ok(new { 
    success = true, 
    notificationId = notification.Id 
});
```

---

## Doctor Messaging Feature

### POST `/api/Notifications/send-message`

**Purpose:** Allows doctors (and other staff) to send messages/notifications to patients and staff members.

**Request Format (PascalCase):**
```json
{
  "recipientId": "string (GUID, required)",
  "recipientRole": "string (required - 'patient', 'doctor', 'nurse', 'admin')",
  "subject": "string (required, max 200 chars)",
  "content": "string (required, max 5000 chars)",
  "senderId": "string (GUID, required)",
  "senderRole": "string (required - 'doctor', 'nurse', 'admin')"
}
```

**Response Format (200 OK):**
```json
{
  "success": true,
  "notificationId": "guid",
  "threadId": "guid",
  "message": "Message sent successfully"
}
```

**Backend Implementation Tasks:**
- [ ] Validate `recipientId` exists in database (check `Patients` table for role='patient', `Staff`/`Users` for staff roles)
- [ ] Validate `senderId` exists and has permission to send messages
- [ ] Create notification record with:
  - `PatientId` = recipientId (if recipientRole='patient')
  - OR `StaffId` = recipientId (if recipientRole is 'doctor', 'nurse', or 'admin')
  - `Type` = 'message'
  - `Status` = 'sent'
  - `EmailSubject` = subject
  - `EmailContent` = content
  - `SenderId` = senderId
  - `SenderName` = sender name (fetch from Users/Staff table)
  - `SenderRole` = senderRole
  - `ThreadId` = generate new GUID (or use existing if replying to a thread)
  - `IsRead` = false
  - `CreatedAt` = DateTime.UtcNow
  - `UpdatedAt` = DateTime.UtcNow

- [ ] **Handle Both Recipient Types:**
  - **For Patients:** Set `PatientId` = recipientId, `StaffId` = NULL
  - **For Staff:** Set `StaffId` = recipientId, `PatientId` = NULL
  - Consider creating a separate `Messages` table if you want to distinguish messages from notifications

- [ ] **Send Email Notification (Optional):**
  - If email service is configured, send email to recipient
  - Don't fail the message creation if email fails

- [ ] **Error Handling:**
  - 400 Bad Request: Return validation errors (invalid recipientId, missing fields)
  - 404 Not Found: Recipient not found
  - 403 Forbidden: Sender doesn't have permission
  - 500 Internal Server Error: Log actual exception details

**Example Implementation Logic:**
```csharp
// 1. Validate sender has permission (must be doctor, nurse, or admin)
if (!new[] { "doctor", "nurse", "admin" }.Contains(request.SenderRole.ToLower()))
    return BadRequest(new { error = "Only doctors, nurses, and admins can send messages" });

// 2. Validate recipient exists
if (request.RecipientRole.ToLower() == "patient")
{
    var patient = await _context.Patients.FindAsync(request.RecipientId);
    if (patient == null)
        return NotFound(new { error = "Patient not found" });
}
else
{
    var staff = await _context.Staff.FindAsync(request.RecipientId) 
             ?? await _context.Users.FirstOrDefaultAsync(u => u.Id == request.RecipientId);
    if (staff == null)
        return NotFound(new { error = "Staff member not found" });
}

// 3. Get sender details
var sender = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == request.SenderId)
          ?? await _context.Users.FindAsync(request.SenderId);
var senderName = sender != null ? $"{sender.FirstName} {sender.LastName}" : "Unknown";

// 4. Generate thread ID (new thread for new messages)
var threadId = Guid.NewGuid();

// 5. Create notification/message
var notification = new Notification
{
    Id = Guid.NewGuid(),
    Type = "message",
    Status = "sent",
    SentAt = DateTime.UtcNow,
    EmailSubject = request.Subject ?? string.Empty,
    EmailContent = request.Content ?? string.Empty,
    IsRead = false,
    ThreadId = threadId,
    SenderId = request.SenderId,
    SenderName = senderName,
    SenderRole = request.SenderRole,
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};

// Set recipient based on role
if (request.RecipientRole.ToLower() == "patient")
{
    notification.PatientId = request.RecipientId;
}
else
{
    notification.StaffId = request.RecipientId;
}

// 6. Save to database
_context.Notifications.Add(notification);
await _context.SaveChangesAsync();

// 7. Send email notification (optional, don't fail if this fails)
try
{
    await _emailService.SendMessageNotification(notification);
}
catch (Exception ex)
{
    // Log but don't fail
    _logger.LogWarning(ex, "Failed to send email notification");
}

// 8. Return success
return Ok(new { 
    success = true, 
    notificationId = notification.Id,
    threadId = threadId
});
```

---

## Additional Endpoints Needed

### GET `/api/Notifications/{notificationId}/replies`
Get replies for a notification (for notification center reply functionality).

**Request:**
- Path Parameter: `notificationId` (GUID)

**Response:**
```json
[
  {
    "id": "string",
    "notificationId": "string",
    "threadId": "string",
    "senderId": "string",
    "senderName": "string",
    "senderRole": "string",
    "content": "string",
    "sentAt": "2024-01-15T10:30:00Z",
    "isRead": false
  }
]
```

**Database Table Required:**
```sql
CREATE TABLE NotificationReplies (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    NotificationId UNIQUEIDENTIFIER NOT NULL,
    ThreadId UNIQUEIDENTIFIER NOT NULL,
    SenderId UNIQUEIDENTIFIER NOT NULL,
    SenderName NVARCHAR(255) NOT NULL,
    SenderRole NVARCHAR(50) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SentAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    IsRead BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (NotificationId) REFERENCES Notifications(Id),
    INDEX IX_NotificationReplies_NotificationId (NotificationId),
    INDEX IX_NotificationReplies_ThreadId (ThreadId)
);
```

### POST `/api/Notifications/{notificationId}/reply`
Reply to a notification.

**Request:**
```json
{
  "senderId": "string (required)",
  "senderRole": "string (required - 'patient', 'doctor', 'nurse', 'admin')",
  "content": "string (required)"
}
```

**Response:**
```json
{
  "id": "string",
  "notificationId": "string",
  "threadId": "string",
  "senderId": "string",
  "senderName": "string",
  "senderRole": "string",
  "content": "string",
  "sentAt": "2024-01-15T10:30:00Z",
  "isRead": false
}
```

### PUT `/api/Notifications/{notificationId}/read`
Mark notification as read.

**Request:**
- Path Parameter: `notificationId` (GUID)

**Response:**
```json
{
  "success": true,
  "notificationId": "string"
}
```

---

## Priority Fix Order

1. **HIGH PRIORITY** - Fix POST `/api/Notifications/send-custom` (400 error)
   - This is blocking admin users from sending notifications
   - Check database schema constraints
   - Fix null/required field issues
   - Improve error messages

2. **HIGH PRIORITY** - Fix GET `/api/Notifications/patient/{patientId}` (500 error)
   - This is blocking patient notification center
   - Add proper error handling
   - Handle null/empty results gracefully

3. **HIGH PRIORITY** - Implement POST `/api/Notifications/send-message` (for doctor messaging)
   - This enables doctors to send messages to patients and staff
   - **CRITICAL:** Ensure `Notifications` table has `StaffId` column (nullable)
   - Validate recipient exists (patient or staff based on `recipientRole`)
   - Create notification with correct `PatientId` or `StaffId` set based on recipient type
   - See "Doctor Messaging Feature" section above for full implementation details

4. **MEDIUM PRIORITY** - Implement reply endpoints
   - GET `/api/Notifications/{notificationId}/replies`
   - POST `/api/Notifications/{notificationId}/reply`
   - PUT `/api/Notifications/{notificationId}/read`

5. **MEDIUM PRIORITY** - Implement GET `/api/Notifications/staff/{staffId}` (for staff notifications)
   - Similar to patient notifications endpoint
   - Return notifications where `StaffId` matches
   - Handle null/empty results gracefully

---

## Testing Checklist

- [ ] Test POST `/api/Notifications/send-custom` with valid patient ID
- [ ] Test POST `/api/Notifications/send-custom` with invalid patient ID (should return 404)
- [ ] Test POST `/api/Notifications/send-custom` with empty subject/message (should return 400 with validation errors)
- [ ] Test GET `/api/Notifications/patient/{validPatientId}` - should return array (empty if no notifications)
- [ ] Test GET `/api/Notifications/patient/{invalidPatientId}` - should return 404, not 500
- [ ] Test GET `/api/Notifications/patient/{patientId}` with database error - should return 500 with proper error message
- [ ] Verify all database inserts complete successfully
- [ ] Verify error messages are user-friendly, not generic "entity changes" errors

---

## Database Schema Verification

Run this query to verify your `Notifications` table structure:

```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Notifications'
ORDER BY ORDINAL_POSITION;
```

**Expected Columns (minimum required):**
- `Id` (UNIQUEIDENTIFIER, NOT NULL, PRIMARY KEY)
- `PatientId` (UNIQUEIDENTIFIER, NULLABLE - for patient notifications)
- `StaffId` (UNIQUEIDENTIFIER, NULLABLE - **REQUIRED for doctor messaging to staff**)
- `Type` (NVARCHAR(50), NOT NULL)
- `Status` (NVARCHAR(20), NOT NULL)
- `SentAt` (DATETIME2, NULLABLE)
- `EmailSubject` (NVARCHAR(200), NULLABLE)
- `EmailContent` (NVARCHAR(MAX), NULLABLE)
- `IsRead` (BIT, NOT NULL, DEFAULT 0)
- `ThreadId` (UNIQUEIDENTIFIER, NULLABLE)
- `SenderId` (UNIQUEIDENTIFIER, NULLABLE)
- `SenderName` (NVARCHAR(255), NULLABLE)
- `SenderRole` (NVARCHAR(50), NULLABLE)
- `CreatedAt` (DATETIME2, NOT NULL)
- `UpdatedAt` (DATETIME2, NOT NULL)

**If any columns are missing or have wrong constraints, fix them using:**
```sql
-- Example: Add StaffId column (if missing - REQUIRED for doctor messaging)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'StaffId')
BEGIN
    ALTER TABLE Notifications 
    ADD StaffId UNIQUEIDENTIFIER NULL;
    
    -- Optionally add foreign key constraint
    ALTER TABLE Notifications
    ADD CONSTRAINT FK_Notifications_Staff FOREIGN KEY (StaffId) REFERENCES Staff(Id);
END;

-- Example: Make EmailSubject nullable
ALTER TABLE Notifications 
ALTER COLUMN EmailSubject NVARCHAR(200) NULL;

-- Example: Add default value
ALTER TABLE Notifications 
ADD CONSTRAINT DF_Notifications_IsRead DEFAULT 0 FOR IsRead;
```

---

## Quick Fix Commands

If using Entity Framework, check your model:

```csharp
public class Notification
{
    public Guid Id { get; set; }
    public Guid? PatientId { get; set; } // For patient notifications
    public Guid? StaffId { get; set; } // For staff notifications (REQUIRED for doctor messaging)
    public string Type { get; set; } = "custom";
    public string Status { get; set; } = "sent";
    public DateTime? SentAt { get; set; }
    public string? EmailSubject { get; set; } // Make nullable
    public string? EmailContent { get; set; } // Make nullable
    public bool IsRead { get; set; } = false;
    public Guid? ThreadId { get; set; } // Make nullable
    public Guid? SenderId { get; set; } // Make nullable
    public string? SenderName { get; set; } // Make nullable
    public string? SenderRole { get; set; } // Make nullable
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

## Support

For backend debugging:
1. Check Azure App Service logs: Portal → App Service → Log stream
2. Check Application Insights for detailed exception traces
3. Enable detailed error messages in development environment
4. Check database constraints and foreign key relationships
