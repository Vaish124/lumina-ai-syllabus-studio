"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { generateQuizFeedback } from "@/lib/gemini";

// Helper for security authorization checks
async function requireTeacher() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") {
    throw new Error("Unauthorized. Educator access required.");
  }
  return user;
}

async function requireStudent() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    throw new Error("Unauthorized. Student access required.");
  }
  return user;
}

// MODULE ACTIONS
export async function createModule(courseId: string, title: string, description: string, order: number) {
  try {
    await requireTeacher();

    const newModule = await prisma.module.create({
      data: {
        courseId,
        title,
        description,
        order,
      },
    });

    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true, moduleId: newModule.id };
  } catch (error: any) {
    console.error("Create module error:", error);
    return { success: false, error: error.message || "Failed to create module" };
  }
}

export async function updateModule(moduleId: string, title: string, description: string, order: number) {
  try {
    await requireTeacher();

    const mod = await prisma.module.update({
      where: { id: moduleId },
      data: {
        title,
        description,
        order,
      },
    });

    revalidatePath(`/dashboard/courses/${mod.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update module error:", error);
    return { success: false, error: error.message || "Failed to update module" };
  }
}

export async function deleteModule(moduleId: string) {
  try {
    await requireTeacher();

    const mod = await prisma.module.delete({
      where: { id: moduleId },
    });

    revalidatePath(`/dashboard/courses/${mod.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Delete module error:", error);
    return { success: false, error: error.message || "Failed to delete module" };
  }
}

// LESSON ACTIONS
export async function createLesson(
  moduleId: string,
  data: {
    title: string;
    content: string;
    objectives: string[];
    order: number;
  }
) {
  try {
    await requireTeacher();

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!mod) throw new Error("Module not found");

    const newLesson = await prisma.lesson.create({
      data: {
        moduleId,
        title: data.title,
        content: data.content,
        objectives: JSON.stringify(data.objectives),
        order: data.order,
      },
    });

    revalidatePath(`/dashboard/courses/${mod.courseId}`);
    return { success: true, lessonId: newLesson.id };
  } catch (error: any) {
    console.error("Create lesson error:", error);
    return { success: false, error: error.message || "Failed to create lesson" };
  }
}

export async function updateLesson(
  lessonId: string,
  data: {
    title: string;
    content: string;
    objectives: string[];
    order: number;
  }
) {
  try {
    await requireTeacher();

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: data.title,
        content: data.content,
        objectives: JSON.stringify(data.objectives),
        order: data.order,
      },
      include: {
        module: {
          select: { courseId: true },
        },
      },
    });

    revalidatePath(`/dashboard/courses/${lesson.module.courseId}`);
    revalidatePath(`/dashboard/lessons/${lessonId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update lesson error:", error);
    return { success: false, error: error.message || "Failed to update lesson" };
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    await requireTeacher();

    const lesson = await prisma.lesson.delete({
      where: { id: lessonId },
      include: {
        module: {
          select: { courseId: true },
        },
      },
    });

    revalidatePath(`/dashboard/courses/${lesson.module.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Delete lesson error:", error);
    return { success: false, error: error.message || "Failed to delete lesson" };
  }
}

// QUIZ QUESTIONS ACTIONS
export async function createQuizQuestion(
  lessonId: string,
  data: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }
) {
  try {
    await requireTeacher();

    await prisma.quizQuestion.create({
      data: {
        lessonId,
        question: data.question,
        options: JSON.stringify(data.options),
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      },
    });

    revalidatePath(`/dashboard/lessons/${lessonId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Create quiz question error:", error);
    return { success: false, error: error.message || "Failed to add quiz question" };
  }
}

export async function deleteQuizQuestion(questionId: string, lessonId: string) {
  try {
    await requireTeacher();

    await prisma.quizQuestion.delete({
      where: { id: questionId },
    });

    revalidatePath(`/dashboard/lessons/${lessonId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Delete quiz question error:", error);
    return { success: false, error: error.message || "Failed to delete quiz question" };
  }
}

// STUDENT INTERACTIVE ACTIONS
export async function submitQuizAttempt(
  lessonId: string,
  userAnswers: { questionId: string; selectedAnswer: string }[],
  customApiKey?: string
) {
  try {
    const user = await requireStudent();

    // Fetch quiz questions for this lesson to grade them securely on the server
    const questions = await prisma.quizQuestion.findMany({
      where: { lessonId },
    });

    if (questions.length === 0) {
      throw new Error("No quiz questions found for this lesson.");
    }

    let score = 0;
    const gradedAnswers = questions.map((q) => {
      const userAns = userAnswers.find((ua) => ua.questionId === q.id);
      const selected = userAns ? userAns.selectedAnswer : "";
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) score++;

      return {
        question: q.question,
        selected,
        correct: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true },
    });

    const lessonTitle = lesson?.title || "Lesson";

    // Call Gemini to generate personalized learning feedback on the student's score
    const aiFeedback = await generateQuizFeedback(
      lessonTitle,
      score,
      questions.length,
      gradedAnswers,
      customApiKey
    );

    // Save attempt in the database (Create)
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        lessonId,
        score,
        total: questions.length,
        answers: JSON.stringify(userAnswers),
        feedback: aiFeedback.feedback,
      },
    });

    // Automatically mark the lesson as completed when they get a perfect score or finish the quiz
    if (score >= questions.length / 2) {
      await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId,
          },
        },
        update: { completed: true },
        create: {
          userId: user.id,
          lessonId,
          completed: true,
        },
      });
    }

    revalidatePath(`/dashboard/lessons/${lessonId}`);
    return { success: true, score, total: questions.length, feedback: aiFeedback.feedback, attemptId: attempt.id };
  } catch (error: any) {
    console.error("Submit quiz attempt error:", error);
    return { success: false, error: error.message || "Failed to submit quiz attempt" };
  }
}

export async function toggleLessonProgress(lessonId: string, completed: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      update: { completed },
      create: {
        userId: user.id,
        lessonId,
        completed,
      },
    });

    revalidatePath(`/dashboard/lessons/${lessonId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Toggle progress error:", error);
    return { success: false, error: error.message || "Failed to update progress" };
  }
}

export async function getQuizAttempts(lessonId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    return await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        lessonId,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Get quiz attempts error:", error);
    return [];
  }
}

// NOTES ACTIONS (CRUD)
export async function saveStudyNote(lessonId: string, content: string) {
  try {
    const user = await requireStudent();

    // We store one note per user per lesson. If it exists, update it. If not, create it.
    const existingNote = await prisma.studyNote.findFirst({
      where: { userId: user.id, lessonId },
    });

    if (existingNote) {
      if (content.trim() === "") {
        // Delete if content cleared (Delete operation)
        await prisma.studyNote.delete({
          where: { id: existingNote.id },
        });
        return { success: true, noteDeleted: true };
      } else {
        // Update operation
        await prisma.studyNote.update({
          where: { id: existingNote.id },
          data: { content },
        });
      }
    } else if (content.trim() !== "") {
      // Create operation
      await prisma.studyNote.create({
        data: {
          userId: user.id,
          lessonId,
          content,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Save note error:", error);
    return { success: false, error: error.message || "Failed to save study notes" };
  }
}

export async function getStudyNote(lessonId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    return await prisma.studyNote.findFirst({
      where: { userId: user.id, lessonId },
    });
  } catch (error) {
    console.error("Get study note error:", error);
    return null;
  }
}

// DASHBOARD ANALYTICS ACTIONS
export async function getStudentAnalytics() {
  try {
    const user = await requireStudent();

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const progress = await prisma.userProgress.findMany({
      where: { userId: user.id, completed: true },
    });

    const notes = await prisma.studyNote.findMany({
      where: { userId: user.id },
    });

    const averageScore =
      attempts.length > 0
        ? Math.round(
            (attempts.reduce((sum, item) => sum + (item.score / item.total) * 100, 0) / attempts.length)
          )
        : 0;

    return {
      totalQuizzesTaken: attempts.length,
      lessonsCompleted: progress.length,
      notesTaken: notes.length,
      averageScore,
      recentAttempts: attempts.slice(0, 5),
    };
  } catch (error) {
    console.error("Get student analytics error:", error);
    return null;
  }
}

export async function getTeacherAnalytics() {
  try {
    const user = await requireTeacher();

    // Fetch all courses created by this teacher
    const courses = await prisma.course.findMany({
      where: { authorId: user.id },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                quizzes: true,
                progress: true,
                notes: true,
              },
            },
          },
        },
      },
    });

    const totalCourses = courses.length;
    const totalModules = courses.reduce((sum, c) => sum + c.modules.length, 0);
    const totalLessons = courses.reduce((sum, c) => sum + c.modules.reduce((sm, m) => sm + m.lessons.length, 0), 0);

    // Get all students enrolled or taking quizzes
    const allQuizAttempts = await prisma.quizAttempt.findMany({
      where: {
        lessonId: {
          in: courses.flatMap((c) => c.modules.flatMap((m) => m.lessons.map((l) => l.id))),
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const uniqueStudents = new Set(allQuizAttempts.map((a) => a.userId)).size;

    return {
      totalCourses,
      totalModules,
      totalLessons,
      totalStudentsEnrolled: uniqueStudents,
      recentQuizAttempts: allQuizAttempts.slice(0, 10),
    };
  } catch (error) {
    console.error("Get teacher analytics error:", error);
    return null;
  }
}

export async function getLessonDetail(lessonId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        quizzes: true,
        progress: {
          where: { userId: user.id },
        },
        module: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                authorId: true,
              },
            },
          },
        },
      },
    });

    return lesson;
  } catch (error) {
    console.error("Get lesson detail error:", error);
    return null;
  }
}

