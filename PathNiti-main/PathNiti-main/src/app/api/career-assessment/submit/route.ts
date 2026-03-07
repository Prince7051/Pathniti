/**
 * Career Assessment Submission
 * Handles submission of career assessment responses and generates recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

interface AssessmentSubmissionRequest {
  assessment_id: string;
  user_id: string;
  responses: Array<{
    question_id: string;
    selected_answer: number;
    time_taken: number;
    category: string;
  }>;
  total_time_seconds: number;
}

interface AssessmentSubmissionResponse {
  success: boolean;
  assessment_id: string;
  performance_summary: {
    total_questions: number;
    answered_questions: number;
    correct_answers: number;
    accuracy_percentage: number;
    average_time_per_question: number;
    subject_breakdown: {
      science_aptitude: { correct: number; total: number; accuracy: number };
      math_aptitude: { correct: number; total: number; accuracy: number };
      logical_reasoning: { correct: number; total: number; accuracy: number };
      general_knowledge: { correct: number; total: number; accuracy: number };
    };
  };
  recommendation_ready: boolean;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AssessmentSubmissionRequest = await request.json();
    const { assessment_id, user_id, responses, total_time_seconds } = body;

    if (!assessment_id || !user_id || !responses || !total_time_seconds) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify assessment session exists
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("id", assessment_id)
      .eq("user_id", user_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Assessment session not found" },
        { status: 404 }
      );
    }

    // Get questions to validate answers
    const questionIds = responses.map(r => r.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*")
      .in("id", questionIds);

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: "Questions not found" },
        { status: 404 }
      );
    }

    // Create a map for quick question lookup
    const questionMap = new Map((questions as any[]).map(q => [q.id, q]));

    // Process responses and calculate performance
    const processedResponses = responses.map(response => {
      const question = questionMap.get(response.question_id);
      const is_correct = question ? response.selected_answer === question.correct_answer : false;
      
      return {
        session_id: assessment_id,
        question_id: response.question_id,
        user_answer: response.selected_answer,
        time_taken: response.time_taken,
        is_correct,
        answered_at: new Date().toISOString(),
      };
    });

    // Store responses in database
    const { error: responsesError } = await supabase
      .from("assessment_responses")
      .insert(processedResponses as any);

    if (responsesError) {
      console.error("Error storing responses:", responsesError);
      return NextResponse.json(
        { error: "Failed to store responses" },
        { status: 500 }
      );
    }

    // Calculate performance metrics
    const performanceSummary = calculatePerformanceSummary(
      responses,
      questions,
      total_time_seconds
    );

    // Update assessment session
    const { error: updateError } = await (supabase as any)
      .from("assessment_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        answered_questions: responses.length,
        time_spent: total_time_seconds,
        total_score: performanceSummary.accuracy_percentage,
      })
      .eq("id", assessment_id);

    if (updateError) {
      console.error("Error updating session:", updateError);
    }

    const response: AssessmentSubmissionResponse = {
      success: true,
      assessment_id,
      performance_summary: performanceSummary,
      recommendation_ready: true,
      message: "Assessment completed successfully. You can now view your career recommendations.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculatePerformanceSummary(
  responses: AssessmentSubmissionRequest['responses'],
  questions: any[],
  totalTimeSeconds: number
) {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  
  let correctAnswers = 0;
  const subjectBreakdown = {
    science_aptitude: { correct: 0, total: 0, accuracy: 0 },
    math_aptitude: { correct: 0, total: 0, accuracy: 0 },
    logical_reasoning: { correct: 0, total: 0, accuracy: 0 },
    general_knowledge: { correct: 0, total: 0, accuracy: 0 },
  };

  responses.forEach(response => {
    const question = questionMap.get(response.question_id);
    if (question) {
      const isCorrect = response.selected_answer === question.correct_answer;
      if (isCorrect) {
        correctAnswers++;
      }

      // Update subject breakdown
      const category = response.category as keyof typeof subjectBreakdown;
      if (category in subjectBreakdown) {
        subjectBreakdown[category].total++;
        if (isCorrect) {
          subjectBreakdown[category].correct++;
        }
      }
    }
  });

  // Calculate accuracy percentages for each subject
  Object.keys(subjectBreakdown).forEach(category => {
    const subject = subjectBreakdown[category as keyof typeof subjectBreakdown];
    subject.accuracy = subject.total > 0 ? (subject.correct / subject.total) * 100 : 0;
  });

  const accuracyPercentage = responses.length > 0 ? (correctAnswers / responses.length) * 100 : 0;
  const averageTimePerQuestion = responses.length > 0 ? totalTimeSeconds / responses.length : 0;

  return {
    total_questions: questions.length,
    answered_questions: responses.length,
    correct_answers: correctAnswers,
    accuracy_percentage: Math.round(accuracyPercentage * 100) / 100,
    average_time_per_question: Math.round(averageTimePerQuestion * 100) / 100,
    subject_breakdown: subjectBreakdown,
  };
}
