/**
 * Questions API
 * Fetches assessment questions from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'aptitude', 'riasec_interest', 'personality', 'subject_performance'
  const category = searchParams.get("category");
  const limit = searchParams.get("limit") || "10";

  const supabase = createServiceClient();

  try {
    let query = supabase
      .from("quiz_questions")
      .select("*")
      .eq("is_active", true)
      .limit(parseInt(limit));

    if (type) {
      query = query.eq("question_type", type);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error("Error fetching questions:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 },
      );
    }

    // Transform the data to match the expected format
    const transformedQuestions = questions?.map((q: any) => ({
      id: q.id,
      text: q.question_text,
      type: q.question_type,
      category: q.category,
      subcategory: q.subcategory,
      options: q.options,
      correctAnswer: q.correct_answer,
      timeLimit: q.time_limit,
      weight: q.scoring_weight,
    })) || [];

    // Shuffle questions for randomization
    const shuffledQuestions = transformedQuestions.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      questions: shuffledQuestions,
      count: shuffledQuestions.length,
    });
  } catch (error) {
    console.error("Error in questions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
