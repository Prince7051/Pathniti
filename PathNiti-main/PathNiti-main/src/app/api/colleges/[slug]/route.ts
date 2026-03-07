import { NextRequest, NextResponse } from "next/server";
import { collegeProfileServiceEnhanced } from "@/lib/services/college-profile-service";

// Enable caching for this route
export const revalidate = 300; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { error: "College slug is required" },
        { status: 400 },
      );
    }

    // Validate slug format
    const slugValidation = collegeProfileServiceEnhanced.validateSlug(slug);
    if (!slugValidation.isValid) {
      return NextResponse.json(
        { error: slugValidation.error || "Invalid slug format" },
        { status: 400 },
      );
    }

    // Use optimized profile fetch with caching
    const { data: college, error } =
      await collegeProfileServiceEnhanced.getProfileOptimized(slug);

    if (error) {
      console.error("Error fetching college profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch college profile" },
        { status: 500 },
      );
    }

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Add cache headers for better performance
    const response = NextResponse.json({ data: college });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    return response;
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
