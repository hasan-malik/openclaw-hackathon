import { cn } from "@/lib/cn";
import type { Severity } from "@shared/types";

const STYLES: Record<Severity, string> = {
  critical: "bg-critical/15 text-critical border-critical/40",
  high: "bg-high/15 text-high border-high/40",
  medium: "bg-medium/15 text-medium border-medium/40",
  low: "bg-low/15 text-low border-low/40",
  info: "bg-info/15 text-info border-info/40"
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-mono uppercase tracking-wider",
        STYLES[severity]
      )}
    >
      {severity}
    </span>
  );
}
