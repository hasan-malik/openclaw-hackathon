import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShieldClaw — Autonomous Security Auditor",
  description:
    "Continuous security auditing agent on GOAT Network. ERC-8004 identity, per-finding x402 billing.",
  icons: { icon: "data:," }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-fg antialiased">
        <div className="gridbg min-h-screen">{children}</div>
      </body>
    </html>
  );
}
