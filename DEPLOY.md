# DwaTrack — Railway Deployment Guide

## Prerequisites
- Code pushed to a GitHub repository
- Railway account (railway.app)
- Existing Railway PostgreSQL service

---

## Step 1 — Push to GitHub

```bash
cd C:\Users\user\Desktop\KoboTrack
git add .
git commit -m "DwaTrack ready for deployment"
git push
```

---

## Step 2 — Deploy the Backend

1. Railway → your project → **New Service** → **GitHub Repo**
2. Select your repo
3. Set **Root Directory** → `server`
4. Railway detects `server/railway.toml` automatically
5. Add these **environment variables** in Railway:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(link to your Railway PostgreSQL — Railway fills this automatically)* |
| `JWT_SECRET` | *(copy from server/.env)* |
| `CLIENT_URL` | *(fill in after frontend deploys — see Step 4)* |
| `PORT` | `5000` |

6. Deploy → Railway gives you a URL e.g. `https://dwatrack-backend.up.railway.app`

---

## Step 3 — Deploy the Frontend

1. Railway → **New Service** → **GitHub Repo** (same repo)
2. Root Directory → leave **empty** (project root)
3. Railway detects `railway.toml` automatically
4. Add this **environment variable**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://dwatrack-backend.up.railway.app/api` |

5. Deploy → Railway gives you a URL e.g. `https://dwatrack.up.railway.app`

---

## Step 4 — Connect Frontend ↔ Backend

Go back to your **backend service** → Variables → update:

| Variable | Value |
|---|---|
| `CLIENT_URL` | `https://dwatrack.up.railway.app` |

Redeploy the backend service.

---

## Done

Your full stack is live:
- Frontend: `https://dwatrack.up.railway.app`
- Backend API: `https://dwatrack-backend.up.railway.app/api`
- Database: Railway PostgreSQL (already running)
