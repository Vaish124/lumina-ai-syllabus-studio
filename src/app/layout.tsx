import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina AI | Intelligent Syllabus & Lesson Design Studio",
  description:
    "An AI-powered Edtech platform to design curriculums, generate lesson materials, host interactive quizzes, and study with an AI learning companion.",
  keywords: "Next.js, React, Tailwind CSS, AI, Gemini, Edtech, Syllabus, Lesson Planner, Interactive Quiz",
  authors: [{ name: "House of Edtech Developer Candidate" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full dark antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
