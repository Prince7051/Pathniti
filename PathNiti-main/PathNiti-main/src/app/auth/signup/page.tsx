"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to role selection page
    router.replace("/auth/signup/role-selection");
  }, [router]);

  return null;
}
