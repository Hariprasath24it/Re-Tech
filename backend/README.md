# ReTech Backend Database Setup

## MongoDB Atlas

1. Create or select an Atlas project and cluster.
2. Create a database user with a strong password. This database user is separate from ReTech application users.
3. In Network Access, allow the development machine's current public IP. Avoid allowing access from every IP unless a temporary, controlled test specifically requires it.
4. In the cluster's Connect dialog, choose Drivers and copy the Node.js connection URI.
5. Copy `.env.example` to `.env` in this directory.
6. Set `MONGO_URI` in `.env` to the Atlas URI. Replace the username, password, cluster host, and database placeholders. URL-encode reserved characters in the username or password.
7. Set `JWT_SECRET` to a generated, long random value. Keep `.env` private and do not commit it.
8. Install dependencies with `npm install`, then start the API with `npm run dev`.

When `MONGO_URI` is configured, startup connects only to that database. Connection errors stop startup; they never trigger an in-memory fallback. When `MONGO_URI` is absent, the temporary database is allowed only with `NODE_ENV=development`, and the API reports that its data will be lost on restart.

## Seed Data

`npm run seed` is restricted to `NODE_ENV=development`, connects using the same `MONGO_URI` in `.env`, and requires a `DEMO_PASSWORD` of at least 12 characters. The seed routine clears existing ReTech collections before inserting demo data. Run it only against a disposable development database. Automatic demo seeding is disabled outside development.

## Persistence Check

Start the API and confirm its MongoDB connection message identifies the expected Atlas cluster. Sign in with an existing or seeded development account, create a device, stop and restart the API, and confirm the device remains available. Do not run the seed routine against data that must be preserved.