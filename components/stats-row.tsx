import type { Finding } from "@shared/types";

export function StatsRow({ findings }: { findings: Finding[] }) {
  const totalEarnedUsdc = findings
    .filter((f) => f.billing.status === "paid")
    .reduce((s, f) => s + Number(f.billing.amountUsdc), 0);

  const pendingUsdc = findings
    .filter((f) => f.billing.status === "pending" || f.billing.status === "confirmed")
    .reduce((s, f) => s + Number(f.billing.amountUsdc), 0);

  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;

  const stats = [
    { label: "Findings", value: String(findings.length), accent: false },
    { label: "Critical / High", value: `${critical} / ${high}`, accent: false },
    { label: "Paid (USDC)", value: totalEarnedUsdc.toFixed(2), accent: true },
    { label: "Pending (USDC)", value: pendingUsdc.toFixed(2), accent: false }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-panel/60 p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted">{s.label}</div>
          <div className={`mt-1 font-mono text-2xl ${s.accent ? "text-accent" : "text-fg"}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
