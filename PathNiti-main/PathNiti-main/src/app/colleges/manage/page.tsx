import { redirect } from "next/navigation";

export default function CollegeManageRedirect() {
  // Redirect to the proper college dashboard
  redirect("/colleges/dashboard");
}
