"use client";

import { useEffect } from "react";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0e] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full rounded-3xl border border-slate-800 p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="mx-auto w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-6 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100 font-display">Something went wrong</h2>
          <p className="text-sm text-slate-400">
            We encountered an unexpected error while loading this page. Our team has been notified.
          </p>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 text-left overflow-hidden">
          <p className="text-xs text-rose-400 font-mono break-words line-clamp-3">
            {error.message || "Unknown Application Error"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/15"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
