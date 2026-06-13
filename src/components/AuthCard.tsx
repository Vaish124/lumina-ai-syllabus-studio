"use client";

import { useState, useTransition } from "react";
import { Sparkles, Mail, Lock, User, GraduationCap, School, ShieldAlert, ArrowRight, Check, RefreshCw } from "lucide-react";
import { loginAction, registerAction } from "@/app/actions/auth";

interface AuthCardProps {
  onSuccess: (user: { id: string; name: string; email: string; role: string }) => void;
}

export default function AuthCard({ onSuccess }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
  };

  const handleDemoLogin = async (demoRole: "TEACHER" | "STUDENT") => {
    setError("");
    const demoEmail = demoRole === "TEACHER" ? "teacher@edtech.com" : "student@edtech.com";
    const demoPassword = "password123";

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", demoEmail);
      formData.set("password", demoPassword);

      const res = await loginAction(null, formData);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || "Demo login failed");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (activeTab === "register" && !name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);

      if (activeTab === "register") {
        formData.set("name", name);
        formData.set("role", role);
        const res = await registerAction(null, formData);
        if (res.success && res.user) {
          onSuccess(res.user);
        } else {
          setError(res.error || "Registration failed");
        }
      } else {
        const res = await loginAction(null, formData);
        if (res.success && res.user) {
          onSuccess(res.user);
        } else {
          setError(res.error || "Login failed");
        }
      }
    });
  };

  return (
    <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Tabs */}
      <div className="flex bg-slate-900/60 border-b border-slate-850">
        <button
          onClick={() => handleTabChange("login")}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === "login"
              ? "text-indigo-400 border-b-2 border-indigo-500 bg-slate-950/20"
              : "text-slate-500 hover:text-slate-350"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => handleTabChange("register")}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            activeTab === "register"
              ? "text-indigo-400 border-b-2 border-indigo-500 bg-slate-950/20"
              : "text-slate-500 hover:text-slate-350"
          }`}
        >
          Create Account
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-display flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span>Lumina AI Workspace</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {activeTab === "login"
              ? "Access your intelligent course planner and study hub"
              : "Register as an educator or learner to get started"}
          </p>
        </div>

        {/* Demo Quick Logins */}
        {activeTab === "login" && (
          <div className="space-y-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block text-center">
              Quick Dev Access (Seeded Accounts)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin("TEACHER")}
                disabled={isPending}
                className="py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <School className="w-4 h-4" />
                <span>Demo Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("STUDENT")}
                disabled={isPending}
                className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Demo Student</span>
              </button>
            </div>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-850"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-650 uppercase font-bold">Or use credentials</span>
              <div className="flex-grow border-t border-slate-850"></div>
            </div>
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 block pl-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block pl-1 font-sans">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block pl-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {activeTab === "register" && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-400 block pl-1">Select Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    role === "STUDENT"
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  <GraduationCap className="w-5 h-5 mb-0.5" />
                  <span>Student Learner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("TEACHER")}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    role === "TEACHER"
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  <School className="w-5 h-5 mb-0.5" />
                  <span>Educator Planner</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all mt-4 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{activeTab === "login" ? "Sign In to Workspace" : "Register & Start"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
