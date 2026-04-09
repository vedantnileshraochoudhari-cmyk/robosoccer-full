"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement("span");
  span.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(232,255,60,0.25);transform:scale(0);animation:ripple-out 0.55s ease-out forwards;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;pointer-events:none;`;
  btn.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

function LoginCard({
  role,
  icon,
  title,
  description,
  index,
}: {
  role: "admin" | "volunteer";
  icon: string;
  title: string;
  description: string;
  index: number;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleLogin() {
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    // Client-side password check against env vars
    // Set NEXT_PUBLIC_ADMIN_PASSWORD and NEXT_PUBLIC_VOLUNTEER_PASSWORD on Vercel
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
    const volunteerPass = process.env.NEXT_PUBLIC_VOLUNTEER_PASSWORD || "volunteer123";
    const expectedPass = role === "admin" ? adminPass : volunteerPass;

    if (password !== expectedPass) {
      setError("Wrong password");
      setLoading(false);
      return;
    }

    // Set the role cookie — must be readable by server-side layout.tsx
    document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 12}; SameSite=lax`;

    const from = searchParams.get("from") || "/";
    // Use window.location to ensure layout re-reads the cookie on full navigation
    window.location.href = from === "/login" ? "/" : from;
  }

  const isAdmin = role === "admin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      style={{
        flex: "1 1 280px",
        background: "rgba(19,19,26,0.6)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${isAdmin ? "rgba(232,255,60,0.2)" : "rgba(42,42,58,0.8)"}`,
        borderRadius: 16,
        padding: 28,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top gradient accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: isAdmin
            ? "linear-gradient(90deg, transparent, #e8ff3c, transparent)"
            : "linear-gradient(90deg, transparent, rgba(42,42,58,0.8), transparent)",
          opacity: isAdmin ? 0.7 : 0.4,
        }}
      />

      {/* Corner glow for admin */}
      {isAdmin && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 80,
            height: 80,
            background: "radial-gradient(circle at top right, rgba(232,255,60,0.1), transparent)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          fontSize: "2rem",
          marginBottom: 12,
          width: 52,
          height: 52,
          borderRadius: 12,
          background: isAdmin ? "rgba(232,255,60,0.1)" : "rgba(42,42,58,0.5)",
          border: `1px solid ${isAdmin ? "rgba(232,255,60,0.25)" : "rgba(42,42,58,0.8)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "1.6rem",
          letterSpacing: "0.06em",
          color: isAdmin ? "var(--accent)" : "var(--text)",
          textShadow: isAdmin ? "0 0 20px #e8ff3c44" : "none",
          marginBottom: 4,
        }}
      >
        {title}
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {/* Password input */}
      <label
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "0.68rem",
          color: "var(--text-muted)",
          display: "block",
          marginBottom: 6,
          letterSpacing: "0.06em",
        }}
      >
        PASSWORD
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        placeholder={isAdmin ? "Admin password..." : "Volunteer password..."}
        style={{
          background: "rgba(26,26,36,0.9)",
          border: `1px solid ${error ? "rgba(255,68,68,0.5)" : "rgba(42,42,58,0.9)"}`,
          borderRadius: 8,
          padding: "10px 14px",
          color: "var(--text)",
          fontFamily: "DM Mono, monospace",
          fontSize: "0.9rem",
          outline: "none",
          width: "100%",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "0.72rem",
              color: "#ff4444",
              marginBottom: 10,
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: loading ? 1 : 1.03, boxShadow: loading ? "none" : isAdmin ? "0 0 20px #e8ff3c55" : "0 0 12px rgba(232,232,240,0.15)" }}
        whileTap={{ scale: loading ? 1 : 0.97 }}
        onClick={(e) => { addRipple(e); handleLogin(); }}
        disabled={loading}
        style={{
          width: "100%",
          background: isAdmin ? "var(--accent)" : "rgba(42,42,58,0.7)",
          color: isAdmin ? "var(--bg)" : "var(--text)",
          border: isAdmin ? "none" : "1px solid rgba(42,42,58,0.9)",
          borderRadius: 8,
          padding: "11px",
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "1.05rem",
          letterSpacing: "0.06em",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {loading ? "..." : `LOGIN AS ${title}`}
      </motion.button>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        style={{ textAlign: "center", marginBottom: 40 }}
      >
        <h1
          className="neon-text"
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "clamp(3rem, 8vw, 5rem)",
            letterSpacing: "0.06em",
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          ⚽ ROBOSOCCER
        </h1>
        <p
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
          }}
        >
          TECHTONICS — TOURNAMENT MANAGER
        </p>
      </motion.div>

      {/* Role cards */}
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: 640,
        }}
      >
        <LoginCard
          role="volunteer"
          icon="🙋"
          title="VOLUNTEER"
          description="Manage matches, enter scores, mark attendance, and view results."
          index={0}
        />
        <LoginCard
          role="admin"
          icon="⚙"
          title="ADMIN"
          description="Full access including data export, tournament reset, and settings."
          index={1}
        />
      </div>
    </div>
  );
}
