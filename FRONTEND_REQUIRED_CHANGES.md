# Frontend Guide: Removing Nurse Role from Hopewell Clinic System

This guide provides step-by-step instructions for removing the nurse role from the frontend application.

## Overview

The backend API has been updated to remove the nurse role completely. The frontend needs to be updated accordingly to reflect these changes.

## Changes Made in Backend

1. **Nurse role removed** from database seeders
2. **NurseController deleted** - All nurse-specific endpoints removed
3. **Authorization updated** - Staff authorization now only includes `doctor` and `admin` roles
4. **Endpoints changed**:
   - `POST /api/Appointments/walkin` - Now requires `admin` or `doctor` role (previously `nurse`)
   - `PUT /api/Appointments/{id}/approve-for-doctor` - **REMOVED** (was nurse-only)
5. **Nurse role references removed** from user role checks and displays

## Frontend Changes Required

### 1. Remove Nurse Role from User Type Definitions

**Location**: Wherever user roles/types are defined (e.g., `types/index.ts`, `constants.ts`, etc.)

**Action**: Remove `"nurse"` from role arrays and type definitions.

**Example**:

```typescript
// Before
export type UserRole = "admin" | "doctor" | "nurse" | "patient";
export const STAFF_ROLES = ["admin", "doctor", "nurse"];

// After
export type UserRole = "admin" | "doctor" | "patient";
export const STAFF_ROLES = ["admin", "doctor"];
```

**Files to Check**:
- `src/types/index.ts`
- Any constants files defining roles

### 2. Remove Nurse Dashboard Components

**Locations to Check**:
- `src/components/NurseDashboard.tsx`
- `src/pages/NurseDashboard.js`
- Any route definitions for nurse dashboard

**Action**: Delete these files and remove routes from your routing configuration.

**Example**:

```typescript
// Remove from routes (in App.tsx or routing config)
{
  path: "/nurse",
  element: <NurseDashboard />,
  // Remove this route
}
```

**Files to Delete**:
- `src/components/NurseDashboard.tsx`
- `src/pages/NurseDashboard.js`

### 3. Update Navigation/Menu Components

**Location**: Navigation bars, sidebars, or menu components

**Action**: Remove any links/buttons that navigate to nurse-specific pages.

**Example**:

```typescript
// Before
const menuItems = [
  { label: "Admin Dashboard", path: "/admin", roles: ["admin"] },
  { label: "Doctor Dashboard", path: "/doctor", roles: ["doctor"] },
  { label: "Nurse Dashboard", path: "/nurse", roles: ["nurse"] }, // REMOVE THIS
  { label: "Patient Dashboard", path: "/patient", roles: ["patient"] },
];

// After
const menuItems = [
  { label: "Admin Dashboard", path: "/admin", roles: ["admin"] },
  { label: "Doctor Dashboard", path: "/doctor", roles: ["doctor"] },
  { label: "Patient Dashboard", path: "/patient", roles: ["patient"] },
];
```

**Files to Update**:
- `src/components/Navigation.js`
- `src/components/Sidebar.js`
- Any menu/navigation components

### 4. Update Role-Based Conditional Rendering

**Location**: Any component that conditionally renders based on user role

**Action**: Remove checks for `role === "nurse"` or `roles.includes("nurse")`

**Example**:

```typescript
// Before
{user.role === "nurse" && <NurseSpecificComponent />}
{user.role === "doctor" && <DoctorSpecificComponent />}
{user.role === "admin" && <AdminSpecificComponent />}

// After
{user.role === "doctor" && <DoctorSpecificComponent />}
{user.role === "admin" && <AdminSpecificComponent />}
```

**Files to Check**:
- `src/App.tsx`
- `src/App.js`
- `src/components/AdminDashboard.tsx`
- Any components with role-based rendering

### 5. Update User Creation/Registration Forms

**Location**: Admin user creation forms, registration forms

**Action**: Remove "nurse" from role dropdowns/selects

**Example**:

```typescript
// Before
<select name="role">
  <option value="admin">Admin</option>
  <option value="doctor">Doctor</option>
  <option value="nurse">Nurse</option> {/* REMOVE THIS */}
  <option value="patient">Patient</option>
</select>

// After
<select name="role">
  <option value="admin">Admin</option>
  <option value="doctor">Doctor</option>
  <option value="patient">Patient</option>
</select>
```

**Files to Update**:
- `src/components/AdminDashboard.tsx` (user creation forms)
- Any registration/user creation components

### 6. Update User List/Display Components

**Location**: User management tables, user cards, user profiles

**Action**: Remove nurse role display logic and badge colors

**Example**:

```typescript
// Before
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin": return "red";
    case "doctor": return "blue";
    case "nurse": return "green"; // REMOVE THIS
    case "patient": return "gray";
    default: return "gray";
  }
};

// After
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin": return "red";
    case "doctor": return "blue";
    case "patient": return "gray";
    default: return "gray";
  }
};
```

**Files to Check**:
- `src/components/AdminDashboard.tsx`
- `src/components/ProfileModal.tsx`
- User list/display components

### 7. Update API Calls

**Location**: API service files (e.g., `api.js`, `services/api.js`)

**Action**: 
- Remove any calls to `/api/Nurse/*` endpoints
- Update `POST /api/Appointments/walkin` to use admin/doctor authorization
- Remove calls to `PUT /api/Appointments/{id}/approve-for-doctor`

**Example**:

```typescript
// REMOVE these functions
async function getNurseAppointments() {
  return axios.get("/api/Nurse/appointments/today");
}

async function approveForDoctor(appointmentId: string, doctorId: string) {
  return axios.put(`/api/Appointments/${appointmentId}/approve-for-doctor`, {
    doctorId
  });
}

// UPDATE walkin endpoint authorization
// The endpoint still exists but now requires admin or doctor role
async function createWalkInAppointment(data: WalkInAppointmentDto) {
  return axios.post("/api/Appointments/walkin", data);
  // Ensure the request includes admin or doctor JWT token
}
```

**Files to Update**:
- `src/services/api.js` - Remove all nurse-related API functions

### 8. Update Statistics/Dashboard Components

**Location**: Admin dashboard, statistics components

**Action**: Remove nurse-related statistics (TotalNurses will always be 0)

**Example**:

```typescript
// Before
<div className="stats">
  <div>Total Doctors: {stats.totalDoctors}</div>
  <div>Total Nurses: {stats.totalNurses}</div> {/* REMOVE or HIDE */}
  <div>Total Patients: {stats.totalPatients}</div>
</div>

// After
<div className="stats">
  <div>Total Doctors: {stats.totalDoctors}</div>
  <div>Total Patients: {stats.totalPatients}</div>
</div>
```

**Files to Update**:
- `src/components/AdminDashboard.tsx`
- Dashboard statistics components

### 9. Update Notification/Messaging Features

**Location**: Notification components, messaging features

**Action**: Remove "nurse" from sender role validation (if frontend validates)

**Example**:

```typescript
// Before
const VALID_SENDER_ROLES = ["doctor", "nurse", "admin"];

// After
const VALID_SENDER_ROLES = ["doctor", "admin"];
```

**Files to Update**:
- `src/components/NotificationCenter.tsx`
- `src/components/SendMessageModal.tsx`
- Any notification/messaging components

### 10. Update User Filtering/Search

**Location**: User lists, search functionality

**Action**: Remove "nurse" from role filters

**Example**:

```typescript
// Before
const roleFilters = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" }, // REMOVE THIS
  { value: "patient", label: "Patient" },
];

// After
const roleFilters = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Doctor" },
  { value: "patient", label: "Patient" },
];
```

**Files to Update**:
- `src/components/AdminDashboard.tsx` (user filtering)
- Any search/filter components

### 11. Update Authentication/Authorization Logic

**Location**: Auth context, protected routes, role checks

**Action**: Remove nurse role checks from authorization logic

**Example**:

```typescript
// Before
const isStaff = (user: User) => {
  return ["admin", "doctor", "nurse"].includes(user.role);
};

// After
const isStaff = (user: User) => {
  return ["admin", "doctor"].includes(user.role);
};
```

**Files to Update**:
- `src/contexts/AuthContext.js`
- `src/App.tsx` (route protection)
- Any authentication/authorization utilities

### 12. Remove Nurse-Specific Features

**Features to Remove**:
- Nurse appointment approval workflow
- Nurse-specific appointment booking
- Nurse dashboard summaries
- Any UI components specific to nurses

**Action**: Delete or hide these features completely.

**Files to Check**:
- `src/components/NurseDashboard.tsx` (delete)
- `src/pages/NurseDashboard.js` (delete)
- Any nurse-specific components

## API Endpoint Changes Summary

| Endpoint | Previous Access | New Access | Status |
|----------|----------------|------------|--------|
| `POST /api/Appointments/walkin` | Nurse only | Admin, Doctor | ✅ Updated |
| `PUT /api/Appointments/{id}/approve-for-doctor` | Nurse only | - | ❌ Removed |
| `GET /api/Nurse/appointments/today` | Nurse only | - | ❌ Removed |
| `GET /api/Nurse/patients/search` | Nurse only | - | ❌ Removed |
| `POST /api/Nurse/appointments/book-for-patient` | Nurse only | - | ❌ Removed |

## Testing Checklist

After making changes, test the following:

- [ ] User login with admin role works
- [ ] User login with doctor role works
- [ ] User login with patient role works
- [ ] Admin can create users with roles: admin, doctor, patient (not nurse)
- [ ] Admin dashboard loads correctly
- [ ] Doctor dashboard loads correctly
- [ ] Patient dashboard loads correctly
- [ ] Walk-in appointment creation works (admin/doctor only)
- [ ] User lists don't show nurse role
- [ ] Role filters don't include nurse option
- [ ] Navigation doesn't show nurse links
- [ ] No console errors related to nurse role
- [ ] API calls don't reference nurse endpoints
- [ ] No 404 errors for removed nurse endpoints
- [ ] Dashboard statistics display correctly (without nurse count)

## Migration Notes

### Existing Nurse Users

If there are existing users with the nurse role in the database:

1. Backend migration will remove nurse role from `AspNetRoles` table
2. User-role associations for nurse role will be automatically deleted
3. These users will need to be reassigned to a different role (doctor or admin) by an admin user

### Backward Compatibility

- The backend will return `TotalNurses: 0` in dashboard statistics
- The backend will no longer accept "nurse" as a valid role in user creation
- Any existing nurse users will lose access until reassigned

## Implementation Priority

### HIGH PRIORITY (Critical Changes)
1. **Remove Nurse Dashboard Routes** - Prevents 404 errors
2. **Update Type Definitions** - Prevents TypeScript errors
3. **Remove Nurse from Navigation** - Prevents broken links
4. **Update API Calls** - Prevents API errors

### MEDIUM PRIORITY (UI Updates)
5. **Remove from User Creation Forms** - UI consistency
6. **Update Role Filters** - UI consistency
7. **Update Statistics Display** - UI consistency

### LOW PRIORITY (Cleanup)
8. **Remove Dead Code** - Clean up unused components
9. **Update Documentation** - Update any docs referencing nurse role

## Common Issues to Check

### TypeScript Errors
- ✅ Remove "nurse" from type unions
- ✅ Update role arrays and constants
- ✅ Fix any type assertions assuming nurse role

### Runtime Errors
- ✅ Remove references to nurse-only routes
- ✅ Remove nurse role checks in conditionals
- ✅ Update authorization functions

### API Errors
- ✅ Remove calls to `/api/Nurse/*` endpoints
- ✅ Update walk-in appointment creation to use admin/doctor auth
- ✅ Remove `approve-for-doctor` endpoint calls

### UI/UX Issues
- ✅ Remove nurse links from navigation
- ✅ Remove nurse option from dropdowns
- ✅ Update role badges/colors
- ✅ Remove nurse statistics

## File Checklist

Use this checklist to track which files need to be updated:

### Files to Delete
- [ ] `src/components/NurseDashboard.tsx`
- [ ] `src/pages/NurseDashboard.js`

### Files to Update
- [ ] `src/types/index.ts` - Remove nurse from types
- [ ] `src/App.tsx` or `src/App.js` - Remove nurse routes
- [ ] `src/components/Navigation.js` - Remove nurse links
- [ ] `src/components/Sidebar.js` - Remove nurse links
- [ ] `src/components/AdminDashboard.tsx` - Remove nurse from user creation, filters, stats
- [ ] `src/services/api.js` - Remove nurse API calls
- [ ] `src/components/NotificationCenter.tsx` - Remove nurse from valid roles
- [ ] `src/components/SendMessageModal.tsx` - Remove nurse from valid roles
- [ ] `src/components/ProfileModal.tsx` - Remove nurse role badge/display
- [ ] `src/contexts/AuthContext.js` - Remove nurse from isStaff check
- [ ] Any other files found with nurse references

## Questions or Issues?

If you encounter any issues during the frontend update:

1. **Check browser console** for errors
2. **Verify API endpoints** match the backend changes
3. **Ensure JWT tokens** include correct roles
4. **Check network tab** for failed API requests
5. **Search codebase** for "nurse" or "Nurse" to find all references
6. **Review TypeScript errors** for type-related issues

## Contact

For backend-related questions or issues, refer to the `BACKEND_REQUIRED_CHANGES.md` file or contact the backend development team.

---

**Note**: This guide should be used in conjunction with the backend changes. Ensure the backend API is updated before making frontend changes to avoid API errors.

