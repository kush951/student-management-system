# Student Information Management System

A beginner-friendly three-tier cloud project:
- Frontend: HTML, CSS, JavaScript (deploy to Netlify)
- Backend: Node.js + Express + Mongoose (deploy to Render)
- Database: MongoDB Atlas

## Requirements
Install Node.js LTS from https://nodejs.org/ and use a recent version. Create a MongoDB Atlas account at https://www.mongodb.com/atlas/database.

## Run the backend locally
1. Open a terminal in the `backend` folder.
2. Run `npm install`.
3. Copy `.env.example` to a new file named `.env`.
4. Replace `MONGODB_URI` in `.env` with the connection string from MongoDB Atlas. Replace `<password>` with the database user's password and URL-encode special characters in the password if needed.
5. Set `FRONTEND_URL=http://127.0.0.1:5500`.
6. Run `npm start`. It should print `Connected to MongoDB Atlas` and `API running on port 5000`.

Never share or commit `.env`; it contains credentials.

## Run the frontend locally
Serve the `frontend` folder using VS Code's Live Server extension on `http://127.0.0.1:5500`. Avoid opening `index.html` as a `file://` URL because browser security can block requests.
The frontend initially points to `http://localhost:5000`.

## Deploy
1. Create a MongoDB Atlas database user and allow network access for Render. For a simple learning setup, Atlas's `0.0.0.0/0` access rule can be used temporarily with a strong database password; restrict it when feasible. Never use this with a weak password.
2. Push the project to a GitHub repository. Do not commit `.env`.
3. In Render, create a Web Service from the repository, set Root Directory to `backend`, Build Command to `npm install`, Start Command to `npm start`, and add environment variables `MONGODB_URI` and `FRONTEND_URL` (temporary value can be `http://127.0.0.1:5500` until Netlify is deployed).
4. Copy the Render service URL, e.g. `https://your-service.onrender.com`.
5. In `frontend/app.js`, replace `http://localhost:5000` in `API_BASE_URL` with the actual Render URL. Commit and push this change.
6. Deploy the `frontend` folder on Netlify (or configure the site's base/publish directory as `frontend`).
7. Copy the Netlify site URL and update Render's `FRONTEND_URL` environment variable to that exact URL. Redeploy/restart the Render service if prompted.
8. Test adding, listing, editing and deleting records. Check the `studentDB` database and `students` collection in Atlas.

## API endpoints
- `GET /api/health`
- `GET /api/students`
- `GET /api/students/:id`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
