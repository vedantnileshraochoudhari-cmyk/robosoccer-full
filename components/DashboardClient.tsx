"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

// --- Ripple helper ---
function addRipple(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement("span");
  span.style.cssText = `
    position:absolute;width:${size}px;height:${size}px;
    border-radius:50%;background:rgba(232,255,60,0.2);
    transform:scale(0);animation:ripple-out 0.55s ease-out forwards;
    left:${e.clientX - rect.left - size / 2}px;
    top:${e.clientY - rect.top - size / 2}px;
    pointer-events:none;
  `;
  el.style.position = "relative";
  el.style.overflow = "hidden";
  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

// --- Animated counter ---
function Counter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || typeof target !== "number") return;
    if (target === 0) return;
    let frame = 0;
    const totalFrames = 60;
    const timer = setInterval(() => {
      frame++;
      setCount(Math.round((frame / totalFrames) * target));
      if (frame >= totalFrames) clearInterval(timer);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{typeof target === "number" ? count : target}</span>;
}

// --- 3D Soccer ball ---
function SoccerBall() {
  return (
    <motion.div
      animate={{ y: [0, -18, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ position: "relative", width: 160, height: 160 }}
    >
      {/* Outer glow ring */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: -20,
          borderRadius: "50%",
          background: "radial-gradient(circle, #e8ff3c28 0%, transparent 70%)",
          filter: "blur(16px)",
        }}
      />
      {/* Second glow ring — cyan */}
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: -28,
          borderRadius: "50%",
          background: "radial-gradient(circle, #00c8ff15 0%, transparent 65%)",
          filter: "blur(20px)",
        }}
      />
      {/* Ball */}
      <motion.div
        animate={{ rotateZ: [0, 360] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        style={{ width: 160, height: 160 }}
      >
        <svg width="160" height="160" viewBox="0 0 160 160">
          <defs>
            <radialGradient id="ballGrad" cx="38%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#2a2a40" />
              <stop offset="50%" stopColor="#141420" />
              <stop offset="100%" stopColor="#08080f" />
            </radialGradient>
            <filter id="ballGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Ball body */}
          <circle cx="80" cy="80" r="76" fill="url(#ballGrad)" stroke="#e8ff3c" strokeWidth="0.8" strokeOpacity="0.4" />
          {/* Central hexagon */}
          <polygon
            points="80,52 100,64 100,88 80,100 60,88 60,64"
            fill="#e8ff3c10"
            stroke="#e8ff3c"
            strokeWidth="1.5"
            strokeOpacity="0.75"
            filter="url(#ballGlow)"
          />
          {/* Connector lines to edge hexagons */}
          <line x1="80" y1="52" x2="80" y2="26" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="100" y1="64" x2="122" y2="52" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="100" y1="88" x2="122" y2="100" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="80" y1="100" x2="80" y2="126" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="60" y1="88" x2="38" y2="100" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="60" y1="64" x2="38" y2="52" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.4" />
          {/* Partial surrounding hexagons */}
          <polygon points="80,26 96,17 110,26 110,44 96,53 80,44" fill="none" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.35" />
          <polygon points="122,52 138,43 152,52 152,70 138,79 122,70" fill="none" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.25" />
          <polygon points="80,126 96,117 110,126 110,144 96,153 80,144" fill="none" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.25" />
          <polygon points="38,52 54,43 68,52 68,70 54,79 38,70" fill="none" stroke="#e8ff3c" strokeWidth="1" strokeOpacity="0.3" />
          {/* Shine highlight */}
          <ellipse cx="58" cy="54" rx="14" ry="9" fill="white" fillOpacity="0.09" transform="rotate(-20 58 54)" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// --- 3D tilt card ---
function TiltCard({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-4px)`;
    el.style.boxShadow = `0 12px 40px rgba(232,255,60,0.18), 0 0 0 1px rgba(232,255,60,0.22)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    el.style.boxShadow = "none";
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        transformStyle: "preserve-3d",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// --- Glass stat card ---
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

interface StatItem {
  label: string;
  value: number | string;
  sub: string;
  icon?: string;
}

interface NavItem {
  href: string;
  label: string;
  desc: string;
  icon: string;
}

interface Match {
  id: number;
  round: number;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  isBye: boolean;
  team1Id: number;
  team2Id: number | null;
  team1: { name: string };
  team2: { name: string } | null;
}

interface Props {
  stats: StatItem[];
  navItems: NavItem[];
  recentMatches: Match[];
}

export default function DashboardClient({ stats: initialStats, navItems, recentMatches: initialMatches }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [recentMatches, setRecentMatches] = useState(initialMatches);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/results");
        if (!res.ok) return;
        const data = await res.json();
        
        setStats(prev => {
          const next = [...prev];
          next[0].value = data.stats.total_teams || next[0].value; // If we add total_teams to result api
          next[1].value = data.stats.completed;
          next[1].sub = `${data.stats.total - data.stats.completed} remaining`;
          next[2].value = data.stats.goals;
          return next;
        });
        setRecentMatches(data.matches.reverse().slice(0, 5));
      } catch (e) {
        // Fallback or silent Fail
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          marginBottom: 40,
          flexWrap: "wrap",
        }}
      >
        <div>
          {/* Event badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(232,255,60,0.07)",
              border: "1px solid rgba(232,255,60,0.22)",
              borderRadius: 100,
              padding: "5px 16px",
              marginBottom: 16,
              animation: "badge-pulse 3s ease-in-out infinite",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 8px #e8ff3c, 0 0 16px #e8ff3c88",
              }}
            />
            <span
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "0.65rem",
                color: "var(--accent)",
                letterSpacing: "0.13em",
              }}
            >
              TECHTONICS · COLLEGE TECH FEST
            </span>
          </motion.div>

          <h1
            className="neon-text"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(3rem, 8vw, 5.5rem)",
              letterSpacing: "0.06em",
              lineHeight: 1,
            }}
          >
            ROBOSOCCER
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              color: "var(--text-muted)",
              fontFamily: "DM Mono, monospace",
              fontSize: "0.78rem",
              marginTop: 10,
              letterSpacing: "0.12em",
            }}
          >
            TOURNAMENT MANAGER — AUTONOMOUS FOOTBALL
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <SoccerBall />
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(232,255,60,0.4), rgba(0,200,255,0.3), transparent)",
          marginBottom: 32,
          transformOrigin: "left",
        }}
      />

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <TiltCard
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--glass-border)",
                borderRadius: 14,
                padding: "20px 22px 18px",
                height: "100%",
                cursor: "default",
              }}
            >
              {/* Gradient border top accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  borderRadius: "14px 14px 0 0",
                  background: "linear-gradient(90deg, transparent, #e8ff3c, #00c8ff55, transparent)",
                  opacity: 0.7,
                }}
              />
              {/* Icon */}
              {s.icon && (
                <div
                  style={{
                    fontSize: "1.2rem",
                    marginBottom: 12,
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(232,255,60,0.08)",
                    border: "1px solid rgba(232,255,60,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.icon}
                </div>
              )}
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: "2.4rem",
                  color: "var(--accent)",
                  fontWeight: 500,
                  lineHeight: 1,
                  textShadow: "0 0 24px #e8ff3c55",
                }}
              >
                {typeof s.value === "number" ? <Counter target={s.value} /> : s.value}
              </div>
              <div
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "0.95rem",
                  color: "var(--text)",
                  letterSpacing: "0.05em",
                  marginTop: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginTop: 3,
                }}
              >
                {s.sub}
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "1rem",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
          }}
        >
          QUICK ACCESS
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "linear-gradient(90deg, rgba(232,255,60,0.2), transparent)",
          }}
        />
      </motion.div>

      {/* Nav cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {navItems.map((item, i) => (
          <motion.div
            key={item.href}
            custom={i + stats.length}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Link href={item.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
              <motion.div
                whileHover={{
                  y: -5,
                  boxShadow: "0 20px 50px rgba(232,255,60,0.14), 0 0 0 1px rgba(232,255,60,0.28)",
                  borderColor: "rgba(232,255,60,0.3)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={addRipple}
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(232,255,60,0.1)",
                  borderRadius: 14,
                  padding: "20px 20px 18px",
                  cursor: "pointer",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Top gradient bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderRadius: "14px 14px 0 0",
                    background: "linear-gradient(90deg, transparent, rgba(232,255,60,0.5), transparent)",
                    opacity: 0.5,
                  }}
                />
                {/* Corner glow */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 60,
                    height: 60,
                    background: "linear-gradient(225deg, rgba(232,255,60,0.1), transparent)",
                    borderRadius: "0 14px 0 60px",
                  }}
                />

                {/* Icon container */}
                <div
                  style={{
                    fontSize: "1.3rem",
                    marginBottom: 12,
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "rgba(232,255,60,0.08)",
                    border: "1px solid rgba(232,255,60,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 12px rgba(232,255,60,0.08)",
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.15rem",
                    color: "var(--accent)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {item.desc}
                </div>

                {/* Arrow indicator */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    fontFamily: "DM Mono, monospace",
                    fontSize: "0.8rem",
                    color: "rgba(232,255,60,0.4)",
                  }}
                >
                  →
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent results */}
      {recentMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
          style={{ marginTop: 44 }}
        >
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1rem",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
              }}
            >
              RECENT RESULTS
            </h2>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "linear-gradient(90deg, rgba(232,255,60,0.2), transparent)",
              }}
            />
            <span
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "0.6rem",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
              }}
            >
              LAST {recentMatches.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentMatches.map((m, i) => {
              const team1Wins = m.winnerId === m.team1Id;
              const team2Wins = m.winnerId === m.team2Id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.06, duration: 0.35 }}
                  style={{
                    background: "rgba(19,19,26,0.7)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(232,255,60,0.08)",
                    borderLeft: team1Wins || team2Wins
                      ? "3px solid rgba(232,255,60,0.5)"
                      : "3px solid rgba(42,42,58,0.6)",
                    borderRadius: 10,
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* Round badge */}
                  <span
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: "0.6rem",
                      color: "var(--text-muted)",
                      background: "rgba(42,42,58,0.6)",
                      border: "1px solid rgba(42,42,58,0.9)",
                      borderRadius: 4,
                      padding: "2px 7px",
                      minWidth: 44,
                      textAlign: "center",
                      letterSpacing: "0.06em",
                    }}
                  >
                    R{m.round}
                  </span>

                  {/* Team 1 */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: "0.88rem",
                      color: team1Wins ? "var(--accent)" : "var(--text)",
                      fontWeight: team1Wins ? 600 : 400,
                      textShadow: team1Wins ? "0 0 12px #e8ff3c55" : "none",
                    }}
                  >
                    {team1Wins && <span style={{ marginRight: 4, fontSize: "0.75rem" }}>🏆</span>}
                    {m.team1.name}
                  </span>

                  {/* Score */}
                  <span
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: "0.95rem",
                      color: "var(--text)",
                      minWidth: 64,
                      textAlign: "center",
                      background: "rgba(42,42,58,0.35)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {m.isBye ? "BYE" : `${m.score1} – ${m.score2}`}
                  </span>

                  {/* Team 2 */}
                  <span
                    style={{
                      flex: 1,
                      textAlign: "right",
                      fontSize: "0.88rem",
                      color: team2Wins ? "var(--accent)" : "var(--text)",
                      fontWeight: team2Wins ? 600 : 400,
                      textShadow: team2Wins ? "0 0 12px #e8ff3c55" : "none",
                    }}
                  >
                    {m.team2?.name ?? "BYE"}
                    {team2Wins && <span style={{ marginLeft: 4, fontSize: "0.75rem" }}>🏆</span>}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
