import { NextRequest, NextResponse } from "next/server";
import { QuestionGenerator } from "@/lib/question-generator";
import { CollegeMigrationService } from "@/lib/college-migration";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get current user (admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { action } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    const results: Record<
      string,
      { success: boolean; message?: string; error?: string }
    > = {};

    // Execute setup actions
    if (action === "all" || action === "migrate_colleges") {
      try {
        const collegeService = new CollegeMigrationService();
        await collegeService.migrateMockColleges();
        results.colleges = {
          success: true,
          message: "Colleges migrated successfully",
        };
      } catch (error) {
        results.colleges = { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    if (action === "all" || action === "generate_questions") {
      try {
        const questionGenerator = new QuestionGenerator();
        const grades = [10, 11, 12];
        const subjects = [
          "mathematics",
          "science",
          "english",
          "social_science",
        ];

        let totalGenerated = 0;
        for (const grade of grades) {
          for (const subject of subjects) {
            const questions =
              await questionGenerator.generateQuestionsForSubject(
                grade,
                subject,
                20,
              );
            await questionGenerator.storeQuestions(questions);
            totalGenerated += questions.length;
          }
        }

        results.questions = {
          success: true,
          message: `Generated ${totalGenerated} questions across all grades and subjects`,
        };
      } catch (error) {
        results.questions = { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    if (action === "all" || action === "populate_curriculum") {
      try {
        // Populate curriculum topics
        const curriculumTopics = [
          // Grade 10 Mathematics
          {
            grade: 10,
            subject: "mathematics",
            topic: "Real Numbers",
            subtopics: ["Rational Numbers", "Irrational Numbers"],
            learning_objectives: ["Understand real number system"],
            competency_codes: ["MATH_10_REAL_NUMBERS"],
          },
          {
            grade: 10,
            subject: "mathematics",
            topic: "Polynomials",
            subtopics: ["Linear Polynomials", "Quadratic Polynomials"],
            learning_objectives: ["Factorize polynomials"],
            competency_codes: ["MATH_10_POLYNOMIALS"],
          },
          {
            grade: 10,
            subject: "mathematics",
            topic: "Quadratic Equations",
            subtopics: ["Solving by factorization", "Using quadratic formula"],
            learning_objectives: ["Solve quadratic equations"],
            competency_codes: ["MATH_10_QUADRATIC"],
          },

          // Grade 10 Science
          {
            grade: 10,
            subject: "science",
            topic: "Light - Reflection and Refraction",
            subtopics: ["Laws of reflection", "Refraction"],
            learning_objectives: ["Understand light behavior"],
            competency_codes: ["SCI_10_LIGHT"],
          },
          {
            grade: 10,
            subject: "science",
            topic: "Electricity",
            subtopics: ["Current", "Voltage", "Resistance"],
            learning_objectives: ["Understand electrical concepts"],
            competency_codes: ["SCI_10_ELECTRICITY"],
          },

          // Grade 11 Mathematics
          {
            grade: 11,
            subject: "mathematics",
            topic: "Sets",
            subtopics: ["Set operations", "Venn diagrams"],
            learning_objectives: ["Work with sets"],
            competency_codes: ["MATH_11_SETS"],
          },
          {
            grade: 11,
            subject: "mathematics",
            topic: "Relations and Functions",
            subtopics: ["Domain", "Range", "Types of functions"],
            learning_objectives: ["Understand functions"],
            competency_codes: ["MATH_11_FUNCTIONS"],
          },

          // Grade 12 Mathematics
          {
            grade: 12,
            subject: "mathematics",
            topic: "Relations and Functions",
            subtopics: ["Inverse functions", "Composition"],
            learning_objectives: ["Advanced function concepts"],
            competency_codes: ["MATH_12_FUNCTIONS"],
          },
          {
            grade: 12,
            subject: "mathematics",
            topic: "Inverse Trigonometric Functions",
            subtopics: ["Domain restrictions", "Principal values"],
            learning_objectives: ["Work with inverse trig functions"],
            competency_codes: ["MATH_12_INVERSE_TRIG"],
          },
        ];

        const { error: insertError } = await supabase
          .from("curriculum_topics")
          .insert(curriculumTopics);

        if (insertError) {
          throw new Error(
            `Failed to insert curriculum topics: ${insertError.message}`,
          );
        }

        results.curriculum = {
          success: true,
          message: `Populated ${curriculumTopics.length} curriculum topics`,
        };
      } catch (error) {
        results.curriculum = { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    return NextResponse.json({
      success: true,
      message: "System setup completed",
      results,
    });
  } catch (error) {
    console.error("Error setting up system:", error);
    return NextResponse.json(
      { error: "Failed to setup system" },
      { status: 500 },
    );
  }
}
