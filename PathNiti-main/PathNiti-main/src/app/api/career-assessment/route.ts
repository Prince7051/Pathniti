/**
 * Career Assessment Generator
 * Creates 30-question assessments with 4 subject categories and randomization
 * Supports both 10th and 12th class students
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

interface AssessmentRequest {
  user_id: string;
  student_class: "10th" | "12th";
  assessment_type?: "career_guidance" | "stream_selection";
}

interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: string;
  category: string;
  subcategory: string;
  options: string[];
  correct_answer: number;
  time_limit: number;
  scoring_weight: number;
  difficulty_level: number;
}

interface AssessmentResponse {
  assessment_id: string;
  user_id: string;
  student_class: "10th" | "12th";
  total_questions: number;
  estimated_time_minutes: number;
  questions: AssessmentQuestion[];
  subject_distribution: {
    science_aptitude: number;
    math_aptitude: number;
    logical_reasoning: number;
    general_knowledge: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AssessmentRequest = await request.json();
    const { user_id, student_class, assessment_type = "career_guidance" } = body;

    if (!user_id || !student_class) {
      return NextResponse.json(
        { error: "User ID and student class are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate 30 questions with specific distribution
    const questions = await generateCareerAssessmentQuestions(student_class, supabase);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for assessment" },
        { status: 404 }
      );
    }

    // Create assessment session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id,
        status: "not_started",
        session_type: assessment_type,
        total_questions: questions.length,
        started_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (sessionError) {
      console.error("Error creating assessment session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create assessment session" },
        { status: 500 }
      );
    }

    // Calculate subject distribution
    const subjectDistribution = calculateSubjectDistribution(questions);

    const response: AssessmentResponse = {
      assessment_id: (session as any).id,
      user_id,
      student_class,
      total_questions: questions.length,
      estimated_time_minutes: Math.ceil(questions.reduce((sum, q) => sum + q.time_limit, 0) / 60),
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        category: q.category,
        subcategory: q.subcategory,
        options: q.options,
        correct_answer: q.correct_answer,
        time_limit: q.time_limit,
        scoring_weight: q.scoring_weight,
        difficulty_level: q.difficulty_level,
      })),
      subject_distribution: subjectDistribution,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating career assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateCareerAssessmentQuestions(
  student_class: "10th" | "12th",
  supabase: any
): Promise<AssessmentQuestion[]> {
  const questions: AssessmentQuestion[] = [];
  
  // Map our required categories to database categories
  const categoryMapping = {
    science_aptitude: ["quantitative_skills", "logical_reasoning"], // Math and logic for science aptitude
    math_aptitude: ["quantitative_skills"], // Pure math questions
    logical_reasoning: ["logical_reasoning"], // Logical reasoning questions
    general_knowledge: ["language_verbal_skills", "memory_attention"], // General knowledge and verbal skills
  };

  // Subject distribution: 5-10 questions from each category (total 30)
  const subjectDistribution = {
    science_aptitude: 8,
    math_aptitude: 8,
    logical_reasoning: 7,
    general_knowledge: 7,
  };

  // Get questions from database for each category
  for (const [category, count] of Object.entries(subjectDistribution)) {
    const dbCategories = categoryMapping[category as keyof typeof categoryMapping];
    const categoryQuestions: any[] = [];

    // Try to get questions from each mapped database category
    for (const dbCategory of dbCategories) {
      const { data: existingQuestions, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("category", dbCategory)
        .eq("is_active", true)
        .eq("question_type", "aptitude") // Only get aptitude questions for career assessment
        .limit(count);

      if (error) {
        console.error(`Error fetching ${dbCategory} questions:`, error);
        continue;
      }

      if (existingQuestions && existingQuestions.length > 0) {
        categoryQuestions.push(...existingQuestions);
      }
    }

    if (categoryQuestions.length > 0) {
      // Shuffle and take required number
      const shuffled = shuffleArray(categoryQuestions);
      const selectedQuestions = shuffled.slice(0, count);
      questions.push(...selectedQuestions.map(convertToAssessmentQuestion));
    } else {
      // Fallback: Generate new questions if none exist in database
      console.warn(`No questions found for ${category}, using fallback questions`);
      const generatedQuestions = generateQuestionsForCategory(category, count, student_class);
      questions.push(...generatedQuestions);
    }
  }

  // If we don't have enough questions, fill with any available aptitude questions
  if (questions.length < 30) {
    const { data: fallbackQuestions, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("question_type", "aptitude")
      .eq("is_active", true)
      .limit(50);

    if (!error && fallbackQuestions && fallbackQuestions.length > 0) {
      const shuffled = shuffleArray(fallbackQuestions);
      const needed = 30 - questions.length;
      const additionalQuestions = shuffled.slice(0, needed);
      questions.push(...additionalQuestions.map(convertToAssessmentQuestion));
    }
  }

  // Shuffle all questions to randomize order
  return shuffleArray(questions);
}

function generateQuestionsForCategory(
  category: string,
  count: number,
  student_class: "10th" | "12th"
): AssessmentQuestion[] {
  const questionTemplates = getQuestionTemplates(category, student_class);
  const questions: AssessmentQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const template = questionTemplates[i % questionTemplates.length];
    const question: AssessmentQuestion = {
      id: `generated_${category}_${i}_${Date.now()}`,
      question_text: template.text,
      question_type: "career_assessment",
      category: category,
      subcategory: template.subcategory,
      options: template.options,
      correct_answer: template.correct_answer,
      time_limit: template.time_limit,
      scoring_weight: template.scoring_weight,
      difficulty_level: template.difficulty,
    };
    questions.push(question);
  }

  return questions;
}

function getQuestionTemplates(category: string, student_class: "10th" | "12th") {
  const templates: Record<string, any[]> = {
    science_aptitude: [
      {
        text: "What is the chemical symbol for Gold?",
        subcategory: "chemistry_basics",
        options: ["Au", "Ag", "Go", "Gd"],
        correct_answer: 0,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "Which gas makes up most of Earth's atmosphere?",
        subcategory: "environmental_science",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the speed of light in vacuum?",
        subcategory: "physics_basics",
        options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
        correct_answer: 0,
        time_limit: 45,
        scoring_weight: 1.5,
        difficulty: 2,
      },
      {
        text: "Which organelle is known as the powerhouse of the cell?",
        subcategory: "biology_basics",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the pH of pure water?",
        subcategory: "chemistry_basics",
        options: ["6", "7", "8", "9"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "Which force keeps planets in orbit around the sun?",
        subcategory: "physics_basics",
        options: ["Magnetic force", "Gravitational force", "Electric force", "Nuclear force"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the process by which plants make their food?",
        subcategory: "biology_basics",
        options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "Which element has the atomic number 1?",
        subcategory: "chemistry_basics",
        options: ["Helium", "Hydrogen", "Lithium", "Carbon"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
    ],
    math_aptitude: [
      {
        text: "What is 15% of 200?",
        subcategory: "percentage",
        options: ["25", "30", "35", "40"],
        correct_answer: 1,
        time_limit: 45,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "If x + 5 = 12, what is the value of x?",
        subcategory: "algebra",
        options: ["6", "7", "8", "9"],
        correct_answer: 1,
        time_limit: 45,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the area of a circle with radius 7 cm? (π = 22/7)",
        subcategory: "geometry",
        options: ["154 cm²", "44 cm²", "88 cm²", "22 cm²"],
        correct_answer: 0,
        time_limit: 60,
        scoring_weight: 1.5,
        difficulty: 2,
      },
      {
        text: "What is the next number in the sequence: 2, 4, 8, 16, ?",
        subcategory: "number_sequences",
        options: ["24", "32", "20", "28"],
        correct_answer: 1,
        time_limit: 45,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "If a train travels 120 km in 2 hours, what is its speed?",
        subcategory: "word_problems",
        options: ["50 km/h", "60 km/h", "70 km/h", "80 km/h"],
        correct_answer: 1,
        time_limit: 60,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the value of 3² + 4²?",
        subcategory: "arithmetic",
        options: ["25", "49", "7", "12"],
        correct_answer: 0,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "If the ratio of boys to girls in a class is 3:2 and there are 30 students, how many boys are there?",
        subcategory: "ratio_proportion",
        options: ["12", "15", "18", "20"],
        correct_answer: 2,
        time_limit: 60,
        scoring_weight: 1.5,
        difficulty: 2,
      },
      {
        text: "What is the square root of 144?",
        subcategory: "arithmetic",
        options: ["11", "12", "13", "14"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
    ],
    logical_reasoning: [
      {
        text: "If all roses are flowers and some flowers are red, which statement is definitely true?",
        subcategory: "logical_deduction",
        options: [
          "All roses are red",
          "Some roses are red",
          "All red things are roses",
          "Some red things are flowers"
        ],
        correct_answer: 3,
        time_limit: 60,
        scoring_weight: 1.5,
        difficulty: 2,
      },
      {
        text: "Complete the pattern: A, C, E, G, ?",
        subcategory: "pattern_recognition",
        options: ["H", "I", "J", "K"],
        correct_answer: 1,
        time_limit: 45,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "If Monday is the 1st, what day of the week is the 15th?",
        subcategory: "calendar_reasoning",
        options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        correct_answer: 0,
        time_limit: 60,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "Which word does not belong: Apple, Orange, Banana, Carrot?",
        subcategory: "classification",
        options: ["Apple", "Orange", "Banana", "Carrot"],
        correct_answer: 3,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "If PENCIL is coded as 123456, how is PEN coded?",
        subcategory: "coding_decoding",
        options: ["123", "124", "125", "126"],
        correct_answer: 0,
        time_limit: 60,
        scoring_weight: 1.5,
        difficulty: 2,
      },
      {
        text: "What comes next: 1, 1, 2, 3, 5, 8, ?",
        subcategory: "number_sequences",
        options: ["11", "12", "13", "14"],
        correct_answer: 2,
        time_limit: 60,
        scoring_weight: 1.5,
        difficulty: 2,
      },
      {
        text: "If you're facing north and turn 90 degrees clockwise, which direction are you facing?",
        subcategory: "direction_sense",
        options: ["North", "South", "East", "West"],
        correct_answer: 2,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
    ],
    general_knowledge: [
      {
        text: "Who is known as the 'Father of the Nation' in India?",
        subcategory: "indian_history",
        options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Subhash Chandra Bose", "Bhagat Singh"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the capital of Australia?",
        subcategory: "world_geography",
        options: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correct_answer: 2,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "Which is the largest planet in our solar system?",
        subcategory: "astronomy",
        options: ["Earth", "Saturn", "Jupiter", "Neptune"],
        correct_answer: 2,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "Who wrote the book 'Wings of Fire'?",
        subcategory: "literature",
        options: ["A.P.J. Abdul Kalam", "R.K. Narayan", "Ruskin Bond", "Chetan Bhagat"],
        correct_answer: 0,
        time_limit: 45,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the currency of Japan?",
        subcategory: "world_economics",
        options: ["Won", "Yuan", "Yen", "Dong"],
        correct_answer: 2,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "Which sport is associated with Wimbledon?",
        subcategory: "sports",
        options: ["Football", "Tennis", "Cricket", "Badminton"],
        correct_answer: 1,
        time_limit: 30,
        scoring_weight: 1.0,
        difficulty: 1,
      },
      {
        text: "What is the full form of NASA?",
        subcategory: "science_technology",
        options: [
          "National Aeronautics and Space Administration",
          "National Aerospace and Space Agency",
          "National Aeronautics and Space Agency",
          "National Aerospace and Space Administration"
        ],
        correct_answer: 0,
        time_limit: 45,
        scoring_weight: 1.0,
        difficulty: 1,
      },
    ],
  };

  return templates[category] || [];
}

function convertToAssessmentQuestion(dbQuestion: any): AssessmentQuestion {
  // Map database category to our assessment category
  const categoryMapping: Record<string, string> = {
    'quantitative_skills': 'math_aptitude',
    'logical_reasoning': 'logical_reasoning', 
    'language_verbal_skills': 'general_knowledge',
    'memory_attention': 'general_knowledge',
    'spatial_visual_skills': 'science_aptitude',
  };

  const mappedCategory = categoryMapping[dbQuestion.category] || 'general_knowledge';

  return {
    id: dbQuestion.id,
    question_text: dbQuestion.question_text,
    question_type: "career_assessment",
    category: mappedCategory,
    subcategory: dbQuestion.subcategory || dbQuestion.category,
    options: Array.isArray(dbQuestion.options) ? dbQuestion.options : [],
    correct_answer: dbQuestion.correct_answer || 0,
    time_limit: dbQuestion.time_limit || 60,
    scoring_weight: dbQuestion.scoring_weight || 1.0,
    difficulty_level: dbQuestion.difficulty_level || 1,
  };
}

function calculateSubjectDistribution(questions: AssessmentQuestion[]) {
  const distribution = {
    science_aptitude: 0,
    math_aptitude: 0,
    logical_reasoning: 0,
    general_knowledge: 0,
  };

  questions.forEach(question => {
    if (question.category in distribution) {
      (distribution as any)[question.category]++;
    }
  });

  return distribution;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
