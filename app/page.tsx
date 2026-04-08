import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const role = cookieStore.get("rs_session")?.value ?? null;
  const [teams, matches] = await Promise.all([
    prisma.team.findMany(),
    prisma.match.findMany({ include: { team1: true, team2: true, winner: true } }),
  ]);

  const presentTeams = teams.filter((t) => t.present);
  const completedMatches = matches.filter((m) => m.status === "completed");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming" || m.status === "live");
  const totalGoals = completedMatches.reduce((s, m) => s + (m.score1 ?? 0) + (m.score2 ?? 0), 0);
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const currentRound = rounds.length > 0 ? Math.max(...rounds) : 0;

  const winners = completedMatches.map((m) => m.winner).filter(Boolean);
  const uniqueWinners = [...new Map(winners.map((w) => [w!.id, w])).values()];
  let stage = "Not Started";
  if (uniqueWinners.length === 1 && completedMatches.length > 0) stage = "Champion Crowned 🏆";
  else if (uniqueWinners.length === 2) stage = "Finals";
  else if (uniqueWinners.length <= 4 && uniqueWinners.length > 2) stage = "Semifinals";
  else if (currentRound >= 1) stage = `Round ${currentRound}`;

  const stats = [
    { label: "Registered Teams", value: teams.length, sub: `${presentTeams.length} present`, icon: "🏟️" },
    { label: "Matches Played", value: completedMatches.length, sub: `${upcomingMatches.length} remaining`, icon: "⚽" },
    { label: "Total Goals", value: totalGoals, sub: "across all rounds", icon: "🎯" },
    {
      label: "Tournament Stage",
      value: stage === "Not Started" ? "—" : stage,
      sub: currentRound ? `Round ${currentRound} active` : "not started",
      icon: "🏆",
    },
  ];

  const navItems = [
    { href: "/attendance", label: "Mark Attendance", desc: "Toggle present/absent for teams", icon: "📋" },
    { href: "/matches", label: "Manage Matches", desc: "Create matches and enter scores", icon: "⚽" },
    { href: "/results", label: "View Results", desc: "All match results by round", icon: "📊" },
    { href: "/bracket", label: "Tournament Bracket", desc: "Semifinals and finals bracket", icon: "🏆" },
    ...(role === "admin" ? [{ href: "/admin", label: "Admin Controls", desc: "Reset, export, and manage data", icon: "⚙️" }] : []),
  ];

  const recentMatches = [...completedMatches].reverse().slice(0, 5);

  return (
    <DashboardClient
      stats={stats}
      navItems={navItems}
      recentMatches={recentMatches}
    />
  );
}
