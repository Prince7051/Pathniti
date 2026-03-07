import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

interface UserProfile {
  role: string;
  created_at: string;
}

interface CollegeData {
  id: string;
  type: string;
  location: Record<string, unknown>;
  created_at: string;
}

interface AssessmentData {
  status: string;
  completed_at: string;
  aptitude_scores: Record<string, number>;
}

interface RecentUserData {
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch admin analytics data
    const [userStats, collegeStats, assessmentStats, recentActivity] =
      await Promise.all([
        // Get user statistics
        supabase
          .from("profiles")
          .select("role, created_at")
          .order("created_at", { ascending: false }),

        // Get college statistics
        supabase
          .from("colleges")
          .select("id, type, location, created_at")
          .order("created_at", { ascending: false }),

        // Get assessment statistics
        supabase
          .from("assessment_sessions")
          .select("status, completed_at, aptitude_scores")
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),

        // Get recent user registrations
        supabase
          .from("profiles")
          .select("first_name, last_name, role, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    // Calculate user statistics
    const totalUsers = userStats.data?.length || 0;
    const students =
      userStats.data?.filter((u: UserProfile) => u.role === "student").length || 0;
    const colleges =
      userStats.data?.filter((u: UserProfile) => u.role === "college").length || 0;
    const admins =
      userStats.data?.filter((u: UserProfile) => u.role === "admin").length || 0;

    // Calculate new users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek =
      userStats.data?.filter((user: UserProfile) => new Date(user.created_at) > weekAgo)
        .length || 0;

    // Calculate college statistics
    const totalColleges = collegeStats.data?.length || 0;
    const governmentColleges =
      collegeStats.data?.filter((c: CollegeData) => c.type === "government").length || 0;
    const privateColleges =
      collegeStats.data?.filter((c: CollegeData) => c.type === "private").length || 0;

    // Calculate assessment statistics
    const totalAssessments = assessmentStats.data?.length || 0;
    let averageScore = 0;
    if (assessmentStats.data && assessmentStats.data.length > 0) {
      const scores = assessmentStats.data.map((assessment: AssessmentData) => {
        if (assessment.aptitude_scores) {
          const scoreValues = Object.values(
            assessment.aptitude_scores,
          ) as number[];
          return scoreValues.length > 0
            ? Math.round(
                scoreValues.reduce((sum, score) => sum + score, 0) /
                  scoreValues.length,
              )
            : 0;
        }
        return 0;
      });
      averageScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      );
    }

    // Get recent activity
    const recentActivityList =
      recentActivity.data?.map((user: RecentUserData) => ({
        action: "user_registered",
        description: `${user.first_name} ${user.last_name} (${user.role}) joined`,
        timestamp: user.created_at,
        timeAgo: getTimeAgo(user.created_at),
      })) || [];

    const analytics = {
      totalUsers,
      students,
      colleges: colleges, // This is user role 'college', not college institutions
      admins,
      newUsersThisWeek,
      totalColleges,
      governmentColleges,
      privateColleges,
      totalAssessments,
      averageScore,
      recentActivity: recentActivityList,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}
