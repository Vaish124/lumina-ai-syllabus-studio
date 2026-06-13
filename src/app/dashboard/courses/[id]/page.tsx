import { getCurrentUser } from "@/lib/auth";
import { getCourseDetail } from "@/app/actions/course";
import { redirect } from "next/navigation";
import TeacherCourseDetail from "@/components/TeacherCourseDetail";
import StudentCourseDetail from "@/components/StudentCourseDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const { id: courseId } = await params;
  const course = await getCourseDetail(courseId);

  if (!course) {
    redirect("/dashboard");
  }

  if (user.role === "TEACHER") {
    // Check ownership
    if (course.authorId !== user.id) {
      redirect("/dashboard");
    }

    return <TeacherCourseDetail user={user} course={course as any} />;
  } else {
    return <StudentCourseDetail user={user} course={course as any} />;
  }
}
export const dynamic = "force-dynamic";
