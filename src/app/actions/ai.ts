"use server";

import {
  generateCourseOutline,
  generateLessonContent,
  getLessonChatResponse,
} from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";

// Basic Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // Max 10 AI requests per user per 5 minutes
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

function checkRateLimit(userId: string) {
  const now = Date.now();
  const userData = rateLimitMap.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + RATE_LIMIT_WINDOW;
  } else {
    userData.count++;
  }
  
  rateLimitMap.set(userId, userData);
  
  if (userData.count > RATE_LIMIT_MAX) {
    throw new Error("Rate limit exceeded. Please wait a few minutes before generating more AI content.");
  }
}

// Helper for security authorization checks
async function requireTeacher() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") {
    throw new Error("Unauthorized. Educator access required.");
  }
  return user;
}

export async function generateCourseOutlineAction(
  topic: string,
  difficulty: string,
  duration: string,
  customApiKey?: string
) {
  try {
    const user = await requireTeacher();
    checkRateLimit(user.id);

    if (!topic || topic.trim() === "") {
      throw new Error("Topic is required");
    }

    const outline = await generateCourseOutline(topic, difficulty, duration, customApiKey);
    return { success: true, outline };
  } catch (error: any) {
    console.error("AI Generate Course Outline Action Error:", error);
    return { success: false, error: error.message || "Failed to generate syllabus outline" };
  }
}

export async function generateLessonContentAction(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  customApiKey?: string
) {
  try {
    const user = await requireTeacher();
    checkRateLimit(user.id);

    if (!lessonTitle || lessonTitle.trim() === "") {
      throw new Error("Lesson title is required");
    }

    const content = await generateLessonContent(courseTitle, moduleTitle, lessonTitle, customApiKey);
    return { success: true, content };
  } catch (error: any) {
    console.error("AI Generate Lesson Content Action Error:", error);
    return { success: false, error: error.message || "Failed to generate lesson contents" };
  }
}

export async function getLessonChatResponseAction(
  lessonTitle: string,
  lessonContent: string,
  chatHistory: { role: "user" | "model"; text: string }[],
  userMessage: string,
  customApiKey?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    checkRateLimit(user.id);

    if (!userMessage || userMessage.trim() === "") {
      throw new Error("Message is required");
    }

    const response = await getLessonChatResponse(
      lessonTitle,
      lessonContent,
      chatHistory,
      userMessage,
      customApiKey
    );

    return { success: true, response };
  } catch (error: any) {
    console.error("AI Chat Response Action Error:", error);
    return { success: false, error: error.message || "Failed to retrieve chat response" };
  }
}
