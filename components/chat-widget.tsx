"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Wrench, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type UiMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; traces?: { name: string; input: unknown }[] }
  | { role: "system"; text: string };

const STARTERS = [
  "What do you do?",
  "Show me the latest findings",
  "Authorise a scan of juice-shop.demo.local for 24 hours",
  "Try to scan example.com" // judges' "attempt high-risk command" test
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "system",
      text:
        "Talk to ShieldClaw. It can describe itself, list findings, sign scope grants, refuse out-of-scope scans, and trigger x402 payments."
    }
  ]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: `⚠️ ${data.error ?? "request failed"}` }
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: data.reply || "(no text)",
            traces: data.traces?.map((t: any) => ({ name: t.name, input: t.input }))
          }
        ]);
        setHistory(data.history ?? []);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `⚠️ network error: ${(err as Error).message}` }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full border border-accent/30 bg-panel text-accent shadow-xl transition hover:bg-accent hover:text-bg",
          open && "rotate-90"
        )}
        aria-label="Open chat"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[420px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-bg/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <span className="text-sm font-medium">Chat with ShieldClaw</span>
            </div>
            <span className="font-mono text-[10px] text-muted">claude · live</span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 px-2 text-xs text-muted">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                thinking…
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border bg-bg/30 px-4 py-3">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] text-muted hover:border-accent/40 hover:text-fg"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-bg/40 px-3 py-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ShieldClaw anything…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-8 w-8 place-items-center rounded-md bg-accent/10 text-accent hover:bg-accent hover:text-bg disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ msg }: { msg: UiMessage }) {
  if (msg.role === "system") {
    return (
      <div className="rounded-md border border-border bg-bg/30 px-3 py-2 text-[11px] leading-relaxed text-muted">
        {msg.text}
      </div>
    );
  }
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-accent/10 px-3 py-2 text-sm text-fg">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {msg.traces && msg.traces.length > 0 && (
        <div className="space-y-1">
          {msg.traces.map((t, i) => (
            <div
              key={i}
              className="inline-flex max-w-full items-center gap-1.5 truncate rounded border border-border bg-bg/50 px-2 py-1 text-[10px] text-muted"
            >
              <Wrench size={10} className="text-accent" />
              <span className="font-mono">{t.name}</span>
              <span className="truncate text-muted/60">{JSON.stringify(t.input)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="max-w-[90%] rounded-lg border border-border bg-bg/60 px-3 py-2 text-sm leading-relaxed text-fg">
        {msg.text}
      </div>
    </div>
  );
}
