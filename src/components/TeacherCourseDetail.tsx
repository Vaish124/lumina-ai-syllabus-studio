"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Globe,
  GlobeLock,
  ChevronRight,
  BookOpen,
  FileText,
  Settings,
  X,
  Loader2,
  MoveRight,
  CheckCircle,
} from "lucide-react";
import { updateCourse, togglePublishCourse } from "@/app/actions/course";
import {
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  deleteLesson,
} from "@/app/actions/lesson";

interface TeacherCourseDetailProps {
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
    published: boolean;
    modules: {
      id: string;
      title: string;
      description: string;
      order: number;
      lessons: {
        id: string;
        title: string;
        order: number;
        quizzes: { id: string }[];
      }[];
    }[];
  };
}

export default function TeacherCourseDetail({ user, course }: TeacherCourseDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Course Edit State
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState(course.title);
  const [courseDesc, setCourseDesc] = useState(course.description);
  const [courseDiff, setCourseDiff] = useState(course.difficulty);
  const [courseDur, setCourseDur] = useState(course.duration);
  const [courseSubj, setCourseSubj] = useState(course.subject);
  const [courseError, setCourseError] = useState("");

  // Modals States
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<{ id: string; title: string; description: string; order: number } | null>(null);
  const [modTitle, setModTitle] = useState("");
  const [modDesc, setModDesc] = useState("");
  const [modOrder, setModOrder] = useState(1);
  const [modError, setModError] = useState("");

  const [showLessonModal, setShowLessonModal] = useState<string | null>(null); // moduleId
  const [lesTitle, setLesTitle] = useState("");
  const [lesOrder, setLesOrder] = useState(1);
  const [lesError, setLesError] = useState("");

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError("");

    startTransition(async () => {
      const res = await updateCourse(course.id, {
        title: courseTitle,
        description: courseDesc,
        difficulty: courseDiff,
        duration: courseDur,
        subject: courseSubj,
      });

      if (res.success) {
        setIsEditingCourse(false);
        router.refresh();
      } else {
        setCourseError(res.error || "Failed to update course info");
      }
    });
  };

  const handlePublishToggle = async () => {
    const res = await togglePublishCourse(course.id, !course.published);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to change publication status");
    }
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModError("");

    if (!modTitle) {
      setModError("Module Title is required");
      return;
    }

    startTransition(async () => {
      let res;
      if (editingModule) {
        res = await updateModule(editingModule.id, modTitle, modDesc, modOrder);
      } else {
        res = await createModule(course.id, modTitle, modDesc, modOrder);
      }

      if (res.success) {
        setShowModuleModal(false);
        setEditingModule(null);
        setModTitle("");
        setModDesc("");
        setModOrder(1);
        router.refresh();
      } else {
        setModError(res.error || "Failed to save module");
      }
    });
  };

  const handleEditModuleClick = (mod: { id: string; title: string; description: string; order: number }) => {
    setEditingModule(mod);
    setModTitle(mod.title);
    setModDesc(mod.description);
    setModOrder(mod.order);
    setShowModuleModal(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm("Are you sure you want to delete this module and all its lessons?")) {
      const res = await deleteModule(moduleId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete module");
      }
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLesError("");

    if (!lesTitle || !showLessonModal) {
      setLesError("Lesson Title is required");
      return;
    }

    startTransition(async () => {
      const res = await createLesson(showLessonModal, {
        title: lesTitle,
        content: `# ${lesTitle}\n\nThis lesson material is ready to be expanded using the AI writer or custom manual edits. Click the Edit button above to get started!`,
        objectives: [],
        order: lesOrder,
      });

      if (res.success) {
        setShowLessonModal(null);
        setLesTitle("");
        setLesOrder(1);
        router.refresh();
      } else {
        setLesError(res.error || "Failed to add lesson");
      }
    });
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lesson and its quizzes?")) {
      const res = await deleteLesson(lessonId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete lesson");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Curriculums</span>
        </Link>
        <button
          onClick={handlePublishToggle}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            course.published
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-indigo-600/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/20"
          }`}
        >
          {course.published ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              <span>Published</span>
            </>
          ) : (
            <>
              <GlobeLock className="w-3.5 h-3.5" />
              <span>Draft (Private)</span>
            </>
          )}
        </button>
      </div>

      {/* Course Header Banner */}
      {!isEditingCourse ? (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-900 bg-slate-900/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2.5">
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
            </div>
            <button
              onClick={() => setIsEditingCourse(true)}
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors self-start shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            {course.description}
          </p>
        </div>
      ) : (
        <form onSubmit={handleUpdateCourse} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-850 space-y-4">
          <h3 className="font-bold text-slate-100 text-lg">Edit Course Details</h3>
          {courseError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs sm:text-sm">
              {courseError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Course Title</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Subject</label>
              <input
                type="text"
                value={courseSubj}
                onChange={(e) => setCourseSubj(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
            <textarea
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Difficulty</label>
              <select
                value={courseDiff}
                onChange={(e) => setCourseDiff(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none text-slate-300"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Duration</label>
              <input
                type="text"
                value={courseDur}
                onChange={(e) => setCourseDur(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/60">
            <button
              type="button"
              onClick={() => setIsEditingCourse(false)}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Modules & Lessons Workspace */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <h3 className="text-lg font-bold text-slate-100 font-display">Modules & Syllabus Outlines</h3>
          <button
            onClick={() => {
              setEditingModule(null);
              setModTitle("");
              setModDesc("");
              setModOrder(course.modules.length + 1);
              setShowModuleModal(true);
            }}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Module</span>
          </button>
        </div>

        {course.modules.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl border border-slate-900 bg-slate-900/10 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-650 mx-auto" />
            <div>
              <h4 className="font-semibold text-slate-350 text-sm">No modules added yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                Organize your curriculum outline by creating modules first, then insert lessons.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {course.modules.map((mod, modIdx) => (
              <div
                key={mod.id}
                className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-900 bg-slate-900/5 space-y-4"
              >
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-900/60 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Module {mod.order}
                    </span>
                    <h4 className="font-bold text-slate-150 text-base leading-snug">{mod.title}</h4>
                    <p className="text-xs text-slate-400 max-w-2xl">{mod.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 self-start">
                    <button
                      onClick={() => handleEditModuleClick(mod)}
                      className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-450 hover:text-slate-250 transition-colors"
                      title="Edit Module Info"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-450 hover:text-rose-400 transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons list */}
                <div className="space-y-2.5">
                  {mod.lessons.length === 0 ? (
                    <p className="text-xs text-slate-500 italic pl-1 py-1">
                      No lessons inside this module yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="p-4 bg-slate-950 border border-slate-900/80 rounded-xl hover:border-slate-800 transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 overflow-hidden">
                            <span className="text-[9px] uppercase font-bold text-slate-500">
                              Lesson {lesson.order}
                            </span>
                            <h5 className="font-semibold text-slate-200 text-sm leading-snug truncate group-hover:text-indigo-400 transition-colors">
                              {lesson.title}
                            </h5>
                            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                              {lesson.quizzes.length > 0 ? (
                                <span className="text-indigo-400">{lesson.quizzes.length} Practice {lesson.quizzes.length === 1 ? "Question" : "Questions"}</span>
                              ) : (
                                <span className="text-slate-600">No quizzes configured</span>
                              )}
                            </span>
                          </div>

                          <div className="flex gap-1">
                            <Link
                              href={`/dashboard/lessons/${lesson.id}`}
                              className="p-1.5 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors"
                              title="Open Content Workspace"
                            >
                              <MoveRight className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add lesson triggers */}
                  <div className="pt-2 pl-1">
                    <button
                      onClick={() => {
                        setLesTitle("");
                        setLesOrder(mod.lessons.length + 1);
                        setShowLessonModal(mod.id);
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Lesson Placeholder</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: CREATE/EDIT MODULE */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModuleModal(false)} />
          <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-800 z-10 relative">
            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base font-display">
                {editingModule ? "Edit Module Info" : "New Module Outline"}
              </h3>
              <button
                onClick={() => setShowModuleModal(false)}
                className="p-1 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleModuleSubmit} className="p-6 space-y-4">
              {modError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs">
                  {modError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Module Title</label>
                <input
                  type="text"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  placeholder="e.g., Module 1: Core Architectures"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Description</label>
                <textarea
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  placeholder="A brief summary of what this module covers..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              <div className="space-y-1.5 max-w-[120px]">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Order Sequence</label>
                <input
                  type="number"
                  value={modOrder}
                  onChange={(e) => setModOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none text-center"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingModule ? "Save Changes" : "Create Module"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LESSON */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLessonModal(null)} />
          <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-800 z-10 relative">
            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base font-display">Add Lesson Placeholder</h3>
              <button
                onClick={() => setShowLessonModal(null)}
                className="p-1 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleLessonSubmit} className="p-6 space-y-4">
              {lesError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs">
                  {lesError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-455 uppercase pl-0.5">Lesson Title</label>
                <input
                  type="text"
                  value={lesTitle}
                  onChange={(e) => setLesTitle(e.target.value)}
                  placeholder="e.g., Intro to Deep Neural Networks"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="space-y-1.5 max-w-[120px]">
                <label className="text-xs font-bold text-slate-455 uppercase pl-0.5">Lesson Order</label>
                <input
                  type="number"
                  value={lesOrder}
                  onChange={(e) => setLesOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none text-center"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setShowLessonModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Add Lesson</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
