export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Attempt to create tables if they don't exist (primitive migration)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Team" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "gmail" TEXT NOT NULL UNIQUE,
        "members" TEXT NOT NULL,
        "college" TEXT NOT NULL,
        "present" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const teams = await prisma.team.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(teams);
  } catch (error: any) {
    console.error("Prisma Error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { name, gmail, members, college } = body;
  if (!name || !gmail) {
    return NextResponse.json({ error: "name and gmail required" }, { status: 400 });
  }
  try {
    const team = await prisma.team.create({
      data: {
        name,
        gmail,
        members: JSON.stringify(members || []),
        college: college || "",
      },
    });
    return NextResponse.json(team);
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Gmail already registered" }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(req: NextRequest) {
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (data.members && Array.isArray(data.members)) {
    data.members = JSON.stringify(data.members);
  }
  const team = await prisma.team.update({ where: { id: Number(id) }, data });
  return NextResponse.json(team);
}

export async function DELETE(req: NextRequest) {
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.team.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
