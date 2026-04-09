// ─── Base API URL ─────────────────────────────────────────────────────────────
// Points to the deployed Render backend. For local dev, set NEXT_PUBLIC_API_URL
// in your .env.local to http://localhost:5000/api
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://robosoccer-api.onrender.com/api";
