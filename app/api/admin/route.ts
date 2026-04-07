export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // Auth: must have admin session cookie
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "reset") {
    await prisma.match.deleteMany({});
    await prisma.team.updateMany({ data: { present: false } });
    return NextResponse.json({ ok: true, message: "Tournament reset. All matches deleted, attendance cleared." });
  }

  if (action === "reset_full") {
    await prisma.match.deleteMany({});
    await prisma.team.deleteMany({});
    return NextResponse.json({ ok: true, message: "Full reset. All teams and matches deleted." });
  }

  if (action === "export") {
    const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
    const matches = await prisma.match.findMany({
      include: { team1: true, team2: true, winner: true },
      orderBy: [{ round: "asc" }, { createdAt: "asc" }],
    });

    const teamLines = ["--- TEAMS ---", "ID,Name,Gmail,College,Members,Present"];
    for (const t of teams) {
      const members = JSON.parse(t.members || "[]").join("; ");
      teamLines.push(`${t.id},"${t.name}","${t.gmail}","${t.college}","${members}",${t.present}`);
    }

    const matchLines = ["", "--- MATCHES ---", "Round,Team1,Score1,Score2,Team2,Winner,Status"];
    for (const m of matches) {
      matchLines.push(
        `${m.round},"${m.team1.name}",${m.score1 ?? ""},${m.score2 ?? ""},"${m.team2?.name ?? "BYE"}","${m.winner?.name ?? ""}","${m.status}"`
      );
    }

    const csv = [...teamLines, ...matchLines].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="tournament_results.csv"',
      },
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
