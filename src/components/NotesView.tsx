"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Save, Check, RefreshCw, Trash2 } from "lucide-react";
import { saveStudyNote, getStudyNote } from "@/app/actions/lesson";

interface NotesViewProps {
  lessonId: string;
}

export default function NotesView({ lessonId }: NotesViewProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load existing note
    const loadNote = async () => {
      setLoading(true);
      try {
        const note = await getStudyNote(lessonId);
        if (note) {
          setContent(note.content);
        } else {
          setContent("");
        }
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNote();
  }, [lessonId]);

  const handleSave = async (textToSave: string) => {
    setIsSaving(true);
    setSaved(false);
    try {
      await saveStudyNote(lessonId, textToSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Debounce auto-save: save 1.5 seconds after student stops typing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(val);
    }, 1500);
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    handleSave(content);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to clear your notes for this lesson?")) {
      setContent("");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true);
      try {
        await saveStudyNote(lessonId, "");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error("Failed to delete note:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-xs">Loading your notes...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Notes Header */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Study Journal</h4>
            <span className="text-[10px] text-slate-400 block">
              Saved automatically as you type
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {content && (
            <button
              onClick={handleDelete}
              title="Clear Notes"
              className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-rose-450 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              saved
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : isSaving
                ? "bg-slate-900 border-slate-800 text-slate-500"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
            }`}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Saving</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notepad Textarea */}
      <div className="flex-1 bg-slate-950/20 relative">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down notes, summarize concepts, or outline key takeaways here..."
          className="w-full h-full min-h-[300px] p-5 bg-transparent text-slate-200 placeholder:text-slate-650 resize-none focus:outline-none text-sm md:text-base leading-relaxed"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "100% 2rem",
            lineHeight: "2rem",
          }}
        />
      </div>
    </div>
  );
}
