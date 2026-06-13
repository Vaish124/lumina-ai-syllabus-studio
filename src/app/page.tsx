import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sparkles, Brain, Cpu, FileText, CheckSquare, BarChart, ArrowRight, User } from "lucide-react";
import LandingAuthWrapper from "@/components/LandingAuthWrapper";

export default async function Home() {
  const user = await getCurrentUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col justify-between relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-glow -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-glow -z-10" style={{ animationDelay: "4s" }} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Side: Copy & Features */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-550/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Edtech Workspace</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.1] tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Lumina AI <br /> Syllabus Studio
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Design courses in seconds, write detailed learning materials with AI assistance, generate interactive practice quizzes, and study with an active AI companion.
            </p>
          </div>

          {/* Core Features Showcase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0">
            <div className="glass-panel p-4 rounded-2xl flex items-start gap-3 border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition-colors">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5 shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-200">AI Syllabus Generator</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Generate full-fledged modules and lesson outlines in seconds.</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex items-start gap-3 border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition-colors">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-200">Rich Markdown Editor</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Create, edit, and expand comprehensive lesson contents with AI.</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex items-start gap-3 border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition-colors">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5 shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-200">Interactive Quizzes</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Auto-graded practice sets with instant detailed grading & feedback.</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex items-start gap-3 border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition-colors">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-200">AI Study Companion</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">Chat with a context-aware AI tutor to clarify doubts in real-time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Card Container */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <LandingAuthWrapper />
        </div>
      </main>

      {/* Footer (Mentions Name, Github, LinkedIn) */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 shrink-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-slate-400">
            <User className="w-3.5 h-3.5" />
            <span>Developer Assignment &bull; House of Edtech Fullstack Developer</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="font-semibold text-slate-400">Vaishnavi Bhusare</span>
            <a
              href="https://github.com/vaishnavi-bhusare"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <span>GitHub Profile</span>
            </a>
            <a
              href="https://linkedin.com/in/vaishnavi-bhusare"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              <span>LinkedIn Profile</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
