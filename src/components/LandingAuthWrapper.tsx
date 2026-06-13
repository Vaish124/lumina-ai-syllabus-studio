"use client";

import { useRouter } from "next/navigation";
import AuthCard from "./AuthCard";

export default function LandingAuthWrapper() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.push("/dashboard");
    router.refresh();
  };

  return <AuthCard onSuccess={handleAuthSuccess} />;
}
