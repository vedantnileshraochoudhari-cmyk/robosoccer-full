export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdvancementEmail } from "@/lib/email";

export async function GET() {
  try {
     await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Match" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "round" INTEGER NOT NULL,
        "team1Id" INTEGER NOT NULL,
        "team2Id" INTEGER,
        "score1" INTEGER,
        "score2" INTEGER,
        "winnerId" INTEGER,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "isBye" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL
      );
    `).catch(() => {});

    const matches = await prisma.match.findMany({
      include: { team1: true, team2: true, winner: true },
      orderBy: [{ round: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(matches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { round, team1Id, team2Id, isBye } = body;
  if (!round || !team1Id) {
    return NextResponse.json({ error: "round and team1Id required" }, { status: 400 });
  }

  // Block creation if the round is closed
  const closedSetting = await prisma.settings.findUnique({ where: { key: "closed_rounds" } });
  const closedRounds: number[] = closedSetting ? JSON.parse(closedSetting.value) : [];
  if (closedRounds.includes(Number(round))) {
    return NextResponse.json({ error: `Round ${round} is closed. No new matches can be added.` }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      round: Number(round),
      team1Id: Number(team1Id),
      team2Id: team2Id ? Number(team2Id) : null,
      isBye: !!isBye,
      winnerId: isBye ? Number(team1Id) : null,
      status: isBye ? "completed" : "pending",
    },
    include: { team1: true, team2: true, winner: true },
  });
  return NextResponse.json(match);
}

export async function PATCH(req: NextRequest) {
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { id, score1, score2 } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const match = await prisma.match.findUnique({
    where: { id: Number(id) },
    include: { team1: true, team2: true },
  });
  if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });

  const s1 = Number(score1);
  const s2 = Number(score2);
  if (s1 === s2) {
    return NextResponse.json({ error: "Draws are not allowed. Scores must differ." }, { status: 400 });
  }

  const winnerId = s1 > s2 ? match.team1Id : match.team2Id!;

  const updated = await prisma.match.update({
    where: { id: Number(id) },
    data: { score1: s1, score2: s2, winnerId, status: "completed" },
    include: { team1: true, team2: true, winner: true },
  });

  // Determine email context
  const currentRound = updated.round;
  const allMatches = await prisma.match.findMany({
    where: { status: "completed" },
    include: { winner: true },
  });
  const winners = allMatches.map((m: typeof allMatches[0]) => m.winner).filter(Boolean);
  const uniqueWinners = [...new Map(winners.map((w) => [w!.id, w])).values()];

  let subject = "RoboSoccer — You Advanced to the Next Round!";
  let body2 = "";
  const teamName = updated.winner!.name;

  if (uniqueWinners.length === 1) {
    subject = "🏆 RoboSoccer — You Are the Champion!";
    body2 = `Congratulations ${teamName}! You have won the RoboSoccer tournament at Tectonics! You are the Champions! — Team Tectonics`;
  } else if (uniqueWinners.length <= 4 && uniqueWinners.length > 2) {
    subject = "RoboSoccer — You Made it to the Semifinals!";
    body2 = `Congratulations ${teamName}! You have qualified for the Semifinals of RoboSoccer at Tectonics! We will notify you about your match soon. — Team Tectonics`;
  } else if (uniqueWinners.length === 2) {
    subject = "RoboSoccer — You Made it to the Finals!";
    body2 = `Congratulations ${teamName}! You have qualified for the Grand Final of RoboSoccer at Tectonics! Get ready to fight for the championship! — Team Tectonics`;
  } else {
    body2 = `Congratulations ${teamName}! You have won your Round ${currentRound} match and advanced. We will notify you about your next match soon. — Team Tectonics`;
  }

  if (updated.winner?.gmail) {
    await sendAdvancementEmail(updated.winner.gmail, subject, body2).catch(console.error);
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.match.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
