/**
 * Admin endpoint to populate career assessment questions
 * This adds additional questions specifically for the career assessment system
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const CAREER_ASSESSMENT_QUESTIONS = [
  // Science Aptitude Questions (mapped to quantitative_skills and logical_reasoning)
  {
    question_text: "What is the chemical symbol for Gold?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "chemistry_basics",
    options: ["Au", "Ag", "Go", "Gd"],
    correct_answer: 0,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "Which gas makes up most of Earth's atmosphere?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "environmental_science",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the speed of light in vacuum?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "physics_basics",
    options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
    correct_answer: 0,
    time_limit: 45,
    scoring_weight: 1.5,
    difficulty_level: 2,
  },
  {
    question_text: "Which organelle is known as the powerhouse of the cell?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "biology_basics",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the pH of pure water?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "chemistry_basics",
    options: ["6", "7", "8", "9"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "Which force keeps planets in orbit around the sun?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "physics_basics",
    options: ["Magnetic force", "Gravitational force", "Electric force", "Nuclear force"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the process by which plants make their food?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "biology_basics",
    options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "Which element has the atomic number 1?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "chemistry_basics",
    options: ["Helium", "Hydrogen", "Lithium", "Carbon"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  // Math Aptitude Questions
  {
    question_text: "What is 15% of 200?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "percentage",
    options: ["25", "30", "35", "40"],
    correct_answer: 1,
    time_limit: 45,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "If x + 5 = 12, what is the value of x?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "algebra",
    options: ["6", "7", "8", "9"],
    correct_answer: 1,
    time_limit: 45,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the area of a circle with radius 7 cm? (π = 22/7)",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "geometry",
    options: ["154 cm²", "44 cm²", "88 cm²", "22 cm²"],
    correct_answer: 0,
    time_limit: 60,
    scoring_weight: 1.5,
    difficulty_level: 2,
  },
  {
    question_text: "What is the next number in the sequence: 2, 4, 8, 16, ?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "number_sequences",
    options: ["24", "32", "20", "28"],
    correct_answer: 1,
    time_limit: 45,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "If a train travels 120 km in 2 hours, what is its speed?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "word_problems",
    options: ["50 km/h", "60 km/h", "70 km/h", "80 km/h"],
    correct_answer: 1,
    time_limit: 60,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the value of 3² + 4²?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "arithmetic",
    options: ["25", "49", "7", "12"],
    correct_answer: 0,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "If the ratio of boys to girls in a class is 3:2 and there are 30 students, how many boys are there?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "ratio_proportion",
    options: ["12", "15", "18", "20"],
    correct_answer: 2,
    time_limit: 60,
    scoring_weight: 1.5,
    difficulty_level: 2,
  },
  {
    question_text: "What is the square root of 144?",
    question_type: "aptitude",
    category: "quantitative_skills",
    subcategory: "arithmetic",
    options: ["11", "12", "13", "14"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  // Logical Reasoning Questions
  {
    question_text: "If all roses are flowers and some flowers are red, which statement is definitely true?",
    question_type: "aptitude",
    category: "logical_reasoning",
    subcategory: "logical_deduction",
    options: ["All roses are red", "Some roses are red", "All red things are roses", "Some red things are flowers"],
    correct_answer: 3,
    time_limit: 60,
    scoring_weight: 1.5,
    difficulty_level: 2,
  },
  {
    question_text: "Complete the pattern: A, C, E, G, ?",
    question_type: "aptitude",
    category: "logical_reasoning",
    subcategory: "pattern_recognition",
    options: ["H", "I", "J", "K"],
    correct_answer: 1,
    time_limit: 45,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "If Monday is the 1st, what day of the week is the 15th?",
    question_type: "aptitude",
    category: "logical_reasoning",
    subcategory: "calendar_reasoning",
    options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    correct_answer: 0,
    time_limit: 60,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "Which word does not belong: Apple, Orange, Banana, Carrot?",
    question_type: "aptitude",
    category: "logical_reasoning",
    subcategory: "classification",
    options: ["Apple", "Orange", "Banana", "Carrot"],
    correct_answer: 3,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "If PENCIL is coded as 123456, how is PEN coded?",
    question_type: "aptitude",
    category: "logical_reasoning",
    subcategory: "coding_decoding",
    options: ["123", "124", "125", "126"],
    correct_answer: 0,
    time_limit: 60,
    scoring_weight: 1.5,
    difficulty_level: 2,
  },
  {
    question_text: "What comes next: 1, 1, 2, 3, 5, 8, ?",
    question_type: "aptitude",
    category: "logical_reasoning",
    subcategory: "number_sequences",
    options: ["11", "12", "13", "14"],
    correct_answer: 2,
    time_limit: 60,
    scoring_weight: 1.5,
    difficulty_level: 2,
  },
  {
    question_text: "If you're facing north and turn 90 degrees clockwise, which direction are you facing?",
    question_type: "aptitude",
    category: "logical_reasoning",
    subcategory: "direction_sense",
    options: ["North", "South", "East", "West"],
    correct_answer: 2,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  // General Knowledge Questions (mapped to language_verbal_skills and memory_attention)
  {
    question_text: "Who is known as the 'Father of the Nation' in India?",
    question_type: "aptitude",
    category: "language_verbal_skills",
    subcategory: "indian_history",
    options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Subhash Chandra Bose", "Bhagat Singh"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the capital of Australia?",
    question_type: "aptitude",
    category: "language_verbal_skills",
    subcategory: "world_geography",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correct_answer: 2,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "Which is the largest planet in our solar system?",
    question_type: "aptitude",
    category: "language_verbal_skills",
    subcategory: "astronomy",
    options: ["Earth", "Saturn", "Jupiter", "Neptune"],
    correct_answer: 2,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "Who wrote the book 'Wings of Fire'?",
    question_type: "aptitude",
    category: "language_verbal_skills",
    subcategory: "literature",
    options: ["A.P.J. Abdul Kalam", "R.K. Narayan", "Ruskin Bond", "Chetan Bhagat"],
    correct_answer: 0,
    time_limit: 45,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the currency of Japan?",
    question_type: "aptitude",
    category: "language_verbal_skills",
    subcategory: "world_economics",
    options: ["Won", "Yuan", "Yen", "Dong"],
    correct_answer: 2,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "Which sport is associated with Wimbledon?",
    question_type: "aptitude",
    category: "language_verbal_skills",
    subcategory: "sports",
    options: ["Football", "Tennis", "Cricket", "Badminton"],
    correct_answer: 1,
    time_limit: 30,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
  {
    question_text: "What is the full form of NASA?",
    question_type: "aptitude",
    category: "language_verbal_skills",
    subcategory: "science_technology",
    options: ["National Aeronautics and Space Administration", "National Aerospace and Space Agency", "National Aeronautics and Space Agency", "National Aerospace and Space Administration"],
    correct_answer: 0,
    time_limit: 45,
    scoring_weight: 1.0,
    difficulty_level: 1,
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Check if questions already exist to avoid duplicates
    const { data: existingQuestions, error: checkError } = await supabase
      .from("quiz_questions")
      .select("question_text")
      .eq("question_type", "aptitude");

    if (checkError) {
      console.error("Error checking existing questions:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing questions" },
        { status: 500 }
      );
    }

    const existingTexts = new Set((existingQuestions as any[])?.map(q => q.question_text) || []);
    
    // Filter out questions that already exist
    const newQuestions = CAREER_ASSESSMENT_QUESTIONS.filter(
      q => !existingTexts.has(q.question_text)
    );

    if (newQuestions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All career assessment questions already exist in database",
        added: 0,
        total: CAREER_ASSESSMENT_QUESTIONS.length,
      });
    }

    // Insert new questions
    const { data: insertedQuestions, error: insertError } = await supabase
      .from("quiz_questions")
      .insert(newQuestions as any)
      .select();

    if (insertError) {
      console.error("Error inserting questions:", insertError);
      return NextResponse.json(
        { error: "Failed to insert questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${newQuestions.length} new career assessment questions`,
      added: newQuestions.length,
      total: CAREER_ASSESSMENT_QUESTIONS.length,
      questions: (insertedQuestions as any[])?.map(q => ({
        id: q.id,
        question_text: q.question_text,
        category: q.category,
      })),
    });
  } catch (error) {
    console.error("Error populating career assessment questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get count of aptitude questions by category
    const { data: questions, error } = await supabase
      .from("quiz_questions")
      .select("category")
      .eq("question_type", "aptitude")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching questions:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    const categoryCounts = (questions as any[])?.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      success: true,
      total_aptitude_questions: questions?.length || 0,
      category_breakdown: categoryCounts,
      available_for_career_assessment: {
        quantitative_skills: categoryCounts.quantitative_skills || 0,
        logical_reasoning: categoryCounts.logical_reasoning || 0,
        language_verbal_skills: categoryCounts.language_verbal_skills || 0,
        memory_attention: categoryCounts.memory_attention || 0,
        spatial_visual_skills: categoryCounts.spatial_visual_skills || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
