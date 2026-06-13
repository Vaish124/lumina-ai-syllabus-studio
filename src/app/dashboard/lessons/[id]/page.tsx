import { getCurrentUser } from "@/lib/auth";
import { getLessonDetail } from "@/app/actions/lesson";
import { redirect } from "next/navigation";
import TeacherLessonWorkspace from "@/components/TeacherLessonWorkspace";
import StudentLessonWorkspace from "@/components/StudentLessonWorkspace";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonWorkspacePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const { id: lessonId } = await params;
  const lesson = await getLessonDetail(lessonId);

  if (!lesson) {
    redirect("/dashboard");
  }

  if (user.role === "TEACHER") {
    // Check ownership
    if (lesson.module.course.authorId !== user.id) {
      redirect("/dashboard");
    }
    return <TeacherLessonWorkspace user={user} lesson={lesson as any} />;
  } else {
    // Student can access
    return <StudentLessonWorkspace user={user} lesson={lesson as any} />;
  }
}
export const dynamic = "force-dynamic";
