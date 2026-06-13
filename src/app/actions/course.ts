"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().min(2, "Duration must be at least 2 characters"),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
});

// Helper for security authorization checks
async function requireTeacher() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") {
    throw new Error("Unauthorized. Only educators are authorized to perform this operation.");
  }
  return user;
}

export async function createCourse(data: {
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  subject: string;
}) {
  try {
    const user = await requireTeacher();
    const validated = courseSchema.parse(data);

    const course = await prisma.course.create({
      data: {
        ...validated,
        authorId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, courseId: course.id };
  } catch (error: any) {
    console.error("Create course error:", error);
    return { success: false, error: error.message || "Failed to create course" };
  }
}

export async function updateCourse(
  courseId: string,
  data: {
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    subject: string;
  }
) {
  try {
    const user = await requireTeacher();
    const validated = courseSchema.parse(data);

    // Verify ownership
    const existingCourse = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existingCourse) throw new Error("Course not found");
    if (existingCourse.authorId !== user.id) throw new Error("Unauthorized to edit this course");

    await prisma.course.update({
      where: { id: courseId },
      data: validated,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update course error:", error);
    return { success: false, error: error.message || "Failed to update course" };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const user = await requireTeacher();

    // Verify ownership
    const existingCourse = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existingCourse) throw new Error("Course not found");
    if (existingCourse.authorId !== user.id) throw new Error("Unauthorized to delete this course");

    await prisma.course.delete({ where: { id: courseId } });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete course error:", error);
    return { success: false, error: error.message || "Failed to delete course" };
  }
}

export async function togglePublishCourse(courseId: string, published: boolean) {
  try {
    const user = await requireTeacher();

    // Verify ownership
    const existingCourse = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existingCourse) throw new Error("Course not found");
    if (existingCourse.authorId !== user.id) throw new Error("Unauthorized to publish this course");

    await prisma.course.update({
      where: { id: courseId },
      data: { published },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Toggle publish course error:", error);
    return { success: false, error: error.message || "Failed to change publication status" };
  }
}

export async function getCourses() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (user.role === "TEACHER") {
      // Teachers see all courses they created
      return await prisma.course.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          modules: {
            include: { lessons: true },
          },
        },
      });
    } else {
      // Students see all published courses
      return await prisma.course.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { name: true },
          },
          modules: {
            include: { lessons: true },
          },
        },
      });
    }
  } catch (error) {
    console.error("Get courses error:", error);
    return [];
  }
}

export async function getCourseDetail(courseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        author: {
          select: { name: true, email: true },
        },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                quizzes: true,
                progress: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!course) return null;

    // Student can only access published courses
    if (user.role === "STUDENT" && !course.published) {
      throw new Error("Course not found or not published");
    }

    return course;
  } catch (error) {
    console.error("Get course detail error:", error);
    return null;
  }
}

export async function createCourseWithOutline(
  courseData: {
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    subject: string;
  },
  modulesData: {
    title: string;
    description: string;
    lessons: { title: string }[];
  }[]
) {
  try {
    const user = await requireTeacher();
    const validated = courseSchema.parse(courseData);

    const course = await prisma.course.create({
      data: {
        ...validated,
        authorId: user.id,
        modules: {
          create: modulesData.map((mod, modIdx) => ({
            title: mod.title,
            description: mod.description,
            order: modIdx + 1,
            lessons: {
              create: mod.lessons.map((les, lesIdx) => ({
                title: les.title,
                content: `# ${les.title}\n\nThis lesson material is ready to be expanded using the AI writer or custom manual edits. Click the Edit button above to get started!`,
                objectives: JSON.stringify([]),
                order: lesIdx + 1,
              })),
            },
          })),
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, courseId: course.id };
  } catch (error: any) {
    console.error("Create course with outline error:", error);
    return { success: false, error: error.message || "Failed to create course from outline" };
  }
}

export async function enrollCourse(courseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") throw new Error("Only students can enroll in courses");

    // Check course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.published) throw new Error("Course not found or not available");

    await prisma.enrollment.create({
      data: { userId: user.id, courseId },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message?.includes("Unique constraint")) {
      return { success: false, error: "Already enrolled in this course" };
    }
    return { success: false, error: error.message || "Failed to enroll" };
  }
}

export async function unenrollCourse(courseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") throw new Error("Only students can unenroll");

    await prisma.enrollment.deleteMany({
      where: { userId: user.id, courseId },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to unenroll" };
  }
}

export async function getStudentCoursesWithEnrollment() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") return { enrolled: [], available: [] };

    // All published courses with enrollment status
    const allCourses = await prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        enrollments: { where: { userId: user.id } },
        modules: {
          include: {
            lessons: {
              include: {
                progress: { where: { userId: user.id } },
              },
            },
          },
        },
      },
    });

    const enrolled = allCourses.filter((c) => c.enrollments.length > 0);
    const available = allCourses.filter((c) => c.enrollments.length === 0);

    return { enrolled, available };
  } catch (error) {
    console.error("Get student courses error:", error);
    return { enrolled: [], available: [] };
  }
}
