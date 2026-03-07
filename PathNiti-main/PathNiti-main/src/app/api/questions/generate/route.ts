import { NextRequest, NextResponse } from "next/server";
import { QuestionGenerator } from "@/lib/question-generator";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { grade, subject, count = 10 } = await request.json();

    // Validate input
    if (!grade || !subject) {
      return NextResponse.json(
        { error: "Grade and subject are required" },
        { status: 400 },
      );
    }

    if (![10, 11, 12].includes(grade)) {
      return NextResponse.json(
        { error: "Grade must be 10, 11, or 12" },
        { status: 400 },
      );
    }

    const validSubjects = [
      "mathematics",
      "science",
      "english",
      "social_science",
    ];
    if (!validSubjects.includes(subject)) {
      return NextResponse.json(
        {
          error:
            "Invalid subject. Must be one of: mathematics, science, english, social_science",
        },
        { status: 400 },
      );
    }

    // Generate questions
    const generator = new QuestionGenerator();
    const questions = await generator.generateQuestionsForSubject(
      grade,
      subject,
      count,
    );

    // Validate questions before storing
    const validationResults = questions.map((q) =>
      generator.validateQuestion(q),
    );
    const invalidQuestions = validationResults.filter((r) => !r.isValid);

    if (invalidQuestions.length > 0) {
      console.warn(
        `Found ${invalidQuestions.length} invalid questions:`,
        invalidQuestions,
      );
    }

    // Store only valid questions
    const validQuestions = questions.filter(
      (_, index) => validationResults[index].isValid,
    );

    if (validQuestions.length > 0) {
      await generator.storeQuestions(validQuestions);
    }

    return NextResponse.json({
      success: true,
      generated: questions.length,
      stored: validQuestions.length,
      invalid: invalidQuestions.length,
      questions: validQuestions.map((q) => ({
        question_id: q.question_id,
        grade: q.grade,
        subject: q.subject,
        topic: q.topic,
        question_type: q.question_type,
        difficulty: q.difficulty,
        text: q.text,
        marks: q.marks,
        time_seconds: q.time_seconds,
        tags: q.tags,
        pending_review: q.pending_review,
      })),
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const subject = searchParams.get("subject");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from("questions")
      .select("*")
      .eq("is_active", true)
      .limit(limit);

    if (grade) {
      query = query.eq("grade", parseInt(grade));
    }

    if (subject) {
      query = query.eq("subject", subject);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    const { data: questions, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      questions: questions || [],
      count: questions?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}
