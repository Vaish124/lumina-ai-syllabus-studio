"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User, RefreshCw, X } from "lucide-react";
import { getLessonChatResponseAction } from "@/app/actions/ai";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AIStudyCompanionProps {
  lessonTitle: string;
  lessonContent: string;
}

export default function AIStudyCompanion({ lessonTitle, lessonContent }: AIStudyCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: `Hello! I'm your AI Study Companion for this lesson. Feel free to ask me questions, request examples, or ask me to explain a specific section in simpler terms!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "" || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const apiKey = localStorage.getItem("gemini_api_key") || undefined;
      const chatHistory = messages.map((m) => ({ role: m.role, text: m.text }));

      const res = await getLessonChatResponseAction(
        lessonTitle,
        lessonContent,
        chatHistory,
        userMessage,
        apiKey
      );

      if (res.success && res.response) {
        setMessages((prev) => [...prev, { role: "model", text: res.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `Sorry, I encountered an issue: ${res.error || "Could not generate response."}`,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `An error occurred: ${err.message || "Please try again later."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "model",
        text: `Chat cleared! Let's start fresh. What would you like to understand about "${lessonTitle}"?`,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Study Assistant</h4>
            <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
              Reviewing: {lessonTitle}
            </span>
          </div>
        </div>
        <button
          onClick={clearChat}
          title="Reset Chat"
          className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg, i) => {
          const isAI = msg.role === "model";
          return (
            <div key={i} className={`flex gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}>
              {isAI && (
                <div className="w-7 h-7 rounded-lg bg-indigo-550 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/10">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  isAI
                    ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                    : "bg-indigo-650 text-white rounded-tr-none font-medium"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              </div>
              {!isAI && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-550 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-3.5 py-3 text-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/60 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Study Companion..."
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={input.trim() === "" || loading}
          className="p-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/10"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
