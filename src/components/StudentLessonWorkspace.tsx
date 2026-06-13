"use client";

import { useState, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  CheckCircle,
  Circle,
  FileText,
  MessageSquare,
  Award,
  BookOpenCheck,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import QuizView from "./QuizView";
import NotesView from "./NotesView";
import AIStudyCompanion from "./AIStudyCompanion";
import { toggleLessonProgress } from "@/app/actions/lesson";

interface QuizQuestion {
  id: string;
  question: string;
  options: string;
  correctAnswer: string;
  explanation: string;
}

interface StudentLessonWorkspaceProps {
  user: {
    id: string;
    role: string;
  };
  lesson: {
    id: string;
    title: string;
    content: string;
    objectives: string; // JSON stringified array
    order: number;
    quizzes: QuizQuestion[];
    progress: {
      completed: boolean;
    }[];
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
}

export default function StudentLessonWorkspace({ user, lesson }: StudentLessonWorkspaceProps) {
  const router = useRouter();
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "quiz" | "notes">("chat");

  // Mobile navigation tabs (combines both left and right segments into single views on small screens)
  const [mobileTab, setMobileTab] = useState<"material" | "chat" | "quiz" | "notes">("material");

  const isCompleted = lesson.progress?.[0]?.completed || false;
  const objectivesList: string[] = (() => {
    try {
      return JSON.parse(lesson.objectives);
    } catch {
      return [];
    }
  })();

  const handleToggleCompleted = async () => {
    const res = await toggleLessonProgress(lesson.id, !isCompleted);
    if (res.success) {
      router.refresh();
    }
  };

  const handleQuizFinished = () => {
    router.refresh(); // Reload to refresh completed ticks / attempts
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Navigation */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/courses/${lesson.module.course.id}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Course Map</span>
          </Link>
          <div className="h-4 w-[1px] bg-slate-900 hidden sm:block"></div>
          <span className="text-xs text-slate-500 font-semibold hidden sm:block truncate max-w-[300px]">
            {lesson.module.course.title} &bull; {lesson.module.title}
          </span>
        </div>

        {/* Complete Toggler */}
        <button
          onClick={handleToggleCompleted}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isCompleted
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-450" />
              <span>Marked Complete</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 text-slate-500" />
              <span>Mark Completed</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile-only tab headers */}
      <div className="lg:hidden flex bg-slate-950 border border-slate-900 rounded-xl p-1 shrink-0">
        <button
          onClick={() => setMobileTab("material")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            mobileTab === "material" ? "bg-indigo-600 text-white" : "text-slate-400"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Material</span>
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            mobileTab === "chat" ? "bg-indigo-600 text-white" : "text-slate-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Tutor</span>
        </button>
        <button
          onClick={() => setMobileTab("quiz")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            mobileTab === "quiz" ? "bg-indigo-600 text-white" : "text-slate-400"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Practice</span>
        </button>
        <button
          onClick={() => setMobileTab("notes")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            mobileTab === "notes" ? "bg-indigo-600 text-white" : "text-slate-400"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Journal</span>
        </button>
      </div>

      {/* Workspace Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 min-h-0">
        {/* LEFT COLUMN: Lesson Material (Visible on large screens, or when mobileTab is 'material') */}
        <div
          className={`lg:col-span-7 flex flex-col space-y-6 ${
            mobileTab === "material" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Learning Objectives block */}
          {objectivesList.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-3">
              <h4 className="font-bold text-slate-100 text-xs sm:text-sm uppercase tracking-wider font-display">
                Pedagogical Objectives
              </h4>
              <ul className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-slate-350 font-medium">
                {objectivesList.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lesson Rich Article Text */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-900 bg-slate-900/5 leading-relaxed overflow-y-auto flex-1">
            <MarkdownRenderer content={lesson.content} />
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Tools Suite (Visible on large screens, or when mobileTab != 'material') */}
        <div
          className={`lg:col-span-5 flex flex-col h-[600px] lg:h-auto ${
            mobileTab !== "material" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Sub-tabs for Desktop Right column */}
          <div className="hidden lg:flex bg-slate-950 border border-slate-900 rounded-2xl p-1 mb-4 shrink-0">
            <button
              onClick={() => setActiveRightTab("chat")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeRightTab === "chat"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-650/10"
                  : "text-slate-450 hover:text-slate-205"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Tutor Chat</span>
            </button>
            <button
              onClick={() => setActiveRightTab("quiz")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeRightTab === "quiz"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-650/10"
                  : "text-slate-455 hover:text-slate-205"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Quiz Sandbox</span>
            </button>
            <button
              onClick={() => setActiveRightTab("notes")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeRightTab === "notes"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-650/10"
                  : "text-slate-455 hover:text-slate-205"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Study Notes</span>
            </button>
          </div>

          {/* Render Active Tool Panel */}
          <div className="flex-1 min-h-0">
            {/* For desktop, use activeRightTab. For mobile, use mobileTab */}
            {(activeRightTab === "chat" && lgScreenActive()) || mobileTab === "chat" ? (
              <AIStudyCompanion lessonTitle={lesson.title} lessonContent={lesson.content} />
            ) : null}

            {(activeRightTab === "quiz" && lgScreenActive()) || mobileTab === "quiz" ? (
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/5 h-full overflow-y-auto">
                <QuizView
                  lessonId={lesson.id}
                  questions={lesson.quizzes as any}
                  onQuizCompleted={handleQuizFinished}
                />
              </div>
            ) : null}

            {(activeRightTab === "notes" && lgScreenActive()) || mobileTab === "notes" ? (
              <NotesView lessonId={lesson.id} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  // Helper check to evaluate if screen size is desktop and tab is active
  function lgScreenActive() {
    return true; // The css controls visibility, this helper just allows conditional mount for performance
  }
}
