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
  const nonBye = matches.filter((m) => m.round === round && !m.isBye);
  if (nonBye.length === 1) return "FINAL";
  if (nonBye.length === 2) return "SEMIFINALS";
  return `ROUND ${round}`;
}

function getRoundShort(round: number, matches: Match[]): string {
  const nonBye = matches.filter((m) => m.round === round && !m.isBye);
  if (nonBye.length === 1) return "FINAL";
  if (nonBye.length === 2) return "SEMIS";
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
                  letterSpacing: "0.05em",
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
  onSave,
  onDelete,
}: {
  m: Match;
  dimmed: boolean;
  editScores: Record<number, { s1: string; s2: string }>;
  setEditScores: React.Dispatch<React.SetStateAction<Record<number, { s1: string; s2: string }>>>;
  saving: number | null;
  onSave: (m: Match) => void;
  onDelete: (id: number) => void;
}) {
  const sc = editScores[m.id] || { s1: String(m.score1 ?? ""), s2: String(m.score2 ?? "") };
  const isEditing = !!editScores[m.id];
  const isCompleted = m.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dimmed ? 0.45 : 1, y: 0 }}
      whileHover={dimmed ? {} : {
        borderColor: "rgba(232,255,60,0.3)",
        boxShadow: "0 4px 24px rgba(232,255,60,0.08)",
      }}
      style={{
        ...glass,
        border: `1px solid ${isCompleted ? "rgba(232,255,60,0.18)" : "rgba(42,42,58,0.7)"}`,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        filter: dimmed ? "grayscale(0.4)" : "none",
      }}
    >
      {/* Team 1 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: m.winnerId === m.team1Id ? "var(--accent)" : "var(--text)" }}>
            {m.team1.name}
            {m.winnerId === m.team1Id && <span style={{ marginLeft: 6, fontSize: "0.7rem" }}>★</span>}
          </span>
          <span style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            {m.team1.college}
          </span>
        </div>

      {/* Score */}
      {m.isBye ? (
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.8rem", color: "var(--text-muted)", padding: "0 12px" }}>
          BYE
        </span>
      ) : isCompleted && !isEditing ? (
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "1.1rem", color: "var(--text)", minWidth: 70, textAlign: "center" }}>
          {m.score1} — {m.score2}
        </span>
      ) : (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="number"
            min={0}
            value={sc.s1}
            onChange={(e) => setEditScores((prev) => ({ ...prev, [m.id]: { ...sc, s1: e.target.value } }))}
            style={{ ...inputStyle, width: 52, textAlign: "center" }}
            placeholder="0"
          />
          <span style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>—</span>
          <input
            type="number"
            min={0}
            value={sc.s2}
            onChange={(e) => setEditScores((prev) => ({ ...prev, [m.id]: { ...sc, s2: e.target.value } }))}
            style={{ ...inputStyle, width: 52, textAlign: "center" }}
            placeholder="0"
          />
        </div>
      )}

      {/* Team 2 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ color: m.winnerId === m.team2Id ? "var(--accent)" : "var(--text)" }}>
            {m.winnerId === m.team2Id && <span style={{ marginRight: 6, fontSize: "0.7rem" }}>★</span>}
            {m.team2?.name ?? "—"}
          </span>
          {m.team2 && (
            <span style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
              {m.team2.college}
            </span>
          )}
        </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {!m.isBye && (
          <>
            {isCompleted && !isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  addRipple(e);
                  setEditScores((prev) => ({ ...prev, [m.id]: { s1: String(m.score1 ?? ""), s2: String(m.score2 ?? "") } }));
                }}
                style={{ background: "transparent", border: "1px solid rgba(42,42,58,0.8)", borderRadius: 6, padding: "4px 10px", color: "var(--text-muted)", cursor: "pointer", fontFamily: "DM Mono, monospace", fontSize: "0.72rem", position: "relative", overflow: "hidden" }}
              >
                EDIT
              </motion.button>
            ) : isEditing ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 12px #e8ff3c44" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { addRipple(e); onSave(m); }}
                  disabled={saving === m.id}
                  style={{ background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 6, padding: "4px 14px", cursor: "pointer", fontFamily: "Bebas Neue, sans-serif", fontSize: "0.9rem", position: "relative", overflow: "hidden" }}
                >
                  {saving === m.id ? "..." : "SAVE"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditScores((prev) => { const n = { ...prev }; delete n[m.id]; return n; })}
                  style={{ background: "transparent", border: "1px solid rgba(42,42,58,0.8)", borderRadius: 6, padding: "4px 8px", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.72rem", position: "relative", overflow: "hidden" }}
                >
                  ✕
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 12px #e8ff3c44" }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { addRipple(e); setEditScores((prev) => ({ ...prev, [m.id]: { s1: "", s2: "" } })); }}
                style={{ background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontFamily: "Bebas Neue, sans-serif", fontSize: "0.9rem", position: "relative", overflow: "hidden" }}
              >
                SCORE
              </motion.button>
            )}
          </>
        )}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(255,68,68,0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { addRipple(e); onDelete(m.id); }}
          style={{ background: "transparent", border: "1px solid rgba(255,68,68,0.5)", borderRadius: 6, padding: "4px 8px", color: "#ff4444", cursor: "pointer", fontSize: "0.72rem", position: "relative", overflow: "hidden" }}
        >
          ✕
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Round Section ───────────────────────────────────────────────────────────

function RoundSection({
  round,
  roundMatches,
  allMatches,
  isClosed,
  isActive,
  isExpanded,
  onToggle,
  editScores,
  setEditScores,
  saving,
  onSave,
  onDelete,
  onCloseRound,
  closingRound,
  animIndex,
}: {
  round: number;
  roundMatches: Match[];
  allMatches: Match[];
  isClosed: boolean;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  editScores: Record<number, { s1: string; s2: string }>;
  setEditScores: React.Dispatch<React.SetStateAction<Record<number, { s1: string; s2: string }>>>;
  saving: number | null;
  onSave: (m: Match) => void;
  onDelete: (id: number) => void;
  onCloseRound: (round: number) => void;
  closingRound: boolean;
  animIndex: number;
}) {
  const completed = roundMatches.filter((m) => m.status === "completed");
  const pending = roundMatches.filter((m) => m.status !== "completed");
  const label = getRoundLabel(round, allMatches);
  const canClose = !isClosed && completed.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animIndex * 0.06, duration: 0.4 }}
      style={{ marginBottom: 16 }}
    >
      {/* Section header */}
      <motion.div
        whileHover={{ borderColor: isActive ? "rgba(232,255,60,0.4)" : "rgba(232,255,60,0.15)" }}
        onClick={onToggle}
        style={{
          ...glass,
          border: `1px solid ${isActive ? "rgba(232,255,60,0.3)" : isClosed ? "rgba(42,42,58,0.6)" : "rgba(42,42,58,0.8)"}`,
          padding: "14px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderRadius: isExpanded ? "12px 12px 0 0" : 12,
          userSelect: "none",
          transition: "border-color 0.2s",
        }}
      >
        {/* Accent bar for active round */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 8,
              bottom: 8,
              width: 3,
              borderRadius: "0 2px 2px 0",
              background: "var(--accent)",
              boxShadow: "0 0 8px #e8ff3c88",
            }}
          />
        )}

        <span
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "1.15rem",
            letterSpacing: "0.05em",
            color: isActive ? "var(--accent)" : isClosed ? "var(--text-muted)" : "var(--text)",
            textShadow: isActive ? "0 0 16px #e8ff3c55" : "none",
            flex: 1,
          }}
        >
          {label}
        </span>

        {/* Progress */}
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
          }}
        >
          {completed.length}/{roundMatches.length} done
        </span>

        {/* Status badge */}
        {isClosed ? (
          <span
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "0.62rem",
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(107,107,138,0.2)",
              color: "var(--text-muted)",
              border: "1px solid rgba(107,107,138,0.3)",
              letterSpacing: "0.06em",
            }}
          >
            CLOSED
          </span>
        ) : isActive ? (
          <span
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "0.62rem",
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(232,255,60,0.12)",
              color: "var(--accent)",
              border: "1px solid rgba(232,255,60,0.3)",
              letterSpacing: "0.06em",
            }}
          >
            ACTIVE
          </span>
        ) : null}

        {/* Expand chevron */}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            display: "inline-block",
          }}
        >
          ▼
        </motion.span>
      </motion.div>

      {/* Progress bar */}
      {isActive && (
        <div style={{ height: 3, background: "rgba(42,42,58,0.8)", borderRadius: "0", margin: "0" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: roundMatches.length ? `${(completed.length / roundMatches.length) * 100}%` : "0%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #e8ff3c88, var(--accent))",
              boxShadow: "0 0 6px #e8ff3c88",
            }}
          />
        </div>
      )}

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                background: "rgba(10,10,14,0.4)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${isActive ? "rgba(232,255,60,0.2)" : "rgba(42,42,58,0.5)"}`,
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {roundMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  m={m}
                  dimmed={isClosed}
                  editScores={editScores}
                  setEditScores={setEditScores}
                  saving={saving}
                  onSave={onSave}
                  onDelete={onDelete}
                />
              ))}

              {/* Close Round controls */}
              {isActive && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {pending.length > 0 && (
                    <span
                      style={{
                        fontFamily: "DM Mono, monospace",
                        fontSize: "0.72rem",
                        color: "#ff8844",
                      }}
                    >
                      ⚠ {pending.length} match{pending.length !== 1 ? "es" : ""} still pending
                    </span>
                  )}
                  {canClose && (
                    <motion.button
                      whileHover={{ scale: closingRound ? 1 : 1.04, boxShadow: closingRound ? "none" : "0 0 20px #e8ff3c55" }}
                      whileTap={{ scale: closingRound ? 1 : 0.96 }}
                      onClick={(e) => {
                        addRipple(e);
                        if (!confirm(`Close Round ${round} and auto-generate next round matches?`)) return;
                        onCloseRound(round);
                      }}
                      disabled={closingRound}
                      style={{
                        background: "var(--accent)",
                        color: "var(--bg)",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 20px",
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "1rem",
                        letterSpacing: "0.04em",
                        cursor: closingRound ? "not-allowed" : "pointer",
                        opacity: closingRound ? 0.7 : 1,
                        position: "relative",
                        overflow: "hidden",
                        marginLeft: "auto",
                      }}
                    >
                      {closingRound ? "CLOSING..." : `CLOSE ${label}`}
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [closedRounds, setClosedRounds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [editScores, setEditScores] = useState<Record<number, { s1: string; s2: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [closingRound, setClosingRound] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, []);
  const [closedBanner, setClosedBanner] = useState<number | null>(null);

  // Create form
  const [newTeam1, setNewTeam1] = useState("");
  const [newTeam2, setNewTeam2] = useState("");
  const [creating, setCreating] = useState(false);

  // Expanded rounds state
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const initializedRef = useRef(false);

  async function fetchAll() {
    const [tr, mr, rr] = await Promise.all([
      fetch("/api/teams"),
      fetch("/api/matches"),
      fetch("/api/rounds"),
    ]);
    const teamsData = await tr.json();
    const matchesData: Match[] = await mr.json();
    const roundsData = await rr.json();

    setTeams(teamsData);
    setMatches(matchesData);
    setClosedRounds(roundsData.closedRounds ?? []);

    // On first load: expand only the active round
    if (!initializedRef.current) {
      const allRounds = [...new Set(matchesData.map((m: Match) => m.round))].sort((a, b) => a - b);
      const closedSet = new Set(roundsData.closedRounds ?? []);
      const active = allRounds.filter((r) => !closedSet.has(r));
      const activeRound = active.length > 0 ? Math.max(...active) : (allRounds.length > 0 ? Math.max(...allRounds) : null);
      if (activeRound !== null) {
        setExpandedRounds(new Set([activeRound]));
      }
      initializedRef.current = true;
    }

    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll(); }, []);

  const presentTeams = teams.filter((t) => t.present);
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const closedSet = new Set(closedRounds);
  const openRounds = rounds.filter((r) => !closedSet.has(r));
  const activeRound = openRounds.length > 0 ? Math.max(...openRounds) : (rounds.length === 0 ? 1 : null);

  // Teams available for manual creation in the active round
  const activeRoundTeamIds = new Set(
    matches
      .filter((m) => m.round === (activeRound ?? 0))
      .flatMap((m) => [m.team1Id, m.team2Id].filter(Boolean) as number[])
  );
  const availableTeams =
    activeRound === 1
      ? presentTeams.filter((t) => !activeRoundTeamIds.has(t.id))
      : matches
          .filter((m) => m.round === (activeRound ?? 1) - 1 && m.status === "completed" && m.winner)
          .map((m) => m.winner!)
          .filter((w, idx, arr) => arr.findIndex((x) => x.id === w.id) === idx)
          .filter((w) => !activeRoundTeamIds.has(w.id));

  function toggleRound(round: number) {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  }

  async function createMatch() {
    if (!newTeam1) { setMsg("Select Team 1"); setMsgType("err"); return; }
    if (activeRound === null) { setMsg("No active round"); setMsgType("err"); return; }
    setCreating(true);
    setMsg("");
    const isBye = newTeam2 === "bye";
    const body: Record<string, unknown> = { round: activeRound, team1Id: Number(newTeam1), isBye };
    if (!isBye && newTeam2) body.team2Id = Number(newTeam2);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) { setMsg(data.error); setMsgType("err"); }
    else { setMsg("Match created!"); setMsgType("ok"); }
    setNewTeam1("");
    setNewTeam2("");
    setCreating(false);
    fetchAll();
  }

  async function saveScore(match: Match) {
    const sc = editScores[match.id];
    if (!sc) return;
    const s1 = parseInt(sc.s1);
    const s2 = parseInt(sc.s2);
    if (isNaN(s1) || isNaN(s2)) { setMsg("Enter valid scores"); setMsgType("err"); return; }
    if (s1 === s2) { setMsg("Draws not allowed — scores must differ"); setMsgType("err"); return; }
    setSaving(match.id);
    setMsg("");
    const res = await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: match.id, score1: s1, score2: s2 }),
    });
    const data = await res.json();
    if (data.error) { setMsg(data.error); setMsgType("err"); }
    else { setMsg("Score saved! Email sent to winner."); setMsgType("ok"); }
    setEditScores((prev) => { const n = { ...prev }; delete n[match.id]; return n; });
    setSaving(null);
    fetchAll();
  }

  async function deleteMatch(id: number) {
    if (!confirm("Delete this match?")) return;
    await fetch(`/api/matches?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function closeRound(round: number) {
    setClosingRound(true);
    setMsg("");
    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", round }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to close round");
      setMsgType("err");
      setClosingRound(false);
      return;
    }
    setClosedBanner(round);
    setTimeout(() => setClosedBanner(null), 5000);
    setMsg("");
    setClosingRound(false);
    // After fetch, expand the new round
    await fetchAll();
    setExpandedRounds((prev) => new Set([...prev, data.nextRound]));
  }

  if (loading) return <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>Loading...</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      {/* Header */}
      <div className="mb-6">
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
          MATCHES
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace", fontSize: "0.8rem", marginTop: 4 }}>
          {presentTeams.length} teams present · {matches.length} total matches
          {activeRound && ` · Round ${activeRound} active`}
        </p>
      </div>

      {/* Round closed banner */}
      <AnimatePresence>
        {closedBanner !== null && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "linear-gradient(135deg, rgba(232,255,60,0.12), rgba(232,255,60,0.06))",
              border: "1px solid rgba(232,255,60,0.4)",
              borderRadius: 10,
              padding: "14px 20px",
              marginBottom: 20,
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.1rem",
              color: "var(--accent)",
              letterSpacing: "0.04em",
              textShadow: "0 0 12px #e8ff3c66",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 0 24px rgba(232,255,60,0.1)",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>✓</span>
            Round {closedBanner} Complete — Round {closedBanner + 1} Starting
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast message */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              ...glass,
              border: `1px solid ${msgType === "ok" ? "rgba(232,255,60,0.4)" : "rgba(255,68,68,0.4)"}`,
              padding: "10px 16px",
              marginBottom: 16,
              fontFamily: "DM Mono, monospace",
              fontSize: "0.8rem",
              color: msgType === "ok" ? "var(--accent)" : "#ff4444",
            }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round Timeline */}
      {rounds.length > 0 && (
        <RoundTimeline
          rounds={rounds}
          closedRounds={closedRounds}
          activeRound={activeRound}
          matches={matches}
        />
      )}

      {/* Create Match — only when active round exists and user is admin/volunteer */}
      {activeRound !== null && (role === "admin" || role === "volunteer") && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ ...glass, padding: 24, marginBottom: 32, position: "relative", overflow: "hidden" }}
        >
          {/* Header with decorative line */}
          <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 20 }}>
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.2rem",
                color: "var(--accent)",
                letterSpacing: "0.06em",
                textShadow: "0 0 12px #e8ff3c44",
                whiteSpace: "nowrap"
              }}
            >
              CREATE MATCH MANUALLY
            </h2>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(232,255,60,0.3), transparent)" }} />
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {getRoundLabel(activeRound, matches)}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
            {/* Team 1 Slot */}
            <div style={{ flex: 1, minWidth: 200, padding: 16, background: "rgba(26,26,36,0.4)", borderRadius: 12, border: "1px solid rgba(232,255,60,0.05)" }}>
              <label style={{ fontFamily: "DM Mono, monospace", fontSize: "0.65rem", color: "var(--accent)", display: "block", marginBottom: 8, letterSpacing: "0.1em" }}>
                TEAM 1
              </label>
              <select 
                value={newTeam1} 
                onChange={(e) => setNewTeam1(e.target.value)} 
                style={{ ...inputStyle, width: "100%", background: "rgba(13,13,18,0.6)", border: "1px solid rgba(42,42,58,0.8)", borderRadius: 8, cursor: "pointer" }}
              >
                <option value="">Select first team...</option>
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name.toUpperCase()} ({t.college})</option>
                ))}
              </select>
            </div>

            {/* VS Indicator */}
            <div style={{ 
              width: 40, height: 40, borderRadius: "50%", 
              background: "rgba(232,255,60,0.1)", border: "1px solid rgba(232,255,60,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Bebas Neue, sans-serif", color: "var(--accent)", fontSize: "0.9rem",
              textShadow: "0 0 10px #e8ff3c66", zIndex: 2
            }}>
              VS
            </div>

            {/* Team 2 Slot */}
            <div style={{ flex: 1, minWidth: 200, padding: 16, background: "rgba(26,26,36,0.4)", borderRadius: 12, border: "1px solid rgba(232,255,60,0.05)" }}>
              <label style={{ fontFamily: "DM Mono, monospace", fontSize: "0.65rem", color: "var(--accent)", display: "block", marginBottom: 8, letterSpacing: "0.1em" }}>
                TEAM 2
              </label>
              <select 
                value={newTeam2} 
                onChange={(e) => setNewTeam2(e.target.value)} 
                style={{ ...inputStyle, width: "100%", background: "rgba(13,13,18,0.6)", border: "1px solid rgba(42,42,58,0.8)", borderRadius: 8, cursor: "pointer" }}
              >
                <option value="">Select second team...</option>
                <option value="bye">BYE (NO OPPONENT)</option>
                {availableTeams.filter((t) => String(t.id) !== newTeam1).map((t) => (
                  <option key={t.id} value={t.id}>{t.name.toUpperCase()} ({t.college})</option>
                ))}
              </select>
            </div>

            {/* Create Button */}
            <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 8 }}>
              <motion.button
                whileHover={{ scale: creating ? 1 : 1.02, boxShadow: creating ? "none" : "0 0 20px #e8ff3c33" }}
                whileTap={{ scale: creating ? 1 : 0.98 }}
                onClick={(e) => { addRipple(e); createMatch(); }}
                disabled={creating}
                style={{
                  background: "var(--accent)",
                  color: "var(--bg)",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 40px",
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.08em",
                  cursor: creating ? "not-allowed" : "pointer",
                  position: "relative",
                  overflow: "hidden",
                  opacity: creating ? 0.7 : 1,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}
              >
                {creating ? "INITIALIZING..." : "CREATE MATCH"}
              </motion.button>
            </div>
          </div>
          
          {presentTeams.length < 2 && (
            <div style={{ 
              marginTop: 20, padding: "10px 15px", borderRadius: 8, background: "rgba(255,136,68,0.05)", 
              border: "1px solid rgba(255,136,68,0.2)", display: "flex", alignItems: "center", gap: 10 
            }}>
              <span style={{ fontSize: "1.1rem" }}>⚠</span>
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "#ff8844", margin: 0 }}>
                Less than 2 teams are marked present. Mark teams present in Attendance first.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Round sections */}
      {matches.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace", textAlign: "center", padding: "40px 0" }}>
          No matches created yet.
        </p>
      ) : (
        <div>
          {rounds.map((round, ri) => {
            const roundMatches = matches.filter((m) => m.round === round);
            return (
              <RoundSection
                key={round}
                round={round}
                roundMatches={roundMatches}
                allMatches={matches}
                isClosed={closedSet.has(round)}
                isActive={round === activeRound}
                isExpanded={expandedRounds.has(round)}
                onToggle={() => toggleRound(round)}
                editScores={editScores}
                setEditScores={setEditScores}
                saving={saving}
                onSave={saveScore}
                onDelete={role === "admin" || role === "volunteer" ? deleteMatch : undefined}
                onCloseRound={role === "admin" || role === "volunteer" ? closeRound : undefined}
                closingRound={closingRound}
                animIndex={ri}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
