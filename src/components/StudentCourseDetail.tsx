"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle,
  Circle,
  MoveRight,
  BookmarkCheck,
  User,
} from "lucide-react";

interface StudentCourseDetailProps {
  user: {
    id: string;
    role: string;
  };
  course: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    subject: string;
    author: {
      name: string;
    };
    modules: {
      id: string;
      title: string;
      description: string;
      order: number;
      lessons: {
        id: string;
        title: string;
        order: number;
        progress: {
          completed: boolean;
        }[];
        quizzes: { id: string }[];
      }[];
    }[];
  };
}

export default function StudentCourseDetail({ user, course }: StudentCourseDetailProps) {
  // Calculate general statistics
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (sum, m) =>
      sum + m.lessons.reduce((subSum, l) => subSum + (l.progress?.[0]?.completed ? 1 : 0), 0),
    0
  );
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Course Detail Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-900 bg-slate-900/10 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {course.subject}
            </span>
            <span className="text-[10px] uppercase bg-slate-800 text-slate-350 px-2 py-0.5 rounded font-bold">
              {course.difficulty}
            </span>
            <span className="text-[10px] uppercase bg-slate-800 text-slate-350 px-2 py-0.5 rounded font-bold">
              {course.duration}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-100">
            {course.title}
          </h2>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium pt-1">
            <User className="w-4 h-4 text-slate-550" />
            <span>Curriculum designed by <strong className="text-slate-300 font-semibold">{course.author.name}</strong></span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
          {course.description}
        </p>

        {/* Progress Tracker */}
        <div className="space-y-2 border-t border-slate-900/60 pt-5 max-w-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-350">
            <span className="flex items-center gap-1">
              <BookmarkCheck className="w-4 h-4 text-indigo-400" />
              <span>Syllabus Completion Tracker</span>
            </span>
            <span>
              {completedLessons}/{totalLessons} Lessons ({progressPercentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Curriculum outline */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 font-display">Curriculum Syllabus Structure</h3>

        {course.modules.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl border border-slate-900 bg-slate-900/10">
            <p className="text-slate-400">There are no modules available for study in this course yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {course.modules.map((mod) => (
              <div
                key={mod.id}
                className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-900 bg-slate-900/5 space-y-4"
              >
                {/* Module title */}
                <div className="border-b border-slate-900 pb-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-550 block mb-0.5">
                    Module {mod.order}
                  </span>
                  <h4 className="font-bold text-slate-200 text-sm md:text-base leading-snug">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-slate-450 mt-1 leading-relaxed">{mod.description}</p>
                </div>

                {/* Lessons list */}
                {mod.lessons.length === 0 ? (
                  <p className="text-xs text-slate-500 italic pl-1">
                    No lessons available in this module yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mod.lessons.map((lesson) => {
                      const isCompleted = lesson.progress?.[0]?.completed;

                      return (
                        <Link
                          key={lesson.id}
                          href={`/dashboard/lessons/${lesson.id}`}
                          className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all group ${
                            isCompleted
                              ? "bg-emerald-500/2 border-emerald-500/15 hover:border-emerald-500/30"
                              : "bg-slate-950 border-slate-900/80 hover:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="shrink-0">
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-emerald-450 fill-emerald-500/10" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-650 hover:text-slate-450" />
                              )}
                            </div>
                            <div className="overflow-hidden space-y-0.5">
                              <span className="text-[9px] uppercase font-bold text-slate-550">
                                Lesson {lesson.order}
                              </span>
                              <h5 className="font-semibold text-slate-200 text-xs sm:text-sm group-hover:text-indigo-400 transition-colors leading-snug truncate">
                                {lesson.title}
                              </h5>
                            </div>
                          </div>
                          <MoveRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
