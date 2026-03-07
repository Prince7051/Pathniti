/**
 * Enhanced AI-driven Career Recommendation Engine
 * Implements comprehensive assessment with RIASEC interests, aptitude, personality, and practical constraints
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import {
  AptitudeScores,
  RIASECScores,
  PersonalityScores,
  SubjectPerformance,
  PracticalConstraints,
  StreamRecommendation,
  CollegeRecommendation,
  ScholarshipRecommendation,
  BackupOption,
} from "./types";

// Enhanced user profile for comprehensive assessment
export interface EnhancedUserProfile {
  user_id: string;
  basic_info: {
    age?: number;
    class_level?: string;
    current_stream?: string;
    location?: {
      state?: string;
      city?: string;
      district?: string;
    };
  };
  assessment_results: {
    aptitude_scores: AptitudeScores;
    riasec_scores: RIASECScores;
    personality_scores: PersonalityScores;
    subject_performance: SubjectPerformance;
    practical_constraints: PracticalConstraints;
  };
  timestamp: string;
}

export interface ComprehensiveRecommendationResult {
  primary_recommendations: StreamRecommendation[];
  secondary_recommendations: StreamRecommendation[];
  backup_options: BackupOption[];
  colleges: CollegeRecommendation[];
  scholarships: ScholarshipRecommendation[];
  overall_reasoning: string;
  confidence_score: number;
}

// Career data with enhanced information
const ENHANCED_CAREER_DATA = [
  {
    stream: "engineering",
    careers: [
      {
        title: "Software Engineer",
        time_to_earn: "4-5 years",
        average_salary: "6-25 LPA",
        job_demand_trend: "very_high",
        required_aptitudes: ["logical_reasoning", "quantitative_skills"],
        riasec_match: ["investigative", "realistic"],
        personality_match: ["structured"],
        subjects: ["math", "science"],
      },
      {
        title: "Civil Engineer",
        time_to_earn: "4-6 years",
        average_salary: "4-15 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["spatial_visual_skills", "quantitative_skills"],
        riasec_match: ["realistic", "investigative"],
        personality_match: ["structured", "leadership"],
        subjects: ["math", "science"],
      },
    ],
  },
  {
    stream: "medical",
    careers: [
      {
        title: "Doctor (MBBS)",
        time_to_earn: "5.5-11 years",
        average_salary: "8-50 LPA",
        job_demand_trend: "very_high",
        required_aptitudes: ["memory_attention", "language_verbal_skills"],
        riasec_match: ["social", "investigative"],
        personality_match: ["leadership", "supportive"],
        subjects: ["science"],
      },
      {
        title: "Pharmacist",
        time_to_earn: "4-6 years",
        average_salary: "3-12 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["memory_attention", "logical_reasoning"],
        riasec_match: ["investigative", "social"],
        personality_match: ["structured"],
        subjects: ["science"],
      },
    ],
  },
  {
    stream: "commerce",
    careers: [
      {
        title: "Chartered Accountant",
        time_to_earn: "4-5 years",
        average_salary: "6-30 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["quantitative_skills", "logical_reasoning"],
        riasec_match: ["conventional", "enterprising"],
        personality_match: ["structured"],
        subjects: ["math"],
      },
      {
        title: "Investment Banker",
        time_to_earn: "4-6 years",
        average_salary: "8-40 LPA",
        job_demand_trend: "medium",
        required_aptitudes: ["quantitative_skills", "language_verbal_skills"],
        riasec_match: ["enterprising", "conventional"],
        personality_match: ["risk_taking", "leadership"],
        subjects: ["math", "english"],
      },
      {
        title: "Business Analyst",
        time_to_earn: "3-5 years",
        average_salary: "5-20 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["logical_reasoning", "language_verbal_skills"],
        riasec_match: ["conventional", "investigative"],
        personality_match: ["structured"],
        subjects: ["math", "english"],
      },
      {
        title: "Financial Advisor",
        time_to_earn: "3-4 years",
        average_salary: "4-15 LPA",
        job_demand_trend: "growing",
        required_aptitudes: ["quantitative_skills", "language_verbal_skills"],
        riasec_match: ["social", "conventional"],
        personality_match: ["supportive"],
        subjects: ["math", "english"],
      },
    ],
  },
  {
    stream: "arts",
    careers: [
      {
        title: "Architect",
        time_to_earn: "5-6 years",
        average_salary: "6-25 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["spatial_visual_skills", "quantitative_skills"],
        riasec_match: ["artistic", "realistic"],
        personality_match: ["structured", "leadership"],
        subjects: ["math", "science"],
      },
      {
        title: "Graphic Designer",
        time_to_earn: "3-4 years",
        average_salary: "3-12 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["spatial_visual_skills"],
        riasec_match: ["artistic"],
        personality_match: ["flexible"],
        subjects: ["english"],
      },
      {
        title: "Interior Designer",
        time_to_earn: "3-4 years",
        average_salary: "4-15 LPA",
        job_demand_trend: "medium",
        required_aptitudes: ["spatial_visual_skills"],
        riasec_match: ["artistic", "realistic"],
        personality_match: ["structured"],
        subjects: ["math"],
      },
      {
        title: "Civil Services (IAS/IPS)",
        time_to_earn: "4-6 years",
        average_salary: "7-20 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["language_verbal_skills", "memory_attention"],
        riasec_match: ["social", "enterprising"],
        personality_match: ["leadership"],
        subjects: ["social_science", "english", "general_knowledge"],
      },
      {
        title: "Journalist",
        time_to_earn: "3-4 years",
        average_salary: "3-15 LPA",
        job_demand_trend: "medium",
        required_aptitudes: ["language_verbal_skills"],
        riasec_match: ["artistic", "social"],
        personality_match: ["flexible", "risk_taking"],
        subjects: ["english", "social_science"],
      },
    ],
  },
  {
    stream: "science",
    careers: [
      {
        title: "Research Scientist",
        time_to_earn: "6-10 years",
        average_salary: "5-25 LPA",
        job_demand_trend: "growing",
        required_aptitudes: ["logical_reasoning", "memory_attention"],
        riasec_match: ["investigative"],
        personality_match: ["structured"],
        subjects: ["science", "math"],
      },
      {
        title: "Data Scientist",
        time_to_earn: "4-6 years",
        average_salary: "8-30 LPA",
        job_demand_trend: "very_high",
        required_aptitudes: ["logical_reasoning", "quantitative_skills"],
        riasec_match: ["investigative", "conventional"],
        personality_match: ["structured"],
        subjects: ["math", "science"],
      },
      {
        title: "Environmental Scientist",
        time_to_earn: "4-6 years",
        average_salary: "4-15 LPA",
        job_demand_trend: "growing",
        required_aptitudes: ["logical_reasoning", "memory_attention"],
        riasec_match: ["investigative", "realistic"],
        personality_match: ["structured"],
        subjects: ["science", "math"],
      },
      {
        title: "Biotechnologist",
        time_to_earn: "4-6 years",
        average_salary: "5-20 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["logical_reasoning", "memory_attention"],
        riasec_match: ["investigative"],
        personality_match: ["structured"],
        subjects: ["science", "math"],
      },
    ],
  },
  {
    stream: "vocational",
    careers: [
      {
        title: "Electrician",
        time_to_earn: "2-3 years",
        average_salary: "3-12 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["spatial_visual_skills", "logical_reasoning"],
        riasec_match: ["realistic", "conventional"],
        personality_match: ["structured"],
        subjects: ["science", "math"],
      },
      {
        title: "Automotive Technician",
        time_to_earn: "2-3 years",
        average_salary: "3-10 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["spatial_visual_skills", "logical_reasoning"],
        riasec_match: ["realistic", "investigative"],
        personality_match: ["structured"],
        subjects: ["science", "math"],
      },
      {
        title: "Chef",
        time_to_earn: "2-4 years",
        average_salary: "3-15 LPA",
        job_demand_trend: "growing",
        required_aptitudes: ["spatial_visual_skills"],
        riasec_match: ["artistic", "realistic"],
        personality_match: ["flexible"],
        subjects: ["science"],
      },
      {
        title: "Plumber",
        time_to_earn: "2-3 years",
        average_salary: "3-10 LPA",
        job_demand_trend: "high",
        required_aptitudes: ["spatial_visual_skills", "logical_reasoning"],
        riasec_match: ["realistic", "conventional"],
        personality_match: ["structured"],
        subjects: ["science", "math"],
      },
    ],
  },
];

export class EnhancedAIRecommendationEngine {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("=== AI ENGINE INITIALIZATION ===");
    console.log("API Key available:", !!apiKey);
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        },
      });
      console.log("AI Engine initialized successfully");
    } else {
      console.log("AI Engine initialized without API key - will use fallback recommendations");
    }
  }

  /**
   * Generate comprehensive career recommendations based on multidimensional assessment
   */
  async generateComprehensiveRecommendations(
    userProfile: EnhancedUserProfile,
  ): Promise<ComprehensiveRecommendationResult> {
    console.log("=== AI ENGINE RECOMMENDATION GENERATION ===");
    console.log("Model available:", !!this.model);
    try {
      // Calculate base recommendations using scoring algorithm
      const baseRecommendations =
        this.calculateMultidimensionalScores(userProfile);

      // Enhance with AI if available
      if (this.model) {
        console.log("Using AI enhancement");
        return await this.enhanceWithAI(userProfile, baseRecommendations);
      }

      console.log("Using basic recommendations (no AI model)");
      return this.formatBasicRecommendations(userProfile, baseRecommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      // Fallback to basic algorithm
      const baseRecommendations =
        this.calculateMultidimensionalScores(userProfile);
      return this.formatBasicRecommendations(userProfile, baseRecommendations);
    }
  }

  /**
   * Calculate scores using multidimensional assessment data
   */
  private calculateMultidimensionalScores(userProfile: EnhancedUserProfile) {
    const {
      aptitude_scores,
      riasec_scores,
      personality_scores,
      subject_performance,
      practical_constraints,
    } = userProfile.assessment_results;

    console.log("=== AI ENGINE DEBUG ===");
    console.log("User Profile:", userProfile);
    console.log("Aptitude Scores:", aptitude_scores);
    console.log("RIASEC Scores:", riasec_scores);
    console.log("Personality Scores:", personality_scores);
    console.log("Subject Performance:", subject_performance);
    console.log("Practical Constraints:", practical_constraints);
    const streamScores: Record<
      string,
      { score: number; reasons: string[]; careers: Array<{ title: string; score: number; [key: string]: unknown }> }
    > = {};

    for (const streamData of ENHANCED_CAREER_DATA) {
      const stream = streamData.stream;
      let totalScore = 0;
      const reasons: string[] = [];
      const matchingCareers = [];

      for (const career of streamData.careers) {
        let careerScore = 0;

        // Aptitude matching (60% weight) - with stronger differentiation
        let aptitudeMatchCount = 0;
        const totalRequiredAptitudes = career.required_aptitudes.length;
        let hasWeakRequiredSkill = false;
        let strongAptitudeCount = 0;
        
        for (const aptitude of career.required_aptitudes) {
          const aptitudeScore =
            aptitude_scores[aptitude as keyof AptitudeScores] || 0;
          
        // More strict aptitude scoring - only reward strong matches
        if (aptitudeScore > 0.7) {
          careerScore += aptitudeScore * 0.7; // Strong aptitude gets good score
          aptitudeMatchCount++;
          strongAptitudeCount++;
          reasons.push(
            `Your excellent ${aptitude.replace("_", " ")} skills make ${career.title} ideal`,
          );
        } else if (aptitudeScore > 0.5) {
          // Good aptitude gets moderate score
          careerScore += aptitudeScore * 0.3;
          aptitudeMatchCount++;
          reasons.push(
            `Your strong ${aptitude.replace("_", " ")} skills align well with ${career.title}`,
          );
        } else if (aptitudeScore > 0.3) {
          // Moderate aptitude gets minimal score
          careerScore += aptitudeScore * 0.1;
          aptitudeMatchCount++;
          reasons.push(
            `Your ${aptitude.replace("_", " ")} skills are suitable for ${career.title}`,
          );
        } else {
          // Weak aptitude gets very strong penalty
          careerScore -= 1.2; // Much stronger penalty for weak required skill
          hasWeakRequiredSkill = true;
          reasons.push(
            `Your ${aptitude.replace("_", " ")} skills may limit success in ${career.title}`,
          );
        }
        }
        
        // Only give bonus if ALL required aptitudes are strong
        if (aptitudeMatchCount === totalRequiredAptitudes && strongAptitudeCount === totalRequiredAptitudes) {
          careerScore += 0.8; // Strong bonus for perfect match
        } else if (aptitudeMatchCount === totalRequiredAptitudes && strongAptitudeCount > 0) {
          careerScore += 0.3; // Moderate bonus for good match
        }
        
        // Very strong penalty if any required skill is weak
        if (hasWeakRequiredSkill) {
          careerScore -= 1.5; // Much stronger penalty
        }
        
        // Special bonus for careers that match user's strongest skills
        const spatialScore = aptitude_scores.spatial_visual_skills || 0;
        const quantitativeScore = aptitude_scores.quantitative_skills || 0;
        
        if (spatialScore > 0.8 && career.required_aptitudes.includes('spatial_visual_skills')) {
          careerScore += 0.3; // Bonus for matching strongest skill
          reasons.push(`Excellent spatial skills make ${career.title} ideal`);
        }
        
        if (quantitativeScore > 0.6 && career.required_aptitudes.includes('quantitative_skills')) {
          careerScore += 0.2; // Bonus for matching good skill
        }

        // RIASEC interest matching (35% weight) - increased from 25%
        for (const interest of career.riasec_match) {
          const interestScore =
            riasec_scores[interest as keyof RIASECScores] || 0;
          careerScore += interestScore * 0.35;
          if (interestScore > 0.5) { // Lowered threshold from 0.7
            reasons.push(`Your ${interest} interests align well with ${career.title}`);
          }
        }

        // Personality matching (25% weight) - increased from 20%
        for (const trait of career.personality_match) {
          const personalityScore = this.getPersonalityScore(
            personality_scores,
            trait,
          );
          careerScore += personalityScore * 0.25;
          if (personalityScore > 0.5) { // Lowered threshold from 0.7
            reasons.push(`${trait} personality trait suits ${career.title}`);
          }
        }

        // Subject performance matching (20% weight)
        for (const subject of career.subjects) {
          const subjectScore = this.getSubjectScore(
            subject_performance,
            subject,
          );
          careerScore += subjectScore * 0.2;
          if (subjectScore > 0.7) {
            reasons.push(
              `Strong performance in ${subject} supports ${career.title}`,
            );
          }
        }

        // Job demand and practical considerations (5% weight)
        const demandMultiplier = this.getDemandMultiplier(
          career.job_demand_trend,
        );
        careerScore *= demandMultiplier;

        if (careerScore > 2.0) {
          // Higher threshold for viable career match - only strong matches
          matchingCareers.push({
            ...career,
            score: careerScore,
          });
        }

        totalScore += careerScore;
      }

      // Apply practical constraints
      totalScore = this.applyPracticalConstraints(
        totalScore,
        stream,
        practical_constraints,
        reasons,
      );

      // Calculate average score - handle NaN values
      const averageScore = isNaN(totalScore) ? 0 : totalScore / streamData.careers.length;
      
      streamScores[stream] = {
        score: isNaN(averageScore) ? 0 : averageScore, // Ensure no NaN values
        reasons: Array.from(new Set(reasons)), // Remove duplicates
        careers: matchingCareers.sort((a, b) => b.score - a.score),
      };
    }

    console.log("Final stream scores:", streamScores);
    console.log("=== DETAILED SCORE BREAKDOWN ===");
    Object.entries(streamScores).forEach(([stream, data]) => {
      console.log(`${stream}: score=${data.score.toFixed(2)}, reasons=${data.reasons.length}, careers=${data.careers.length}`);
      console.log(`  Top reasons: ${data.reasons.slice(0, 2).join(", ")}`);
    });
    return streamScores;
  }

  private getPersonalityScore(
    personality: PersonalityScores,
    trait: string,
  ): number {
    switch (trait) {
      case "structured":
        return 1 - personality.structured_vs_flexible; // Lower = more structured
      case "flexible":
        return personality.structured_vs_flexible; // Higher = more flexible
      case "leadership":
        return personality.leadership_vs_supportive; // Higher = more leadership
      case "supportive":
        return 1 - personality.leadership_vs_supportive; // Lower = more supportive
      case "risk_taking":
        return personality.risk_taking_vs_risk_averse; // Higher = more risk taking
      case "risk_averse":
        return 1 - personality.risk_taking_vs_risk_averse; // Lower = more risk averse
      default:
        return 0.5;
    }
  }

  private getSubjectScore(
    subjects: SubjectPerformance,
    subject: string,
  ): number {
    const subjectData = subjects[subject as keyof SubjectPerformance];
    if (!subjectData) return 0;

    // Combine accuracy and speed (70% accuracy, 30% speed)
    return subjectData.accuracy * 0.7 + subjectData.speed * 0.3;
  }

  private getDemandMultiplier(demand: string): number {
    switch (demand) {
      case "very_high":
        return 1.2;
      case "high":
        return 1.1;
      case "growing":
        return 1.15;
      case "medium":
        return 1.0;
      case "declining":
        return 0.8;
      default:
        return 1.0;
    }
  }

  private applyPracticalConstraints(
    score: number,
    stream: string,
    constraints: PracticalConstraints,
    reasons: string[],
  ): number {
    let adjustedScore = score;

    // Financial background considerations
    if (constraints.financial_background === "low") {
      if (["medical", "engineering"].includes(stream)) {
        adjustedScore *= 0.8; // Higher cost streams get penalty
        reasons.push("Consider financial constraints for professional courses");
      } else {
        adjustedScore *= 1.1; // Boost other streams
        reasons.push("Financially accessible career path");
      }
    }

    // Parental expectations
    if (constraints.parental_expectation === "doctor" && stream === "medical") {
      adjustedScore *= 1.2;
      reasons.push("Aligns with family expectations");
    } else if (
      constraints.parental_expectation === "engineer" &&
      stream === "engineering"
    ) {
      adjustedScore *= 1.2;
      reasons.push("Aligns with family expectations");
    }

    return adjustedScore;
  }

  /**
   * Enhance recommendations with AI analysis
   */
  private async enhanceWithAI(
    userProfile: EnhancedUserProfile,
    baseRecommendations: Record<string, unknown>,
  ): Promise<ComprehensiveRecommendationResult> {
    const prompt = this.buildAIPrompt(userProfile, baseRecommendations);

    try {
      if (!this.model) {
        throw new Error('AI model not initialized');
      }
      const result = await this.model.generateContent(prompt);
      if (!result || typeof result !== 'object' || !('response' in result)) {
        throw new Error('Failed to generate content from AI model');
      }
      const response = (result as { response: { text: () => string } }).response;
      const aiAnalysis = response.text();

      return this.parseAIResponse(aiAnalysis, baseRecommendations);
    } catch (error) {
      console.error("AI enhancement failed:", error);
      return this.formatBasicRecommendations(userProfile, baseRecommendations);
    }
  }

  private buildAIPrompt(
    userProfile: EnhancedUserProfile,
    baseRecommendations: Record<string, unknown>,
  ): string {
    const {
      aptitude_scores,
      riasec_scores,
      personality_scores,
      practical_constraints,
    } = userProfile.assessment_results;

    return `
You are an expert career counselor analyzing a comprehensive student assessment. Please provide detailed career recommendations.

STUDENT PROFILE:
- Age: ${userProfile.basic_info.age}
- Class Level: ${userProfile.basic_info.class_level}
- Location: ${userProfile.basic_info.location?.state}, ${userProfile.basic_info.location?.city}

APTITUDE SCORES (0-1 scale):
- Logical Reasoning: ${aptitude_scores.logical_reasoning}
- Quantitative Skills: ${aptitude_scores.quantitative_skills}
- Language/Verbal Skills: ${aptitude_scores.language_verbal_skills}
- Spatial/Visual Skills: ${aptitude_scores.spatial_visual_skills}
- Memory/Attention: ${aptitude_scores.memory_attention}

RIASEC INTERESTS (0-1 scale):
- Realistic: ${riasec_scores.realistic}
- Investigative: ${riasec_scores.investigative}
- Artistic: ${riasec_scores.artistic}
- Social: ${riasec_scores.social}
- Enterprising: ${riasec_scores.enterprising}
- Conventional: ${riasec_scores.conventional}

PERSONALITY TRAITS (0-1 scale):
- Introvert/Extrovert: ${personality_scores.introvert_extrovert}
- Risk Taking/Risk Averse: ${personality_scores.risk_taking_vs_risk_averse}
- Structured/Flexible: ${personality_scores.structured_vs_flexible}
- Leadership/Supportive: ${personality_scores.leadership_vs_supportive}

PRACTICAL CONSTRAINTS:
- Location: ${practical_constraints.location}
- Financial Background: ${practical_constraints.financial_background}
- Parental Expectation: ${practical_constraints.parental_expectation}

CALCULATED STREAM SCORES:
${Object.entries(baseRecommendations)
  .map(
    ([stream, data]: [string, unknown]) =>
      `${stream}: ${typeof data === 'object' && data !== null && 'score' in data ? (data as { score: number }).score.toFixed(2) : '0.00'} (${typeof data === 'object' && data !== null && 'reasons' in data ? (data as { reasons: string[] }).reasons.slice(0, 2).join(", ") : 'N/A'})`,
  )
  .join("\n")}

Please provide:
1. Top 3 primary stream recommendations with detailed reasoning
2. 2-3 secondary alternatives
3. 2-3 backup options for exam failure scenarios
4. Overall confidence assessment (0-1)
5. Key insights about the student's profile

Format as structured analysis focusing on career fit, earning potential, and personal fulfillment.
    `;
  }

  private parseAIResponse(
    aiResponse: string,
    baseRecommendations: Record<string, unknown>,
  ): ComprehensiveRecommendationResult {
    // Parse AI response and combine with base recommendations
    // This is a simplified version - in practice, you'd implement more sophisticated parsing

    const sortedStreams = Object.entries(baseRecommendations).sort(
      ([, a], [, b]) => {
        const aScore = (a as { score?: number })?.score || 0;
        const bScore = (b as { score?: number })?.score || 0;
        return bScore - aScore;
      },
    );

    // Filter out streams with very low scores (less than 0.5)
    const viableStreams = sortedStreams.filter(([, data]) => {
      const dataObj = data as { score?: number };
      return (dataObj.score || 0) > 0.5; // Only include streams with decent scores
    });

    // If no streams are viable, suggest skill development
    if (viableStreams.length === 0) {
      return {
        primary_recommendations: [{
          stream: "Skill Development",
          reasoning: "Based on your current assessment, we recommend focusing on skill development in key areas before choosing a specific career path. Consider taking additional courses or training in areas where you showed interest.",
          time_to_earn: "6-12 months",
          average_salary: "Varies based on skills developed",
          job_demand_trend: "high",
          confidence_score: 0.8
        }],
        secondary_recommendations: [],
        backup_options: [{
          course: "Online Skill Development Courses",
          why_considered: "Flexible learning to improve weak areas"
        }],
        colleges: [],
        scholarships: [],
        overall_reasoning: "Your assessment shows potential in multiple areas, but no single stream stands out strongly. We recommend focusing on skill development first.",
        confidence_score: 0.6
      };
    }

    const primary_recommendations: StreamRecommendation[] = viableStreams
      .slice(0, 1) // Show ONLY the top 1 viable stream as primary recommendation
      .map(([stream, data]: [string, unknown]) => {
        const dataObj = data as { 
          score?: number; 
          reasons?: string[]; 
          careers?: Array<{ title?: string; time_to_earn?: string; average_salary?: string; job_demand_trend?: string }> 
        };
        // Create cleaner, more readable reasoning
        const topCareer = dataObj.careers?.[0];
        const cleanReasons = Array.isArray(dataObj.reasons) 
          ? dataObj.reasons.filter(reason => reason.length < 100) // Filter out very long reasons
          : [];
        
        let reasoning = "";
        if (cleanReasons.length > 0) {
          // Clean up the reasoning text
          const cleanedReasons = cleanReasons.slice(0, 2).map(reason => {
            // Fix duplicate words and improve readability
            return reason
              .replace(/(\w+)\s+\1\s+/g, '$1 ') // Remove duplicate words
              .replace(/skills skills/g, 'skills') // Fix "skills skills"
              .replace(/may limit (\w+) success/g, 'may be challenging for $1') // Improve negative phrasing
              .replace(/Strong (\w+) skills match (\w+)/g, 'Your strong $1 skills align well with $2') // Improve positive phrasing
              .replace(/Weak (\w+) skills may be challenging for (\w+)/g, 'Your $1 skills may need improvement for $2'); // Improve negative phrasing
          });
          reasoning = cleanedReasons.join(". ");
        } else {
          // Generate a more specific fallback based on the stream
          const streamDescriptions = {
            engineering: "Your technical and analytical skills make engineering a strong option for you.",
            medical: "Your caring nature and scientific aptitude align well with medical careers.",
            commerce: "Your numerical and business skills are well-suited for commerce and finance.",
            arts: "Your creative and communication abilities make arts and humanities a great fit.",
            science: "Your analytical thinking and research skills are perfect for scientific careers.",
            vocational: "Your practical skills and hands-on approach make vocational training ideal."
          };
          reasoning = streamDescriptions[stream as keyof typeof streamDescriptions] || 
            `Good match for ${stream} stream based on your assessment results.`;
        }
        
        if (topCareer?.title) {
          reasoning += ` Top career option: ${topCareer.title}.`;
        }

        return {
          stream,
          reasoning,
          time_to_earn: topCareer?.time_to_earn || "4-6 years",
          average_salary: topCareer?.average_salary || "5-20 LPA",
          job_demand_trend: topCareer?.job_demand_trend || "medium",
          confidence_score: Math.max(Math.min((dataObj.score || 0) / 15, 0.95), 0.3), // More realistic confidence scores
        };
      });

    const secondary_recommendations: StreamRecommendation[] = viableStreams
      .slice(1, 3) // Show only 2 secondary options from viable streams
      .map(([stream, data]: [string, unknown]) => {
        const dataObj = data as { 
          score?: number; 
          reasons?: string[]; 
          careers?: Array<{ title?: string; time_to_earn?: string; average_salary?: string; job_demand_trend?: string }> 
        };
        // Create cleaner reasoning for secondary recommendations
        const topCareer = dataObj.careers?.[0];
        const cleanReasons = Array.isArray(dataObj.reasons) 
          ? dataObj.reasons.filter(reason => reason.length < 100)
          : [];
        
        let reasoning = "";
        if (cleanReasons.length > 0) {
          // Clean up the reasoning text for secondary recommendations
          const cleanedReasons = cleanReasons.slice(0, 1).map(reason => {
            return reason
              .replace(/(\w+)\s+\1\s+/g, '$1 ') // Remove duplicate words
              .replace(/skills skills/g, 'skills') // Fix "skills skills"
              .replace(/may limit (\w+) success/g, 'may be challenging for $1') // Improve negative phrasing
              .replace(/Strong (\w+) skills match (\w+)/g, 'Your strong $1 skills align well with $2') // Improve positive phrasing
              .replace(/Weak (\w+) skills may be challenging for (\w+)/g, 'Your $1 skills may need improvement for $2'); // Improve negative phrasing
          });
          reasoning = cleanedReasons.join(". ");
        } else {
          // Generate a more specific fallback for secondary recommendations
          const streamDescriptions = {
            engineering: "Engineering could be a good alternative path for you.",
            medical: "Medical careers might be worth considering as an alternative.",
            commerce: "Commerce and business could be viable alternative options.",
            arts: "Arts and creative fields might be good alternatives to explore.",
            science: "Scientific careers could be interesting alternative paths.",
            vocational: "Vocational training might be a practical alternative option."
          };
          reasoning = streamDescriptions[stream as keyof typeof streamDescriptions] || 
            `Good alternative option in ${stream} stream.`;
        }

        return {
          stream,
          reasoning,
          time_to_earn: topCareer?.time_to_earn || "4-6 years",
          average_salary: topCareer?.average_salary || "4-15 LPA",
          job_demand_trend: dataObj.careers?.[0]?.job_demand_trend || "medium",
          confidence_score: Math.max(Math.min((dataObj.score || 0) / 15, 0.8), 0.2), // More realistic confidence scores for secondary
        };
      });

    const backup_options: BackupOption[] = [
      {
        course: "Diploma Courses",
        why_considered:
          "Shorter duration with practical skills, good job opportunities",
      },
      {
        course: "Skill-based Certifications",
        why_considered: "Industry-relevant skills that can be learned quickly",
      },
    ];

    const overall_reasoning = `
Based on your comprehensive assessment, your strongest areas are ${this.getTopStrengths(baseRecommendations)}. 
The AI analysis suggests focusing on ${primary_recommendations[0]?.stream} as your primary path due to strong alignment 
with your aptitude, interests, and personality traits. ${aiResponse.slice(0, 200)}...
    `.trim();

    const confidence_score = Math.max(
      primary_recommendations.length > 0
        ? primary_recommendations.reduce(
            (sum, rec) => sum + rec.confidence_score,
            0,
          ) / primary_recommendations.length
        : 0.5,
      0.3 // Minimum 30% confidence to avoid 0% scores
    );

    return {
      primary_recommendations,
      secondary_recommendations,
      backup_options,
      colleges: [], // Will be populated by separate college matching logic
      scholarships: [], // Will be populated by separate scholarship matching logic
      overall_reasoning,
      confidence_score,
    };
  }

  private formatBasicRecommendations(
    userProfile: EnhancedUserProfile,
    baseRecommendations: Record<string, unknown>,
  ): ComprehensiveRecommendationResult {
    // Fallback formatting when AI is not available
    return this.parseAIResponse(
      "Basic algorithm recommendations",
      baseRecommendations,
    );
  }

  private getTopStrengths(recommendations: Record<string, unknown>): string {
    const topStream = Object.entries(recommendations).sort(
      ([, a], [, b]) => {
        const aScore = (a as { score?: number })?.score || 0;
        const bScore = (b as { score?: number })?.score || 0;
        return bScore - aScore;
      },
    )[0];

    return topStream
      ? `${topStream[0]} with score ${((topStream[1] as { score?: number })?.score || 0).toFixed(2)}`
      : "analytical thinking";
  }
}

// Export singleton instance
export const enhancedAIEngine = new EnhancedAIRecommendationEngine();

