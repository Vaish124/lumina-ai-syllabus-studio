"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { submitQuizAttempt } from "@/app/actions/lesson";

interface QuizQuestion {
  id: string;
  question: string;
  options: string; // JSON stringified array
  correctAnswer: string;
  explanation: string;
}

interface QuizViewProps {
  lessonId: string;
  questions: QuizQuestion[];
  onQuizCompleted?: () => void;
}

export default function QuizView({ lessonId, questions, onQuizCompleted }: QuizViewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    feedback: string;
    submitted: boolean;
  } | null>(null);
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [validationError, setValidationError] = useState("");

  const parsedQuestions = questions.map((q) => {
    let opts: string[] = [];
    try {
      opts = JSON.parse(q.options);
    } catch {
      opts = [];
    }
    return { ...q, optionsList: opts };
  });

  const handleSelectOption = (questionId: string, option: string) => {
    if (results?.submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
    setValidationError("");
  };

  const toggleExplanation = (questionId: string) => {
    setShowExplanations((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmit = async () => {
    if (results?.submitted || isSubmitting) return;

    // Validate that all questions are answered
    const unanswered = parsedQuestions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      setValidationError(`Please answer all questions before submitting. (${unanswered.length} remaining)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const apiKey = localStorage.getItem("gemini_api_key") || undefined;
      const res = await submitQuizAttempt(lessonId, answersPayload, apiKey);

      if (res.success && res.score !== undefined && res.total !== undefined) {
        setResults({
          score: res.score,
          total: res.total,
          feedback: res.feedback || "",
          submitted: true,
        });

        // Initialize explanations to open for all incorrect answers
        const newExplanations: Record<string, boolean> = {};
        parsedQuestions.forEach((q) => {
          newExplanations[q.id] = selectedAnswers[q.id] !== q.correctAnswer;
        });
        setShowExplanations(newExplanations);

        if (onQuizCompleted) {
          onQuizCompleted();
        }
      } else {
        setValidationError(res.error || "Failed to grade quiz. Please try again.");
      }
    } catch (err: any) {
      setValidationError(err.message || "An error occurred while grading the quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setResults(null);
    setShowExplanations({});
    setValidationError("");
  };

  if (parsedQuestions.length === 0) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800">
        <p className="text-slate-400">There are no quiz questions available for this lesson yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 font-display">Lesson Practice Quiz</h3>
          <p className="text-xs text-slate-400">
            Check your understanding of the concepts introduced in this lesson.
          </p>
        </div>
        {results?.submitted && (
          <button
            onClick={handleRetake}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-150 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        )}
      </div>

      {/* Results Box */}
      {results?.submitted && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-md shadow-indigo-600/5">
                <span className="text-xl font-bold text-indigo-400">
                  {results.score}/{results.total}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-base">Quiz Attempt Result</h4>
                <p className="text-xs text-slate-400">
                  Score Percentage: {Math.round((results.score / results.total) * 100)}%
                </p>
              </div>
            </div>
            <div className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full max-w-fit">
              {results.score === results.total
                ? "Perfect Score!"
                : results.score >= results.total / 2
                ? "Passed"
                : "Needs Review"}
            </div>
          </div>

          {results.feedback && (
            <div className="border-t border-indigo-500/10 pt-3 flex gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                  AI Feedback Report
                </span>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{results.feedback}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {parsedQuestions.map((q, qIdx) => {
          const selected = selectedAnswers[q.id];
          const isGraded = results?.submitted;
          const isCorrect = selected === q.correctAnswer;

          return (
            <div
              key={q.id}
              className={`glass-panel p-5 rounded-2xl border transition-all ${
                isGraded
                  ? isCorrect
                    ? "border-emerald-500/20 bg-emerald-500/2"
                    : "border-rose-500/20 bg-rose-500/2"
                  : selected
                  ? "border-slate-700 bg-slate-900/20"
                  : "border-slate-800"
              }`}
            >
              <div className="flex gap-3">
                <span className="text-xs font-bold text-slate-500 mt-1 shrink-0">
                  Q{qIdx + 1}.
                </span>
                <div className="space-y-4 flex-1">
                  <h4 className="font-semibold text-slate-100 text-sm md:text-base leading-relaxed">
                    {q.question}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.optionsList.map((opt) => {
                      const isOptionSelected = selected === opt;
                      const isOptionCorrect = opt === q.correctAnswer;

                      let optStyles = "bg-slate-900/60 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-slate-150 hover:border-slate-700";
                      let icon = null;

                      if (isOptionSelected) {
                        optStyles = "bg-indigo-500/10 border-indigo-500 text-indigo-300 font-medium";
                      }

                      if (isGraded) {
                        if (isOptionCorrect) {
                          optStyles = "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium";
                          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
                        } else if (isOptionSelected) {
                          optStyles = "bg-rose-500/10 border-rose-500 text-rose-300 font-medium";
                          icon = <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
                        } else {
                          optStyles = "bg-slate-950 border-slate-900 text-slate-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt)}
                          disabled={isGraded}
                          className={`w-full text-left p-3.5 border rounded-xl text-sm flex items-center justify-between gap-3 transition-all ${optStyles}`}
                        >
                          <span>{opt}</span>
                          {icon}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Toggle */}
                  {isGraded && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(q.id)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        {showExplanations[q.id] ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Explanation</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Show Explanation</span>
                          </>
                        )}
                      </button>

                      {showExplanations[q.id] && (
                        <div className="mt-2.5 p-3.5 bg-slate-900 border border-slate-850 rounded-xl text-xs md:text-sm text-slate-400 space-y-1.5 leading-relaxed">
                          <span className="font-semibold text-slate-200 block">
                            Explanation:
                          </span>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!results?.submitted && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/10"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Grading...</span>
              </>
            ) : (
              <span>Submit Answers</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
