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

    // Get the latest quiz session (regardless of status)
    const { data: latestSession, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error("Error fetching latest session:", sessionError);
      return NextResponse.json(
        { error: `Failed to fetch assessment data: ${sessionError.message}` },
        { status: 500 },
      );
    }

    if (!latestSession) {
      return NextResponse.json(
        { error: "No quiz sessions found for this user" },
        { status: 404 },
      );
    }

    // Get all responses for this session with question details
    const { data: responses, error: responsesError } = await supabase
      .from("quiz_responses")
      .select(`
        *,
        quiz_questions (
          id,
          question_text,
          options,
          correct_answer,
          category,
          question_type,
          time_limit,
          scoring_weight
        )
      `)
      .eq("session_id", (latestSession as any).id)
      .order("answered_at", { ascending: true });

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      return NextResponse.json(
        { error: "Failed to fetch test responses" },
        { status: 500 },
      );
    }

    // Format the response
    const testData = {
      session: {
        id: (latestSession as any).id,
        completed_at: (latestSession as any).completed_at,
        aptitude_scores: (latestSession as any).aptitude_scores,
        riasec_scores: (latestSession as any).riasec_scores,
        personality_scores: (latestSession as any).personality_scores,
      },
      questions: responses?.map((response: any) => ({
        question_id: response.question_id,
        question_text: response.quiz_questions?.question_text || "Question text not available",
        options: response.quiz_questions?.options || [],
        correct_answer: response.quiz_questions?.correct_answer,
        user_answer: response.user_answer,
        is_correct: response.is_correct,
        time_taken: response.time_taken || 0,
        category: response.quiz_questions?.category || "general",
        question_type: response.quiz_questions?.question_type || "aptitude",
        time_limit: response.quiz_questions?.time_limit || 60,
        scoring_weight: response.quiz_questions?.scoring_weight || 1.0,
        // Provide default values for fields that don't exist in the database
        difficulty_level: "medium", // Default difficulty level
        explanation: "No explanation available for this question.", // Default explanation
        answered_at: response.answered_at,
      })) || [],
      summary: {
        total_questions: responses?.length || 0,
        correct_answers: responses?.filter((r: any) => r.is_correct === true).length || 0,
        incorrect_answers: responses?.filter((r: any) => r.is_correct === false).length || 0,
        unanswered: responses?.filter((r: any) => r.is_correct === null).length || 0,
        average_time_per_question: responses?.length > 0 
          ? responses.reduce((sum: number, r: any) => sum + (r.time_taken || 0), 0) / responses.length 
          : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: testData,
    });
  } catch (error) {
    console.error("Error fetching last test:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
