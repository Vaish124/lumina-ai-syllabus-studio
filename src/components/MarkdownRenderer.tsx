"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split content by code blocks to isolate code from text
  const parts = content.split(/(\`\`\`[a-zA-Z]*\n[\s\S]*?\n\`\`\`)/g);

  return (
    <div className="prose prose-invert max-w-none text-slate-300 space-y-4 leading-relaxed">
      {parts.map((part, index) => {
        // Check if this part is a code block
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          // Extract language (e.g., typescript, javascript, python) from the first line
          const lang = lines[0].replace("```", "").trim();
          // Extract content between the first and last line
          const codeText = lines.slice(1, lines.length - 1).join("\n");

          return (
            <div
              key={index}
              className="my-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 shadow-lg"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-850 text-xs font-mono text-slate-500">
                <span>{lang || "code"}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeText, index)}
                  className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-200">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        // Render plain text and standard inline markdown elements
        const lines = part.split("\n");
        let listBuffer: React.ReactNode[] = [];
        let listType: "ul" | "ol" | null = null;
        const renderedElements: React.ReactNode[] = [];

        const flushList = (keyPrefix: number) => {
          if (listBuffer.length > 0) {
            if (listType === "ul") {
              renderedElements.push(
                <ul key={`ul-${keyPrefix}`} className="list-disc pl-6 my-2 space-y-1 text-slate-300">
                  {listBuffer}
                </ul>
              );
            } else if (listType === "ol") {
              renderedElements.push(
                <ol key={`ol-${keyPrefix}`} className="list-decimal pl-6 my-2 space-y-1 text-slate-300">
                  {listBuffer}
                </ol>
              );
            }
            listBuffer = [];
            listType = null;
          }
        };

        const parseInline = (text: string) => {
          // Quick bold and code helper
          let segments: React.ReactNode[] = [];
          let tempText = text;
          let inlineKey = 0;

          // Simple parsing of code and bold tags: `code` and **bold**
          const inlineRegex = /(\*\*.*?\*\*|\`.*?\`)/g;
          const pieces = tempText.split(inlineRegex);

          return pieces.map((piece, i) => {
            if (piece.startsWith("**") && piece.endsWith("**")) {
              return <strong key={i} className="font-semibold text-slate-100">{piece.slice(2, -2)}</strong>;
            }
            if (piece.startsWith("`") && piece.endsWith("`")) {
              return (
                <code key={i} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-indigo-400">
                  {piece.slice(1, -1)}
                </code>
              );
            }
            return piece;
          });
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          // Handle Headers
          if (trimmed.startsWith("# ")) {
            flushList(lineIdx);
            renderedElements.push(
              <h1 key={lineIdx} className="text-2xl font-bold text-slate-50 font-display mt-6 mb-3 border-b border-slate-850 pb-2">
                {parseInline(trimmed.substring(2))}
              </h1>
            );
          } else if (trimmed.startsWith("## ")) {
            flushList(lineIdx);
            renderedElements.push(
              <h2 key={lineIdx} className="text-xl font-bold text-slate-100 font-display mt-5 mb-2.5">
                {parseInline(trimmed.substring(3))}
              </h2>
            );
          } else if (trimmed.startsWith("### ")) {
            flushList(lineIdx);
            renderedElements.push(
              <h3 key={lineIdx} className="text-lg font-semibold text-slate-200 font-display mt-4 mb-2">
                {parseInline(trimmed.substring(4))}
              </h3>
            );
          }
          // Handle Blockquotes
          else if (trimmed.startsWith("> ")) {
            flushList(lineIdx);
            renderedElements.push(
              <blockquote key={lineIdx} className="border-l-4 border-indigo-550 bg-indigo-500/5 px-4 py-2.5 my-3 rounded-r-lg text-slate-400 italic">
                {parseInline(trimmed.substring(2))}
              </blockquote>
            );
          }
          // Handle Bullet Lists
          else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            if (listType !== "ul") {
              flushList(lineIdx);
              listType = "ul";
            }
            listBuffer.push(
              <li key={`li-${lineIdx}`} className="pl-1">
                {parseInline(trimmed.substring(2))}
              </li>
            );
          }
          // Handle Numbered Lists
          else if (/^\d+\.\s/.test(trimmed)) {
            if (listType !== "ol") {
              flushList(lineIdx);
              listType = "ol";
            }
            const contentStart = trimmed.indexOf(".") + 1;
            listBuffer.push(
              <li key={`li-${lineIdx}`} className="pl-1">
                {parseInline(trimmed.substring(contentStart).trim())}
              </li>
            );
          }
          // Handle Paragraphs / Empty lines
          else {
            if (trimmed === "") {
              flushList(lineIdx);
            } else {
              if (listType) {
                // If it is a continuing line inside a list
                listBuffer.push(
                  <div key={`div-${lineIdx}`} className="mt-1">
                    {parseInline(trimmed)}
                  </div>
                );
              } else {
                renderedElements.push(
                  <p key={lineIdx} className="my-2.5 text-slate-350">
                    {parseInline(trimmed)}
                  </p>
                );
              }
            }
          }
        });

        flushList(lines.length);
        return <div key={index}>{renderedElements}</div>;
      })}
    </div>
  );
}
