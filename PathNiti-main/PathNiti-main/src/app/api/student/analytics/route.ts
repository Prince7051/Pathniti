import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Fetch student analytics data
    const [
      assessmentData,
      collegeData,
      applicationData,
      scholarshipData,
      recentActivity,
    ] = await Promise.all([
      // Get latest assessment scores
      (supabase
        .from("assessment_sessions")
        .select("riasec_scores, aptitude_scores, completed_at")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single() as unknown) as { data: { riasec_scores?: Record<string, number>; aptitude_scores?: Record<string, number>; completed_at?: string } | null; error: unknown },

      // Get colleges explored (from user_favorites)
      (supabase
        .from("user_favorites")
        .select("college_id, created_at")
        .eq("user_id", user_id)
        .eq("favorite_type", "college") as unknown) as { data: { college_id: string; created_at: string }[] | null },

      // Get applications tracked (from user_favorites with programs)
      (supabase
        .from("user_favorites")
        .select("program_id, created_at")
        .eq("user_id", user_id)
        .eq("favorite_type", "program") as unknown) as { data: { program_id: string; created_at: string }[] | null },

      // Get scholarships found (from user_favorites)
      (supabase
        .from("user_favorites")
        .select("scholarship_id, created_at")
        .eq("user_id", user_id)
        .eq("favorite_type", "scholarship") as unknown) as { data: { scholarship_id: string; created_at: string }[] | null },

      // Get recent activity (from user_timeline)
      (supabase
        .from("user_timeline")
        .select("action, data, created_at")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(10) as unknown) as { data: { action: string; data: unknown; created_at: string }[] | null },
    ]);

    // Calculate quiz score average
    let quizScoreAverage = 0;
    let lastAssessmentScore = 0;
    let scoreChange = 0;

    if (assessmentData.data) {
      // Calculate average from aptitude_scores
      let currentScore = 0;

      if (assessmentData.data.aptitude_scores) {
        const scores = Object.values(
          assessmentData.data.aptitude_scores,
        ) as number[];
        if (scores.length > 0) {
          currentScore = Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          );
        }
      }

      quizScoreAverage = currentScore;
      lastAssessmentScore = currentScore;

      // Get previous assessment for comparison
      const { data: previousAssessment } = (await supabase
        .from("assessment_sessions")
        .select("aptitude_scores")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .range(1, 1)) as { data: { aptitude_scores?: Record<string, number> }[] | null }; // Get the second most recent

      if (previousAssessment && previousAssessment.length > 0) {
        let previousScore = 0;

        if (previousAssessment[0].aptitude_scores) {
          const prevScores = Object.values(
            previousAssessment[0].aptitude_scores,
          ) as number[];
          if (prevScores.length > 0) {
            previousScore = Math.round(
              prevScores.reduce((sum, score) => sum + score, 0) /
                prevScores.length,
            );
          }
        }

        scoreChange = currentScore - previousScore;
      }
    }

    // Count colleges explored
    const collegesExplored = collegeData.data?.length || 0;
    const collegesThisWeek =
      collegeData.data?.filter((item) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(item.created_at) > weekAgo;
      }).length || 0;

    // Count applications tracked
    const applicationsTracked = applicationData.data?.length || 0;

    // Get upcoming deadlines from admission_deadlines table
    const { data: deadlineData } = await supabase
      .from("admission_deadlines")
      .select("deadline_date")
      .gte("deadline_date", new Date().toISOString())
      .order("deadline_date", { ascending: true })
      .limit(10);
    
    const upcomingDeadlines = deadlineData?.length || 0;

    // Count scholarships found
    const scholarshipsFound = scholarshipData.data?.length || 0;

    // Calculate total scholarship value from actual scholarship data
    let totalScholarshipValue = 0;
    if (scholarshipData.data && scholarshipData.data.length > 0) {
      const scholarshipIds = scholarshipData.data.map(item => item.scholarship_id);
      
      const { data: scholarshipDetails } = await supabase
        .from("scholarships")
        .select("amount")
        .in("id", scholarshipIds);
      
      if (scholarshipDetails) {
        totalScholarshipValue = scholarshipDetails.reduce((sum, scholarship: { amount?: number }) => {
          return sum + (scholarship.amount || 0);
        }, 0);
      }
    }

    // Get recent activity
    const recentActivityList =
      recentActivity.data?.map((activity) => ({
        action: activity.action,
        description: getActivityDescription(activity.action, activity.data as { [key: string]: unknown }),
        timestamp: activity.created_at,
        timeAgo: getTimeAgo(activity.created_at),
      })) || [];

    // Get progress milestones based on actual user activities
    const progressMilestones = await getProgressMilestones(user_id, supabase);

    const analytics = {
      quizScoreAverage: Math.round(quizScoreAverage),
      lastAssessmentScore: Math.round(lastAssessmentScore),
      scoreChange: Math.round(scoreChange),
      collegesExplored,
      collegesThisWeek,
      applicationsTracked,
      upcomingDeadlines,
      scholarshipsFound,
      totalScholarshipValue,
      recentActivity: recentActivityList,
      progressMilestones,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}

function getActivityDescription(
  action: string,
  data: {
    quiz_type?: string;
    score?: number;
    college_name?: string;
    application_id?: string;
    document_type?: string;
    [key: string]: unknown;
  },
): string {
  switch (action) {
    case "quiz_completed":
      return `Completed ${data?.quiz_type || "assessment"} with score ${data?.score || "N/A"}%`;
    case "college_viewed":
      return `Viewed ${data?.college_name || "college"}`;
    case "college_saved":
      return `Saved ${data?.college_name || "college"} to favorites`;
    case "application_started":
      return `Started application for ${data?.program_name || "program"}`;
    case "scholarship_found":
      return `Found scholarship: ${data?.scholarship_name || "scholarship"}`;
    default:
      return action.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
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

async function getProgressMilestones(user_id: string, supabase: any) {
  try {
    // Get user's completed activities from timeline
    const { data: timelineData } = await supabase
      .from("user_timeline")
      .select("action, data, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    // Get user's assessment completion status
    const { data: assessmentData } = await supabase
      .from("assessment_sessions")
      .select("status, completed_at")
      .eq("user_id", user_id)
      .eq("status", "completed")
      .order("completed_at", { ascending: true });

    // Get user's application count
    const { data: applicationData } = await supabase
      .from("student_applications")
      .select("id, submitted_at")
      .eq("student_id", user_id);

    // Get user's favorites count
    const { data: favoritesData } = await supabase
      .from("user_favorites")
      .select("favorite_type, created_at")
      .eq("user_id", user_id);

    // Define milestone criteria
    const milestones = [
      {
        id: "profile_complete",
        title: "Complete Profile Setup",
        description: "Fill out your personal information and preferences",
        completed: false,
        inProgress: false,
        completedAt: null,
      },
      {
        id: "first_assessment",
        title: "Complete First Assessment",
        description: "Take your first comprehensive assessment",
        completed: false,
        inProgress: false,
        completedAt: null,
      },
      {
        id: "explore_colleges",
        title: "Explore 5 Colleges",
        description: "Browse and explore at least 5 colleges",
        completed: false,
        inProgress: false,
        completedAt: null,
      },
      {
        id: "save_favorites",
        title: "Save 3 Favorites",
        description: "Save at least 3 colleges, programs, or scholarships",
        completed: false,
        inProgress: false,
        completedAt: null,
      },
      {
        id: "first_application",
        title: "Submit First Application",
        description: "Submit your first college application",
        completed: false,
        inProgress: false,
        completedAt: null,
      },
      {
        id: "scholarship_search",
        title: "Find Scholarships",
        description: "Discover and save at least 2 scholarships",
        completed: false,
        inProgress: false,
        completedAt: null,
      },
    ];

    // Check milestone completion based on actual data
    const collegeFavorites = favoritesData?.filter((f: { favorite_type: string }) => f.favorite_type === "college") || [];
    const scholarshipFavorites = favoritesData?.filter((f: { favorite_type: string }) => f.favorite_type === "scholarship") || [];
    const programFavorites = favoritesData?.filter((f: { favorite_type: string }) => f.favorite_type === "program") || [];
    const totalFavorites = collegeFavorites.length + scholarshipFavorites.length + programFavorites.length;

    // Update milestone status
    milestones.forEach(milestone => {
      switch (milestone.id) {
        case "profile_complete":
          // Check if user has completed profile (has interests, location, etc.)
          milestone.completed = true; // Assume completed if user exists
          milestone.completedAt = timelineData?.[0]?.created_at || null;
          break;
        
        case "first_assessment":
          if (assessmentData && assessmentData.length > 0) {
            milestone.completed = true;
            milestone.completedAt = assessmentData[0].completed_at;
          }
          break;
        
        case "explore_colleges":
          if (collegeFavorites.length >= 5) {
            milestone.completed = true;
            milestone.completedAt = collegeFavorites[4]?.created_at || null;
          } else if (collegeFavorites.length > 0) {
            milestone.inProgress = true;
          }
          break;
        
        case "save_favorites":
          if (totalFavorites >= 3) {
            milestone.completed = true;
            milestone.completedAt = favoritesData?.[2]?.created_at || null;
          } else if (totalFavorites > 0) {
            milestone.inProgress = true;
          }
          break;
        
        case "first_application":
          if (applicationData && applicationData.length > 0) {
            milestone.completed = true;
            milestone.completedAt = applicationData[0].submitted_at;
          }
          break;
        
        case "scholarship_search":
          if (scholarshipFavorites.length >= 2) {
            milestone.completed = true;
            milestone.completedAt = scholarshipFavorites[1]?.created_at || null;
          } else if (scholarshipFavorites.length > 0) {
            milestone.inProgress = true;
          }
          break;
      }
    });

    return milestones;
  } catch (error) {
    console.error("Error calculating progress milestones:", error);
    return [];
  }
}
