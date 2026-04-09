"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const BASE_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/matches", label: "Matches" },
  { href: "/results", label: "Results" },
  { href: "/bracket", label: "Bracket" },
];

export default function Nav({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    ...BASE_LINKS,
    ...(role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  function handleLogout() {
    // Clear both cookie names for compatibility
    document.cookie = 'role=; Max-Age=0; path=/';
    document.cookie = 'rs_session=; Max-Age=0; path=/';
    // Full reload so layout.tsx re-reads the cleared cookie
    window.location.href = "/login";
  }

  return (
    <header
      style={{
        background: "rgba(13, 13, 18, 0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(232,255,60,0.1)",
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
          <span
            className="neon-text"
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.5rem",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}
          >
            ⚽ ROBOSOCCER
          </span>
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              fontFamily: "DM Mono, monospace",
              whiteSpace: "nowrap",
              opacity: 0.7,
            }}
          >
            TECHTONICS
          </span>
        </div>

        {/* Nav links + role badge + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href} style={{ textDecoration: "none", position: "relative" }}>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-block",
                      padding: "0.375rem 0.75rem",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 500,
                      color: active ? "var(--bg)" : "var(--text-muted)",
                      background: active ? "var(--accent)" : "transparent",
                      boxShadow: active ? "0 0 12px #e8ff3c55" : "none",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      transition: "color 0.2s, background 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {l.label}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* Role badge */}
          <span
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "0.6rem",
              padding: "2px 8px",
              borderRadius: 4,
              background: role === "admin" ? "rgba(232,255,60,0.12)" : "rgba(42,42,58,0.6)",
              color: role === "admin" ? "var(--accent)" : "var(--text-muted)",
              border: `1px solid ${role === "admin" ? "rgba(232,255,60,0.25)" : "rgba(42,42,58,0.8)"}`,
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
              textShadow: role === "admin" ? "0 0 8px #e8ff3c66" : "none",
            }}
          >
            {role.toUpperCase()}
          </span>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.05, color: "var(--accent)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid rgba(42,42,58,0.8)",
              borderRadius: 6,
              padding: "0.3rem 0.65rem",
              fontSize: "0.75rem",
              fontFamily: "DM Mono, monospace",
              color: "var(--text-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            logout
          </motion.button>
        </div>
      </div>
    </header>
  );
}
