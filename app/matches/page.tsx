"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Team {
  id: number;
  name: string;
  gmail: string;
  college: string;
  present: boolean;
}

interface Match {
  id: number;
  round: number;
  team1Id: number;
  team2Id: number | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  status: string;
  isBye: boolean;
  team1: Team;
  team2: Team | null;
  winner: Team | null;
  updatedAt: string;
}

// ─── Timer Component ─────────────────────────────────────────────────────────

function LiveTimer({ updatedAt }: { updatedAt: string }) {
  const [seconds, setSeconds] = useState(240);

  useEffect(() => {
    const calc = () => {
      const start = new Date(updatedAt).getTime();
      const diff = Math.floor((Date.now() - start) / 1000);
      setSeconds(Math.max(0, 240 - diff));
    };
    calc();
    const inv = setInterval(calc, 1000);
    return () => clearInterval(inv);
  }, [updatedAt]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ color: seconds < 60 ? "#ff4444" : "var(--accent)", fontFamily: "DM Mono, monospace", fontSize: "1.2rem", fontWeight: "bold", textShadow: "0 0 10px currentColor" }}>
      {formatTime(seconds)}
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement("span");
  span.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(232,255,60,0.25);transform:scale(0);animation:ripple-out 0.55s ease-out forwards;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;pointer-events:none;`;
  btn.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

const glass: React.CSSProperties = {
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
  padding: "8px 10px",
  color: "var(--text)",
  fontFamily: "DM Mono, monospace",
  fontSize: "0.85rem",
  outline: "none",
};

function getRoundLabel(round: number, matches: Match[]): string {
  if (round === 1) return "ROUND 1";
  if (round === 2) return "SEMIFINALS";
  if (round === 3) return "FINAL";
  return `ROUND ${round}`;
}

function getRoundShort(round: number, matches: Match[]): string {
  if (round === 1) return "R1";
  if (round === 2) return "SEMIS";
  if (round === 3) return "FINAL";
  return `R${round}`;
}

// ─── Round Timeline ─────────────────────────────────────────────────────────

function RoundTimeline({
  rounds,
  closedRounds,
  activeRound,
  matches,
}: {
  rounds: number[];
  closedRounds: number[];
  activeRound: number | null;
  matches: Match[];
}) {
  if (rounds.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 28,
        overflowX: "auto",
        padding: "4px 0",
        gap: 0,
      }}
    >
      {rounds.map((round, i) => {
        const isClosed = closedRounds.includes(round);
        const isActive = round === activeRound;
        const label = getRoundShort(round, matches);

        return (
          <div key={round} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {i > 0 && (
              <div
                style={{
                  width: 36,
                  height: 2,
                  background: isClosed
                    ? "linear-gradient(90deg, #e8ff3c, #e8ff3c88)"
                    : "rgba(42,42,58,0.8)",
                  flexShrink: 0,
                }}
              />
            )}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: isClosed
                    ? "var(--accent)"
                    : isActive
                    ? "rgba(232,255,60,0.15)"
                    : "rgba(26,26,36,0.8)",
                  border: `2px solid ${isClosed ? "var(--accent)" : isActive ? "var(--accent)" : "rgba(42,42,58,0.8)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontFamily: "DM Mono, monospace",
                  color: isClosed ? "var(--bg)" : isActive ? "var(--accent)" : "var(--text-muted)",
                  boxShadow: isActive ? "0 0 16px #e8ff3c55" : "none",
                  fontWeight: isActive ? 600 : 400,
                  flexShrink: 0,
                }}
              >
                {isClosed ? "✓" : round}
              </div>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontFamily: "DM Mono, monospace",
                  color: isClosed
                    ? "var(--text-muted)"
                    : isActive
                    ? "var(--accent)"
                    : "rgba(107,107,138,0.6)",
                  whiteSpace: "nowrap",
                  textShadow: isActive ? "0 0 8px #e8ff3c88" : "none",
                }}
              >
                {label}
              </span>
            </motion.div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Match Card ──────────────────────────────────────────────────────────────

function MatchCard({
  m,
  dimmed,
  editScores,
  setEditScores,
  saving,
  updatingId,
  onSave,
  onDelete,
  onStatusChange,
  onUpdateScore,
  onSelectWinner,
}: {
  m: Match;
  dimmed: boolean;
  editScores: Record<number, { s1: string; s2: string }>;
  setEditScores: React.Dispatch<React.SetStateAction<Record<number, { s1: string; s2: string }>>>;
  saving: number | null;
  updatingId: number | null;
  onSave: (m: Match) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string, scores?: { s1: number, s2: number }) => void;
  onUpdateScore: (id: number, team: "A"|"B", delta: number) => void;
  onSelectWinner: (id: number, winnerId: number) => void;
}) {
  const sc = editScores[m.id] || { s1: String(m.score1 ?? "0"), s2: String(m.score2 ?? "0") };
  const isEditing = !!editScores[m.id];
  const isCompleted = m.status === "completed";
  const isLive = m.status === "live";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: dimmed ? 0.5 : 1, scale: 1 }}
      style={{
        ...glass,
        border: `1px solid ${isLive ? "var(--accent)" : isCompleted ? "rgba(232,255,60,0.18)" : "rgba(42,42,58,0.7)"}`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        boxShadow: isLive ? "0 0 20px rgba(232,255,60,0.1)" : "none",
      }}
    >
      {/* Team 1 */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <span style={{ color: m.winnerId === m.team1Id ? "var(--accent)" : "var(--text)", fontWeight: m.winnerId === m.team1Id ? 600 : 400 }}>
          {m.team1.name}
          {m.winnerId === m.team1Id && <span style={{ marginLeft: 6, fontSize: "0.7rem" }}>★ WINNER</span>}
        </span>
        <span style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--text-muted)" }}>
          {m.team1.college}
        </span>
      </div>

      {/* Score */}
      <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
        {m.isBye ? (
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.8rem", color: "var(--accent)" }}>BYE</span>
        ) : (
          <>
            <div style={{ textAlign: "center" }}>
               <div style={{ fontSize: "1.5rem", fontFamily: "Bebas Neue", color: m.winnerId === m.team1Id ? "var(--accent)" : "var(--text)" }}>{m.score1 ?? 0}</div>
               {isLive && (
                 <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                   <button onClick={() => onUpdateScore(m.id, "A", 1)} style={{ background: "rgba(232,255,60,0.15)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, width: 24, height: 24, cursor: "pointer" }}>+</button>
                   <button onClick={() => onUpdateScore(m.id, "A", -1)} style={{ background: "rgba(255,68,68,0.1)", border: "1px solid #ff4444", color: "#ff4444", borderRadius: 4, width: 24, height: 24, cursor: "pointer" }}>-</button>
                 </div>
               )}
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "1.2rem", opacity: 0.5 }}>VS</span>
            <div style={{ textAlign: "center" }}>
               <div style={{ fontSize: "1.5rem", fontFamily: "Bebas Neue", color: m.winnerId === m.team2Id ? "var(--accent)" : "var(--text)" }}>{m.score2 ?? 0}</div>
               {isLive && (
                 <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                   <button onClick={() => onUpdateScore(m.id, "B", 1)} style={{ background: "rgba(232,255,60,0.15)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, width: 24, height: 24, cursor: "pointer" }}>+</button>
                   <button onClick={() => onUpdateScore(m.id, "B", -1)} style={{ background: "rgba(255,68,68,0.1)", border: "1px solid #ff4444", color: "#ff4444", borderRadius: 4, width: 24, height: 24, cursor: "pointer" }}>-</button>
                 </div>
               )}
            </div>
          </>
        )}
      </div>

      {/* Team 2 */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <span style={{ color: m.winnerId === m.team2Id ? "var(--accent)" : "var(--text)", fontWeight: m.winnerId === m.team2Id ? 600 : 400 }}>
          {m.winnerId === m.team2Id && <span style={{ marginRight: 6, fontSize: "0.7rem" }}>WINNER ★</span>}
          {m.team2?.name ?? "TBD"}
        </span>
        <span style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--text-muted)" }}>
          {m.team2?.college ?? "—"}
        </span>
      </div>

      {/* Actions */}
      <div style={{ width: "100%", display: "flex", gap: 12, borderTop: "1px solid rgba(42,42,58,0.3)", paddingTop: 12, marginTop: 4 }}>
        {!m.isBye && (
          <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "center" }}>
            {m.status === "upcoming" && (
              <button 
                onClick={() => onStatusChange(m.id, "live")}
                style={{ background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 6, padding: "6px 20px", cursor: "pointer", fontFamily: "Bebas Neue", fontSize: "0.9rem" }}
              >
                START MATCH
              </button>
            )}

            {isLive && (
              <>
                <LiveTimer updatedAt={m.updatedAt} />
                <button 
                  onClick={() => onStatusChange(m.id, "completed")}
                  style={{ background: "#ff4444", color: "white", border: "none", borderRadius: 6, padding: "6px 20px", cursor: "pointer", fontFamily: "Bebas Neue", fontSize: "0.9rem", marginLeft: "auto" }}
                >
                  END MATCH
                </button>
              </>
            )}

            {isCompleted && !m.winnerId && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                <span style={{ fontFamily: "DM Mono", fontSize: "0.75rem", color: "var(--accent)" }}>SELECT WINNER:</span>
                <button 
                  onClick={() => onSelectWinner(m.id, m.team1Id)}
                  style={{ background: "rgba(232,255,60,0.1)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  {m.team1.name}
                </button>
                {m.team2 && (
                  <button 
                    onClick={() => onSelectWinner(m.id, m.team2Id!)}
                    style={{ background: "rgba(232,255,60,0.1)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    {m.team2.name}
                  </button>
                )}
              </div>
            )}

            {m.winnerId && (
              <span style={{ fontFamily: "DM Mono", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Match officially completed. Winner: {m.winner?.name}
              </span>
            )}
            
            {(m.status === "upcoming" || m.status === "completed") && (
              <button onClick={() => onDelete(m.id)} style={{ background: "transparent", border: "none", color: "rgba(255,68,68,0.4)", cursor: "pointer", marginLeft: "auto" }}>✕</button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RoundSection({
  label,
  roundMatches,
  onDelete,
  onStatusChange,
  onUpdateScore,
  onSelectWinner,
  animIndex,
}: {
  label: string;
  roundMatches: Match[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onUpdateScore: (id: number, team: "A"|"B", delta: number) => void;
  onSelectWinner: (id: number, winnerId: number) => void;
  animIndex: number;
}) {
  if (roundMatches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animIndex * 0.1, duration: 0.4 }}
      style={{ marginBottom: 32 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontFamily: "Bebas Neue", fontSize: "1.5rem", color: "var(--accent)", letterSpacing: "0.05em", margin: 0 }}>
          {label}
        </h2>
        <div style={{ flex: 1, height: 1, background: "rgba(232,255,60,0.2)" }} />
        <span style={{ fontFamily: "DM Mono", fontSize: "0.7rem", color: "var(--text-muted)" }}>
          {roundMatches.length} MATCHES
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {roundMatches.map((m) => (
          <MatchCard
            key={m.id}
            m={m}
            dimmed={false}
            editScores={{}}
            setEditScores={() => {}}
            saving={null}
            updatingId={null}
            onSave={() => {}}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onUpdateScore={onUpdateScore}
            onSelectWinner={onSelectWinner}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [role, setRole] = useState<string | null>(null);

  // Create form
  const [newTeam1, setNewTeam1] = useState("");
  const [newTeam2, setNewTeam2] = useState("");
  const [selectedRound, setSelectedRound] = useState(1);
  const [creating, setCreating] = useState(false);

  async function fetchAll() {
    try {
      const [tr, mr] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/matches"),
      ]);
      setTeams(await tr.json());
      setMatches(await mr.json());
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me").then(res => res.json()).then(d => setRole(d.role));
    fetchAll();
    const inv = setInterval(fetchAll, 1500);
    return () => clearInterval(inv);
  }, []);

  async function createMatch() {
    if (!newTeam1 || !newTeam2) { setMsg("Select both teams"); setMsgType("err"); return; }
    setCreating(true); setMsg("");
    const isBye = newTeam2 === "bye";
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round: selectedRound, team1Id: Number(newTeam1), team2Id: isBye ? null : Number(newTeam2), isBye }),
    });
    if (res.ok) { setMsg("Match created!"); setMsgType("ok"); setNewTeam1(""); setNewTeam2(""); }
    else { setMsg("Error creating match"); setMsgType("err"); }
    setCreating(false); fetchAll();
  }

  async function handleStatusChange(id: number, status: string) {
    const res = await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg(d.error || "Update failed");
      setMsgType("err");
    } else {
      setMsg("");
    }
    fetchAll();
  }

  async function handleUpdateScore(id: number, team: "A" | "B", delta: number) {
    const m = matches.find(m => m.id === id);
    if (!m) return;
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        score1: team === "A" ? Math.max(0, (m.score1 || 0) + delta) : m.score1,
        score2: team === "B" ? Math.max(0, (m.score2 || 0) + delta) : m.score2,
      }),
    });
    fetchAll();
  }

  async function handleSelectWinner(id: number, winnerId: number) {
    if (!confirm("Confirm winner selection? This will move the team to the next round pool.")) return;
    const res = await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, winnerId }),
    });
    if (res.ok) { setMsg("Winner assigned! Team advanced."); setMsgType("ok"); }
    fetchAll();
  }

  async function deleteMatch(id: number) {
    if (!confirm("Delete this match?")) return;
    await fetch(`/api/matches?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  if (loading) return <div style={{ color: "var(--accent)", padding: 40, fontFamily: "DM Mono" }}>LOADING TOURNAMENT DATA...</div>;

  const liveMatches = matches.filter(m => m.status === "live");
  const upcomingMatches = matches.filter(m => m.status === "upcoming");
  const completedMatches = matches.filter(m => m.status === "completed");

  const r1Winners = matches.filter(m => m.round === 1 && m.winnerId).map(m => m.winner!);
  const r2Winners = matches.filter(m => m.round === 2 && m.winnerId).map(m => m.winner!);

  // Filter out teams already in the current round
  const getAvailableTeams = (round: number) => {
    const usedIds = new Set(matches.filter(m => m.round === round).flatMap(m => [m.team1Id, m.team2Id].filter(Boolean) as number[]));
    if (round === 1) return teams.filter(t => t.present && !usedIds.has(t.id));
    if (round === 2) return r1Winners.filter(t => !usedIds.has(t.id));
    if (round === 3) return r2Winners.filter(t => !usedIds.has(t.id));
    return [];
  };

  const currentAvailable = getAvailableTeams(selectedRound);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Bebas Neue", fontSize: "3rem", color: "var(--accent)", margin: 0 }}>TOURNAMENT CONTROL</h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono", fontSize: "0.9rem" }}>MANUAL MODERATION PANEL</p>
      </div>

      {msg && (
        <div style={{ padding: 12, borderRadius: 8, background: msgType === "ok" ? "rgba(232,255,60,0.1)" : "rgba(255,68,68,0.1)", border: `1px solid ${msgType === "ok" ? "var(--accent)" : "#ff4444"}`, color: msgType === "ok" ? "var(--accent)" : "#ff4444", marginBottom: 20, fontFamily: "DM Mono" }}>
          {msg}
        </div>
      )}

      {/* Live Match Section */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 10px #ff4444" }} />
          <h2 style={{ fontFamily: "Bebas Neue", fontSize: "1.8rem", color: "white", margin: 0 }}>LIVE MATCH</h2>
        </div>
        {liveMatches.length > 0 ? (
          liveMatches.map(m => (
            <MatchCard key={m.id} m={m} dimmed={false} editScores={{}} setEditScores={() => {}} saving={null} updatingId={null} onSave={() => {}} onDelete={deleteMatch} onStatusChange={handleStatusChange} onUpdateScore={handleUpdateScore} onSelectWinner={handleSelectWinner} />
          ))
        ) : (
          <div style={{ ...glass, padding: 30, textAlign: "center", color: "var(--text-muted)", fontFamily: "DM Mono" }}>NO ACTIVE LIVE MATCH</div>
        )}
      </section>

      {/* Upcoming Section */}
      {upcomingMatches.length > 0 && (
         <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: "Bebas Neue", fontSize: "1.8rem", color: "white", marginBottom: 20 }}>UPCOMING MATCHES</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
               {upcomingMatches.map(m => (
                 <MatchCard key={m.id} m={m} dimmed={false} editScores={{}} setEditScores={() => {}} saving={null} updatingId={null} onSave={() => {}} onDelete={deleteMatch} onStatusChange={handleStatusChange} onUpdateScore={handleUpdateScore} onSelectWinner={handleSelectWinner} />
               ))}
            </div>
         </section>
      )}

      {/* Create Match Form */}
      <section style={{ ...glass, padding: 24, marginBottom: 48 }}>
        <h2 style={{ fontFamily: "Bebas Neue", fontSize: "1.5rem", color: "var(--accent)", marginBottom: 20 }}>CREATE NEXT MATCH</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: 8, fontFamily: "DM Mono" }}>ROUND</label>
            <select value={selectedRound} onChange={e => setSelectedRound(Number(e.target.value))} style={{ ...inputStyle, width: "100%" }}>
              <option value={1}>ROUND 1</option>
              <option value={2}>SEMIFINALS</option>
              <option value={3}>GRAND FINAL</option>
            </select>
          </div>
          <div style={{ flex: 2, minWidth: 250 }}>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: 8, fontFamily: "DM Mono" }}>TEAM 1</label>
            <select value={newTeam1} onChange={e => setNewTeam1(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="">Select Team...</option>
              {currentAvailable.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: 250 }}>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: 8, fontFamily: "DM Mono" }}>TEAM 2</label>
            <select value={newTeam2} onChange={e => setNewTeam2(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="">Select Team...</option>
              {selectedRound === 1 && <option value="bye">BYE</option>}
              {currentAvailable.filter(t => String(t.id) !== newTeam1).map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
            </select>
          </div>
          <button onClick={createMatch} disabled={creating} style={{ background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 8, padding: "10px 30px", fontFamily: "Bebas Neue", fontSize: "1.1rem", cursor: "pointer" }}>
            {creating ? "CREATING..." : "CREATE MATCH"}
          </button>
        </div>
        {currentAvailable.length === 0 && (
          <p style={{ color: "#ff8844", fontSize: "0.7rem", marginTop: 12, fontFamily: "DM Mono" }}>⚠ No more teams available in current pool for this round.</p>
        )}
      </section>

      {/* Qualified Teams Pools */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 48 }}>
         <div style={{ ...glass, padding: 20, border: "1px solid rgba(232,255,60,0.2)" }}>
            <h3 style={{ fontFamily: "Bebas Neue", fontSize: "1.2rem", color: "var(--accent)", marginBottom: 12 }}>QUALIFIED FOR SEMIS ({r1Winners.length})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
               {r1Winners.length > 0 ? r1Winners.map(t => (
                 <span key={t.id} style={{ background: "rgba(232,255,60,0.1)", border: "1px solid var(--accent)", color: "var(--accent)", padding: "4px 10px", borderRadius: 4, fontSize: "0.75rem", fontFamily: "DM Mono" }}>{t.name}</span>
               )) : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>None yet</span>}
            </div>
         </div>
         <div style={{ ...glass, padding: 20, border: "1px solid rgba(232,255,60,0.2)" }}>
            <h3 style={{ fontFamily: "Bebas Neue", fontSize: "1.2rem", color: "var(--accent)", marginBottom: 12 }}>QUALIFIED FOR FINAL ({r2Winners.length})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
               {r2Winners.length > 0 ? r2Winners.map(t => (
                 <span key={t.id} style={{ background: "rgba(232,255,60,0.1)", border: "1px solid var(--accent)", color: "var(--accent)", padding: "4px 10px", borderRadius: 4, fontSize: "0.75rem", fontFamily: "DM Mono" }}>{t.name}</span>
               )) : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>None yet</span>}
            </div>
         </div>
      </section>

      {/* Completed Matches Section */}
      <section>
        <h2 style={{ fontFamily: "Bebas Neue", fontSize: "1.8rem", color: "white", marginBottom: 24 }}>COMPLETED MATCHES</h2>
        <RoundSection label="ROUND 1" roundMatches={completedMatches.filter(m => m.round === 1)} onDelete={deleteMatch} onStatusChange={handleStatusChange} onUpdateScore={handleUpdateScore} onSelectWinner={handleSelectWinner} animIndex={0} />
        <RoundSection label="SEMIFINALS" roundMatches={completedMatches.filter(m => m.round === 2)} onDelete={deleteMatch} onStatusChange={handleStatusChange} onUpdateScore={handleUpdateScore} onSelectWinner={handleSelectWinner} animIndex={1} />
        <RoundSection label="GRAND FINAL" roundMatches={completedMatches.filter(m => m.round === 3)} onDelete={deleteMatch} onStatusChange={handleStatusChange} onUpdateScore={handleUpdateScore} onSelectWinner={handleSelectWinner} animIndex={2} />
      </section>
    </motion.div>
  );
}
