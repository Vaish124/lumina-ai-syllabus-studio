import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCourses, getStudentCoursesWithEnrollment } from "@/app/actions/course";
import { getTeacherAnalytics, getStudentAnalytics } from "@/app/actions/lesson";
import TeacherDashboard from "@/components/TeacherDashboard";
import StudentDashboard from "@/components/StudentDashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  if (user.role === "TEACHER") {
    const courses = await getCourses();
    const analytics = await getTeacherAnalytics();
    return (
      <TeacherDashboard
        user={user}
        initialCourses={courses as any}
        initialAnalytics={analytics}
      />
    );
  } else {
    const { enrolled, available } = await getStudentCoursesWithEnrollment();
    const analytics = await getStudentAnalytics();
    return (
      <StudentDashboard
        user={user}
        initialEnrolled={enrolled as any}
        initialAvailable={available as any}
        initialAnalytics={analytics}
      />
    );
  }
}

export const dynamic = "force-dynamic";
