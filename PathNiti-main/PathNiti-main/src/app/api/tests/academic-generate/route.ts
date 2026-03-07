import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface TestQuestion {
  id: string;
  question_text: string;
  question_type: string;
  category: string;
  subcategory: string;
  options: string[];
  time_limit: number;
  scoring_weight: number;
  difficulty_level: number;
}

export async function POST(request: NextRequest) {
  try {
    const {
      student_id,
      grade,
      subjects = ["mathematics", "science", "english", "social_science"],
      // total_questions = 20, // Unused variable
      test_type = "stream_assessment",
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Generate test questions (temporarily disabled)
    // const testQuestions = await generateTestQuestions(
    //   grade,
    //   subjects,
    //   total_questions,
    //   supabase,
    // );
    const testQuestions: unknown[] = []; // Temporary placeholder

    if (testQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for the specified criteria" },
        { status: 404 },
      );
    }

    // Create assessment session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .insert([
        {
          user_id: student_id,
          status: "not_started",
          session_type: test_type,
          total_questions: testQuestions.length,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (sessionError) {
      throw new Error(
        `Failed to create assessment session: ${sessionError.message}`,
      );
    }

    // Calculate test metrics (temporarily disabled)
    const totalMarks = 0;
    const totalTime = 0;

    return NextResponse.json({
      success: true,
      test: {
        session_id: session.id,
        student_id: student_id,
        student_name: `${student.first_name} ${student.last_name}`,
        grade: grade,
        test_type: test_type,
        total_questions: testQuestions.length,
        total_marks: totalMarks,
        estimated_time_minutes: Math.ceil(totalTime / 60),
        subjects: subjects,
        questions: (testQuestions as TestQuestion[]).map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          category: q.category,
          subcategory: q.subcategory,
          options: q.options,
          time_limit: q.time_limit,
          scoring_weight: q.scoring_weight,
          difficulty_level: q.difficulty_level,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating academic test:", error);
    return NextResponse.json(
      { error: "Failed to generate test" },
      { status: 500 },
    );
  }
}

// async function generateTestQuestions(
//   grade: number,
//   subjects: string[],
//   totalQuestions: number,
//   supabase: {
//     from: (table: string) => {
//       select: (columns: string) => {
//         eq: (
//           column: string,
//           value: string | number,
//         ) => Promise<{ data: unknown; error: unknown }>;
//       };
//     };
//   },
// ) {
//   const questionsPerSubject = Math.floor(totalQuestions / subjects.length);
//   const remainingQuestions = totalQuestions % subjects.length;
//   const allQuestions = [];

//   for (let i = 0; i < subjects.length; i++) {
//     const subject = subjects[i];
//     const questionCount =
//       questionsPerSubject + (i < remainingQuestions ? 1 : 0);

//     // Get questions for this subject
//     const { data: subjectQuestions, error } = await supabase
//       .from("quiz_questions")
//       .select("*")
//       .eq("category", subject)
//       .eq("is_active", true)
//       .limit(questionCount);

//     if (error) {
//       console.error(`Error fetching questions for ${subject}:`, error);
//       continue;
//     }

//     if (subjectQuestions && subjectQuestions.length > 0) {
//       allQuestions.push(...subjectQuestions);
//     } else {
//       // If no questions exist, generate some
//       console.log(`No questions found for ${subject}, generating...`);
//       await generateQuestionsForSubject(
//         grade,
//         subject,
//         questionCount,
//         supabase,
//       );

//       // Try to fetch again
//       const { data: newQuestions } = await supabase
//         .from("quiz_questions")
//         .select("*")
//         .eq("category", subject)
//         .eq("is_active", true)
//         .limit(questionCount);

//       if (newQuestions) {
//         allQuestions.push(...newQuestions);
//       }
//     }
//   }

//   // Shuffle questions to randomize order
//   return shuffleArray(allQuestions);
// }

// async function generateQuestionsForSubject(
//   grade: number,
//   subject: string,
//   count: number,
//   supabase: {
//     from: (table: string) => {
//       select: (columns: string) => {
//         eq: (
//           column: string,
//           value: string | number,
//         ) => Promise<{ data: unknown; error: unknown }>;
//       };
//     };
//   },
// ) {
//   // Generate questions using the academic generation logic
//   const questions = generateAcademicQuestions(grade, subject, count);

//   if (questions.length > 0) {
//     const { error } = await (supabase as any).from("quiz_questions").insert(questions);

//     if (error) {
//       console.error(`Error inserting questions for ${subject}:`, error);
//     }
//   }
// }

// function generateAcademicQuestions(
//   grade: number,
//   subject: string,
//   count: number,
// ) {
//   const questions = [];
//   const questionTemplates = getQuestionTemplates(grade, subject);

//   for (let i = 0; i < count; i++) {
//     const template = questionTemplates[i % questionTemplates.length];
//     const question = {
//       question_text: template.text,
//       question_type: "academic",
//       category: subject,
//       subcategory: template.subcategory,
//       options: template.options,
//       correct_answer: template.correct_answer,
//       difficulty_level: template.difficulty,
//       time_limit: template.time_limit,
//       scoring_weight: template.scoring_weight,
//       is_active: true,
//     };
//     questions.push(question);
//   }

//   return questions;
// }

// function getQuestionTemplates(grade: number, subject: string) {
//   const templates = {
//     mathematics: {
//       10: [
//         {
//           text: "Solve the quadratic equation x² - 5x + 6 = 0",
//           subcategory: "quadratic_equations",
//           options: ["x = 2, 3", "x = 1, 6", "x = -2, -3", "x = 0, 5"],
//           correct_answer: 0,
//           difficulty: 2,
//           time_limit: 90,
//           scoring_weight: 2.0,
//         },
//         {
//           text: "In a right-angled triangle, if one angle is 30°, what is the measure of the other acute angle?",
//           subcategory: "triangles",
//           options: ["60°", "45°", "90°", "120°"],
//           correct_answer: 0,
//           difficulty: 1,
//           time_limit: 60,
//           scoring_weight: 1.0,
//         },
//         {
//           text: "Find the value of √144 + √81",
//           subcategory: "arithmetic",
//           options: ["21", "15", "25", "17"],
//           correct_answer: 0,
//           difficulty: 1,
//           time_limit: 45,
//           scoring_weight: 1.0,
//         },
//       ],
//     },
//     science: {
//       10: [
//         {
//           text: "What is the law of reflection?",
//           subcategory: "light",
//           options: [
//             "Angle of incidence = Angle of reflection",
//             "Angle of incidence = 2 × Angle of reflection",
//             "Angle of reflection = 2 × Angle of incidence",
//             "Both angles are always 90°",
//           ],
//           correct_answer: 0,
//           difficulty: 1,
//           time_limit: 60,
//           scoring_weight: 1.0,
//         },
//         {
//           text: "A current of 2A flows through a resistor of 5Ω. Calculate the voltage across the resistor.",
//           subcategory: "electricity",
//           options: ["5V", "10V", "7V", "2.5V"],
//           correct_answer: 1,
//           difficulty: 2,
//           time_limit: 90,
//           scoring_weight: 2.0,
//         },
//       ],
//     },
//     english: {
//       10: [
//         {
//           text: "Choose the correct form: 'The book _____ on the table.'",
//           subcategory: "grammar",
//           options: ["is lying", "are lying", "is lie", "are lie"],
//           correct_answer: 0,
//           difficulty: 1,
//           time_limit: 45,
//           scoring_weight: 1.0,
//         },
//       ],
//     },
//     social_science: {
//       10: [
//         {
//           text: "Who was the first Prime Minister of India?",
//           subcategory: "history",
//           options: [
//             "Mahatma Gandhi",
//             "Jawaharlal Nehru",
//             "Sardar Patel",
//             "Dr. Rajendra Prasad",
//           ],
//           correct_answer: 1,
//           difficulty: 1,
//           time_limit: 45,
//           scoring_weight: 1.0,
//         },
//       ],
//     },
//   };

//   return (
//     templates[subject as keyof typeof templates]?.[
//       grade as keyof (typeof templates)[typeof subject]
//     ] || []
//   );
// }

// function shuffleArray<T>(array: T[]): T[] {
//   const shuffled = [...array];
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
//   return shuffled;
// }
