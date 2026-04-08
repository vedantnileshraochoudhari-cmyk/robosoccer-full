"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Team {
  id: number;
  name: string;
  gmail: string;
  members: string;
  college: string;
  present: boolean;
}

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement("span");
  span.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(232,255,60,0.25);transform:scale(0);animation:ripple-out 0.55s ease-out forwards;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;pointer-events:none;`;
  btn.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

const glassCard: React.CSSProperties = {
  background: "rgba(19,19,26,0.6)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(232,255,60,0.1)",
  borderRadius: 12,
};

const inputStyle: React.CSSProperties = {
  background: "rgba(26,26,36,0.8)",
  border: "1px solid rgba(42,42,58,0.8)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "var(--text)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "0.9rem",
  outline: "none",
  width: "100%",
  backdropFilter: "blur(8px)",
};

export default function AttendancePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, []);

  async function fetchTeams() {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data);
    setLoading(false);
  }

  useEffect(() => { fetchTeams(); }, []);

  async function togglePresent(team: Team) {
    setUpdating(team.id);
    await fetch("/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: team.id, present: !team.present }),
    });
    await fetchTeams();
    setUpdating(null);
  }

  async function handleImport() {
    if (!csvFile) return;
    setImporting(true);
    setImportMsg("");
    const text = await csvFile.text();
    const { default: Papa } = await import("papaparse");
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: result.data }),
    });
    const data = await res.json();
    setImportMsg(`Imported: ${data.created} teams. Skipped: ${data.skipped}. ${data.errors?.length ? "Errors: " + data.errors.join(", ") : ""}`);
    setImporting(false);
    setCsvFile(null);
    fetchTeams();
  }

  async function addTeamManually() {
    const name = prompt("Team Name:");
    if (!name) return;
    const gmail = prompt("Team Gmail:");
    if (!gmail) return;
    const college = prompt("College Name:") || "";
    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gmail, members: [], college }),
    });
    fetchTeams();
  }

  async function editTeamName(team: Team) {
    const name = prompt("New team name:", team.name);
    if (!name || name === team.name) return;
    await fetch("/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: team.id, name }),
    });
    fetchTeams();
  }

  async function deleteTeam(team: Team) {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    await fetch(`/api/teams?id=${team.id}`, { method: "DELETE" });
    fetchTeams();
  }

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.college.toLowerCase().includes(search.toLowerCase()) ||
    t.gmail.toLowerCase().includes(search.toLowerCase())
  );
  const presentCount = teams.filter((t) => t.present).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "2.5rem",
            color: "var(--accent)",
            letterSpacing: "0.06em",
            lineHeight: 1,
            textShadow: "0 0 30px #e8ff3c55",
          }}
        >
          ATTENDANCE
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace", fontSize: "0.8rem", marginTop: 4 }}>
          {presentCount} present out of {teams.length} registered
        </p>
      </div>

      {/* Import CSV — only for admin/volunteer */}
      {(role === "admin" || role === "volunteer") && (
        <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ ...glassCard, padding: 20, marginBottom: 24, position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            borderRadius: "12px 12px 0 0",
            background: "linear-gradient(90deg, transparent, #e8ff3c, transparent)",
            opacity: 0.5,
          }}
        />
        <h2
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "1.1rem",
            color: "var(--text)",
            letterSpacing: "0.04em",
            marginBottom: 12,
          }}
        >
          IMPORT FROM CSV (Zoho Backstage)
        </h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            style={{ ...inputStyle, width: "auto", flex: 1 }}
          />
          <motion.button
            whileHover={{ scale: csvFile && !importing ? 1.04 : 1, boxShadow: csvFile && !importing ? "0 0 16px #e8ff3c44" : "none" }}
            whileTap={{ scale: csvFile && !importing ? 0.96 : 1 }}
            onClick={(e) => { addRipple(e); handleImport(); }}
            disabled={!csvFile || importing}
            style={{
              background: csvFile && !importing ? "var(--accent)" : "rgba(42,42,58,0.8)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1rem",
              letterSpacing: "0.04em",
              cursor: csvFile && !importing ? "pointer" : "not-allowed",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {importing ? "IMPORTING..." : "IMPORT"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 14px rgba(232,255,60,0.3)" }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => { addRipple(e); addTeamManually(); }}
            style={{
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid rgba(232,255,60,0.5)",
              borderRadius: 8,
              padding: "8px 16px",
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1rem",
              letterSpacing: "0.04em",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            + ADD MANUALLY
          </motion.button>
        </div>
        {importMsg && (
          <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 10 }}>
            {importMsg}
          </p>
        )}
      </motion.div>
      )}

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: 16 }}
      >
        <input
          type="text"
          placeholder="Search teams, college, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
      </motion.div>

      {/* Team List */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace", padding: "40px 0", textAlign: "center" }}>
          {teams.length === 0 ? "No teams registered yet. Import a CSV or add manually." : "No teams match your search."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AnimatePresence>
            {filtered.map((team, i) => {
              const members = JSON.parse(team.members || "[]") as string[];
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  whileHover={{
                    borderColor: team.present ? "rgba(232,255,60,0.4)" : "rgba(232,255,60,0.15)",
                    boxShadow: "0 4px 24px rgba(232,255,60,0.07)",
                  }}
                  style={{
                    ...glassCard,
                    border: `1px solid ${team.present ? "rgba(232,255,60,0.3)" : "rgba(42,42,58,0.7)"}`,
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "1.1rem",
                        color: "var(--text)",
                        letterSpacing: "0.04em",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {team.name}
                      {team.present && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            background: "var(--accent)",
                            color: "var(--bg)",
                            fontFamily: "DM Mono, monospace",
                            fontSize: "0.6rem",
                            padding: "1px 6px",
                            borderRadius: 3,
                            fontWeight: 600,
                            boxShadow: "0 0 8px #e8ff3c55",
                          }}
                        >
                          PRESENT
                        </motion.span>
                      )}
                    </div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>
                      {team.gmail} · {team.college || "Unknown College"}
                    </div>
                    {members.length > 0 && (
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 4 }}>
                        {members.join(", ")}
                      </div>
                    )}
                  </div>

                  {(role === "admin" || role === "volunteer") && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <motion.button
                        whileHover={{ scale: 1.1, borderColor: "var(--accent)", color: "var(--accent)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { addRipple(e); editTeamName(team); }}
                        title="Edit name"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(42,42,58,0.8)",
                          borderRadius: 6,
                          padding: "4px 8px",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          position: "relative",
                          overflow: "hidden",
                          transition: "border-color 0.2s, color 0.2s",
                        }}
                      >
                        ✎
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, boxShadow: "0 0 12px rgba(255,68,68,0.4)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { addRipple(e); deleteTeam(team); }}
                        title="Delete team"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,68,68,0.5)",
                          borderRadius: 6,
                          padding: "4px 8px",
                          color: "#ff4444",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        ✕
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: team.present ? "0 0 16px #e8ff3c55" : "0 0 12px rgba(232,255,60,0.2)" }}
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => { addRipple(e); togglePresent(team); }}
                        disabled={updating === team.id}
                        style={{
                          background: team.present ? "var(--accent)" : "transparent",
                          border: `1px solid ${team.present ? "var(--accent)" : "rgba(42,42,58,0.8)"}`,
                          borderRadius: 8,
                          padding: "6px 16px",
                          color: team.present ? "var(--bg)" : "var(--text-muted)",
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "0.95rem",
                          letterSpacing: "0.04em",
                          cursor: "pointer",
                          minWidth: 90,
                          position: "relative",
                          overflow: "hidden",
                          transition: "background 0.2s, border-color 0.2s, color 0.2s",
                        }}
                      >
                        {updating === team.id ? "..." : team.present ? "PRESENT" : "ABSENT"}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
