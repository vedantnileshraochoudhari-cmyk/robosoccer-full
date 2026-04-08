export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTINGS_KEY = "closed_rounds";

async function getClosedRounds(): Promise<number[]> {
  const s = await prisma.settings.findUnique({ where: { key: SETTINGS_KEY } });
  return s ? (JSON.parse(s.value) as number[]) : [];
}

async function setClosedRounds(rounds: number[]) {
  await prisma.settings.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(rounds) },
    create: { key: SETTINGS_KEY, value: JSON.stringify(rounds) },
  });
}

export async function GET() {
  const closedRounds = await getClosedRounds();
  return NextResponse.json({ closedRounds });
}

export async function POST(req: NextRequest) {
  const role = req.cookies.get("rs_session")?.value;
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { action, round } = await req.json();

  if (action !== "close") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const closedRounds = await getClosedRounds();
  if (closedRounds.includes(Number(round))) {
    return NextResponse.json({ error: `Round ${round} is already closed` }, { status: 400 });
  }

  // Fetch all matches in this round
  const roundMatches = await prisma.match.findMany({
    where: { round: Number(round) },
    include: { team1: true, team2: true, winner: true },
    orderBy: { createdAt: "asc" },
  });

  // Collect winners in match-creation order
  const winnersInOrder: { id: number; name: string }[] = [];
  const seen = new Set<number>();
  for (const m of roundMatches) {
    if (m.status === "completed" && m.winner && !seen.has(m.winner.id)) {
      winnersInOrder.push(m.winner);
      seen.add(m.winner.id);
    }
  }

  if (winnersInOrder.length < 2) {
    return NextResponse.json({ error: "Need at least 2 winners to close this round" }, { status: 400 });
  }

  // Calculate total goals scored by each winner in the tournament
  const allCompletedMatches = await prisma.match.findMany({
    where: { status: "completed" },
  });

  const goalsByTeam = new Map<number, number>();
  for (const m of allCompletedMatches) {
    goalsByTeam.set(m.team1Id, (goalsByTeam.get(m.team1Id) ?? 0) + (m.score1 ?? 0));
    if (m.team2Id != null) {
      goalsByTeam.set(m.team2Id, (goalsByTeam.get(m.team2Id) ?? 0) + (m.score2 ?? 0));
    }
  }

  const goalsOf = (id: number) => goalsByTeam.get(id) ?? 0;

  // Sort by goals descending (for seeding / bye assignment)
  const seeded = [...winnersInOrder].sort((a, b) => goalsOf(b.id) - goalsOf(a.id));

  const nextRound = Number(round) + 1;
  const matchData: { team1Id: number; team2Id?: number; isBye: boolean }[] = [];

  if (winnersInOrder.length === 2) {
    // Grand Final
    matchData.push({ team1Id: seeded[0].id, team2Id: seeded[1].id, isBye: false });
  } else if (winnersInOrder.length === 4) {
    // Semifinals — seed: 1v4, 2v3
    matchData.push({ team1Id: seeded[0].id, team2Id: seeded[3].id, isBye: false });
    matchData.push({ team1Id: seeded[1].id, team2Id: seeded[2].id, isBye: false });
  } else {
    // General case
    let pool = [...winnersInOrder]; // creation-order pairing
    if (pool.length % 2 !== 0) {
      // Highest scorer gets the bye
      const byeTeam = seeded[0];
      pool = pool.filter((w) => w.id !== byeTeam.id);
      matchData.push({ team1Id: byeTeam.id, isBye: true });
    }
    for (let i = 0; i < pool.length; i += 2) {
      matchData.push({ team1Id: pool[i].id, team2Id: pool[i + 1].id, isBye: false });
    }
  }

  // Mark round as closed
  await setClosedRounds([...closedRounds, Number(round)]);

  // Create next-round matches
  for (const md of matchData) {
    await prisma.match.create({
      data: {
        round: nextRound,
        team1Id: md.team1Id,
        team2Id: md.team2Id ?? null,
        isBye: md.isBye,
        winnerId: md.isBye ? md.team1Id : null,
        status: md.isBye ? "completed" : "pending",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    closedRound: round,
    nextRound,
    matchesCreated: matchData.length,
  });
}
