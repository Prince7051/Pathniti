/**
 * Quiz Questions API
 * Fetches real questions from the quiz_questions table for assessments
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionType = searchParams.get("type");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = createServiceClient();

    // Build query
    let query = supabase
      .from("quiz_questions")
      .select("*")
      .eq("is_active", true)
      .limit(limit);

    // Filter by question type if provided
    if (questionType) {
      query = query.eq("question_type", questionType);
    }

    // Filter by category if provided
    if (category) {
      query = query.eq("category", category);
    }

    // Order by random for variety
    query = query.order("created_at", { ascending: false });

    const { data: questions, error } = await query;

    if (error) {
      console.error("Error fetching quiz questions:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Format questions for frontend
    const formattedQuestions = questions?.map((question: any) => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      category: question.category,
      subcategory: question.subcategory,
      options: question.options, // Already in JSONB format
      correct_answer: question.correct_answer,
      time_limit: question.time_limit,
      scoring_weight: question.scoring_weight,
      difficulty_level: question.difficulty_level
    })) || [];

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length
    });

  } catch (error) {
    console.error("Error in quiz questions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { questionType, count = 10 } = await request.json();

    const supabase = createServiceClient();

    // Get questions for comprehensive assessment
    const questionTypes = questionType ? [questionType] : [
      'aptitude',
      'riasec_interest', 
      'personality',
      'subject_performance'
    ];

    const allQuestions: any[] = [];

    for (const type of questionTypes) {
      const { data: questions, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("question_type", type)
        .eq("is_active", true)
        .limit(Math.ceil(count / questionTypes.length));

      if (error) {
        console.error(`Error fetching ${type} questions:`, error);
        continue;
      }

      if (questions) {
        allQuestions.push(...questions);
      }
    }

    // Shuffle questions for variety
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);

    // Format questions for frontend
    const formattedQuestions = shuffledQuestions.map(question => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      category: question.category,
      subcategory: question.subcategory,
      options: question.options,
      correct_answer: question.correct_answer,
      time_limit: question.time_limit,
      scoring_weight: question.scoring_weight,
      difficulty_level: question.difficulty_level
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length,
      types: questionTypes
    });

  } catch (error) {
    console.error("Error in quiz questions POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
