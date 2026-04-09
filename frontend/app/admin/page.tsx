"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function AdminPage() {
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function adminAction(action: string) {
    setLoading(true);
    setMsg("");
    console.log(`[Admin] Action: ${action}`);

    if (action === "export") {
      try {
        const res = await fetch(`${API_URL.replace('/api', '')}/api/admin/export`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "tournament_results.csv";
          a.click();
          setMsg("Export downloaded!");
          setMsgType("ok");
        } else {
          const d = await res.json().catch(() => ({}));
          setMsg(d.error || "Export failed");
          setMsgType("err");
        }
      } catch (e) {
        console.error('[Admin] Export error:', e);
        setMsg("Network error — is the backend running?");
        setMsgType("err");
      }
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL.replace('/api', '')}/api/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(data.message || "Done");
        setMsgType("ok");
      } else {
        setMsg(data.error || "Error");
        setMsgType("err");
      }
    } catch (e) {
      console.error('[Admin] Action error:', e);
      setMsg("Network error — is the backend running?");
      setMsgType("err");
    }
    setLoading(false);
  }

  function handleLogout() {
    // Clear both cookie names for compatibility
    document.cookie = 'role=; Max-Age=0; path=/';
    document.cookie = 'rs_session=; Max-Age=0; path=/';
    window.location.href = "/login";
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      style={{ maxWidth: 600, margin: "0 auto" }}
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
          ADMIN
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace", fontSize: "0.8rem", marginTop: 4 }}>
          Tournament controls
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                ...glassCard,
                border: `1px solid ${msgType === "ok" ? "rgba(232,255,60,0.4)" : "rgba(255,68,68,0.4)"}`,
                padding: "12px 16px",
                fontFamily: "DM Mono, monospace",
                fontSize: "0.8rem",
                color: msgType === "ok" ? "var(--accent)" : "#ff4444",
              }}
            >
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          style={{ ...glassCard, padding: 24, position: "relative" }}
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
              opacity: 0.4,
            }}
          />
          <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.1rem", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 8 }}>
            EXPORT RESULTS
          </h2>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 14 }}>
            Download all teams and match results as a CSV file.
          </p>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.04, boxShadow: loading ? "none" : "0 0 20px #e8ff3c55" }}
            whileTap={{ scale: loading ? 1 : 0.96 }}
            onClick={(e) => { addRipple(e); adminAction("export"); }}
            disabled={loading}
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.05rem",
              letterSpacing: "0.04em",
              cursor: loading ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {loading ? "..." : "DOWNLOAD CSV"}
          </motion.button>
        </motion.div>

        {/* Reset Tournament */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          style={{ ...glassCard, border: "1px solid rgba(255,68,68,0.2)", padding: 24, position: "relative" }}
        >
          <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.1rem", color: "#ff6666", letterSpacing: "0.04em", marginBottom: 8 }}>
            RESET TOURNAMENT
          </h2>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 14 }}>
            Deletes all matches and clears attendance. Teams are kept.
          </p>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.04, boxShadow: loading ? "none" : "0 0 16px rgba(255,68,68,0.4)" }}
            whileTap={{ scale: loading ? 1 : 0.96 }}
            onClick={(e) => {
              addRipple(e);
              if (!confirm("Reset tournament? All matches will be deleted and attendance cleared. Teams are kept.")) return;
              adminAction("reset");
            }}
            disabled={loading}
            style={{
              background: "transparent",
              color: "#ff6666",
              border: "1px solid rgba(255,68,68,0.5)",
              borderRadius: 8,
              padding: "10px 22px",
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.05rem",
              letterSpacing: "0.04em",
              cursor: loading ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {loading ? "..." : "RESET TOURNAMENT"}
          </motion.button>
        </motion.div>

        {/* Full Reset */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          style={{ ...glassCard, border: "1px solid rgba(255,34,34,0.2)", padding: 24, position: "relative" }}
        >
          <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.1rem", color: "#ff4444", letterSpacing: "0.04em", marginBottom: 8 }}>
            FULL RESET
          </h2>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 14 }}>
            Deletes ALL data — teams, matches, and attendance. Cannot be undone.
          </p>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.04, boxShadow: loading ? "none" : "0 0 20px rgba(255,34,34,0.5)" }}
            whileTap={{ scale: loading ? 1 : 0.96 }}
            onClick={(e) => {
              addRipple(e);
              if (!confirm("FULL RESET? This will delete ALL teams and matches permanently. Are you sure?")) return;
              if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
              adminAction("reset_full");
            }}
            disabled={loading}
            style={{
              background: "#ff2222",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.05rem",
              letterSpacing: "0.04em",
              cursor: loading ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {loading ? "..." : "FULL RESET — DELETE ALL"}
          </motion.button>
        </motion.div>

        {/* Email Test */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          style={{ ...glassCard, padding: 24, position: "relative" }}
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
              opacity: 0.3,
            }}
          />
          <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.1rem", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 8 }}>
            TEST EMAIL
          </h2>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 14 }}>
            Send a test notification email using your configured Gmail credentials.
          </p>
          <TestEmailForm />
        </motion.div>

        {/* Logout */}
        <motion.button
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          whileHover={{ scale: 1.02, borderColor: "rgba(232,255,60,0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => { addRipple(e); handleLogout(); }}
          style={{
            background: "transparent",
            border: "1px solid rgba(42,42,58,0.8)",
            borderRadius: 8,
            padding: "8px",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontFamily: "DM Mono, monospace",
            fontSize: "0.78rem",
            position: "relative",
            overflow: "hidden",
            transition: "border-color 0.2s",
          }}
        >
          LOGOUT
        </motion.button>
      </div>
    </motion.div>
  );
}

function TestEmailForm() {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  async function send() {
    if (!to.trim()) return;
    setSending(true);
    setResult("");
    // Note: email endpoint lives on the backend
    try {
      const res = await fetch(`${API_URL.replace('/api', '')}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: "RoboSoccer — Test Email",
          body: "This is a test email from the Tectonics RoboSoccer tournament system. If you received this, email notifications are working correctly!",
        }),
      });
      const d = await res.json().catch(() => ({ error: 'Invalid response' }));
      setResult(d.ok ? "Email sent successfully!" : `Error: ${d.error || 'Unknown error'}`);
    } catch (e) {
      setResult('Network error — is the backend running?');
    }
    setSending(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@gmail.com"
          style={{
            background: "rgba(26,26,36,0.8)",
            border: "1px solid rgba(42,42,58,0.8)",
            borderRadius: 8,
            padding: "8px 12px",
            color: "var(--text)",
            fontFamily: "DM Mono, monospace",
            fontSize: "0.85rem",
            outline: "none",
            flex: 1,
            backdropFilter: "blur(8px)",
          }}
        />
        <motion.button
          whileHover={{ scale: sending ? 1 : 1.04, boxShadow: sending ? "none" : "0 0 16px #e8ff3c44" }}
          whileTap={{ scale: sending ? 1 : 0.96 }}
          onClick={(e) => {
            const btn = e.currentTarget;
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const span = document.createElement("span");
            span.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(232,255,60,0.25);transform:scale(0);animation:ripple-out 0.55s ease-out forwards;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;pointer-events:none;`;
            btn.appendChild(span);
            span.addEventListener("animationend", () => span.remove());
            send();
          }}
          disabled={sending}
          style={{
            background: "var(--accent)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.04em",
            cursor: sending ? "not-allowed" : "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {sending ? "..." : "SEND TEST"}
        </motion.button>
      </div>
      <AnimatePresence>
        {result && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "0.75rem",
              color: result.startsWith("Error") ? "#ff4444" : "var(--accent)",
              marginTop: 6,
            }}
          >
            {result}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
