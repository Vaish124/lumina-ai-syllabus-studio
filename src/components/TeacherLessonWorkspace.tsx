"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  CheckSquare,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Loader2,
  Save,
  Check,
  Brain,
  AlertCircle,
  Undo2,
  ListPlus,
} from "lucide-react";
import { updateLesson, createQuizQuestion, deleteQuizQuestion } from "@/app/actions/lesson";
import { generateLessonContentAction } from "@/app/actions/ai";

interface QuizQuestion {
  id: string;
  question: string;
  options: string;
  correctAnswer: string;
  explanation: string;
}

interface TeacherLessonWorkspaceProps {
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

export default function TeacherLessonWorkspace({ user, lesson }: TeacherLessonWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"content" | "quizzes">("content");

  // Lesson Edit states
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content);
  const [objectives, setObjectives] = useState<string[]>(() => {
    try {
      return JSON.parse(lesson.objectives);
    } catch {
      return [];
    }
  });
  const [newObjective, setNewObjective] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Quiz states
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [quizCorrect, setQuizCorrect] = useState("");
  const [quizExplan, setQuizExplan] = useState("");
  const [quizError, setQuizError] = useState("");

  // AI Content Generator states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<{
    content: string;
    objectives: string[];
    quizzes: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }[];
  } | null>(null);

  const handleAddObjective = () => {
    if (newObjective.trim() !== "") {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleSaveLesson = async () => {
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      const res = await updateLesson(lesson.id, {
        title,
        content,
        objectives,
        order: lesson.order,
      });

      if (res.success) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        router.refresh();
      } else {
        setSaveStatus("error");
        setErrorMessage(res.error || "Failed to save lesson");
      }
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred");
    }
  };

  const handleAIGenerateContent = async () => {
    setErrorMessage("");
    setAiLoading(true);
    setAiGeneratedData(null);

    try {
      const apiKey = localStorage.getItem("gemini_api_key") || undefined;
      const res = await generateLessonContentAction(
        lesson.module.course.title,
        lesson.module.title,
        lesson.title,
        apiKey
      );

      if (res.success && res.content) {
        setAiGeneratedData(res.content as any);
      } else {
        setErrorMessage(res.error || "Gemini failed to generate lesson materials. Check API key.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIGenerated = async () => {
    if (!aiGeneratedData) return;

    setContent(aiGeneratedData.content);
    setObjectives(aiGeneratedData.objectives);

    // Save lesson content to database
    setSaveStatus("saving");
    try {
      const res = await updateLesson(lesson.id, {
        title,
        content: aiGeneratedData.content,
        objectives: aiGeneratedData.objectives,
        order: lesson.order,
      });

      if (!res.success) {
        setSaveStatus("error");
        setErrorMessage(res.error || "Failed to save lesson content");
        return;
      }

      // Auto import generated quiz questions
      if (aiGeneratedData.quizzes && aiGeneratedData.quizzes.length > 0) {
        for (const quiz of aiGeneratedData.quizzes) {
          await createQuizQuestion(lesson.id, {
            question: quiz.question,
            options: quiz.options,
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation,
          });
        }
      }

      setSaveStatus("saved");
      setAiGeneratedData(null);
      setTimeout(() => setSaveStatus("idle"), 2000);
      router.refresh();
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMessage(err.message || "Failed to save AI contents");
    }
  };

  const handleAddQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError("");

    if (!quizQuestion.trim() || !quizCorrect.trim() || !quizExplan.trim()) {
      setQuizError("All quiz fields are required");
      return;
    }

    if (quizOptions.some((o) => o.trim() === "")) {
      setQuizError("Please enter all four options");
      return;
    }

    if (!quizOptions.includes(quizCorrect)) {
      setQuizError("Correct Answer must match one of the options exactly");
      return;
    }

    startTransition(async () => {
      const res = await createQuizQuestion(lesson.id, {
        question: quizQuestion,
        options: quizOptions,
        correctAnswer: quizCorrect,
        explanation: quizExplan,
      });

      if (res.success) {
        setShowQuizForm(false);
        setQuizQuestion("");
        setQuizOptions(["", "", "", ""]);
        setQuizCorrect("");
        setQuizExplan("");
        router.refresh();
      } else {
        setQuizError(res.error || "Failed to create quiz question");
      }
    });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz question?")) {
      const res = await deleteQuizQuestion(quizId, lesson.id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete question");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/dashboard/courses/${lesson.module.course.id}`}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Outline</span>
        </Link>

        {/* Tab Controls */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 max-w-fit">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "content" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lesson Material</span>
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "quizzes" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Quiz Sandbox</span>
          </button>
        </div>
      </div>

      {/* Title block */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold text-indigo-400">
          Syllabus Workspace &bull; {lesson.module.course.title}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-100">
          {lesson.title}
        </h2>
        <span className="text-xs text-slate-400 font-semibold block">
          Module: {lesson.module.title}
        </span>
      </div>

      {/* Errors */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: LESSON CONTENT & AI WRITER */}
      {activeTab === "content" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            {/* Lesson Title & Objectives */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Lesson Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Learning Objectives tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-455 uppercase pl-0.5">Learning Objectives</label>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 pl-3.5 pr-2.5 py-1.5 rounded-full"
                    >
                      <span>{obj}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(index)}
                        className="p-0.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add a new objective..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddObjective();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Markdown Editor */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-455 uppercase pl-0.5">Markdown Content</label>
                <span className="text-[10px] text-slate-500">Supports standard headers, lists, code, and bold text</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Introduction to lesson content..."
                rows={15}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveLesson}
                  disabled={saveStatus === "saving"}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    saveStatus === "saved"
                      ? "bg-emerald-600 hover:bg-emerald-550 text-white"
                      : saveStatus === "saving"
                      ? "bg-slate-800 text-slate-500"
                      : "bg-indigo-650 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-650/15"
                  }`}
                >
                  {saveStatus === "saved" ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Changes Saved</span>
                    </>
                  ) : saveStatus === "saving" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Writer Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-slate-100 text-sm font-display">AI Material Designer</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate course lessons automatically. Gemini will structure structured markdown lessons, pedagogical goals, and graded quizzes based on module context.
              </p>

              {!aiGeneratedData && !aiLoading && (
                <button
                  type="button"
                  onClick={handleAIGenerateContent}
                  className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Generate Full Lesson</span>
                </button>
              )}

              {aiLoading && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-250">Generating Lesson Materials...</h5>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-0.5">
                      Creating learning items, outlining objectives, and building practice set.
                    </p>
                  </div>
                </div>
              )}

              {aiGeneratedData && !aiLoading && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-550/15 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Generation Complete!</span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div>&bull; Content: ~{Math.round(aiGeneratedData.content.length / 5)} words</div>
                      <div>&bull; Objectives: {aiGeneratedData.objectives.length} generated</div>
                      <div>&bull; Quizzes: {aiGeneratedData.quizzes.length} generated</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAiGeneratedData(null)}
                      className="flex-1 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyAIGenerated}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save AI Content</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUIZ SANDBOX MANAGER */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm md:text-base font-display">Lesson Practice Questions</h3>
              <p className="text-xs text-slate-450">These questions will be presented to learners for active testing.</p>
            </div>
            {!showQuizForm && (
              <button
                onClick={() => setShowQuizForm(true)}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            )}
          </div>

          {/* Form to Add New Manual Question */}
          {showQuizForm && (
            <form onSubmit={handleAddQuizSubmit} className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-850 bg-slate-900/5 space-y-4 max-w-xl">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-150 text-sm">New Practice Question</h4>
                <button
                  type="button"
                  onClick={() => setShowQuizForm(false)}
                  className="p-1 hover:bg-slate-850 rounded-lg text-slate-450 hover:text-slate-250 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {quizError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs">
                  {quizError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Question Prompt</label>
                <input
                  type="text"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="e.g., What is the runtime of binary search?"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-450 uppercase pl-0.5 block">Multiple Choice Options (Exactly 4)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quizOptions.map((opt, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 w-4">{index + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const nextOpts = [...quizOptions];
                          nextOpts[index] = e.target.value;
                          setQuizOptions(nextOpts);
                        }}
                        placeholder={`Option ${index + 1}`}
                        required
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Correct Answer</label>
                  <input
                    type="text"
                    value={quizCorrect}
                    onChange={(e) => setQuizCorrect(e.target.value)}
                    placeholder="Must match correct option exactly..."
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase pl-0.5">Explanation</label>
                  <input
                    type="text"
                    value={quizExplan}
                    onChange={(e) => setQuizExplan(e.target.value)}
                    placeholder="Why is this answer correct?"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/65">
                <button
                  type="button"
                  onClick={() => setShowQuizForm(false)}
                  className="px-4 py-2 text-slate-455 hover:text-slate-205 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Question</span>
                </button>
              </div>
            </form>
          )}

          {/* List of existing questions */}
          {lesson.quizzes.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl border border-slate-900 bg-slate-900/10 space-y-2">
              <CheckSquare className="w-8 h-8 text-slate-650 mx-auto" />
              <div>
                <h4 className="font-semibold text-slate-350 text-sm">No quizzes configured</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                  Write practice questions manually or use the AI Writer to generate structured quiz blocks automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {lesson.quizzes.map((quiz, idx) => {
                let optionsList: string[] = [];
                try {
                  optionsList = JSON.parse(quiz.options);
                } catch {
                  optionsList = [];
                }

                return (
                  <div key={quiz.id} className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/5 relative group">
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      title="Delete Question"
                      className="absolute right-4 top-4 p-1.5 bg-slate-950 border border-slate-900 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-550 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-3 pr-8">
                      <h4 className="font-semibold text-slate-150 text-sm md:text-base">
                        <span className="text-slate-500 mr-1.5">Q{idx + 1}.</span>
                        {quiz.question}
                      </h4>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                        {optionsList.map((opt) => {
                          const isCorrect = opt === quiz.correctAnswer;
                          return (
                            <div
                              key={opt}
                              className={`p-2.5 border rounded-xl text-xs flex items-center justify-between ${
                                isCorrect
                                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-350 font-medium"
                                  : "bg-slate-950 border-slate-900 text-slate-450"
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl text-xs text-slate-450 leading-relaxed">
                        <strong className="text-slate-350">Explanation:</strong> {quiz.explanation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
