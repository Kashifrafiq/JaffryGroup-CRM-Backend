# CRM Backend API Documentation

This document lists the APIs currently available for frontend integration.



## Authentication

Protected endpoints require:

- Header: `Authorization: Bearer <accessToken>`

Role access is enforced per endpoint (`admin`, `associate`).

---

## 1) Auth APIs

### Health

- `GET /auth/health`
- `GET /api/auth/health` (alternate prefixed route)

### Admin Login

- `POST /auth/admin-login`
- `POST /api/auth/admin-login` (alternate prefixed route)

Request body:

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "firstName": "Kashif",
    "lastName": "Admin",
    "role": "admin"
  }
}
```

### Associate Login

- `POST /auth/associate-login`
- `POST /api/auth/associate-login` (alternate prefixed route)

Request body:

```json
{
  "email": "associate@example.com",
  "password": "your-password"
}
```

Response shape is same as admin login.

---

## 2) Users & Role APIs

All endpoints below are under `/users` and are protected by JWT + role guards.

### Create User

- `POST /users`
- Roles: `admin`, `associate`

Request body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "StrongPass123!",
  "role": "customer"
}
```

Notes:

- Only `admin` can create users with role `associate`.

### Create Associate (Dedicated API)

- `POST /associates`
- Roles: `admin`

Request body:

```json
{
  "name": "Sarah Ali",
  "email": "sarah@example.com",
  "role": "associate",
  "lastActive": "2026-04-15T09:00:00.000Z",
  "taskAssigned": 3
}
```

Optional fields:

- `phoneNumber`
- `address`
- `profilePhoto`
- `password` (if omitted, backend generates a temporary password)

### Get All Users

- `GET /users`
- Roles: `admin`

### Get User by ID

- `GET /users/:id`
- Roles: `admin`

### Update User

- `PATCH /users/:id`
- Roles: `admin`, `associate`

### Soft Delete User

- `DELETE /users/:id`
- Roles: `admin`
- Behavior: sets `isActive = false`.

### Associate: My Customers

- `GET /users/my-customers`
- Roles: `associate`

Returns customers assigned to logged-in associate.

---

## 3) Customer ↔ Associate Assignment APIs

All assignment endpoints are admin-only.

### Single Assignment

- `PATCH /users/:customerId/assign/:associateId`
- Roles: `admin`

### Bulk: One Customer -> Multiple Associates

- `PATCH /users/:customerId/assign-associates`
- Roles: `admin`

Request body:

```json
{
  "associateIds": ["associate-uuid-1", "associate-uuid-2"]
}
```

Response:

```json
{
  "customerId": "customer-uuid",
  "assignedAssociateIds": ["associate-uuid-1", "associate-uuid-2"],
  "totalAssigned": 2
}
```

### Bulk: One Associate -> Multiple Customers

- `PATCH /users/:associateId/assign-customers`
- Roles: `admin`

Request body:

```json
{
  "customerIds": ["customer-uuid-1", "customer-uuid-2"]
}
```

Response:

```json
{
  "associateId": "associate-uuid",
  "assignedCustomerIds": ["customer-uuid-1", "customer-uuid-2"],
  "totalAssigned": 2
}
```

---

## 4) Tasks APIs

All endpoints under `/tasks` are protected by JWT + role guard.

### Create Task

- `POST /tasks`
- Roles: `admin`

Request body:

```json
{
  "title": "Follow up call",
  "description": "Call customer and confirm renewal plan",
  "startDate": "2026-04-16T09:00:00.000Z",
  "endDate": "2026-04-18T17:00:00.000Z",
  "priority": "medium",
  "status": "todo",
  "assignedTo": "uuid-from-post-associates"
}
```

Required:

- `title`, `startDate`, `endDate`

Optional on create (can set assignee later with `PATCH /tasks/:id`):

- `description` — text
- `priority` — `low` | `medium` | `high` | `urgent` (default `medium`)
- `status` — `todo` | `in_progress` | `under_review` | `completed` (default `todo`)
- `assignedTo` — UUID of a row in the `associates` table (from `POST /associates`)

Validation:

- `endDate` must be after or equal to `startDate`
- If `assignedTo` is sent, it must be a valid UUID and exist in `associates`

### Get Tasks

- `GET /tasks`
- Roles: `admin`, `associate`

### Get Task by ID

- `GET /tasks/:id`
- Roles: `admin`, `associate`

### Update Task

- `PATCH /tasks/:id`
- Roles: `admin`

Partial body examples:

```json
{ "assignedTo": "uuid-from-associates-table", "status": "in_progress" }
```

To unassign, send `null`:

```json
{ "assignedTo": null }
```

### Delete Task

- `DELETE /tasks/:id`
- Roles: `admin`

---

## Common Error Patterns

- `401 Unauthorized`: missing/invalid JWT token
- `403 Forbidden`: authenticated but role not allowed
- `404 Not Found`: invalid IDs (user/customer/associate/task)
- `409 Conflict`: duplicate email

