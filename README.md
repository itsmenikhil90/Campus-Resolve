# AI-COMPLY

AI-COMPLY is a standalone, AI-assisted complaint management platform. Users can submit and track complaints, while administrators review recommendations, manage workflows, and make final decisions.

## Run locally

1. Install Node.js and MongoDB.
2. Create `backend/.env` with `PORT`, `MONGO_URI`, and a long random `JWT_SECRET`.
3. Start the backend:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

4. Open `http://localhost:5000`.

To create an administrator, add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to `backend/.env`, then run `node createAdmin.js` from the `backend` directory. Forgot-password emails require `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`.

The backend serves the frontend and API from the same origin, which is allowed automatically. If hosting the frontend separately, set `window.AI_COMPLY_API_BASE` before loading `script.js` and `portal.js`, and add the frontend origin to `FRONTEND_URL`.

After login, users can submit and track their own complaints. Administrators receive dashboard, search, approval/rejection, response, and workflow controls.

Workflow: `Pending Approval → Under Review → Assigned → In Progress → Resolved`; rejection is terminal. Status changes and notifications are stored in MongoDB.

## Production deployment

The production server intentionally refuses to start with incomplete settings. Copy the variable names from `backend/.env.example` into your hosting provider's secret manager; never commit real credentials.

Required production services:

- **MongoDB:** use a managed production cluster, TLS, backups, and a least-privilege database user. `MONGO_URI` must not point to localhost.
- **Admin account:** provision the first admin with `ADMIN_EMAIL` and `ADMIN_PASSWORD` using `node createAdmin.js` before starting the web service. The startup check refuses to run without an admin account; remove the bootstrap credentials from the service environment after provisioning.
- **JWT:** set `JWT_SECRET` to a unique random value of at least 32 characters. For example, generate one with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
- **Password reset email:** configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`. The app checks the SMTP connection in its readiness endpoint.
- **Attachments:** set `STORAGE_DRIVER=s3`, `S3_BUCKET`, and `AWS_REGION`. Use a private S3-compatible bucket with provider-side encryption at rest enabled. For Cloudflare R2 or another custom endpoint, also configure `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. For AWS, use the host's IAM role where available. Attachments are streamed only through an authenticated, ownership-checked endpoint; local disk storage is development-only.
- **AI analysis:** set `AI_ENABLED=true` and `OPENAI_API_KEY`; `OPENAI_MODEL` defaults to `gpt-4.1-mini`. The readiness endpoint verifies model access. If AI is intentionally not part of the deployment, remove that requirement only after updating the production config policy and product copy.

Set `NODE_ENV=production`, `PORT`, and `FRONTEND_URL` to the public HTTPS frontend origin(s), comma-separated. Include the public origin even when the backend also serves the frontend, since most hosts terminate TLS at a reverse proxy. Run `npm run check:production-config` from `backend` before deployment. Configure the platform's readiness probe to `GET /api/health/ready`; `/api/health` is a liveness check and does not prove external services are ready.

Deploy `backend` as a Node web service using the included `Procfile` or `Dockerfile`. The Docker image uses `npm ci --omit=dev`. Run `npm test` before publishing. Persist the database and S3 objects independently of app instances.

## Local test

Run `npm test` from `backend`. Local development can use MongoDB and `STORAGE_DRIVER=local`; email and AI features require their respective provider settings.
