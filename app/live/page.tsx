"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Team {
  id: number;
  name: string;
  college: string;
}

interface Match {
  id: number;
  team1: Team;
  team2: Team | null;
  score1: number;
  score2: number;
  status: string;
  round: number;
  updatedAt: string;
}

function LiveTimer({ updatedAt }: { updatedAt: string }) {
  const [timeLeft, setTimeLeft] = useState(240);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(updatedAt).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      const remaining = Math.max(0, 240 - diff);
      setTimeLeft(remaining);
    };

    calculate();
    const inv = setInterval(calculate, 1000);
    return () => clearInterval(inv);
  }, [updatedAt]);

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  return (
    <div style={{ 
      fontSize: "8rem", 
      fontFamily: "Bebas Neue", 
      color: timeLeft < 60 ? "#ff4444" : "var(--accent)", 
      textShadow: `0 0 40px ${timeLeft < 60 ? "rgba(255,68,68,0.4)" : "rgba(232,255,60,0.4)"}`,
      lineHeight: 1
    }}>
      {min}:{sec.toString().padStart(2, "0")}
    </div>
  );
}

export default function LivePage() {
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchLive() {
    try {
      const res = await fetch("/api/matches");
      const data: Match[] = await res.json();
      const live = data.find((m) => m.status === "live");
      setLiveMatch(live || null);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ height: "100vh", background: "#0a0a0e", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontFamily: "Bebas Neue", fontSize: "2rem" }}>
      SYNCING LIVE DATA...
    </div>
  );

  return (
    <div style={{ 
      height: "100vh", width: "100vw", background: "#060608", color: "white", 
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "fixed", top: 0, left: 0, zIndex: 9999
    }}>
      {/* Dynamic Background */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(232,255,60,0.03) 0%, transparent 70%)" }} />
      
      <AnimatePresence mode="wait">
        {!liveMatch ? (
          <motion.div key="no-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
            <h1 style={{ fontFamily: "Bebas Neue", fontSize: "5rem", color: "rgba(255,255,255,0.1)", letterSpacing: "0.2em" }}>
              WAITING FOR PLAYERS
            </h1>
            <p style={{ fontFamily: "DM Mono", color: "var(--accent)", opacity: 0.3, fontSize: "1.2rem", marginTop: 20 }}>
              ROBOSOCCER TOURNAMENT 2025
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={liveMatch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ width: "95%", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
             {/* Battle Indicator */}
            <div style={{ marginBottom: 60, fontFamily: "Bebas Neue", fontSize: "2.5rem", color: "var(--accent)", letterSpacing: "0.5em", opacity: 0.8 }}>
              {liveMatch.round === 1 ? "ROUND ONE" : liveMatch.round === 2 ? "SEMIFINALS" : "GRAND FINAL"}
            </div>

            <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 60 }}>
              {/* Team 1 */}
              <div style={{ flex: 1, textAlign: "right" }}>
                <h2 style={{ fontFamily: "Bebas Neue", fontSize: "7rem", margin: 0, lineHeight: 0.9 }}>{liveMatch.team1.name}</h2>
                <p style={{ fontFamily: "DM Mono", color: "var(--accent)", fontSize: "1.5rem", opacity: 0.6 }}>{liveMatch.team1.college}</p>
              </div>

              {/* Score Display */}
              <div style={{ display: "flex", alignItems: "center", gap: 40, background: "rgba(255,255,255,0.02)", padding: "20px 60px", borderRadius: 30, border: "1px solid rgba(255,255,255,0.05)" }}>
                <motion.div key={liveMatch.score1} initial={{ scale: 1.2, color: "#fff" }} animate={{ scale: 1, color: "var(--accent)" }} style={{ fontSize: "15rem", fontFamily: "Bebas Neue", lineHeight: 1 }}>{liveMatch.score1}</motion.div>
                <div style={{ fontSize: "6rem", fontFamily: "Bebas Neue", opacity: 0.2 }}>-</div>
                <motion.div key={liveMatch.score2} initial={{ scale: 1.2, color: "#fff" }} animate={{ scale: 1, color: "var(--accent)" }} style={{ fontSize: "15rem", fontFamily: "Bebas Neue", lineHeight: 1 }}>{liveMatch.score2}</motion.div>
              </div>

              {/* Team 2 */}
              <div style={{ flex: 1, textAlign: "left" }}>
                <h2 style={{ fontFamily: "Bebas Neue", fontSize: "7rem", margin: 0, lineHeight: 0.9 }}>{liveMatch.team2?.name || "TBD"}</h2>
                <p style={{ fontFamily: "DM Mono", color: "var(--accent)", fontSize: "1.5rem", opacity: 0.6 }}>{liveMatch.team2?.college || "—"}</p>
              </div>
            </div>

            {/* Timer Block */}
            <div style={{ marginTop: 80 }}>
              <LiveTimer updatedAt={liveMatch.updatedAt} />
            </div>

            <div style={{ marginTop: 40, fontFamily: "Bebas Neue", color: "rgba(255,255,255,0.2)", fontSize: "2rem", letterSpacing: "0.2em" }}>
              MATCH IN PROGRESS
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        :root {
          --accent: #e8ff3c;
          --bg: #060608;
        }
        body { margin: 0; background: #060608; font-family: 'DM Mono', monospace; }
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  );
}
div>
  );
}
