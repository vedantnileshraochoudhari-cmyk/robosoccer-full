export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
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
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Gmail already registered" }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(req: NextRequest) {
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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.team.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
