# AssignHub

AssignHub is a responsive assignment management application for students and teachers. It provides account registration and login, assignment publishing and management, student file submissions, and teacher grading with feedback. Data is persisted in MongoDB; submission files are stored privately by the backend and are only available through authenticated download routes.

## Technology

- Frontend: React, Vite, React Router, Fetch API
- Backend: Node.js, Express, Mongoose, MongoDB
- Authentication: JWT in an HttpOnly cookie; passwords hashed with bcrypt
- Uploads: Multer, private local storage (10 MB maximum)

## Project structure

```text
frontend/
  public/
  src/
    components/  context/  hooks/  layouts/  pages/
    services/    utils/    App.jsx  main.jsx  styles.css
  package.json
backend/
  config/ controllers/ middleware/ models/ routes/ services/ utils/
  uploads/ app.js  server.js  package.json
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB Community Server or a MongoDB Atlas database

## Configure environment

From the project root, copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` and a private random `JWT_SECRET` (at least 32 characters). Do not commit `.env` files.

Set `FRONTEND_URL` to the exact origin used by Vite (default `http://localhost:5173`). If the frontend uses a different origin, set `VITE_API_URL` in `frontend/.env` to the API base URL, such as `http://localhost:5000/api`.

## Install and run

In one terminal:

```bash
cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL. The backend connects to MongoDB before it starts listening; startup fails with an explicit error when the database or required environment values are unavailable. For a production frontend bundle, run `npm run build` in `frontend`.

## API

All API routes are prefixed with `/api`. Protected routes require the session cookie set by login/register.

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | API health |
| POST | `/auth/register` | Public | Register a Student or Teacher |
| POST | `/auth/login` | Public | Sign in |
| GET | `/auth/me` | Signed in | Read current account |
| POST | `/auth/logout` | Public | Clear session cookie |
| GET | `/assignments` | Signed in | List assignments visible to the account |
| POST | `/assignments` | Teacher | Create an assignment |
| PATCH | `/assignments/:id` | Owning Teacher | Update an assignment |
| DELETE | `/assignments/:id` | Owning Teacher | Delete assignment and its submissions |
| GET | `/submissions` | Signed in | List own submissions or submissions for teacher-owned assignments |
| POST | `/submissions/assignments/:assignmentId` | Student | Submit/replace an assignment file (`file` multipart field) |
| PATCH | `/submissions/:id/evaluation` | Owning Teacher | Save marks and feedback |
| DELETE | `/submissions/:id` | Owner / owning Teacher | Delete an eligible submission |
| GET | `/submissions/:id/file` | Submission owner / owning Teacher | Download a submission |
| GET | `/submissions/students` | Teacher | List students who have submitted work |

JSON errors use `{ "message": "..." }`. Uploads accept PDF, DOC, DOCX, TXT, JPG, JPEG, or PNG files up to 10 MB.

## Scripts

- `frontend`: `npm run dev`, `npm run build`, `npm run preview`
- `backend`: `npm run dev`, `npm start`, `npm run check`

To deploy, configure HTTPS, a production MongoDB URI, a strong private JWT secret, and the deployed frontend origin. For multi-instance deployments, replace local upload storage with a private object-storage service.
