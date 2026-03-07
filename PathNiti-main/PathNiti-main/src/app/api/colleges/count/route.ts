import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Get total count of colleges
    const { count: totalColleges, error: collegesError } = await supabase
      .from("colleges")
      .select("*", { count: "exact", head: true });

    if (collegesError) {
      console.error("Error fetching colleges count:", collegesError);
      return NextResponse.json(
        { error: "Failed to fetch colleges count" },
        { status: 500 },
      );
    }

    // Get count of active colleges (with verified status)
    const { count: activeColleges, error: activeError } = await supabase
      .from("colleges")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (activeError) {
      console.error("Error fetching active colleges count:", activeError);
      return NextResponse.json(
        { error: "Failed to fetch active colleges count" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        totalColleges: totalColleges || 0,
        activeColleges: activeColleges || 0,
      },
    });
  } catch (error) {
    console.error("Error in colleges count API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
