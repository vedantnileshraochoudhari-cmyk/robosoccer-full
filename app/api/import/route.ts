export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Expected CSV columns from Zoho Backstage:
// Team Name, Email, Member 1, Member 2, Member 3, College Name (flexible)

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rows } = body; // array of parsed CSV row objects

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    // Flexible column name matching
    const name =
      row["Team Name"] || row["team_name"] || row["Team"] || row["name"] || "";
    const gmail =
      row["Email"] || row["email"] || row["Gmail"] || row["gmail"] || "";
    const college =
      row["College Name"] ||
      row["college_name"] ||
      row["College"] ||
      row["college"] ||
      row["Institution"] ||
      "";

    // Collect members from any column that looks like member/participant
    const members: string[] = [];
    for (const [key, val] of Object.entries(row)) {
      if (
        key.toLowerCase().includes("member") ||
        key.toLowerCase().includes("participant") ||
        key.toLowerCase().includes("player")
      ) {
        if (val && String(val).trim()) {
          members.push(String(val).trim());
        }
      }
    }

    if (!name || !gmail) {
      results.skipped++;
      continue;
    }

    try {
      await prisma.team.upsert({
        where: { gmail: gmail.toLowerCase().trim() },
        update: {
          name: name.trim(),
          members: JSON.stringify(members),
          college: college.trim(),
        },
        create: {
          name: name.trim(),
          gmail: gmail.toLowerCase().trim(),
          members: JSON.stringify(members),
          college: college.trim(),
        },
      });
      results.created++;
    } catch (e: any) {
      results.errors.push(`${name}: ${e.message}`);
    }
  }

  return NextResponse.json(results);
}

// GET: return current team list as CSV
export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  const header = "ID,Name,Gmail,College,Members,Present";
  const lines = teams.map((t: typeof teams[0]) => {
    const members = JSON.parse(t.members || "[]").join("; ");
    return `${t.id},"${t.name}","${t.gmail}","${t.college}","${members}",${t.present}`;
  });
  const csv = [header, ...lines].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="teams.csv"',
    },
  });
}
