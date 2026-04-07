export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "rs_session";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 10, // 10 hours
};

export async function POST(req: NextRequest) {
  const { action, role, password } = await req.json();

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (action === "login") {
    const adminPass = process.env.ADMIN_PASSWORD || "tectonics2025";
    const volunteerPass = process.env.VOLUNTEER_PASSWORD || "volunteer2025";

    if (role === "admin") {
      if (password !== adminPass) {
        return NextResponse.json({ error: "Wrong admin password" }, { status: 401 });
      }
      const res = NextResponse.json({ ok: true, role: "admin" });
      res.cookies.set(SESSION_COOKIE, "admin", COOKIE_OPTS);
      return res;
    }

    if (role === "volunteer") {
      if (password !== volunteerPass) {
        return NextResponse.json({ error: "Wrong volunteer password" }, { status: 401 });
      }
      const res = NextResponse.json({ ok: true, role: "volunteer" });
      res.cookies.set(SESSION_COOKIE, "volunteer", COOKIE_OPTS);
      return res;
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
