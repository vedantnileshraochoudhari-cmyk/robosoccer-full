export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const matches = await prisma.match.findMany({
    where: { status: "completed" },
    include: { team1: true, team2: true, winner: true },
    orderBy: [{ round: "asc" }, { createdAt: "asc" }],
  });

  // Group by round
  const byRound: Record<number, typeof matches> = {};
  for (const m of matches) {
    if (!byRound[m.round]) byRound[m.round] = [];
    byRound[m.round].push(m);
  }

  const totalGoals = matches.reduce((sum, m) => sum + (m.score1 ?? 0) + (m.score2 ?? 0), 0);

  return NextResponse.json({
    matches,
    byRound,
    stats: {
      total: matches.length,
      completed: matches.length,
      goals: totalGoals,
    },
  });
}
