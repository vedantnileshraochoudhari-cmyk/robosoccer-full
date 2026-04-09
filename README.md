# RoboSoccer Tournament — Tectonics

A real-time tournament management system for a college fest RoboSoccer event.

- **Frontend**: Next.js on Vercel
- **Backend**: Express.js + Socket.io + Prisma on Render
- **Database**: PostgreSQL on Neon (neon.tech)

---

## Local Development

### Prerequisites
- Node.js 18+
- A Neon PostgreSQL database (or local PostgreSQL)

### Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, FRONTEND_URL
npm install
npx prisma db push          # creates tables in your Postgres DB
npm run dev                 # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                 # starts on http://localhost:3000
```

---

## Deployment

### 1. Set up PostgreSQL on Neon

1. Go to [neon.tech](https://neon.tech) and create a free project.
2. Copy the **Connection string** from the dashboard — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Keep this for the Render step below.

---

### 2. Deploy Backend to Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
4. Add these **Environment Variables** in Render's dashboard:

   | Key            | Value                                               |
   |----------------|-----------------------------------------------------|
   | `DATABASE_URL` | Your Neon connection string                         |
   | `PORT`         | `5000`                                              |
   | `FRONTEND_URL` | Your Vercel URL (e.g. `https://robosoccer.vercel.app`) — add after step 3 |

5. Deploy. Your backend URL will be `https://<service-name>.onrender.com`.

**Keeping Render alive (free tier spins down after 15 min):**
- Go to [uptimerobot.com](https://uptimerobot.com) → New Monitor → HTTP(S)
- URL: `https://<service-name>.onrender.com/health`
- Interval: every 5 minutes

---

### 3. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Set **Root Directory** to `frontend`.
3. Add these **Environment Variables** in Vercel's dashboard:

   | Key                    | Value                                                     |
   |------------------------|-----------------------------------------------------------|
   | `NEXT_PUBLIC_API_URL`  | `https://<service-name>.onrender.com/api`                 |
   | `GMAIL_USER`           | Your Gmail address                                        |
   | `GMAIL_PASS`           | Your [Gmail App Password](https://myaccount.google.com/apppasswords) |

4. Deploy. Note your Vercel URL (e.g. `https://robosoccer.vercel.app`).
5. **Go back to Render** and update the `FRONTEND_URL` env var to your Vercel URL, then redeploy.

---

### 4. Verify

- `https://<render-url>.onrender.com/health` → `{"status":"ok"}`
- `https://<render-url>.onrender.com/api/teams` → `[]`
- `https://your-app.vercel.app` → dashboard loads and connects to backend

---

## Project Structure

```
robosoccer-full/
├── backend/
│   ├── prisma/schema.prisma   # PostgreSQL schema
│   ├── routes/
│   │   ├── teamRoutes.js
│   │   ├── matchRoutes.js
│   │   └── goalRoutes.js
│   ├── server.js              # Express + Socket.io entry point
│   └── .env.example
├── frontend/
│   ├── app/                   # Next.js pages
│   ├── components/
│   ├── lib/
│   │   ├── api.ts             # Backend API URL config
│   │   └── email.ts           # Nodemailer email sender
│   └── .env.example
└── database/                  # Legacy SQLite (not used in production)
```

## Environment Variables Reference

See [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example).
