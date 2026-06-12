# Assignment

Project management app with a React frontend, GraphQL backend, Prisma, and MySQL.

## Installation

Install dependencies for both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

### Backend

Create `backend/.env` from `backend/.env.example` and fill in the values:

```env
DATABASE_URL=
JWT_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

Notes:
- `DATABASE_URL` should point to your MySQL database.
- `EMAIL_*` is used for invitation emails.
- `FRONTEND_URL` and `BACKEND_URL` are used to build invitation links.

### Frontend

The frontend uses a local API URL by default:

```ts
http://localhost:4000/api
```

If you change the backend host or port, update `frontend/src/api/api.ts`.

## Database Setup

1. Start MySQL locally.
2. Create a database for the project.
3. Set `DATABASE_URL` in `backend/.env`.
4. Generate the Prisma client:

```bash
cd backend
npx prisma generate
```

5. Push the Prisma schema to the database:

```bash
npx prisma db push
```

If you prefer migrations, you can use Prisma migrate instead, but `db push` is the quickest setup for this project.

## Running The Application

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Backend runs on `http://localhost:4000`.
Frontend runs on `http://localhost:5173`.

## Running Tests

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm run test
```

## What The Tests Cover

- Authentication
- Registration
- Login
- Access to protected operations
- Invitation acceptance
- Rejected invitation
- Prevention of duplicate active invitations
- Frontend invitation creation flow

