"use client";

export function SonarPulse() {
  return (
    <div className="relative h-32 w-32 md:h-40 md:w-40">
      <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping" style={{ animationDuration: "2s" }} />
      <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-ping" style={{ animationDuration: "2.6s" }} />
      <div className="absolute inset-4 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: "3.4s" }} />
      <div className="absolute inset-6 rounded-full bg-cyan-400/10 backdrop-blur" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-mono text-2xl font-bold text-cyan-300 text-glow">LIVE</div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-cyan-300/70">scanning</div>
        </div>
      </div>
    </div>
  );
}
