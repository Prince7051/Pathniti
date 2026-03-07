import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { test_id, student_id, responses } = await request.json();

    // Validate input
    if (!test_id || !student_id || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Test ID, student ID, and responses array are required" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verify test exists and belongs to student
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("*")
      .eq("test_id", test_id)
      .eq("student_id", student_id)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 404 },
      );
    }

    if (test.status === "completed") {
      return NextResponse.json(
        { error: "Test has already been completed" },
        { status: 400 },
      );
    }

    // Process responses
    const responseRecords = [];
    let totalCorrect = 0;
    let totalTime = 0;

    for (const response of responses) {
      const { question_id, answer, response_time_seconds } = response;

      if (!question_id || response_time_seconds === undefined) {
        return NextResponse.json(
          {
            error:
              "Each response must have question_id and response_time_seconds",
          },
          { status: 400 },
        );
      }

      // Get question to check correct answer
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .select("correct_answer")
        .eq("question_id", question_id)
        .single();

      if (questionError || !question) {
        return NextResponse.json(
          { error: `Question ${question_id} not found` },
          { status: 404 },
        );
      }

      // Check if answer is correct
      const isCorrect = checkAnswer(answer, question.correct_answer);
      if (isCorrect) totalCorrect++;

      totalTime += response_time_seconds;

      responseRecords.push({
        test_id,
        student_id,
        question_id,
        answer,
        is_correct: isCorrect,
        response_time_seconds,
      });
    }

    // Store responses in database
    const { error: insertError } = await supabase
      .from("student_responses")
      .insert(responseRecords);

    if (insertError) {
      throw new Error(`Failed to store responses: ${insertError.message}`);
    }

    // Calculate test metrics
    const totalQuestions = responses.length;
    const accuracy = (totalCorrect / totalQuestions) * 100;
    const avgResponseTime = totalTime / totalQuestions;

    const metrics = {
      total_questions: totalQuestions,
      correct_answers: totalCorrect,
      accuracy_percent: Math.round(accuracy * 100) / 100,
      avg_response_time_seconds: Math.round(avgResponseTime * 100) / 100,
      total_time_seconds: totalTime,
    };

    // Update test status and metrics
    const { error: updateError } = await supabase
      .from("tests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        metrics,
      })
      .eq("test_id", test_id);

    if (updateError) {
      throw new Error(`Failed to update test: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      test_id,
      metrics,
      message: "Test submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    return NextResponse.json(
      { error: "Failed to submit test" },
      { status: 500 },
    );
  }
}

// Helper function to check if answer is correct
function checkAnswer(
  studentAnswer: string | number | string[] | number[],
  correctAnswer: string | number | string[] | number[],
): boolean {
  // Handle different answer types
  if (Array.isArray(correctAnswer)) {
    // Multiple correct answers (for multi-select or numerical with multiple solutions)
    if (Array.isArray(studentAnswer)) {
      return (
        JSON.stringify(studentAnswer.sort()) ===
        JSON.stringify(correctAnswer.sort())
      );
    }
    return (correctAnswer as (string | number)[]).includes(studentAnswer as string | number);
  }

  // Single correct answer
  if (typeof correctAnswer === "string" && typeof studentAnswer === "string") {
    return (
      studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    );
  }

  // Exact match for other types
  return studentAnswer === correctAnswer;
}
