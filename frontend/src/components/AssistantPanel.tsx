"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type Line = { role: "user" | "assistant"; content: string };

export default function AssistantPanel() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, open]);

  async function send() {
    if (!input.trim() || !token) return;
    const message = input.trim();
    setLines((l) => [...l, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chat(token, message, conversationId);
      setConversationId(res.conversationId);
      setLines((l) => [...l, { role: "assistant", content: res.reply }]);
    } catch {
      setLines((l) => [...l, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="w-[22rem] h-[28rem] mb-3 bg-white rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between">
            <span className="font-display tracking-wide text-lg font-semibold">AI Stylist</span>
            <button onClick={() => setOpen(false)} className="text-paper/70 hover:text-pink text-sm">
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {lines.length === 0 && (
              <p className="text-ink/50 leading-relaxed">
                Ask me for outfit ideas, product comparisons, or recommendations —
                try &ldquo;what should I wear to a summer wedding?&rdquo;
              </p>
            )}
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.role === "user"
                    ? "bg-cultured rounded-anon rounded-br-sm px-3 py-2 ml-8"
                    : "bg-pink/15 rounded-anon rounded-bl-sm px-3 py-2 mr-8"
                }
              >
                {line.content}
              </div>
            ))}
            {loading && <div className="text-ink/40 text-xs">Thinking... (local AI can take up to a minute)</div>}
          </div>

          <div className="border-t border-line p-3">
            {!user ? (
              <p className="text-xs text-ink/50">Log in to chat with the AI stylist.</p>
            ) : (
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask something..."
                  className="flex-1 border border-line rounded-anon px-3 py-2 text-sm outline-none focus:border-pink"
                />
                <button onClick={send} className="bg-ink text-paper rounded-anon px-4 text-sm font-medium hover:bg-pink transition-colors">
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-ink text-paper rounded-anon px-5 py-3 text-sm font-semibold shadow-lg hover:bg-pink transition-colors"
        aria-label="Toggle AI shopping assistant"
      >
        {open ? "Close" : "✨ Ask AI"}
      </button>
    </div>
  );
}
