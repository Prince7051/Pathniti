import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface QuestionTemplate {
  text: string;
  subcategory: string;
  options: string[];
  correct_answer: number;
  difficulty: number;
  time_limit: number;
  scoring_weight: number;
}

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Generate questions based on subject and grade
    const questions = generateAcademicQuestions(grade, subject, count);

    // Insert questions into existing quiz_questions table
    const { data: insertedQuestions, error } = await supabase
      .from("quiz_questions")
      .insert(questions)
      .select();

    if (error) {
      throw new Error(`Failed to insert questions: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      generated: questions.length,
      stored: insertedQuestions?.length || 0,
      questions: insertedQuestions?.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        category: q.category,
        subcategory: q.subcategory,
        options: q.options,
        correct_answer: q.correct_answer,
        difficulty_level: q.difficulty_level,
        time_limit: q.time_limit,
        scoring_weight: q.scoring_weight,
      })),
    });
  } catch (error) {
    console.error("Error generating academic questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}

function generateAcademicQuestions(
  grade: number,
  subject: string,
  count: number,
) {
  const questions = [];

  // Question templates based on subject and grade
  const questionTemplates = getQuestionTemplates(grade, subject);

  for (let i = 0; i < count; i++) {
    const template = questionTemplates[i % questionTemplates.length];
    const question = {
      question_text: template.text,
      question_type: "academic", // New type for academic questions
      category: subject,
      subcategory: template.subcategory,
      options: template.options,
      correct_answer: template.correct_answer,
      difficulty_level: template.difficulty,
      time_limit: template.time_limit,
      scoring_weight: template.scoring_weight,
      is_active: true,
    };
    questions.push(question);
  }

  return questions;
}

function getQuestionTemplates(grade: number, subject: string) {
  const templates = {
    mathematics: {
      10: [
        {
          text: "Solve the quadratic equation x² - 5x + 6 = 0",
          subcategory: "quadratic_equations",
          options: ["x = 2, 3", "x = 1, 6", "x = -2, -3", "x = 0, 5"],
          correct_answer: 0,
          difficulty: 2,
          time_limit: 90,
          scoring_weight: 2.0,
        },
        {
          text: "In a right-angled triangle, if one angle is 30°, what is the measure of the other acute angle?",
          subcategory: "triangles",
          options: ["60°", "45°", "90°", "120°"],
          correct_answer: 0,
          difficulty: 1,
          time_limit: 60,
          scoring_weight: 1.0,
        },
        {
          text: "Find the value of √144 + √81",
          subcategory: "arithmetic",
          options: ["21", "15", "25", "17"],
          correct_answer: 0,
          difficulty: 1,
          time_limit: 45,
          scoring_weight: 1.0,
        },
        {
          text: "If the area of a circle is 154 cm², what is its radius? (π = 22/7)",
          subcategory: "circles",
          options: ["7 cm", "8 cm", "9 cm", "10 cm"],
          correct_answer: 0,
          difficulty: 2,
          time_limit: 90,
          scoring_weight: 2.0,
        },
        {
          text: "What is the HCF of 24 and 36?",
          subcategory: "number_system",
          options: ["6", "12", "8", "4"],
          correct_answer: 1,
          difficulty: 1,
          time_limit: 60,
          scoring_weight: 1.0,
        },
      ],
      11: [
        {
          text: "Find the derivative of x³ + 2x² - 5x + 1",
          subcategory: "calculus",
          options: [
            "3x² + 4x - 5",
            "3x² + 2x - 5",
            "x² + 4x - 5",
            "3x² + 4x + 5",
          ],
          correct_answer: 0,
          difficulty: 2,
          time_limit: 120,
          scoring_weight: 2.0,
        },
        {
          text: "What is the value of sin(30°) + cos(60°)?",
          subcategory: "trigonometry",
          options: ["1", "0.5", "1.5", "0"],
          correct_answer: 0,
          difficulty: 1,
          time_limit: 60,
          scoring_weight: 1.0,
        },
      ],
      12: [
        {
          text: "Find the integral of ∫(2x + 3)dx",
          subcategory: "integration",
          options: ["x² + 3x + C", "2x² + 3x + C", "x² + 3", "2x + 3"],
          correct_answer: 0,
          difficulty: 2,
          time_limit: 90,
          scoring_weight: 2.0,
        },
      ],
    },
    science: {
      10: [
        {
          text: "What is the law of reflection?",
          subcategory: "light",
          options: [
            "Angle of incidence = Angle of reflection",
            "Angle of incidence = 2 × Angle of reflection",
            "Angle of reflection = 2 × Angle of incidence",
            "Both angles are always 90°",
          ],
          correct_answer: 0,
          difficulty: 1,
          time_limit: 60,
          scoring_weight: 1.0,
        },
        {
          text: "A current of 2A flows through a resistor of 5Ω. Calculate the voltage across the resistor.",
          subcategory: "electricity",
          options: ["5V", "10V", "7V", "2.5V"],
          correct_answer: 1,
          difficulty: 2,
          time_limit: 90,
          scoring_weight: 2.0,
        },
        {
          text: "What is the chemical formula of water?",
          subcategory: "chemistry",
          options: ["H2O", "H2O2", "HO", "H3O"],
          correct_answer: 0,
          difficulty: 1,
          time_limit: 30,
          scoring_weight: 1.0,
        },
      ],
    },
    english: {
      10: [
        {
          text: "Choose the correct form: 'The book _____ on the table.'",
          subcategory: "grammar",
          options: ["is lying", "are lying", "is lie", "are lie"],
          correct_answer: 0,
          difficulty: 1,
          time_limit: 45,
          scoring_weight: 1.0,
        },
        {
          text: "What is the synonym of 'abundant'?",
          subcategory: "vocabulary",
          options: ["scarce", "plentiful", "rare", "limited"],
          correct_answer: 1,
          difficulty: 1,
          time_limit: 45,
          scoring_weight: 1.0,
        },
      ],
    },
    social_science: {
      10: [
        {
          text: "Who was the first Prime Minister of India?",
          subcategory: "history",
          options: [
            "Mahatma Gandhi",
            "Jawaharlal Nehru",
            "Sardar Patel",
            "Dr. Rajendra Prasad",
          ],
          correct_answer: 1,
          difficulty: 1,
          time_limit: 45,
          scoring_weight: 1.0,
        },
        {
          text: "What is the capital of Australia?",
          subcategory: "geography",
          options: ["Sydney", "Melbourne", "Canberra", "Perth"],
          correct_answer: 2,
          difficulty: 1,
          time_limit: 45,
          scoring_weight: 1.0,
        },
      ],
    },
  };

  const subjectTemplates = templates[subject as keyof typeof templates];
  if (!subjectTemplates) return [];
  
  return (subjectTemplates as Record<number, QuestionTemplate[]>)[grade] || [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const subject = searchParams.get("subject");
    const type = searchParams.get("type") || "academic";
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from("quiz_questions")
      .select("*")
      .eq("is_active", true)
      .limit(limit);

    if (grade) {
      // For now, we'll filter by category since we don't have grade column
      // In a full implementation, you'd add a grade column
    }

    if (subject) {
      query = query.eq("category", subject);
    }

    if (type) {
      query = query.eq("question_type", type);
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
