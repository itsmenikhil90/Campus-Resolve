# AI-COMPLY

AI-assisted grievance management for Ambalika Institute. Students submit and track database-backed complaints; administrators review AI recommendations and retain the final approval decision.

## Run

1. Copy `backend/.env.example` to `backend/.env` and set a production MongoDB URI and a long random `JWT_SECRET`.
2. `cd backend && npm install && npm run dev`
3. Open `http://localhost:5000`; the backend serves the frontend and API from the same origin. A separate static frontend is optional; if used, set `window.AIMT_API_BASE` before loading `script.js` and `portal.js`, and add its origin to `FRONTEND_URL`.

After login, users are sent to `portal.html`: students see only their records; administrators receive dashboard, search, pending review, approval/rejection, response, and workflow controls.

Workflow: `Pending Approval → Under Review → Assigned → In Progress → Resolved`; rejection is terminal. Status changes and notifications are stored in MongoDB.

## Deployment

Deploy `backend` as a Node web service using `Procfile` or `Dockerfile`. The backend serves `frontend/` directly, so one web service is enough. Set `PORT`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, and SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`) in the host's secret/environment settings; SMTP is required for forgot-password OTP emails. `FRONTEND_URL` accepts comma-separated origins when the frontend is hosted separately. Do not commit `.env` or upload files as a permanent production store; use object storage for durable production attachments.
