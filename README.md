# Chit-Chat

> A realtime social chat app with verified accounts, connection-based messaging, live presence, profile pages, and notification flow.

Chit-Chat is a full-stack MERN application built for conversations that feel immediate but stay intentional. Users verify their email with OTP before entering the app, connect with other people, chat in realtime, see online presence, and receive live notifications when something needs their attention.

## What It Does

- Email OTP verification before a user gets a live session
- JWT auth with protected backend routes
- Realtime messaging with Socket.IO
- Online user presence
- Connection requests and relationship states
- Live notifications for requests, accepts, and messages
- Profile pages with Cloudinary image upload
- Responsive React UI with Tailwind CSS, DaisyUI, Zustand, and Lucide icons

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, DaisyUI, Zustand, Axios, Socket.IO Client  
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Socket.IO  
**Services:** Brevo SMTP for OTP email, Cloudinary for profile images

## Project Structure

```txt
chat-app/
  backend/
    src/
      controllers/
      lib/
      middleware/
      models/
      routes/
      index.js
  frontend/
    src/
      components/
      pages/
      store/
      lib/
  README.md
```

## Environment Variables

Create `backend/.env` locally:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/chat-app
JWT_SECRET=replace_with_a_strong_secret
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_smtp_login
SMTP_PASS=your_brevo_smtp_key
EMAIL_FROM=Chit Chat <your_verified_sender_email>
```

For production, set these variables in your host dashboard instead of committing `.env`.

## Run Locally

Install backend dependencies:

```bash
cd backend
npm install
npm run dev
```

Install frontend dependencies in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite, usually at:

```txt
http://localhost:5173
```

Backend runs at:

```txt
http://localhost:5001
```

## Production Build

From the project root:

```bash
npm run build
npm start
```

The backend serves the frontend build in production.

## Deployment Notes

Render works well for this app. Add your production environment variables in Render's Environment tab.

For Brevo, create an SMTP key in your Brevo dashboard and use the SMTP values in your Render environment variables:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_smtp_login
SMTP_PASS=your_brevo_smtp_key
EMAIL_FROM=Chit Chat <your_verified_sender_email>
```

If the frontend and backend are hosted on different origins, update backend CORS and cookie settings for the production frontend URL.

## Security Notes

- Keep `.env` files out of git.
- Rotate any API keys that were ever pasted into chat, screenshots, or logs.
- Use a long random `JWT_SECRET` in production.
- Use a verified sender or domain in Brevo for better deliverability.

## Scripts

Root:

```bash
npm run build
npm start
```

Backend:

```bash
npm run dev
npm start
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

## Author

Built by Rajan Chaudhary.
