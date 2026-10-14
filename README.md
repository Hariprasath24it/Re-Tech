# ReTech

ReTech is a MERN-based e-waste management platform for tracking collection, repair, reuse, recycling, rewards, and notifications across multiple user roles.

## Features

- User registration and login with JWT-based authentication
- Role-based access for users, collectors, technicians, and admins
- Device registration and tracking with QR code support
- Pickup request, assignment, collection, and completion workflows
- Technician inspection, repair, quality checks, reuse, and recycling routing
- Reward calculation and notification updates
- Admin dashboard, analytics, user management, and lifecycle oversight
- Public tracking page with privacy-safe device status access

## Technology Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT + bcryptjs
- Data visualization: Recharts
- QR generation: qrcode
- API client: Axios

## Roles

- User / Customer
- Collector / Collection Agent
- Technician
- Admin

## Architecture

- Frontend SPA in `frontend/src`
- Backend API in `backend/src`
- MongoDB models and business logic in `backend/src/models` and `backend/src/controllers`
- Protected routes enforced by auth and role middleware
- CORS and environment-based configuration managed through backend environment variables

## Lifecycle Overview

- User device registration
- Pickup request
- Collection and receipt
- Inspection and repair or recycling decision
- Reuse or recycling completion
- Final terminal status: `REUSED` or `RECYCLED`

## Environment Setup

Create a local `.env` file in `backend/` using the values from `backend/.env.example`.

Required variables:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `NODE_ENV`
- `DEMO_PASSWORD` (development only)

Important security notes:

- Never commit `.env` files
- Never expose MongoDB credentials or JWT secrets in the repository or terminal output
- Keep the database username/password and Atlas network access restricted to the required IPs

## MongoDB Atlas Setup

1. Create or select a MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Allow the current machine public IP in Atlas Network Access.
4. Copy the MongoDB connection string from the Atlas Drivers section.
5. Put it in `backend/.env` as `MONGO_URI`.
6. Confirm the database cluster is reachable before running the API.

Note: The app is designed to use MongoDB Atlas when `MONGO_URI` is configured. It intentionally does not silently replace a configured database with an in-memory fallback.

## Startup

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

API base URL:

- http://localhost:5000/api
- Frontend: http://localhost:5173

## Testing

Run the project checks and confirm they pass in the active environment:

```bash
cd backend
node --check src/server.js
node --check src/app.js
node --check src/config/db.js
node src/server.js
```

```bash
cd frontend
npm run build
npm run lint
```

## Current Operational Note

The application codebase is in good shape for build and static validation, but the live backend depends on a working MongoDB Atlas connection. In the current environment, the configured Atlas DNS/host is not reachable, so backend startup is blocked by an external database connectivity issue rather than by a code-level bug.

## Demo Readiness

This project is close to demo-ready from a code and UI standpoint, but live end-to-end testing requires a functioning Atlas cluster and a reachable network path.
