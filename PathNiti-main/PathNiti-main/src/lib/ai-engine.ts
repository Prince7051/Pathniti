/**
 * EduNiti AI Recommendation Engine - TypeScript Version
 * Enhanced with Google Gemini AI for intelligent recommendations
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { usageMonitor } from "./usage-monitor";

// Types
export interface UserProfile {
  user_id: string;
  age?: number;
  class_level?: string;
  stream?: string;
  interests: string[];
  location?: {
    state?: string;
    city?: string;
  };
  quiz_scores?: Record<string, number>;
  personality_traits?: Record<string, number>;
  family_income?: number;
  parent_education?: string;
}

export interface StreamRecommendation {
  stream: string;
  confidence: number;
  reasoning: string;
  career_paths: string[];
  required_subjects: string[];
  description: string;
  match_score: number;
}

export interface CollegeRecommendation {
  college_id: string;
  name: string;
  match_score: number;
  reasons: string[];
  programs: string[];
  location: Record<string, unknown>;
  type: string;
  facilities: string[];
}

export interface CareerRecommendation {
  career: string;
  education_path: string[];
  skills_required: string[];
  job_opportunities: string[];
  salary_range: { min: number; max: number };
  growth_prospects: string;
  match_score: number;
  stream: string;
}

// Sample data (in production, this would come from your database)
const STREAM_DATA = [
  {
    stream: "science",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    careers: [
      "Engineer",
      "Doctor",
      "Scientist",
      "Researcher",
      "Data Scientist",
    ],
    description: "Focus on scientific subjects and analytical thinking",
  },
  {
    stream: "arts",
    subjects: [
      "History",
      "Geography",
      "Political Science",
      "Literature",
      "Psychology",
    ],
    careers: ["Teacher", "Journalist", "Lawyer", "Social Worker", "Writer"],
    description: "Focus on humanities and social sciences",
  },
  {
    stream: "commerce",
    subjects: ["Accountancy", "Business Studies", "Economics", "Mathematics"],
    careers: ["CA", "MBA", "Banking", "Finance", "Business Analyst"],
    description: "Focus on business and financial subjects",
  },
  {
    stream: "engineering",
    subjects: ["Mathematics", "Physics", "Chemistry", "Computer Science"],
    careers: [
      "Software Engineer",
      "Mechanical Engineer",
      "Civil Engineer",
      "Data Scientist",
    ],
    description: "Focus on technical and engineering subjects",
  },
  {
    stream: "medical",
    subjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
    careers: ["Doctor", "Nurse", "Pharmacist", "Medical Researcher"],
    description: "Focus on medical and healthcare subjects",
  },
];

const COLLEGE_DATA = [
  {
    id: "1",
    name: "Delhi University",
    type: "government",
    location: { state: "Delhi", city: "New Delhi" },
    programs: ["B.A.", "B.Sc.", "B.Com.", "B.Tech"],
    streams: ["arts", "science", "commerce", "engineering"],
    cut_off: 85,
    facilities: ["hostel", "library", "sports", "labs"],
  },
  {
    id: "2",
    name: "IIT Delhi",
    type: "government",
    location: { state: "Delhi", city: "New Delhi" },
    programs: ["B.Tech", "M.Tech", "Ph.D"],
    streams: ["engineering"],
    cut_off: 95,
    facilities: ["hostel", "library", "sports", "labs", "research_center"],
  },
  {
    id: "3",
    name: "JNU",
    type: "government",
    location: { state: "Delhi", city: "New Delhi" },
    programs: ["B.A.", "M.A.", "Ph.D"],
    streams: ["arts"],
    cut_off: 80,
    facilities: ["hostel", "library", "sports"],
  },
];

const CAREER_DATA = [
  {
    career: "Software Engineer",
    stream: "engineering",
    education_path: ["B.Tech Computer Science", "M.Tech (Optional)"],
    skills: ["Programming", "Problem Solving", "Mathematics", "Algorithms"],
    salary_range: { min: 500000, max: 2000000 },
    growth: "High",
  },
  {
    career: "Doctor",
    stream: "medical",
    education_path: ["MBBS", "MD/MS (Specialization)"],
    skills: ["Biology", "Chemistry", "Empathy", "Communication"],
    salary_range: { min: 800000, max: 3000000 },
    growth: "High",
  },
  {
    career: "Teacher",
    stream: "arts",
    education_path: ["B.Ed", "M.A. in Subject"],
    skills: ["Communication", "Patience", "Subject Knowledge"],
    salary_range: { min: 300000, max: 800000 },
    growth: "Medium",
  },
  {
    career: "Data Scientist",
    stream: "science",
    education_path: [
      "B.Sc. Mathematics/Statistics",
      "M.Sc./M.Tech Data Science",
    ],
    skills: ["Statistics", "Programming", "Machine Learning", "Mathematics"],
    salary_range: { min: 600000, max: 2500000 },
    growth: "Very High",
  },
];

export class AIRecommendationEngine {
  private genAI: GoogleGenerativeAI | null = null;
  private model: unknown = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        "GEMINI_API_KEY not found. AI features will use fallback logic.",
      );
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Using gemini-1.5-flash which has higher free tier limits
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: 1000, // Limit output to stay within free tier
          temperature: 0.7,
        },
      });
    }
  }

  /**
   * Get stream recommendations using hybrid approach
   */
  async getStreamRecommendations(
    userProfile: UserProfile,
  ): Promise<StreamRecommendation[]> {
    try {
      // First, get basic recommendations using our algorithm
      const basicRecommendations =
        this.calculateBasicStreamRecommendations(userProfile);

      // If Gemini is available, enhance with AI insights
      if (this.model) {
        const enhancedRecommendations = await this.enhanceWithGemini(
          "stream",
          userProfile,
          basicRecommendations,
        );
        return enhancedRecommendations as StreamRecommendation[];
      }

      return basicRecommendations;
    } catch (error) {
      console.error("Error in stream recommendations:", error);
      return this.calculateBasicStreamRecommendations(userProfile);
    }
  }

  /**
   * Get college recommendations using hybrid approach
   */
  async getCollegeRecommendations(
    userProfile: UserProfile,
    limit: number = 10,
  ): Promise<CollegeRecommendation[]> {
    try {
      const basicRecommendations = this.calculateBasicCollegeRecommendations(
        userProfile,
        limit,
      );

      if (this.model) {
        const enhancedRecommendations = await this.enhanceWithGemini(
          "college",
          userProfile,
          basicRecommendations,
        );
        return enhancedRecommendations as CollegeRecommendation[];
      }

      return basicRecommendations;
    } catch (error) {
      console.error("Error in college recommendations:", error);
      return this.calculateBasicCollegeRecommendations(userProfile, limit);
    }
  }

  /**
   * Get career recommendations using hybrid approach
   */
  async getCareerRecommendations(
    userProfile: UserProfile,
  ): Promise<CareerRecommendation[]> {
    try {
      const basicRecommendations =
        this.calculateBasicCareerRecommendations(userProfile);

      if (this.model) {
        const enhancedRecommendations = await this.enhanceWithGemini(
          "career",
          userProfile,
          basicRecommendations,
        );
        return enhancedRecommendations as CareerRecommendation[];
      }

      return basicRecommendations;
    } catch (error) {
      console.error("Error in career recommendations:", error);
      return this.calculateBasicCareerRecommendations(userProfile);
    }
  }

  /**
   * Basic stream recommendation algorithm (converted from Python)
   */
  private calculateBasicStreamRecommendations(
    userProfile: UserProfile,
  ): StreamRecommendation[] {
    const recommendations: StreamRecommendation[] = [];
    const streamScores: Record<string, number> = {};

    for (const streamRow of STREAM_DATA) {
      let score = 0;
      const stream = streamRow.stream;

      // Interest-based scoring
      for (const interest of userProfile.interests) {
        if (
          streamRow.subjects.some((subject) =>
            subject.toLowerCase().includes(interest.toLowerCase()),
          )
        ) {
          score += 2;
        }
        if (
          streamRow.careers.some((career) =>
            career.toLowerCase().includes(interest.toLowerCase()),
          )
        ) {
          score += 3;
        }
      }

      // Quiz score-based scoring
      if (userProfile.quiz_scores) {
        for (const [subject, scoreVal] of Object.entries(
          userProfile.quiz_scores,
        )) {
          if (
            streamRow.subjects.some((s) =>
              s.toLowerCase().includes(subject.toLowerCase()),
            )
          ) {
            score += scoreVal * 0.8;
          }
        }
      }

      // Personality-based scoring
      if (userProfile.personality_traits) {
        if (
          stream === "science" &&
          (userProfile.personality_traits.openness || 3) > 3.5
        ) {
          score += 2;
        }
        if (
          stream === "arts" &&
          (userProfile.personality_traits.agreeableness || 3) > 3.5
        ) {
          score += 2;
        }
        if (
          stream === "commerce" &&
          (userProfile.personality_traits.conscientiousness || 3) > 3.5
        ) {
          score += 2;
        }
      }

      // Age and class level considerations
      if (userProfile.age && userProfile.age < 18) {
        if (["science", "commerce"].includes(stream)) {
          score += 1;
        }
      }

      streamScores[stream] = score;
    }

    // Sort by score and create recommendations
    const sortedStreams = Object.entries(streamScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [stream, score] of sortedStreams) {
      const streamRow = STREAM_DATA.find((s) => s.stream === stream)!;
      const confidence = Math.min(score / 15, 1.0);

      recommendations.push({
        stream,
        confidence,
        reasoning: `Based on your interests in ${userProfile.interests.slice(0, 3).join(", ")} and academic strengths`,
        career_paths: streamRow.careers,
        required_subjects: streamRow.subjects,
        description: streamRow.description,
        match_score: score,
      });
    }

    return recommendations;
  }

  /**
   * Basic college recommendation algorithm
   */
  private calculateBasicCollegeRecommendations(
    userProfile: UserProfile,
    limit: number,
  ): CollegeRecommendation[] {
    const recommendations: CollegeRecommendation[] = [];

    for (const college of COLLEGE_DATA) {
      let matchScore = 0;
      const reasons: string[] = [];

      // Location preference
      if (
        userProfile.location &&
        college.location.state === userProfile.location.state
      ) {
        matchScore += 0.4;
        reasons.push("Located in your preferred state");
      }

      // Stream match
      if (userProfile.stream && college.streams.includes(userProfile.stream)) {
        matchScore += 0.5;
        reasons.push(`Offers ${userProfile.stream} programs`);
      }

      // Interest match
      for (const interest of userProfile.interests) {
        if (
          college.programs.some((program) =>
            program.toLowerCase().includes(interest.toLowerCase()),
          )
        ) {
          matchScore += 0.1;
          reasons.push(`Programs align with your interest in ${interest}`);
        }
      }

      // Academic profile match
      if (userProfile.quiz_scores) {
        const avgScore =
          Object.values(userProfile.quiz_scores).reduce((a, b) => a + b, 0) /
          Object.values(userProfile.quiz_scores).length;
        if (avgScore >= college.cut_off * 0.8) {
          matchScore += 0.3;
          reasons.push(
            "Your academic profile matches the college requirements",
          );
        }
      }

      if (matchScore > 0) {
        recommendations.push({
          college_id: college.id,
          name: college.name,
          match_score: matchScore,
          reasons,
          programs: college.programs,
          location: college.location,
          type: college.type,
          facilities: college.facilities,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);
  }

  /**
   * Basic career recommendation algorithm
   */
  private calculateBasicCareerRecommendations(
    userProfile: UserProfile,
  ): CareerRecommendation[] {
    const recommendations: CareerRecommendation[] = [];

    // Filter careers by stream
    const relevantCareers = userProfile.stream
      ? CAREER_DATA.filter((career) => career.stream === userProfile.stream)
      : CAREER_DATA;

    for (const career of relevantCareers) {
      let matchScore = 0;

      // Interest match
      for (const interest of userProfile.interests) {
        if (career.career.toLowerCase().includes(interest.toLowerCase())) {
          matchScore += 0.3;
        }
        if (
          career.skills.some((skill) =>
            skill.toLowerCase().includes(interest.toLowerCase()),
          )
        ) {
          matchScore += 0.2;
        }
      }

      // Personality match
      if (userProfile.personality_traits) {
        if (
          career.career === "Software Engineer" &&
          (userProfile.personality_traits.openness || 3) > 3.5
        ) {
          matchScore += 0.2;
        }
        if (
          career.career === "Doctor" &&
          (userProfile.personality_traits.agreeableness || 3) > 3.5
        ) {
          matchScore += 0.2;
        }
      }

      recommendations.push({
        career: career.career,
        education_path: career.education_path,
        skills_required: career.skills,
        job_opportunities: [career.career],
        salary_range: career.salary_range,
        growth_prospects: career.growth,
        match_score: matchScore,
        stream: career.stream,
      });
    }

    return recommendations.sort((a, b) => b.match_score - a.match_score);
  }

  /**
   * Enhance recommendations using Gemini AI (with usage monitoring)
   */
  private async enhanceWithGemini(
    type: "stream" | "college" | "career",
    userProfile: UserProfile,
    basicRecommendations: unknown[],
  ): Promise<unknown[]> {
    // Check if we can make a request without exceeding free tier limits
    if (!usageMonitor.canMakeRequest()) {
      console.log("Using fallback recommendations due to API limits");
      return basicRecommendations;
    }

    try {
      const prompt = this.createGeminiPrompt(
        type,
        userProfile,
        basicRecommendations,
      );

      const result = await (this.model as any).generateContent(prompt);
      if (!result || typeof result !== 'object' || !('response' in result)) {
        throw new Error('Failed to generate content from AI model');
      }
      const response = (result as { response: { text: () => string } }).response;
      const text = response.text();

      // Record successful API usage
      usageMonitor.recordRequest();

      // Log usage stats
      const stats = usageMonitor.getUsageStats();
      console.log(
        `Gemini API usage: ${stats.requestsToday}/${stats.dailyLimit} requests today`,
      );

      // Parse Gemini's response and enhance recommendations
      return this.parseGeminiResponse(text, basicRecommendations);
    } catch (error) {
      console.error("Gemini enhancement failed:", error);
      return basicRecommendations;
    }
  }

  /**
   * Create prompt for Gemini AI
   */
  private createGeminiPrompt(
    type: string,
    userProfile: UserProfile,
    basicRecommendations: unknown[],
  ): string {
    const userContext = `
User Profile:
- Age: ${userProfile.age || "Not specified"}
- Class Level: ${userProfile.class_level || "Not specified"}
- Stream: ${userProfile.stream || "Not specified"}
- Interests: ${userProfile.interests.join(", ")}
- Location: ${userProfile.location?.state || "Not specified"}
- Quiz Scores: ${JSON.stringify(userProfile.quiz_scores || {})}
- Personality Traits: ${JSON.stringify(userProfile.personality_traits || {})}
`;

    const recommendationsContext = `
Current ${type} recommendations:
${JSON.stringify(basicRecommendations, null, 2)}
`;

    return `
You are an expert career counselor for Indian students. Based on the user profile and current recommendations, provide enhanced insights.

${userContext}

${recommendationsContext}

Please provide:
1. Enhanced reasoning for each recommendation
2. Additional career paths or opportunities
3. Specific advice for this student
4. Any missing recommendations that would be valuable

Focus on:
- Indian education system context
- Current job market trends
- Practical career advice
- Specific skills to develop

Respond in JSON format with enhanced recommendations.
`;
  }

  /**
   * Parse Gemini's response and merge with basic recommendations
   */
  private parseGeminiResponse(
    geminiText: string,
    basicRecommendations: unknown[],
  ): unknown[] {
    try {
      // Try to extract JSON from Gemini's response
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0]);
        // Merge enhanced insights with basic recommendations
        return basicRecommendations.map((rec, index) => {
          const recObj = rec as { [key: string]: unknown };
          return {
            ...recObj,
            ai_enhanced_reasoning: enhanced.reasoning?.[index] || recObj.reasoning,
            ai_insights: enhanced.insights?.[index] || "",
            ai_advice: enhanced.advice?.[index] || "",
          };
        });
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
    }

    // Fallback: add Gemini's text as general advice
    return basicRecommendations.map((rec) => ({
      ...(rec as { [key: string]: unknown }),
      ai_insights: geminiText.substring(0, 200) + "...",
    }));
  }
}

// Export singleton instance
export const aiEngine = new AIRecommendationEngine();
