import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Nav from "@/components/Nav";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ToastProvider } from "@/components/Toasts";

export const metadata: Metadata = {
  title: "Techtonics — RoboSoccer",
  description: "RoboSoccer Tournament Manager for Techtonics",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  // Check BOTH cookie names for compatibility (old: rs_session, new: role)
  const role =
    cookieStore.get("role")?.value ??
    cookieStore.get("rs_session")?.value ??
    "volunteer"; // Default to volunteer so pages are always accessible

  return (
    <html lang="en">
      <body style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ToastProvider>
          <AnimatedBackground />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Nav role={role} />
            <main style={{ flex: 1, padding: "24px 16px", width: "100%", maxWidth: "80rem", margin: "0 auto", minWidth: 0 }}>
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
