import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, team } = body; // team: "A" or "B"

    if (!matchId || !team) {
      return NextResponse.json({ error: "matchId and team required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: Number(matchId) },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status !== "live") {
      return NextResponse.json({ error: "Goal ignored: Match is not live" }, { status: 400 });
    }

    const updateData: any = {};
    if (team === "A") {
      updateData.score1 = (match.score1 || 0) + 1;
    } else if (team === "B") {
      updateData.score2 = (match.score2 || 0) + 1;
    } else {
      return NextResponse.json({ error: "Invalid team. Use 'A' or 'B'" }, { status: 400 });
    }

    const updated = await prisma.match.update({
      where: { id: match.id },
      data: updateData,
      include: { team1: true, team2: true },
    });

    // In a real Socket.io setup, we would emit('scoreUpdate', updated) here.
    // Since we are using polling for stability in this demo, the DB update is enough.

    return NextResponse.json({ success: true, match: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
