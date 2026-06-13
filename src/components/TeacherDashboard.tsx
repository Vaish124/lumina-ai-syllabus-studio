"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  BookOpen,
  Users,
  Calendar,
  ChevronRight,
  GraduationCap,
  Trash2,
  Globe,
  GlobeLock,
  X,
  Loader2,
  BrainCircuit,
  Settings,
  ArrowRight,
  BookmarkCheck,
  Check,
} from "lucide-react";
import { createCourse, deleteCourse, togglePublishCourse, createCourseWithOutline } from "@/app/actions/course";
import { generateCourseOutlineAction } from "@/app/actions/ai";

interface TeacherDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  initialCourses: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    subject: string;
    published: boolean;
    createdAt: Date;
    modules: {
      id: string;
      lessons: {
        id: string;
      }[];
    }[];
  }[];
  initialAnalytics: {
    totalCourses: number;
    totalModules: number;
    totalLessons: number;
    totalStudentsEnrolled: number;
    recentQuizAttempts: {
      id: string;
      score: number;
      total: number;
      createdAt: Date;
      user: { name: string; email: string };
    }[];
  } | null;
}

export default function TeacherDashboard({ user, initialCourses, initialAnalytics }: TeacherDashboardProps) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [isPending, startTransition] = useTransition();

  // Modals Toggles
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Manual Form States
  const [manualTitle, setManualTitle] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualDiff, setManualDiff] = useState("Intermediate");
  const [manualDur, setManualDur] = useState("4 weeks");
  const [manualSubj, setManualSubj] = useState("Computer Science");
  const [manualError, setManualError] = useState("");

  // AI Form States
  const [aiTopic, setAiTopic] = useState("");
  const [aiDiff, setAiDiff] = useState("Intermediate");
  const [aiDur, setAiDur] = useState("4 weeks");
  const [aiSubj, setAiSubj] = useState("Computer Science");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<{
    modules: {
      title: string;
      description: string;
      lessons: { title: string }[];
    }[];
  } | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");

    if (!manualTitle || !manualDesc) {
      setManualError("Title and Description are required");
      return;
    }

    startTransition(async () => {
      const res = await createCourse({
        title: manualTitle,
        description: manualDesc,
        difficulty: manualDiff,
        duration: manualDur,
        subject: manualSubj,
      });

      if (res.success && res.courseId) {
        setShowManualModal(false);
        // Clear form
        setManualTitle("");
        setManualDesc("");
        router.push(`/dashboard/courses/${res.courseId}`);
      } else {
        setManualError(res.error || "Failed to create course");
      }
    });
  };

  const handleAIGenerate = async () => {
    setAiError("");
    if (!aiTopic.trim()) {
      setAiError("Please specify a topic or subject");
      return;
    }

    setAiLoading(true);
    setGeneratedOutline(null);
    try {
      const apiKey = localStorage.getItem("gemini_api_key") || undefined;
      const res = await generateCourseOutlineAction(aiTopic, aiDiff, aiDur, apiKey);

      if (res.success && res.outline) {
        setGeneratedOutline(res.outline as any);
      } else {
        setAiError(res.error || "Failed to generate syllabus outline. Please try again.");
      }
    } catch (err: any) {
      setAiError(err.message || "An error occurred");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAICourse = async () => {
    if (!generatedOutline) return;
    setAiError("");

    startTransition(async () => {
      const res = await createCourseWithOutline(
        {
          title: aiTopic,
          description: `An AI-generated syllabus course covering ${aiTopic} at ${aiDiff} level.`,
          difficulty: aiDiff,
          duration: aiDur,
          subject: aiSubj,
        },
        generatedOutline.modules
      );

      if (res.success && res.courseId) {
        setShowAIModal(false);
        setGeneratedOutline(null);
        setAiTopic("");
        router.push(`/dashboard/courses/${res.courseId}`);
      } else {
        setAiError(res.error || "Failed to save syllabus");
      }
    });
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Don't trigger navigation
    if (confirm("Are you sure you want to delete this course and all its modules/lessons?")) {
      const res = await deleteCourse(courseId);
      if (res.success) {
        setCourses(courses.filter((c) => c.id !== courseId));
        if (analytics) {
          setAnalytics({
            ...analytics,
            totalCourses: analytics.totalCourses - 1,
          });
        }
      } else {
        alert(res.error || "Failed to delete course");
      }
    }
  };

  const handlePublishToggle = async (courseId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault(); // Don't trigger navigation
    const res = await togglePublishCourse(courseId, !currentStatus);
    if (res.success) {
      setCourses(
        courses.map((c) => (c.id === courseId ? { ...c, published: !currentStatus } : c))
      );
    } else {
      alert(res.error || "Failed to change publication status");
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-100">
            Educator Workspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Build your curriculums, organize course outlines, and track learner performance.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 hover:bg-slate-850 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Syllabus</span>
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-650/15 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      {/* Analytics stats */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex items-center gap-4 bg-slate-900/10">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-100 block">{analytics.totalCourses}</span>
              <span className="text-xs text-slate-400 font-medium">Total Courses</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex items-center gap-4 bg-slate-900/10">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-100 block">{analytics.totalModules}</span>
              <span className="text-xs text-slate-400 font-medium">Total Modules</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex items-center gap-4 bg-slate-900/10">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-100 block">{analytics.totalLessons}</span>
              <span className="text-xs text-slate-400 font-medium">Total Lessons</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex items-center gap-4 bg-slate-900/10">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-100 block">{analytics.totalStudentsEnrolled}</span>
              <span className="text-xs text-slate-400 font-medium">Learners Enrolled</span>
            </div>
          </div>
        </div>
      )}

      {/* Courses Curriculums Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 font-display">My Curriculums</h3>

        {courses.length === 0 ? (
          <div className="glass-panel p-10 text-center rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
            <BookOpen className="w-10 h-10 text-slate-650 mx-auto" />
            <div>
              <h4 className="font-semibold text-slate-350 text-base">No curriculums found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You haven't created any course syllabus yet. Start by generating one with AI or creating one manually!
              </p>
            </div>
            <button
              onClick={() => setShowAIModal(true)}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Course Generator</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const moduleCount = course.modules.length;
              const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

              return (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/20 glass-panel-hover flex flex-col justify-between h-56 transition-all group relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        {course.subject}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handlePublishToggle(course.id, course.published, e)}
                          title={course.published ? "Make Private" : "Publish to Catalog"}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            course.published
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-slate-950 border-slate-900 text-slate-500 hover:bg-slate-900 hover:text-slate-350"
                          }`}
                        >
                          {course.published ? <Globe className="w-3.5 h-3.5" /> : <GlobeLock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCourse(course.id, e)}
                          title="Delete Syllabus"
                          className="p-1.5 bg-slate-950 border border-slate-900 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-100 text-base md:text-lg group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {course.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        {moduleCount} {moduleCount === 1 ? "Mod" : "Mods"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                        {lessonCount} {lessonCount === 1 ? "Les" : "Les"}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase bg-slate-800 text-slate-350 px-2 py-0.5 rounded font-bold">
                      {course.difficulty}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent quiz attempts by students */}
      {analytics && analytics.recentQuizAttempts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100 font-display">Student Performance Log</h3>
          <div className="glass-panel rounded-2xl border border-slate-900 bg-slate-900/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-900">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Percentage</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {analytics.recentQuizAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <div className="font-semibold text-slate-200">{attempt.user.name}</div>
                          <div className="text-[10px] text-slate-500">{attempt.user.email}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-indigo-400">
                          {attempt.score} / {attempt.total}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold">
                          {Math.round((attempt.score / attempt.total) * 100)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs" suppressHydrationWarning>
                        {new Date(attempt.createdAt).toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE MANUAL SYLLABUS */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowManualModal(false)} />
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-800 z-10 relative">
            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-lg font-display">New Course Syllabus</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              {manualError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs sm:text-sm">
                  {manualError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Syllabus Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g., Intro to Machine Learning"
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-650"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Syllabus Description</label>
                <textarea
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="A detailed explanation of the goals, structure, and learning objectives of this course curriculum..."
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-650 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Subject</label>
                  <input
                    type="text"
                    value={manualSubj}
                    onChange={(e) => setManualSubj(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Difficulty</label>
                  <select
                    value={manualDiff}
                    onChange={(e) => setManualDiff(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-300"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Duration</label>
                  <input
                    type="text"
                    value={manualDur}
                    onChange={(e) => setManualDur(e.target.value)}
                    placeholder="e.g., 4 weeks"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Create Syllabus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI SYLLABUS GENERATOR */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => {
            if (!aiLoading) {
              setShowAIModal(false);
              setGeneratedOutline(null);
            }
          }} />
          <div className="glass-panel w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-800 z-10 relative">
            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-lg font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span>AI Curriculum Architect</span>
              </h3>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setGeneratedOutline(null);
                }}
                disabled={aiLoading}
                className="p-1 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-55"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {aiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs sm:text-sm">
                  {aiError}
                </div>
              )}

              {/* Form Input fields */}
              {!generatedOutline && !aiLoading && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Syllabus Topic or Subject</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g., Intro to Quantum Computing or Advanced Next.js 16 Patterns..."
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-650"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Subject</label>
                      <input
                        type="text"
                        value={aiSubj}
                        onChange={(e) => setAiSubj(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Difficulty</label>
                      <select
                        value={aiDiff}
                        onChange={(e) => setAiDiff(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-350"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Duration</label>
                      <input
                        type="text"
                        value={aiDur}
                        onChange={(e) => setAiDur(e.target.value)}
                        placeholder="e.g., 4 weeks"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900/60 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAIModal(false)}
                      className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAIGenerate}
                      className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Architect Syllabus</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Generating Loading State */}
              {aiLoading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-600/10">
                    <BrainCircuit className="w-10 h-10 text-indigo-400 animate-bounce" />
                    <div className="absolute inset-0 border-2 border-indigo-500/40 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">Architecting Course Syllabus...</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                      Gemini is structuring modules, defining pedagogical scopes, and arranging lesson hierarchies.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview and Save Generated Syllabus */}
              {generatedOutline && !aiLoading && (
                <div className="space-y-4">
                  <div className="bg-slate-900/40 p-4 border border-slate-900/60 rounded-2xl text-xs sm:text-sm space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Outline Preview</span>
                    <h4 className="font-bold text-slate-100 text-base">{aiTopic}</h4>
                    <div className="flex gap-4 text-xs text-slate-400 font-semibold pt-1">
                      <span>Subject: {aiSubj}</span>
                      <span>Difficulty: {aiDiff}</span>
                      <span>Duration: {aiDur}</span>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {generatedOutline.modules.map((mod, modIdx) => (
                      <div key={modIdx} className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2.5">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500">Module {modIdx + 1}</span>
                          <h5 className="font-semibold text-slate-200 text-sm leading-snug">{mod.title}</h5>
                          <p className="text-[11px] text-slate-450 leading-relaxed mt-0.5">{mod.description}</p>
                        </div>
                        <div className="pl-3.5 border-l-2 border-slate-800 space-y-1.5">
                          {mod.lessons.map((les, lesIdx) => (
                            <div key={lesIdx} className="text-xs text-slate-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-indigo-500/30 rounded-full shrink-0" />
                              <span className="truncate">{les.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-900/60 flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setGeneratedOutline(null)}
                      disabled={isPending}
                      className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAICourse}
                      disabled={isPending}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/10"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Save and Create Course</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
