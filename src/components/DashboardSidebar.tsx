"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  Settings,
  LogOut,
  User,
  GraduationCap,
  School,
  Menu,
  X,
  PlusCircle,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface DashboardSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    router.push("/");
    router.refresh();
  };

  const isTeacher = user.role === "TEACHER";

  const navigation = [
    {
      name: isTeacher ? "My Curriculums" : "My Learning",
      href: "/dashboard",
      icon: BookOpen,
    },
    {
      name: "API Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-900 w-full shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="font-extrabold text-slate-100 text-sm tracking-wide font-display">LUMINA AI</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-900/60 flex flex-col transition-transform lg:translate-x-0 lg:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-900/60 hidden lg:flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20 animate-float">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-100 text-base tracking-wider font-display">LUMINA AI</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-sans">
              STUDIO
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-5 bg-slate-900/40 border border-slate-900/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
            {isTeacher ? (
              <School className="w-5 h-5 text-indigo-400" />
            ) : (
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="overflow-hidden min-w-0">
            <h4 className="text-sm font-semibold text-slate-200 truncate leading-snug">
              {user.name}
            </h4>
            <span className="text-[10px] px-2 py-0.5 mt-1 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold uppercase tracking-wider inline-block">
              {isTeacher ? "Educator" : "Learner"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600/10 border-l-4 border-indigo-500 text-indigo-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-900/60 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-350 hover:bg-rose-500/5 transition-all"
          >
            <LogOut className="w-4 h-4 text-rose-550" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
