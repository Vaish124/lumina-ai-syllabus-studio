import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Zod schemas for Gemini Structured Output
export const courseOutlineSchema = z.object({
  modules: z.array(
    z.object({
      title: z.string().describe("The name of the module"),
      description: z.string().describe("A brief description of what this module covers"),
      lessons: z.array(
        z.object({
          title: z.string().describe("The name of the lesson"),
        })
      ).describe("List of lessons in this module"),
    })
  ).describe("List of modules for the course"),
});

export const lessonContentSchema = z.object({
  content: z.string().describe("Comprehensive learning material in Markdown format, with titles, bold text, lists, and code blocks if applicable."),
  objectives: z.array(z.string()).describe("List of 3-4 key learning objectives"),
  quizzes: z.array(
    z.object({
      question: z.string().describe("The quiz question text"),
      options: z.array(z.string()).describe("Four multiple choice options"),
      correctAnswer: z.string().describe("The exact correct option from the options array"),
      explanation: z.string().describe("Explanation of why this answer is correct"),
    })
  ).describe("List of 3-5 quiz questions testing the content"),
});

export const quizFeedbackSchema = z.object({
  feedback: z.string().describe("Personalized feedback explaining the user's score, highlighting strengths, and areas for improvement based on their answers."),
});

// Helper to instantiate the Gemini SDK
function getAIClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Generate Course Outline
export async function generateCourseOutline(
  topic: string,
  difficulty: string,
  duration: string,
  customApiKey?: string
) {
  const ai = getAIClient(customApiKey);

  if (!ai) {
    console.log("No Gemini API Key provided. Returning mock course outline.");
    return getMockCourseOutline(topic, difficulty, duration);
  }

  try {
    const prompt = `Create a structured course outline for a syllabus.
Subject/Topic: ${topic}
Difficulty Level: ${difficulty}
Duration: ${duration}

Generate a set of modules (typically 3 to 5 modules) with 2 to 4 lessons per module. Make the titles educational, engaging, and professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: courseOutlineSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text) as z.infer<typeof courseOutlineSchema>;
  } catch (error) {
    console.error("Gemini course outline generation failed, falling back to mock:", error);
    return getMockCourseOutline(topic, difficulty, duration);
  }
}

// Generate Lesson Material & Quizzes
export async function generateLessonContent(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  customApiKey?: string
) {
  const ai = getAIClient(customApiKey);

  if (!ai) {
    console.log("No Gemini API Key provided. Returning mock lesson content.");
    return getMockLessonContent(courseTitle, moduleTitle, lessonTitle);
  }

  try {
    const prompt = `Generate comprehensive learning material for a lesson.
Course: ${courseTitle}
Module: ${moduleTitle}
Lesson: ${lessonTitle}

Requirements:
1. "content": Comprehensive educational content in clean Markdown. Include introduction, detailed paragraphs with headers, examples, and a conclusion.
2. "objectives": 3-4 key objectives that this lesson achieves.
3. "quizzes": 3-5 high-quality multiple choice questions. Each question must have 4 options, a correctAnswer that is exactly identical to one of the options, and an explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonContentSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text) as z.infer<typeof lessonContentSchema>;
  } catch (error) {
    console.error("Gemini lesson content generation failed, falling back to mock:", error);
    return getMockLessonContent(courseTitle, moduleTitle, lessonTitle);
  }
}

// Generate Quiz feedback
export async function generateQuizFeedback(
  lessonTitle: string,
  score: number,
  total: number,
  answers: { question: string; selected: string; correct: string }[],
  customApiKey?: string
) {
  const ai = getAIClient(customApiKey);

  if (!ai) {
    return {
      feedback: `You scored ${score}/${total} on "${lessonTitle}". ${
        score === total
          ? "Excellent work! You've mastered this concept completely."
          : score >= total / 2
          ? "Good effort! Review the explanations for the questions you missed to reinforce your learning."
          : "Keep studying. Try reading the lesson material again and retake the quiz to improve your understanding."
      }`,
    };
  }

  try {
    const prompt = `Provide educational feedback for a student who just finished a quiz on: "${lessonTitle}".
Score: ${score} out of ${total}
Student Answers detail:
${answers
  .map(
    (a, i) =>
      `Q${i + 1}: ${a.question}
Selected Answer: ${a.selected}
Correct Answer: ${a.correct}
Result: ${a.selected === a.correct ? "CORRECT" : "INCORRECT"}`
  )
  .join("\n\n")}

Provide brief, encouraging, and constructive feedback.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizFeedbackSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text) as z.infer<typeof quizFeedbackSchema>;
  } catch (error) {
    console.error("Gemini feedback failed, falling back to static feedback:", error);
    return {
      feedback: `You scored ${score}/${total}. Keep practicing and reviewing the course material.`,
    };
  }
}

// Interactive chat assistance for lesson content
export async function getLessonChatResponse(
  lessonTitle: string,
  lessonContent: string,
  chatHistory: { role: "user" | "model"; text: string }[],
  userMessage: string,
  customApiKey?: string
) {
  const ai = getAIClient(customApiKey);

  if (!ai) {
    return "I'm in offline/mock mode because no Gemini API Key is configured. Please enter your API Key in the settings panel to enable interactive chatting!";
  }

  try {
    const systemInstruction = `You are a helpful, smart, and friendly AI study companion.
The student is currently reading the lesson: "${lessonTitle}".
Here is the lesson content for reference:
---
${lessonContent}
---
Use this content to answer their questions, provide extra examples, explain difficult concepts in simpler terms, or test them on the material. Keep your answers concise, clear, and focused on education.`;

    const formattedHistory = chatHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Add current user message
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: formattedHistory,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const result = await chat.sendMessage({
      message: userMessage,
    });

    return result.text || "Sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini chat failed:", error);
    return `Error communicating with Gemini: ${error?.message || "Please check your API Key."}`;
  }
}

// --- MOCK GENERATION HELPERS ---

function getMockCourseOutline(topic: string, difficulty: string, duration: string) {
  return {
    modules: [
      {
        title: `Module 1: Foundations of ${topic}`,
        description: `An introduction to the fundamental concepts of ${topic} suitable for ${difficulty} level.`,
        lessons: [
          { title: `Introduction to ${topic}` },
          { title: `Core Principles and Terminology` },
          { title: `Setting up your Environment` },
        ],
      },
      {
        title: `Module 2: Core Methodology`,
        description: `Deep dive into the operational mechanisms and practical structures of ${topic}.`,
        lessons: [
          { title: `Working with the Primary API` },
          { title: `Data Processing and Flow control` },
          { title: `Common Patterns and Best Practices` },
        ],
      },
      {
        title: `Module 3: Advanced Applications`,
        description: `Implementing complex designs, optimization techniques, and real-world deployment cases.`,
        lessons: [
          { title: `Performance Optimization` },
          { title: `Security & Vulnerability Mitigation` },
          { title: `Case Study: Production Implementation` },
        ],
      },
    ],
  };
}

function getMockLessonContent(courseTitle: string, moduleTitle: string, lessonTitle: string) {
  return {
    content: `# ${lessonTitle}

Welcome to this lesson in the course **${courseTitle}**, as part of the module **${moduleTitle}**.

## Introduction
In this lesson, we will explore the core concepts surrounding **${lessonTitle}**. Understanding these principles is critical to mastering the field and applying them to solve real-world problems.

## Key Concepts Explained

### 1. Basic Architecture
To build a solid foundation, let's look at how this system operates. It relies on a modular architecture designed to decouple concerns:
*   **Decoupled Components**: Ensures high maintainability and testability.
*   **Scalability**: Built to scale horizontally under high load.
*   **Security by Design**: Validates input at boundaries to prevent standard vulnerabilities.

### 2. Implementation Guide
Here's a standard code snippet illustrating the concept in practice:

\`\`\`typescript
// Example configuration pattern
interface Config {
  enabled: boolean;
  retries: number;
}

export function initialize(config: Config): void {
  console.log("Initializing module for ${lessonTitle}...");
  if (config.enabled) {
    for (let i = 0; i < config.retries; i++) {
      // Execute core routine
      console.log(\`Attempt \${i + 1} processing...\`);
    }
  }
}
\`\`\`

## Summary
To summarize, we've reviewed the background of ${lessonTitle}, analyzed the design choices, and walked through a sample implementation. In the next section, you'll be tested on these topics. Make sure you understand the difference between local states and shared configurations!
`,
    objectives: [
      `Analyze the core architecture of ${lessonTitle}.`,
      `Implement modular interfaces for decoupled components.`,
      `Design high-efficiency flow control and exception handling.`,
    ],
    quizzes: [
      {
        question: `What is the primary benefit of the decoupled components architecture discussed in this lesson?`,
        options: [
          "It maximizes initial code compile speed",
          "It ensures high maintainability and ease of testing",
          "It automatically encrypts all database operations",
          "It restricts user access roles to student only",
        ],
        correctAnswer: "It ensures high maintainability and ease of testing",
        explanation: "Decoupled components separate concerns, making it easier to test individual modules and maintain the system over time without affecting unrelated parts.",
      },
      {
        question: `Which configuration parameter in the code snippet controls the retry loops?`,
        options: [
          "enabled",
          "retries",
          "initialize",
          "config",
        ],
        correctAnswer: "retries",
        explanation: "The variable `config.retries` is used in the for-loop condition `i < config.retries` to determine the number of loop iterations.",
      },
      {
        question: `In a production environment, why is it vital to validate input at component boundaries?`,
        options: [
          "To speed up CSS compilation times",
          "To prevent security vulnerabilities like injections and XSS",
          "To force standard dark-mode interfaces",
          "To automatically generate AI response schema definitions",
        ],
        correctAnswer: "To prevent security vulnerabilities like injections and XSS",
        explanation: "Boundary validation ensures that untrusted user input cannot execute arbitrary command scripts or cause state corruption, preventing severe security gaps.",
      },
    ],
  };
}
