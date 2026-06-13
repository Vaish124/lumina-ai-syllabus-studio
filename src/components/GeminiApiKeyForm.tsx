"use client";

import { useState, useEffect } from "react";
import { Key, Eye, EyeOff, Check, AlertCircle } from "lucide-react";

export default function GeminiApiKeyForm() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const storedKey = localStorage.getItem("gemini_api_key") || "";
    setApiKey(storedKey);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim() === "") {
      localStorage.removeItem("gemini_api_key");
    } else {
      localStorage.setItem("gemini_api_key", apiKey.trim());
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl w-full border border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Gemini API Configuration</h3>
          <p className="text-xs text-slate-400">
            Securely save your Gemini API Key. It is saved only in your local browser storage.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Gemini API Key here (AI-SDK, gemini-3.5-flash)..."
            className="w-full pl-3 pr-10 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>If left blank, the app runs in Mock Mode.</span>
          </div>
          <div className="flex gap-2">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
