# Campus Resolve API

All protected endpoints need `Authorization: Bearer <jwt>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login; response contains token and role |
| POST | `/api/auth/forgot-password` | Request reset email |
| POST | `/api/auth/reset-password/:token` | Reset password with the emailed OTP |
| POST | `/api/complaints` | User creates complaint (`title`, `description`, category, priority, department) |
| GET | `/api/complaints/my` | Current user's complaints, including administrator responses |
| GET | `/api/complaints/:id` | Owner or admin reads one complaint/history and response history |
| GET | `/api/complaints/admin/all` | Admin list; supports search and filters |
| GET | `/api/complaints/admin/stats` | Admin analytics/statistics |
| PATCH | `/api/complaints/admin/:id/approve` | Admin approves pending complaint |
| PATCH | `/api/complaints/admin/:id/reject` | Admin rejects with `rejectionReason` |
| PATCH | `/api/complaints/admin/:id/assign` | Admin assigns (`assignedTo`) |
| PATCH | `/api/complaints/admin/:id/status` | Valid forward transition (`status`) |
| PATCH | `/api/complaints/admin/:id/response` | Admin sends a response to the complaint owner; response is added to the user's Responses section |
| GET | `/api/notifications` | Current user's notifications |
| PATCH | `/api/notifications/:id/read` | Mark one notification read |
| PATCH | `/api/notifications/read-all` | Mark all read |
| POST | `/api/chatbot` | Ask the FAQ assistant; optionally send a bearer token for authorized complaint lookup. Body: `{ "message": "...", "history": [] }` |

Chat requests are limited to 20 per IP per 15 minutes. When AI is enabled, messages and up to eight recent turns are sent to the configured OpenAI model. Complaint details are included only when relevant; regular users are restricted to their own records, while administrators can query complaint records. When AI is disabled, supported FAQs and complaint lookups use local responses.
