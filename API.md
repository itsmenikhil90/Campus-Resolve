# AI-COMPLY API

All protected endpoints need `Authorization: Bearer <jwt>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a student |
| POST | `/api/auth/login` | Login; response contains token and role |
| POST | `/api/auth/forgot-password` | Request reset email |
| PATCH | `/api/auth/reset-password/:token` | Reset password |
| POST | `/api/complaints` | Student creates complaint (`title`, `description`, category, priority, department) |
| GET | `/api/complaints/my` | Student's complaints |
| GET | `/api/complaints/:id` | Owner or admin reads one complaint/history |
| GET | `/api/complaints/admin/all` | Admin list; supports search and filters |
| GET | `/api/complaints/admin/stats` | Admin analytics/statistics |
| PATCH | `/api/complaints/admin/:id/approve` | Admin approves pending complaint |
| PATCH | `/api/complaints/admin/:id/reject` | Admin rejects with `rejectionReason` |
| PATCH | `/api/complaints/admin/:id/assign` | Admin assigns (`assignedTo`) |
| PATCH | `/api/complaints/admin/:id/status` | Valid forward transition (`status`) |
| PATCH | `/api/complaints/admin/:id/response` | Admin response (`adminResponse`) |
| GET | `/api/notifications` | Current user's notifications |
| PATCH | `/api/notifications/:id/read` | Mark one notification read |
| PATCH | `/api/notifications/read-all` | Mark all read |
