/**
 * Student Career Recommendation System
 * Implements class-specific career recommendations for 10th and 12th students
 * with 30-question assessment and AI-powered predictions
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enhancedAIEngine, EnhancedUserProfile } from "@/lib/enhanced-ai-engine";

interface CareerRecommendationRequest {
  user_id: string;
  student_class: "10th" | "12th";
  assessment_data: {
    aptitude_scores: {
      logical_reasoning: number;
      quantitative_skills: number;
      language_verbal_skills: number;
      spatial_visual_skills: number;
      memory_attention: number;
    };
    riasec_scores: {
      realistic: number;
      investigative: number;
      artistic: number;
      social: number;
      enterprising: number;
      conventional: number;
    };
    personality_scores: {
      introvert_extrovert: number;
      risk_taking_vs_risk_averse: number;
      structured_vs_flexible: number;
      leadership_vs_supportive: number;
    };
    subject_performance: {
      science_aptitude: { accuracy: number; speed: number };
      math_aptitude: { accuracy: number; speed: number };
      logical_reasoning: { accuracy: number; speed: number };
      general_knowledge: { accuracy: number; speed: number };
    };
    practical_constraints: {
      location: string;
      financial_background: string;
      parental_expectation: string;
    };
  };
  test_performance: {
    total_questions: number;
    answered_questions: number;
    correct_answers: number;
    total_time_seconds: number;
    responses: Array<{
      question_id: string;
      selected_answer: number;
      time_taken: number;
      is_correct: boolean;
      category: string;
    }>;
  };
}

interface CareerRecommendationResponse {
  student_class: "10th" | "12th";
  recommended_path: Array<{
    stream_or_course: string;
    reasoning: string;
    career_opportunities: string[];
    confidence_score: number;
    time_to_earn: string;
    average_salary: string;
    job_demand_trend: string;
  }>;
  test_performance: {
    accuracy: number;
    speed: number;
    weighted_score: number;
    subject_breakdown: {
      science_aptitude: { accuracy: number; speed: number; score: number };
      math_aptitude: { accuracy: number; speed: number; score: number };
      logical_reasoning: { accuracy: number; speed: number; score: number };
      general_knowledge: { accuracy: number; speed: number; score: number };
    };
  };
  ai_insights: {
    strengths: string[];
    areas_for_improvement: string[];
    overall_assessment: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CareerRecommendationRequest = await request.json();
    const { user_id, student_class, assessment_data, test_performance } = body;

    if (!user_id || !student_class || !assessment_data || !test_performance) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(test_performance);
    
    // Create enhanced user profile
    const enhancedProfile: EnhancedUserProfile = {
      user_id,
      basic_info: {
        age: (profile as any).age || 16,
        class_level: student_class,
        current_stream: (profile as any).stream || null,
        location: {
          state: (profile as any).state || assessment_data.practical_constraints.location,
          city: (profile as any).city,
          district: (profile as any).district,
        },
      },
      assessment_results: {
        aptitude_scores: assessment_data.aptitude_scores,
        riasec_scores: assessment_data.riasec_scores,
        personality_scores: assessment_data.personality_scores,
        subject_performance: assessment_data.subject_performance as any,
        practical_constraints: assessment_data.practical_constraints,
      },
      timestamp: new Date().toISOString(),
    };

    // Generate recommendations based on class level
    const recommendations = await generateClassSpecificRecommendations(
      student_class,
      enhancedProfile,
      performanceMetrics
    );

    // Store recommendation session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id,
        status: "completed",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        aptitude_scores: assessment_data.aptitude_scores,
        riasec_scores: assessment_data.riasec_scores,
        personality_scores: assessment_data.personality_scores,
        subject_performance: assessment_data.subject_performance,
        practical_constraints: assessment_data.practical_constraints,
        total_score: performanceMetrics.weighted_score,
        total_questions: test_performance.total_questions,
        answered_questions: test_performance.answered_questions,
        time_spent: test_performance.total_time_seconds,
        session_type: "career_recommendation",
      } as any)
      .select()
      .single();

    if (sessionError) {
      console.error("Error creating assessment session:", sessionError);
    }

    // Store student recommendations
    if (session) {
      await supabase
        .from("student_recommendations")
        .insert({
          user_id,
          session_id: (session as any).id,
          primary_recommendations: recommendations.recommended_path,
          overall_reasoning: recommendations.ai_insights.overall_assessment,
          recommendation_confidence: recommendations.recommended_path[0]?.confidence_score || 0.5,
          ai_model_used: "enhanced-ai-engine",
        } as any);
    }

    const response: CareerRecommendationResponse = {
      student_class,
      recommended_path: recommendations.recommended_path,
      test_performance: performanceMetrics,
      ai_insights: recommendations.ai_insights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in career recommendation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculatePerformanceMetrics(test_performance: CareerRecommendationRequest['test_performance']) {
  const accuracy = (test_performance.correct_answers / test_performance.answered_questions) * 100;
  const speed = test_performance.total_time_seconds / test_performance.answered_questions;
  const weighted_score = (accuracy * 0.7) + ((100 - Math.min(speed, 100)) * 0.3);

  // Calculate subject-wise performance
  const subjectBreakdown = {
    science_aptitude: { accuracy: 0, speed: 0, score: 0 },
    math_aptitude: { accuracy: 0, speed: 0, score: 0 },
    logical_reasoning: { accuracy: 0, speed: 0, score: 0 },
    general_knowledge: { accuracy: 0, speed: 0, score: 0 },
  };

  // Group responses by category
  const categoryStats: Record<string, { correct: number; total: number; totalTime: number }> = {};
  
  test_performance.responses.forEach(response => {
    if (!categoryStats[response.category]) {
      categoryStats[response.category] = { correct: 0, total: 0, totalTime: 0 };
    }
    categoryStats[response.category].total++;
    categoryStats[response.category].totalTime += response.time_taken;
    if (response.is_correct) {
      categoryStats[response.category].correct++;
    }
  });

  // Calculate subject-wise metrics
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const categoryAccuracy = (stats.correct / stats.total) * 100;
    const categorySpeed = stats.totalTime / stats.total;
    const categoryScore = (categoryAccuracy * 0.7) + ((100 - Math.min(categorySpeed, 100)) * 0.3);

    if (category in subjectBreakdown) {
      (subjectBreakdown as any)[category] = {
        accuracy: categoryAccuracy,
        speed: categorySpeed,
        score: categoryScore,
      };
    }
  });

  return {
    accuracy,
    speed,
    weighted_score,
    subject_breakdown: subjectBreakdown,
  };
}

async function generateClassSpecificRecommendations(
  student_class: "10th" | "12th",
  userProfile: EnhancedUserProfile,
  performanceMetrics: any
) {
  // Get base recommendations from enhanced AI engine
  const baseRecommendations = await enhancedAIEngine.generateComprehensiveRecommendations(userProfile);

  // Use the AI engine's recommendations instead of hardcoded ones
  const primaryRec = baseRecommendations.primary_recommendations[0];
  const secondaryRecs = baseRecommendations.secondary_recommendations.slice(0, 2);

  if (!primaryRec) {
    // Fallback to hardcoded if no AI recommendations
    if (student_class === "10th") {
      return generate10thClassRecommendations(baseRecommendations, performanceMetrics);
    } else {
      return generate12thClassRecommendations(baseRecommendations, performanceMetrics);
    }
  }

  // Convert AI recommendations to the expected format
  const recommended_path = [
    {
      stream_or_course: primaryRec.stream.charAt(0).toUpperCase() + primaryRec.stream.slice(1) + " Stream",
      reasoning: primaryRec.reasoning,
      career_opportunities: getCareerOpportunitiesForStream(primaryRec.stream),
      confidence_score: primaryRec.confidence_score,
      time_to_earn: primaryRec.time_to_earn,
      average_salary: primaryRec.average_salary,
      job_demand_trend: primaryRec.job_demand_trend,
    },
    ...secondaryRecs.map(rec => ({
      stream_or_course: rec.stream.charAt(0).toUpperCase() + rec.stream.slice(1) + " Stream",
      reasoning: rec.reasoning,
      career_opportunities: getCareerOpportunitiesForStream(rec.stream),
      confidence_score: rec.confidence_score,
      time_to_earn: rec.time_to_earn,
      average_salary: rec.average_salary,
      job_demand_trend: rec.job_demand_trend,
    }))
  ];

  return {
    recommended_path,
    ai_insights: {
      strengths: extractStrengthsFromRecommendations(baseRecommendations),
      areas_for_improvement: extractAreasForImprovement(baseRecommendations),
      overall_assessment: baseRecommendations.overall_reasoning,
    }
  };
}

function getCareerOpportunitiesForStream(stream: string): string[] {
  const careerMap: Record<string, string[]> = {
    science: [
      "Engineering (B.Tech in various specializations)",
      "Medical (MBBS, BDS, Pharmacy)",
      "Pure Sciences (B.Sc in Physics, Chemistry, Biology)",
      "Research and Development",
      "Data Science and Analytics"
    ],
    engineering: [
      "Software Engineer",
      "Mechanical Engineer", 
      "Civil Engineer",
      "Data Scientist",
      "AI/ML Engineer"
    ],
    medical: [
      "General Practitioner",
      "Specialist Doctor",
      "Surgeon",
      "Medical Researcher",
      "Public Health Professional"
    ],
    commerce: [
      "Chartered Accountant",
      "Financial Analyst",
      "Business Analyst",
      "Investment Banker",
      "Banking Professional"
    ],
    arts: [
      "Civil Services (IAS, IPS, IFS)",
      "Journalism and Mass Communication",
      "Law (LLB)",
      "Psychology and Social Work",
      "Literature and Languages"
    ],
    vocational: [
      "Technical Trades",
      "Digital Marketing",
      "Hospitality",
      "Healthcare Support",
      "Entrepreneurship"
    ]
  };
  
  return careerMap[stream] || ["Various career opportunities available"];
}

function extractStrengthsFromRecommendations(recommendations: any): string[] {
  const strengths: string[] = [];
  
  if (recommendations.primary_recommendations?.[0]) {
    const primary = recommendations.primary_recommendations[0];
    if (primary.confidence_score > 0.8) {
      strengths.push("Strong aptitude in your recommended field");
    }
    if (primary.job_demand_trend === "very_high") {
      strengths.push("Excellent job market prospects");
    }
  }
  
  // Add more dynamic strengths based on assessment data
  strengths.push("Good analytical thinking abilities");
  strengths.push("Strong foundation in core subjects");
  
  return strengths;
}

function extractAreasForImprovement(recommendations: any): string[] {
  const areas: string[] = [];
  
  if (recommendations.primary_recommendations?.[0]) {
    const primary = recommendations.primary_recommendations[0];
    if (primary.confidence_score < 0.7) {
      areas.push("Consider strengthening skills in your chosen field");
    }
  }
  
  // Add general improvement areas
  areas.push("Develop practical application skills");
  areas.push("Gain exposure to different career fields");
  areas.push("Enhance communication and soft skills");
  
  return areas;
}

function generate10thClassRecommendations(baseRecommendations: any, performanceMetrics: any) {
  // For 10th class, recommend academic streams
  const streamRecommendations = [
    {
      stream_or_course: "Science Stream",
      reasoning: "Strong performance in science and mathematics indicates aptitude for scientific fields. Your analytical thinking and problem-solving skills align well with science subjects.",
      career_opportunities: [
        "Engineering (B.Tech in various specializations)",
        "Medical (MBBS, BDS, Pharmacy)",
        "Pure Sciences (B.Sc in Physics, Chemistry, Biology)",
        "Research and Development",
        "Data Science and Analytics"
      ],
      confidence_score: 0.85,
      time_to_earn: "4-6 years",
      average_salary: "6-25 LPA",
      job_demand_trend: "very_high"
    },
    {
      stream_or_course: "Commerce Stream",
      reasoning: "Good quantitative skills and logical reasoning suggest potential in business and finance. Your structured approach to problem-solving is valuable in commerce.",
      career_opportunities: [
        "Chartered Accountancy (CA)",
        "Company Secretary (CS)",
        "Business Administration (BBA, MBA)",
        "Banking and Finance",
        "Investment Banking"
      ],
      confidence_score: 0.75,
      time_to_earn: "4-5 years",
      average_salary: "5-20 LPA",
      job_demand_trend: "high"
    },
    {
      stream_or_course: "Arts/Humanities Stream",
      reasoning: "Strong language skills and general knowledge indicate potential in humanities. Your communication abilities and broad perspective are assets in arts fields.",
      career_opportunities: [
        "Civil Services (IAS, IPS, IFS)",
        "Journalism and Mass Communication",
        "Law (LLB)",
        "Psychology and Social Work",
        "Literature and Languages"
      ],
      confidence_score: 0.70,
      time_to_earn: "3-6 years",
      average_salary: "4-15 LPA",
      job_demand_trend: "medium"
    }
  ];

  // Sort by confidence score
  streamRecommendations.sort((a, b) => b.confidence_score - a.confidence_score);

  return {
    recommended_path: streamRecommendations,
    ai_insights: {
      strengths: [
        "Strong analytical thinking",
        "Good problem-solving abilities",
        "Solid foundation in core subjects"
      ],
      areas_for_improvement: [
        "Consider exploring more practical applications",
        "Develop communication skills further",
        "Gain exposure to different career fields"
      ],
      overall_assessment: "You show strong potential across multiple streams. Focus on your interests and long-term career goals when choosing your path."
    }
  };
}

function generate12thClassRecommendations(baseRecommendations: any, performanceMetrics: any) {
  // For 12th class, recommend specific courses
  const courseRecommendations = [
    {
      stream_or_course: "B.Tech Computer Science",
      reasoning: "Excellent performance in mathematics and logical reasoning, combined with strong analytical skills, makes you well-suited for computer science engineering.",
      career_opportunities: [
        "Software Engineer",
        "Data Scientist",
        "AI/ML Engineer",
        "Cybersecurity Specialist",
        "Product Manager"
      ],
      confidence_score: 0.90,
      time_to_earn: "4 years",
      average_salary: "8-30 LPA",
      job_demand_trend: "very_high"
    },
    {
      stream_or_course: "MBBS (Medicine)",
      reasoning: "Strong performance in science subjects and good memory retention indicate aptitude for medical studies. Your attention to detail is crucial for medical practice.",
      career_opportunities: [
        "General Practitioner",
        "Specialist Doctor",
        "Surgeon",
        "Medical Researcher",
        "Public Health Professional"
      ],
      confidence_score: 0.85,
      time_to_earn: "5.5 years",
      average_salary: "10-50 LPA",
      job_demand_trend: "very_high"
    },
    {
      stream_or_course: "B.Com + CA",
      reasoning: "Good quantitative skills and logical reasoning suggest potential in commerce and accounting. Your structured approach is valuable in financial fields.",
      career_opportunities: [
        "Chartered Accountant",
        "Financial Analyst",
        "Tax Consultant",
        "Audit Manager",
        "Investment Advisor"
      ],
      confidence_score: 0.80,
      time_to_earn: "4-5 years",
      average_salary: "6-25 LPA",
      job_demand_trend: "high"
    },
    {
      stream_or_course: "B.A. + Civil Services",
      reasoning: "Strong general knowledge and language skills indicate potential for civil services. Your broad perspective and communication abilities are assets in public service.",
      career_opportunities: [
        "Indian Administrative Service (IAS)",
        "Indian Police Service (IPS)",
        "Indian Foreign Service (IFS)",
        "State Civil Services",
        "Public Policy Analyst"
      ],
      confidence_score: 0.75,
      time_to_earn: "4-6 years",
      average_salary: "7-20 LPA",
      job_demand_trend: "high"
    }
  ];

  // Sort by confidence score
  courseRecommendations.sort((a, b) => b.confidence_score - a.confidence_score);

  return {
    recommended_path: courseRecommendations,
    ai_insights: {
      strengths: [
        "Strong academic foundation",
        "Good analytical and logical reasoning",
        "Well-rounded subject knowledge"
      ],
      areas_for_improvement: [
        "Consider gaining practical experience in your field of interest",
        "Develop soft skills and leadership qualities",
        "Stay updated with current industry trends"
      ],
      overall_assessment: "You have excellent potential for higher education and professional success. Choose a course that aligns with your interests and career aspirations."
    }
  };
}
