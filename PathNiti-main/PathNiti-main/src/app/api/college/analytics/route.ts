import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const college_id = searchParams.get("college_id");

    if (!college_id) {
      return NextResponse.json(
        { error: "College ID is required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Fetch college analytics data
    // Temporarily disabled - programs and user_favorites tables not defined in schema
    const [collegeInfo] = await Promise.all([
        // Get college information
        supabase
          .from("colleges")
          .select("name, type, location, website, established_year")
          .eq("id", college_id)
          .single(),

        // Get programs offered by this college
        // supabase
        //   .from("programs")
        //   .select("id, name, stream, duration, fees")
        //   .eq("college_id", college_id),
        { data: [] }, // Temporary placeholder

        // Get applications/favorites for this college
        // supabase
        //   .from("user_favorites")
        //   .select("user_id, program_id, created_at")
        //   .eq("college_id", college_id)
        //   .eq("favorite_type", "college"),
        { data: [] }, // Temporary placeholder

        // Get student interests in programs
        // supabase
        //   .from("user_favorites")
        //   .select("program_id, created_at")
        //   .eq("college_id", college_id)
        //   .eq("favorite_type", "program"),
        { data: [] }, // Temporary placeholder
      ]);

    // Calculate program statistics
    const totalPrograms = 0; // Temporary placeholder - no programs data available
    const engineeringPrograms = 0; // Temporary placeholder
    const commercePrograms = 0; // Temporary placeholder
    const artsPrograms = 0; // Temporary placeholder

    // Calculate application statistics
    const totalApplications = 0; // Temporary placeholder - no applications data available
    const applicationsThisWeek = 0; // Temporary placeholder

    // Calculate program interest statistics
    const programInterests = 0; // Temporary placeholder
    const popularPrograms: unknown[] = []; // Temporary placeholder - no programs data available

    // Get recent applications
    const recentApplications: unknown[] = []; // Temporary placeholder - no applications data available

    const analytics = {
      collegeInfo: collegeInfo.data,
      totalPrograms,
      engineeringPrograms,
      commercePrograms,
      artsPrograms,
      totalApplications,
      applicationsThisWeek,
      programInterests,
      popularPrograms,
      recentApplications,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching college analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}

// function getTimeAgo(timestamp: string): string {
//   const now = new Date();
//   const time = new Date(timestamp);
//   const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

//   if (diffInSeconds < 60) return "Just now";
//   if (diffInSeconds < 3600)
//     return `${Math.floor(diffInSeconds / 60)} minutes ago`;
//   if (diffInSeconds < 86400)
//     return `${Math.floor(diffInSeconds / 3600)} hours ago`;
//   if (diffInSeconds < 2592000)
//     return `${Math.floor(diffInSeconds / 86400)} days ago`;
//   return `${Math.floor(diffInSeconds / 2592000)} months ago`;
// }
