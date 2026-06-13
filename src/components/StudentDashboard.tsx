"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, GraduationCap, Sparkles, Award, BookOpenCheck,
  FileText, TrendingUp, Search, Filter, CheckCircle2,
  BookMarked, Clock, Users, X, Loader2, ChevronRight,
} from "lucide-react";
import { enrollCourse, unenrollCourse } from "@/app/actions/course";

type Course = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  subject: string;
  author: { name: string };
  enrollments: { id: string }[];
  modules: {
    id: string;
    lessons: {
      id: string;
      progress: { completed: boolean }[];
    }[];
  }[];
};

interface StudentDashboardProps {
  user: { id: string; name: string; email: string; role: string };
  initialEnrolled: Course[];
  initialAvailable: Course[];
  initialAnalytics: {
    totalQuizzesTaken: number;
    lessonsCompleted: number;
    notesTaken: number;
    averageScore: number;
  } | null;
}

function CourseProgressStats(course: Course) {
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.progress?.[0]?.completed ? 1 : 0), 0), 0
  );
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return { totalLessons, completedLessons, pct };
}

export default function StudentDashboard({ user, initialEnrolled, initialAvailable, initialAnalytics }: StudentDashboardProps) {
  const [enrolled, setEnrolled] = useState<Course[]>(initialEnrolled);
  const [available, setAvailable] = useState<Course[]>(initialAvailable);
  const [analytics] = useState(initialAnalytics);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"enrolled" | "catalog">("enrolled");
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);

  // Derive all unique subjects for filter
  const allCourses = [...enrolled, ...available];
  const subjects = ["All", ...Array.from(new Set(allCourses.map((c) => c.subject)))];

  const filterCourses = (courses: Course[]) =>
    courses.filter((c) => {
      const matchSearch = search === "" || c.title.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase());
      const matchDiff = filterDifficulty === "All" || c.difficulty === filterDifficulty;
      const matchSubject = filterSubject === "All" || c.subject === filterSubject;
      return matchSearch && matchDiff && matchSubject;
    });

  const filteredEnrolled = useMemo(() => filterCourses(enrolled), [enrolled, search, filterDifficulty, filterSubject]);
  const filteredAvailable = useMemo(() => filterCourses(available), [available, search, filterDifficulty, filterSubject]);

  const handleEnroll = (courseId: string) => {
    setLoadingCourseId(courseId);
    startTransition(async () => {
      const res = await enrollCourse(courseId);
      if (res.success) {
        const course = available.find((c) => c.id === courseId);
        if (course) {
          setAvailable((prev) => prev.filter((c) => c.id !== courseId));
          setEnrolled((prev) => [{ ...course, enrollments: [{ id: "new" }] }, ...prev]);
          setActiveTab("enrolled");
        }
      }
      setLoadingCourseId(null);
    });
  };

  const handleUnenroll = (courseId: string) => {
    setLoadingCourseId(courseId);
    startTransition(async () => {
      const res = await unenrollCourse(courseId);
      if (res.success) {
        const course = enrolled.find((c) => c.id === courseId);
        if (course) {
          setEnrolled((prev) => prev.filter((c) => c.id !== courseId));
          setAvailable((prev) => [{ ...course, enrollments: [] }, ...prev]);
        }
      }
      setLoadingCourseId(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-100 flex items-center gap-2">
          <span>Welcome back, {user.name.split(" ")[0]}!</span>
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Enroll in courses, read lessons, write notes, and test your understanding with AI grading.
        </p>
      </div>

      {/* Analytics Stats */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpenCheck, label: "Lessons Read", value: analytics.lessonsCompleted, color: "indigo" },
            { icon: Award, label: "Quizzes Taken", value: analytics.totalQuizzesTaken, color: "indigo" },
            { icon: TrendingUp, label: "Avg Quiz Score", value: `${analytics.averageScore}%`, color: "emerald" },
            { icon: FileText, label: "Journal Entries", value: analytics.notesTaken, color: "indigo" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-panel p-5 rounded-2xl border border-slate-900 flex items-center gap-4 bg-slate-900/10">
              <div className={`p-3 bg-${color}-500/10 rounded-xl text-${color}-400`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-100 block">{value}</span>
                <span className="text-xs text-slate-400 font-medium">{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab("enrolled")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "enrolled"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookMarked className="w-4 h-4" />
          My Learning
          {enrolled.length > 0 && (
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full font-bold">{enrolled.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "catalog"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Course Catalog
          {available.length > 0 && (
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-1.5 py-0.5 rounded-full font-bold">{available.length}</span>
          )}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {["All", "Beginner", "Intermediate", "Advanced"].map((d) => (
            <option key={d} value={d}>{d} Level</option>
          ))}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Subjects" : s}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {activeTab === "enrolled" ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-400" />
            My Enrolled Courses
            <span className="text-sm text-slate-500 font-normal">({filteredEnrolled.length})</span>
          </h3>

          {filteredEnrolled.length === 0 ? (
            <div className="glass-panel p-10 text-center rounded-2xl border border-slate-900 bg-slate-900/10 space-y-3">
              <GraduationCap className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-semibold text-slate-400 text-base">
                {enrolled.length === 0 ? "Not enrolled in any course yet" : "No results match your search"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {enrolled.length === 0
                  ? "Browse the Course Catalog tab and enroll in a course to start learning."
                  : "Try clearing your search filters."}
              </p>
              {enrolled.length === 0 && (
                <button
                  onClick={() => setActiveTab("catalog")}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> Browse Catalog
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrolled.map((course) => {
                const { totalLessons, pct } = CourseProgressStats(course);
                return (
                  <div key={course.id} className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between group relative overflow-hidden">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                          {course.subject}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Enrolled
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-base group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed">{course.description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mt-3">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>Course Progress</span><span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {totalLessons} lessons</span>
                        <span className="text-[10px] uppercase bg-slate-800 text-slate-350 px-2 py-0.5 rounded font-bold">{course.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUnenroll(course.id)}
                          disabled={loadingCourseId === course.id}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold transition-colors disabled:opacity-50"
                        >
                          Unenroll
                        </button>
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                        >
                          Continue <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Available Courses
            <span className="text-sm text-slate-500 font-normal">({filteredAvailable.length})</span>
          </h3>

          {filteredAvailable.length === 0 ? (
            <div className="glass-panel p-10 text-center rounded-2xl border border-slate-900 bg-slate-900/10 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-semibold text-slate-400 text-base">
                {available.length === 0 ? "You are enrolled in all available courses!" : "No results match your search"}
              </h4>
              <p className="text-xs text-slate-500">
                {available.length === 0 ? "Great job! Check My Learning tab to continue studying." : "Try clearing search filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailable.map((course) => {
                const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
                return (
                  <div key={course.id} className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                          {course.subject}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">By {course.author.name}</span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-base group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed">{course.description}</p>
                    </div>

                    <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {totalLessons} lessons</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration}</span>
                      </div>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={loadingCourseId === course.id || isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-60 shadow-md shadow-indigo-600/20"
                      >
                        {loadingCourseId === course.id ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enrolling...</>
                        ) : (
                          <><GraduationCap className="w-3.5 h-3.5" /> Enroll Now</>
                        )}
                      </button>
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
