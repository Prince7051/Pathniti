import { NextRequest, NextResponse } from "next/server";
import { TestGenerator, TestConfiguration } from "@/lib/test-generator";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const {
      student_id,
      grade,
      test_type = "stream_assessment",
      subjects,
      total_questions,
      time_limit,
      difficulty_distribution,
      question_type_distribution,
    } = await request.json();

    // Validate input
    if (!student_id || !grade) {
      return NextResponse.json(
        { error: "Student ID and grade are required" },
        { status: 400 },
      );
    }

    if (![10, 11, 12].includes(grade)) {
      return NextResponse.json(
        { error: "Grade must be 10, 11, or 12" },
        { status: 400 },
      );
    }

    const validTestTypes = ["stream_assessment", "subject_test", "practice"];
    if (!validTestTypes.includes(test_type)) {
      return NextResponse.json({ error: "Invalid test type" }, { status: 400 });
    }

    // Verify student exists
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: student, error: studentError } = await supabase
      .from("profiles")
      .select("id, grade")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Create test configuration
    const config: TestConfiguration = {
      grade,
      testType: test_type as
        | "stream_assessment"
        | "subject_test"
        | "practice",
      subjects,
      totalQuestions: total_questions,
      timeLimit: time_limit,
      difficultyDistribution: difficulty_distribution,
      questionTypeDistribution: question_type_distribution,
    };

    // Generate test
    const testGenerator = new TestGenerator();
    const test = await testGenerator.generateTest(student_id, config);

    return NextResponse.json({
      success: true,
      test: {
        test_id: test.test_id,
        student_id: test.student_id,
        grade: test.grade,
        test_type: test.test_type,
        total_marks: test.total_marks,
        time_limit_seconds: test.time_limit_seconds,
        difficulty_distribution: test.difficulty_distribution,
        subject_coverage: test.subject_coverage,
        quality_score: test.quality_score,
        created_at: test.created_at,
      },
    });
  } catch (error) {
    console.error("Error generating test:", error);
    return NextResponse.json(
      { error: "Failed to generate test" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get("student_id");
    const test_id = searchParams.get("test_id");
    const status = searchParams.get("status");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase.from("tests").select(`
        *,
        questions:questions(question_id, text, question_type, difficulty, marks, time_seconds)
      `);

    if (student_id) {
      query = query.eq("student_id", student_id);
    }

    if (test_id) {
      query = query.eq("test_id", test_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tests, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      tests: tests || [],
      count: tests?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch tests" },
      { status: 500 },
    );
  }
}
