import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  RefreshCw,
  TrendingUp,
  Package,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("dwatrack_token");
}

// ── Insight Card ─────────────────────────────────────────────────────────────
function InsightCard({ icon: Icon, accent, title, children, onRefresh, loading }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 flex items-center justify-between ${accent}`}>
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-white opacity-90" />
          <span className="text-xs font-semibold text-white uppercase tracking-widest opacity-90">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2.5 text-gray-400 text-sm py-1">
              <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-teal-400 rounded-full animate-spin shrink-0" />
              <span className="text-xs text-gray-400">Analysing your data…</span>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ── Chat Bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ role, content, streaming }) {
  const isAI = role === "assistant";
  return (
    <div className={`flex gap-2.5 ${isAI ? "" : "flex-row-reverse"}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isAI ? "bg-gray-900 text-white" : "bg-teal-500 text-white"
        }`}
      >
        {isAI ? <Sparkles size={11} /> : <User size={11} />}
      </div>
      <div
        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
            : "bg-gray-900 text-white rounded-tr-none"
        }`}
      >
        {content}
        {streaming && (
          <span className="inline-block w-1 h-3.5 bg-teal-400 ml-1 animate-pulse rounded-sm align-middle" />
        )}
      </div>
    </div>
  );
}

// ── Suggested Questions ───────────────────────────────────────────────────────
const SUGGESTED = [
  "What were my best-selling products this month?",
  "How is my profit looking?",
  "Which day of the week do I sell the most?",
  "What expenses should I watch out for?",
  "Am I making more than I'm spending?",
];

// ── Main Component ────────────────────────────────────────────────────────────
export function AIAssistant() {
  const { currency } = useAuth();

  // Insights state
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [restock, setRestock] = useState(null);
  const [restockLoading, setRestockLoading] = useState(false);

  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-load insights on mount
  useEffect(() => {
    fetchSummary();
    fetchRestock();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function fetchSummary() {
    setSummaryLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/daily-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      setSummary(data.summary || data.error || "Unable to generate summary.");
    } catch {
      setSummary("Could not connect to the AI service. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function fetchRestock() {
    setRestockLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      setRestock(data.suggestions || data.error || "Unable to generate suggestions.");
    } catch {
      setRestock("Could not connect to the AI service. Please try again.");
    } finally {
      setRestockLoading(false);
    }
  }

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || chatLoading) return;

    setInput("");
    setChatLoading(true);

    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);

    // Add placeholder for AI response
    setChatHistory((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory.slice(-10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: err.error || "Something went wrong. Please try again.",
            streaming: false,
          };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.text) {
              setChatHistory((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + json.text,
                };
                return updated;
              });
            }
            if (json.done) {
              setChatHistory((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  streaming: false,
                };
                return updated;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch {
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Could not connect to the AI service. Check your internet connection.",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
            <Sparkles size={15} className="text-teal-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 m-0">AI Assistant</h2>
        </div>
        <p className="text-sm text-gray-400 m-0 ml-10.5">
          Powered by Groq — real insights from your actual business data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Insight cards */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <InsightCard
            icon={TrendingUp}
            accent="bg-gray-900"
            title="Today's Summary"
            onRefresh={fetchSummary}
            loading={summaryLoading}
          >
            <p className="text-sm text-gray-700 leading-relaxed m-0">{summary}</p>
          </InsightCard>

          <InsightCard
            icon={Package}
            accent="bg-amber-500"
            title="Restock Suggestions"
            onRefresh={fetchRestock}
            loading={restockLoading}
          >
            <p className="text-sm text-gray-700 leading-relaxed m-0">{restock}</p>
          </InsightCard>
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: 520 }}>
          {/* Chat header */}
          <div className="px-5 py-3.5 bg-gray-900 rounded-t-2xl flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-teal-400/20 flex items-center justify-center">
              <Sparkles size={11} className="text-teal-400" />
            </div>
            <span className="text-sm font-semibold text-white">Business Advisor</span>
            <span className="ml-auto text-[10px] text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">Groq AI</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-4">
                <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center">
                  <Sparkles size={18} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 m-0 mb-1">Ask your business advisor</p>
                  <p className="text-xs text-gray-400 m-0">Connected to your transactions, products, expenses, and stock.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-white hover:bg-gray-900 hover:text-white text-gray-600 border border-gray-200 hover:border-gray-900 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <ChatBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  streaming={msg.streaming}
                />
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested questions — always visible */}
          {chatHistory.length > 0 && (
            <div className="px-4 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={chatLoading}
                  className="text-[11px] whitespace-nowrap bg-white hover:bg-gray-900 hover:text-white text-gray-500 border border-gray-200 hover:border-gray-900 px-2.5 py-1 rounded-full transition-all cursor-pointer disabled:opacity-40 shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-50">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your sales, expenses, or products..."
                rows={1}
                disabled={chatLoading}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-colors disabled:opacity-60"
                style={{ maxHeight: 100 }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || chatLoading}
                className="w-10 h-10 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-none shrink-0"
              >
                {chatLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 m-0 mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
