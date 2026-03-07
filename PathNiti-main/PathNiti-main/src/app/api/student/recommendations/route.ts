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

    // Get latest assessment session with recommendations
    const { data: assessmentSession, error: assessmentError } = await supabase
      .from("assessment_sessions")
      .select(
        `
        *,
        student_recommendations(*)
      `,
      )
      .eq("user_id", user_id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    if (assessmentError) {
      console.error("Error fetching assessment session:", assessmentError);
      return NextResponse.json(
        { error: "No assessment found" },
        { status: 404 },
      );
    }

    // Get the latest recommendations
    const recommendations = (assessmentSession as any).student_recommendations?.[0];

    if (!recommendations) {
      return NextResponse.json(
        { error: "No recommendations found. Please complete an assessment first." },
        { status: 404 },
      );
    }

    // Calculate overall score from aptitude_scores
    let overallScore = 0;
    if ((assessmentSession as any).aptitude_scores) {
      const scores = Object.values(
        (assessmentSession as any).aptitude_scores,
      ) as number[];
      if (scores.length > 0) {
        overallScore = Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length,
        );
      }
    }

    // Format the response with real data
    const response = {
      success: true,
      data: {
        assessment: {
          id: (assessmentSession as { id: string }).id,
          overall_score: overallScore,
          completed_at: (assessmentSession as { completed_at: string }).completed_at,
          aptitude_scores: (assessmentSession as { aptitude_scores: unknown }).aptitude_scores,
          riasec_scores: (assessmentSession as { riasec_scores: unknown }).riasec_scores,
          personality_scores: (assessmentSession as { personality_scores: unknown }).personality_scores,
        },
        recommendations: {
          primary_recommendations: recommendations.primary_recommendations || [],
          secondary_recommendations: recommendations.secondary_recommendations || [],
          backup_options: recommendations.backup_options || [],
          recommended_colleges: recommendations.recommended_colleges || [],
          relevant_scholarships: recommendations.relevant_scholarships || [],
          overall_reasoning: recommendations.overall_reasoning || "AI-powered recommendations based on your assessment results",
          confidence_score: recommendations.confidence_score || 0.85,
          generated_at: recommendations.generated_at || new Date().toISOString(),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching student recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}
