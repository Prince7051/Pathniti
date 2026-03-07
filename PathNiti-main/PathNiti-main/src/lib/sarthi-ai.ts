/**
 * Sarthi AI - Enhanced Career Guidance AI for Jammu & Kashmir
 * Focused on parental mindset awareness, financial concerns, and ROI calculations
 * Always uses Gemini free tier for cost-effective operation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { usageMonitor } from "./usage-monitor";

// Enhanced interfaces for Sarthi AI
export interface SarthiUserProfile {
  user_id: string;
  age?: number;
  class_level?: string;
  current_stream?: string;
  interests: string[];
  aptitude_results?: Record<string, number>; // Subject-wise aptitude scores
  location?: {
    state?: string;
    city?: string;
    district?: string;
  };
  family_background?: {
    income_range?: "low" | "middle" | "high";
    parent_education?: string;
    parent_occupation?: string;
    family_expectations?: string[];
  };
  quiz_scores?: Record<string, number>;
  personality_traits?: Record<string, number>;
  concerns?: string[]; // Student/parent concerns
}

export interface SarthiStreamRecommendation {
  stream: string;
  confidence: number;
  reasoning: string;
  roi_analysis: {
    study_duration_years: number;
    earning_start_year: number;
    early_career_salary: { min: number; max: number };
    mid_career_salary: { min: number; max: number };
    total_education_cost: { min: number; max: number };
    break_even_years: number;
    roi_percentage: number;
  };
  career_paths: Array<{
    career: string;
    timeline: string;
    earning_potential: string;
    job_security: "high" | "medium" | "low";
    growth_rate: number;
  }>;
  required_subjects: string[];
  alternatives: Array<{
    stream: string;
    pros: string[];
    cons: string[];
    roi_comparison: string;
  }>;
  parent_appeal_factors: string[];
  scholarships_available: string[];
  nearby_colleges?: Record<string, unknown>[];
  match_score: number;
  concerns_addressed: string[];
}

export interface SarthiCareerPath {
  career: string;
  stream_required: string;
  education_roadmap: Array<{
    step: number;
    education: string;
    duration: string;
    cost_range: { min: number; max: number };
    earning_during?: { min: number; max: number };
  }>;
  earning_timeline: Array<{
    year: number;
    position: string;
    salary_range: { min: number; max: number };
  }>;
  skills_required: string[];
  job_security_score: number;
  growth_prospects: string;
  alternative_paths: string[];
  government_opportunities: boolean;
  entrepreneurship_potential: "high" | "medium" | "low";
  work_life_balance: number;
  stress_level: number;
  regional_demand_jk: "high" | "medium" | "low";
}

// Enhanced data for Jammu & Kashmir context
const JK_SCHOLARSHIP_SCHEMES = [
  {
    name: "J&K Merit-cum-Means Scholarship",
    for_streams: ["all"],
    eligibility: "Family income < ₹2.5 lakh, 60% marks",
    amount: "₹12,000 - ₹20,000 per year",
    renewable: true,
  },
  {
    name: "PM YASASVI Scholarship",
    for_streams: ["all"],
    eligibility: "OBC/EBC/DNT students, income < ₹2.5 lakh",
    amount: "₹75,000 - ₹1,25,000 per year",
    renewable: true,
  },
  {
    name: "AICTE Pragati Scholarship",
    for_streams: ["engineering"],
    eligibility: "Girls in technical education, income < ₹8 lakh",
    amount: "₹30,000 per year + laptop",
    renewable: true,
  },
  {
    name: "National Means-cum-Merit Scholarship",
    for_streams: ["all"],
    eligibility: "Class 12 passed, family income < ₹1.5 lakh",
    amount: "₹12,000 per year",
    renewable: true,
  },
  {
    name: "J&K Professional Courses Scholarship",
    for_streams: ["medical", "engineering"],
    eligibility: "Professional courses, merit-based",
    amount: "₹50,000 - ₹1,50,000 per year",
    renewable: true,
  },
];

const ENHANCED_STREAM_DATA = [
  {
    stream: "science",
    full_name: "Science (PCM/PCB)",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    careers: [
      {
        name: "Engineering",
        fast_earning: true,
        govt_jobs: true,
        stability: "high",
      },
      {
        name: "Medical",
        fast_earning: false,
        govt_jobs: true,
        stability: "very_high",
      },
      {
        name: "Research Scientist",
        fast_earning: false,
        govt_jobs: true,
        stability: "medium",
      },
      {
        name: "Data Scientist",
        fast_earning: true,
        govt_jobs: false,
        stability: "high",
      },
      {
        name: "Pharmacy",
        fast_earning: true,
        govt_jobs: true,
        stability: "high",
      },
    ],
    avg_education_cost: { min: 200000, max: 2000000 },
    earning_timeline: {
      early_career: { min: 300000, max: 800000 },
      mid_career: { min: 800000, max: 2500000 },
      senior_career: { min: 1500000, max: 5000000 },
    },
    study_duration: 4,
    roi_factors: {
      job_availability: "high",
      salary_growth: "high",
      entrepreneurship: "high",
    },
  },
  {
    stream: "commerce",
    full_name: "Commerce",
    subjects: ["Accountancy", "Business Studies", "Economics", "Mathematics"],
    careers: [
      {
        name: "CA/CS",
        fast_earning: true,
        govt_jobs: false,
        stability: "high",
      },
      {
        name: "Banking",
        fast_earning: true,
        govt_jobs: true,
        stability: "high",
      },
      {
        name: "Business Management",
        fast_earning: true,
        govt_jobs: false,
        stability: "medium",
      },
      {
        name: "Government Services",
        fast_earning: true,
        govt_jobs: true,
        stability: "very_high",
      },
      {
        name: "Finance Analyst",
        fast_earning: true,
        govt_jobs: false,
        stability: "high",
      },
    ],
    avg_education_cost: { min: 150000, max: 1500000 },
    earning_timeline: {
      early_career: { min: 250000, max: 600000 },
      mid_career: { min: 600000, max: 2000000 },
      senior_career: { min: 1200000, max: 4000000 },
    },
    study_duration: 3,
    roi_factors: {
      job_availability: "high",
      salary_growth: "high",
      entrepreneurship: "very_high",
    },
  },
  {
    stream: "arts",
    full_name: "Arts/Humanities",
    subjects: [
      "History",
      "Political Science",
      "Sociology",
      "Psychology",
      "Literature",
    ],
    careers: [
      {
        name: "Civil Services",
        fast_earning: true,
        govt_jobs: true,
        stability: "very_high",
      },
      {
        name: "Teaching",
        fast_earning: true,
        govt_jobs: true,
        stability: "high",
      },
      {
        name: "Journalism",
        fast_earning: false,
        govt_jobs: false,
        stability: "medium",
      },
      { name: "Law", fast_earning: false, govt_jobs: true, stability: "high" },
      {
        name: "Social Work",
        fast_earning: false,
        govt_jobs: true,
        stability: "medium",
      },
    ],
    avg_education_cost: { min: 100000, max: 800000 },
    earning_timeline: {
      early_career: { min: 200000, max: 500000 },
      mid_career: { min: 500000, max: 1500000 },
      senior_career: { min: 1000000, max: 3000000 },
    },
    study_duration: 3,
    roi_factors: {
      job_availability: "medium",
      salary_growth: "medium",
      entrepreneurship: "medium",
    },
  },
  {
    stream: "vocational",
    full_name: "Vocational/Skill-based",
    subjects: ["Trade-specific subjects", "Practical Skills"],
    careers: [
      {
        name: "Technical Trades",
        fast_earning: true,
        govt_jobs: true,
        stability: "high",
      },
      {
        name: "Digital Marketing",
        fast_earning: true,
        govt_jobs: false,
        stability: "medium",
      },
      {
        name: "Hospitality",
        fast_earning: true,
        govt_jobs: false,
        stability: "medium",
      },
      {
        name: "Healthcare Support",
        fast_earning: true,
        govt_jobs: true,
        stability: "high",
      },
      {
        name: "Entrepreneurship",
        fast_earning: true,
        govt_jobs: false,
        stability: "medium",
      },
    ],
    avg_education_cost: { min: 50000, max: 500000 },
    earning_timeline: {
      early_career: { min: 180000, max: 400000 },
      mid_career: { min: 400000, max: 1000000 },
      senior_career: { min: 800000, max: 2500000 },
    },
    study_duration: 1,
    roi_factors: {
      job_availability: "high",
      salary_growth: "medium",
      entrepreneurship: "very_high",
    },
  },
];

export class SarthiAI {
  private genAI: GoogleGenerativeAI | null = null;
  private model: unknown = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        "GEMINI_API_KEY not found. Sarthi AI will use fallback logic.",
      );
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Always use gemini-1.5-flash which has the best free tier limits
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Free tier: 15 requests/minute, 1M tokens/day
        generationConfig: {
          maxOutputTokens: 1000, // Conservative limit for free tier
          temperature: 0.7, // Balanced creativity vs consistency
          topP: 0.95, // Free tier optimization
          topK: 40, // Free tier optimization
        },
      });
    }
  }

  /**
   * Main recommendation method with parental mindset awareness
   */
  async getEnhancedRecommendations(userProfile: SarthiUserProfile): Promise<{
    primary_recommendation: SarthiStreamRecommendation;
    alternatives: SarthiStreamRecommendation[];
    parent_friendly_summary: string;
    student_motivation: string;
    action_plan: string[];
  }> {
    try {
      // Get basic recommendations
      const basicRecommendations =
        this.calculateAdvancedStreamRecommendations(userProfile);

      // Enhance with AI if available
      if (this.model && usageMonitor.canMakeRequest()) {
        return await this.enhanceWithSarthiAI(
          userProfile,
          basicRecommendations,
        );
      }

      return this.formatBasicRecommendations(userProfile, basicRecommendations);
    } catch (error) {
      console.error("Error in Sarthi recommendations:", error);
      const basicRecommendations =
        this.calculateAdvancedStreamRecommendations(userProfile);
      return this.formatBasicRecommendations(userProfile, basicRecommendations);
    }
  }

  /**
   * Calculate advanced stream recommendations with ROI analysis
   */
  private calculateAdvancedStreamRecommendations(
    userProfile: SarthiUserProfile,
  ): SarthiStreamRecommendation[] {
    const recommendations: SarthiStreamRecommendation[] = [];

    for (const streamData of ENHANCED_STREAM_DATA) {
      let score = 0;
      const concerns_addressed: string[] = [];

      // Aptitude-based scoring (40% weight)
      if (userProfile.aptitude_results) {
        for (const [subject, aptitudeScore] of Object.entries(
          userProfile.aptitude_results,
        )) {
          if (
            streamData.subjects.some((s) =>
              s.toLowerCase().includes(subject.toLowerCase()),
            )
          ) {
            score += aptitudeScore * 4;
          }
        }
      }

      // Interest-based scoring (30% weight)
      for (const interest of userProfile.interests) {
        if (
          streamData.careers.some((career) =>
            career.name.toLowerCase().includes(interest.toLowerCase()),
          )
        ) {
          score += 30;
        }
        if (
          streamData.subjects.some((subject) =>
            subject.toLowerCase().includes(interest.toLowerCase()),
          )
        ) {
          score += 20;
        }
      }

      // Family background considerations (20% weight)
      if (userProfile.family_background) {
        const { income_range, family_expectations } =
          userProfile.family_background;

        // If low income, prioritize cost-effective streams with fast earning
        if (income_range === "low") {
          const fastEarningCareers = streamData.careers.filter(
            (c) => c.fast_earning,
          );
          score += fastEarningCareers.length * 15;
          if (fastEarningCareers.length > 0) {
            concerns_addressed.push(
              "Fast earning potential for financial support",
            );
          }
        }

        // Government job preferences (common in J&K)
        const govtJobCareers = streamData.careers.filter((c) => c.govt_jobs);
        if (
          family_expectations?.includes("government_job") ||
          income_range === "low"
        ) {
          score += govtJobCareers.length * 10;
          if (govtJobCareers.length > 0) {
            concerns_addressed.push("Government job opportunities available");
          }
        }

        // Stability preferences
        const stableCareers = streamData.careers.filter(
          (c) => c.stability === "high" || c.stability === "very_high",
        );
        score += stableCareers.length * 8;
        if (stableCareers.length > 0) {
          concerns_addressed.push("High job security and stability");
        }
      }

      // ROI considerations (10% weight)
      const roiScore = this.calculateROIScore(streamData);
      score += roiScore;

      // Create recommendation
      const recommendation: SarthiStreamRecommendation = {
        stream: streamData.stream,
        confidence: Math.min(score / 100, 1.0),
        reasoning: this.generateReasoning(userProfile, streamData),
        roi_analysis: this.calculateROIAnalysis(streamData),
        career_paths: streamData.careers.map((career) => ({
          career: career.name,
          timeline: this.getCareerTimeline(career.name),
          earning_potential: this.getEarningPotential(career.name, streamData),
          job_security: career.stability as "high" | "medium" | "low",
          growth_rate: this.getGrowthRate(career.name),
        })),
        required_subjects: streamData.subjects,
        alternatives: this.getAlternatives(streamData.stream),
        parent_appeal_factors: this.getParentAppealFactors(streamData),
        scholarships_available: this.getRelevantScholarships(streamData.stream),
        match_score: score,
        concerns_addressed,
      };

      recommendations.push(recommendation);
    }

    return recommendations.sort((a, b) => b.match_score - a.match_score);
  }

  /**
   * Calculate ROI score for a stream
   */
  private calculateROIScore(streamData: Record<string, unknown>): number {
    const educationCost =
      ((streamData.avg_education_cost as { min: number; max: number }).min + (streamData.avg_education_cost as { min: number; max: number }).max) /
      2;
    const earlyCareerSalary =
      ((streamData.earning_timeline as { early_career: { min: number; max: number } }).early_career.min +
        (streamData.earning_timeline as { early_career: { min: number; max: number } }).early_career.max) /
      2;
    // Simple ROI calculation: (5 years of early career earnings - education cost) / education cost
    const fiveYearEarnings = earlyCareerSalary * 5;
    const roi = ((fiveYearEarnings - educationCost) / educationCost) * 100;

    return Math.min(roi / 10, 20); // Cap at 20 points
  }

  /**
   * Calculate detailed ROI analysis
   */
  private calculateROIAnalysis(
    streamData: Record<string, unknown>,
  ): SarthiStreamRecommendation["roi_analysis"] {
    const educationCost = streamData.avg_education_cost;
    const earlyCareer = (streamData.earning_timeline as { early_career: { min: number; max: number }; mid_career: { min: number; max: number } }).early_career;
    const midCareer = (streamData.earning_timeline as { early_career: { min: number; max: number }; mid_career: { min: number; max: number } }).mid_career;
    const avgEducationCost = ((educationCost as { min: number; max: number }).min + (educationCost as { min: number; max: number }).max) / 2;
    const avgEarlyCareerSalary = (earlyCareer.min + earlyCareer.max) / 2;

    // Break-even calculation
    const breakEvenYears = Math.ceil(avgEducationCost / avgEarlyCareerSalary);

    // ROI calculation over 10 years post-graduation
    const tenYearEarnings =
      avgEarlyCareerSalary * 6 + ((midCareer.min + midCareer.max) / 2) * 4;
    const roi = ((tenYearEarnings - avgEducationCost) / avgEducationCost) * 100;

    return {
      study_duration_years: streamData.study_duration as number,
      earning_start_year: (streamData.study_duration as number) + 1,
      early_career_salary: earlyCareer,
      mid_career_salary: midCareer,
      total_education_cost: educationCost as { min: number; max: number },
      break_even_years: breakEvenYears,
      roi_percentage: Math.round(roi),
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    userProfile: SarthiUserProfile,
    streamData: Record<string, unknown>,
  ): string {
    const aptitudeMatch = userProfile.aptitude_results
      ? Object.keys(userProfile.aptitude_results).filter((subject) =>
          (streamData.subjects as string[]).some((s: string) =>
            s.toLowerCase().includes(subject.toLowerCase()),
          ),
        )
      : [];

    const interestMatch = userProfile.interests.filter((interest) =>
      (streamData.careers as Record<string, unknown>[]).some((career: Record<string, unknown>) =>
        (career.name as string).toLowerCase().includes(interest.toLowerCase()),
      ),
    );

    let reasoning = `${streamData.full_name} is recommended based on `;

    if (aptitudeMatch.length > 0) {
      reasoning += `your strong aptitude in ${aptitudeMatch.join(", ")}`;
    }

    if (interestMatch.length > 0) {
      reasoning += `${aptitudeMatch.length > 0 ? " and " : ""}your interests in ${interestMatch.join(", ")}`;
    }

    const roiFactors = streamData.roi_factors as Record<string, unknown>;
    reasoning += `. This stream offers excellent ROI with ${roiFactors.job_availability} job availability and ${roiFactors.salary_growth} salary growth potential.`;

    return reasoning;
  }

  /**
   * Get alternative streams for comparison
   */
  private getAlternatives(currentStream: string): Array<{
    stream: string;
    pros: string[];
    cons: string[];
    roi_comparison: string;
  }> {
    const alternatives = ENHANCED_STREAM_DATA.filter(
      (s) => s.stream !== currentStream,
    )
      .slice(0, 2)
      .map((streamData) => ({
        stream: streamData.full_name,
        pros: this.getStreamPros(streamData),
        cons: this.getStreamCons(streamData),
        roi_comparison: this.compareROI(streamData),
      }));

    return alternatives;
  }

  /**
   * Get pros for a stream
   */
  private getStreamPros(streamData: Record<string, unknown>): string[] {
    const pros: string[] = [];

    const roiFactors = streamData.roi_factors as Record<string, unknown>;
    if (roiFactors.job_availability === "high") {
      pros.push("High job availability");
    }

    if (roiFactors.salary_growth === "high") {
      pros.push("Excellent salary growth");
    }

    if (
      roiFactors.entrepreneurship === "high" ||
      roiFactors.entrepreneurship === "very_high"
    ) {
      pros.push("Strong entrepreneurship opportunities");
    }

    const careers = streamData.careers as Array<Record<string, unknown>>;
    const govtJobs = careers.filter((c: Record<string, unknown>) => c.govt_jobs).length;
    if (govtJobs > 0) {
      pros.push(`${govtJobs} government job options`);
    }

    if ((streamData.study_duration as number) <= 3) {
      pros.push("Shorter study duration");
    }

    return pros;
  }

  /**
   * Get cons for a stream
   */
  private getStreamCons(streamData: Record<string, unknown>): string[] {
    const cons: string[] = [];

    const avgEducationCost = streamData.avg_education_cost as Record<string, unknown>;
    if ((avgEducationCost.max as number) > 1000000) {
      cons.push("Higher education costs");
    }

    if ((streamData.study_duration as number) > 4) {
      cons.push("Longer study duration");
    }

    const roiFactors = streamData.roi_factors as Record<string, unknown>;
    if (
      roiFactors.job_availability === "medium" ||
      roiFactors.job_availability === "low"
    ) {
      cons.push("Limited job opportunities");
    }

    const earningTimeline = streamData.earning_timeline as Record<string, unknown>;
    const earlyCareer = earningTimeline.early_career as Record<string, unknown>;
    if ((earlyCareer.min as number) < 300000) {
      cons.push("Lower starting salaries");
    }

    return cons;
  }

  /**
   * Compare ROI with other streams
   */
  private compareROI(streamData: Record<string, unknown>): string {
    const roi = this.calculateROIScore(streamData);

    if (roi > 15) return "Excellent ROI - high returns on investment";
    if (roi > 10) return "Good ROI - moderate returns on investment";
    if (roi > 5) return "Average ROI - steady returns on investment";
    return "Lower ROI - longer payback period";
  }

  /**
   * Get parent appeal factors
   */
  private getParentAppealFactors(streamData: Record<string, unknown>): string[] {
    const factors: string[] = [];

    const careers = streamData.careers as Array<Record<string, unknown>>;
    const govtJobs = careers.filter((c: Record<string, unknown>) => c.govt_jobs).length;
    if (govtJobs > 0) {
      factors.push(`${govtJobs} government job opportunities for security`);
    }

    const fastEarning = (streamData.careers as Record<string, unknown>[]).filter(
      (c: Record<string, unknown>) => c.fast_earning,
    ).length;
    if (fastEarning > 0) {
      factors.push(`${fastEarning} career paths with quick earning potential`);
    }

    const roiFactors = streamData.roi_factors as Record<string, unknown>;
    if (roiFactors.job_availability === "high") {
      factors.push("High demand in job market");
    }

    const earningTimeline = streamData.earning_timeline as Record<string, unknown>;
    const midCareer = earningTimeline.mid_career as Record<string, unknown>;
    if ((midCareer.max as number) > 2000000) {
      factors.push("Excellent long-term earning potential");
    }

    factors.push(`Study duration: ${streamData.study_duration as number} years`);

    return factors;
  }

  /**
   * Get relevant scholarships for stream
   */
  private getRelevantScholarships(stream: string): string[] {
    return JK_SCHOLARSHIP_SCHEMES.filter(
      (scheme) =>
        scheme.for_streams.includes("all") ||
        scheme.for_streams.includes(stream),
    )
      .map((scheme) => `${scheme.name}: ${scheme.amount}`)
      .slice(0, 3);
  }

  /**
   * Helper methods for career information
   */
  private getCareerTimeline(career: string): string {
    const timelines: Record<string, string> = {
      Engineering:
        "4 years B.Tech → Entry level job → 2-3 years experience for mid-level",
      Medical: "5.5 years MBBS → 1 year internship → 3 years specialization",
      "CA/CS": "3 years B.Com → 3 years CA/CS → Practice/Job",
      "Civil Services":
        "3 years graduation → 1 year preparation → UPSC → Training",
      Teaching: "3 years graduation → 2 years B.Ed → Government teacher job",
      Banking: "3 years graduation → Bank exam preparation → Job",
      "Technical Trades":
        "1-2 years diploma/certificate → Immediate job opportunities",
    };

    return (
      timelines[career] ||
      "3-4 years education → 1-2 years experience → Career growth"
    );
  }

  private getEarningPotential(career: string, streamData: Record<string, unknown>): string {
    const earningTimeline = streamData.earning_timeline as Record<string, unknown>;
    const early = earningTimeline.early_career as Record<string, unknown>;
    const mid = earningTimeline.mid_career as Record<string, unknown>;

    return `₹${((early.min as number) / 100000).toFixed(1)}-${((early.max as number) / 100000).toFixed(1)} LPA initially, growing to ₹${((mid.min as number) / 100000).toFixed(1)}-${((mid.max as number) / 100000).toFixed(1)} LPA`;
  }

  private getGrowthRate(career: string): number {
    const growthRates: Record<string, number> = {
      Engineering: 15,
      Medical: 12,
      "Data Scientist": 20,
      "CA/CS": 18,
      Banking: 12,
      "Civil Services": 8,
      Teaching: 6,
      "Technical Trades": 10,
    };

    return growthRates[career] || 10;
  }

  /**
   * Enhance recommendations with Gemini AI for parent-friendly communication
   * Optimized for free tier usage with conservative limits
   */
  private async enhanceWithSarthiAI(
    userProfile: SarthiUserProfile,
    basicRecommendations: SarthiStreamRecommendation[],
  ): Promise<{
    primary_recommendation: SarthiStreamRecommendation;
    alternatives: SarthiStreamRecommendation[];
    parent_friendly_summary: string;
    student_motivation: string;
    action_plan: string[];
  }> {
    try {
      // Check free tier limits before making request
      if (!usageMonitor.canMakeRequest()) {
        console.log("Free tier limit reached, using basic recommendations");
        return this.formatBasicRecommendations(
          userProfile,
          basicRecommendations,
        );
      }

      const prompt = this.createSarthiPrompt(userProfile, basicRecommendations);

      // Use free tier optimized settings
      const result = await (this.model as any).generateContent(prompt);
      if (!result || typeof result !== 'object' || !('response' in result)) {
        throw new Error('Failed to generate content from AI model');
      }
      const response = (result as { response: { text: () => string } }).response;
      const text = response.text();

      // Record usage for free tier monitoring
      usageMonitor.recordRequest();

      // Log free tier usage
      const stats = usageMonitor.getUsageStats();
      console.log(
        `Sarthi AI - Free tier usage: ${stats.requestsToday}/${stats.dailyLimit} requests today`,
      );

      return this.parseSarthiResponse(text, userProfile, basicRecommendations);
    } catch (error) {
      console.error(
        "Sarthi AI enhancement failed (falling back to basic):",
        error,
      );
      return this.formatBasicRecommendations(userProfile, basicRecommendations);
    }
  }

  /**
   * Create specialized prompt for Sarthi AI
   */
  private createSarthiPrompt(
    userProfile: SarthiUserProfile,
    recommendations: SarthiStreamRecommendation[],
  ): string {
    return `
You are Sarthi, an empathetic career counselor specializing in Jammu & Kashmir students and understanding parental concerns about "fast earning" and job security.

STUDENT PROFILE:
- Age: ${userProfile.age || "Not specified"}
- Location: ${userProfile.location?.district || userProfile.location?.city || "J&K"}
- Interests: ${userProfile.interests.join(", ")}
- Family Income: ${userProfile.family_background?.income_range || "Not specified"}
- Parent Concerns: ${userProfile.concerns?.join(", ") || "Job security, fast earning"}

CURRENT RECOMMENDATIONS:
${JSON.stringify(recommendations.slice(0, 3), null, 2)}

Please provide a response that addresses:

1. PARENT-FRIENDLY EXPLANATION (2-3 sentences):
   - Why the recommended stream makes financial sense
   - How it addresses "fast earning" concerns
   - Government job opportunities available

2. STUDENT MOTIVATION (2-3 sentences):
   - Why this choice aligns with their interests and aptitude
   - Future opportunities and growth potential
   - How they can excel in this field

3. ADDRESSING ALTERNATIVES (1-2 sentences per alternative):
   - If parents prefer a different option, compare it fairly
   - Show pros and cons with ROI perspective

4. ACTION PLAN (5 specific steps):
   - Immediate next steps for the student
   - How to prepare for the chosen stream
   - Scholarship application guidance
   - College selection tips
   - Timeline for decisions

Keep the tone empathetic, practical, and focused on both student dreams and parental security concerns. Use specific salary figures and timelines. Mention J&K-specific opportunities where relevant.

Format your response as structured text, not JSON.
`;
  }

  /**
   * Parse Sarthi AI response and format recommendations
   */
  private parseSarthiResponse(
    aiText: string,
    userProfile: SarthiUserProfile,
    basicRecommendations: SarthiStreamRecommendation[],
  ): {
    primary_recommendation: SarthiStreamRecommendation;
    alternatives: SarthiStreamRecommendation[];
    parent_friendly_summary: string;
    student_motivation: string;
    action_plan: string[];
  } {
    // Extract sections from AI response
    const sections = this.extractSections(aiText);

    return {
      primary_recommendation: {
        ...basicRecommendations[0],
        reasoning:
          (sections.parent_explanation as string) || basicRecommendations[0].reasoning,
      },
      alternatives: basicRecommendations.slice(1, 3).map((rec) => ({
        ...rec,
        reasoning: (sections.alternatives as string) || rec.reasoning,
      })),
      parent_friendly_summary:
        (sections.parent_explanation as string) ||
        this.generateDefaultParentSummary(basicRecommendations[0]),
      student_motivation:
        (sections.student_motivation as string) ||
        this.generateDefaultStudentMotivation(basicRecommendations[0]),
      action_plan:
        (sections.action_plan as string[]) ||
        this.generateDefaultActionPlan(userProfile, basicRecommendations[0]),
    };
  }

  /**
   * Extract sections from AI response
   */
  private extractSections(text: string): Record<string, unknown> {
    const sections: Record<string, unknown> = {};

    const parentMatch = text.match(
      /PARENT-FRIENDLY EXPLANATION[:\s]+([\s\S]*?)(?=STUDENT MOTIVATION|$)/,
    );
    if (parentMatch) sections.parent_explanation = parentMatch[1].trim();

    const studentMatch = text.match(
      /STUDENT MOTIVATION[:\s]+([\s\S]*?)(?=ADDRESSING ALTERNATIVES|ACTION PLAN|$)/,
    );
    if (studentMatch) sections.student_motivation = studentMatch[1].trim();

    const alternativesMatch = text.match(
      /ADDRESSING ALTERNATIVES[:\s]+([\s\S]*?)(?=ACTION PLAN|$)/,
    );
    if (alternativesMatch) sections.alternatives = alternativesMatch[1].trim();

    const actionMatch = text.match(/ACTION PLAN[:\s]+([\s\S]*?)$/);
    if (actionMatch) {
      const actionText = actionMatch[1].trim();
      sections.action_plan = actionText
        .split(/\d+\./)
        .filter((step) => step.trim())
        .map((step) => step.trim());
    }

    return sections;
  }

  /**
   * Format basic recommendations when AI is not available
   */
  private formatBasicRecommendations(
    userProfile: SarthiUserProfile,
    recommendations: SarthiStreamRecommendation[],
  ): {
    primary_recommendation: SarthiStreamRecommendation;
    alternatives: SarthiStreamRecommendation[];
    parent_friendly_summary: string;
    student_motivation: string;
    action_plan: string[];
  } {
    return {
      primary_recommendation: recommendations[0],
      alternatives: recommendations.slice(1, 3),
      parent_friendly_summary: this.generateDefaultParentSummary(
        recommendations[0],
      ),
      student_motivation: this.generateDefaultStudentMotivation(
        recommendations[0],
      ),
      action_plan: this.generateDefaultActionPlan(
        userProfile,
        recommendations[0],
      ),
    };
  }

  /**
   * Generate default parent-friendly summary
   */
  private generateDefaultParentSummary(
    recommendation: SarthiStreamRecommendation,
  ): string {
    const roi = recommendation.roi_analysis;
    const govtJobs = recommendation.career_paths.filter(
      (c) => c.job_security === "high",
    ).length;

    return `${recommendation.stream.charAt(0).toUpperCase() + recommendation.stream.slice(1)} stream offers excellent financial prospects with earning potential starting from ₹${(roi.early_career_salary.min / 100000).toFixed(1)} LPA and growing to ₹${(roi.mid_career_salary.min / 100000).toFixed(1)} LPA within ${roi.break_even_years + 3} years. With ${govtJobs} government job opportunities and ${roi.roi_percentage}% return on investment, this choice provides both security and growth that parents value.`;
  }

  /**
   * Generate default student motivation
   */
  private generateDefaultStudentMotivation(
    recommendation: SarthiStreamRecommendation,
  ): string {
    return `Your aptitude and interests align perfectly with ${recommendation.stream}, opening doors to exciting careers like ${recommendation.career_paths
      .slice(0, 2)
      .map((c) => c.career)
      .join(
        " and ",
      )}. This field is experiencing ${recommendation.career_paths[0]?.growth_rate || 10}% annual growth, meaning abundant opportunities for someone with your potential. You'll be solving real-world problems while building a rewarding career that matches your passions.`;
  }

  /**
   * Generate default action plan
   */
  private generateDefaultActionPlan(
    userProfile: SarthiUserProfile,
    recommendation: SarthiStreamRecommendation,
  ): string[] {
    const stream = recommendation.stream;
    const currentClass = userProfile.class_level;

    return [
      `Choose ${recommendation.required_subjects.join(", ")} as your main subjects for Class ${currentClass === "10" ? "11-12" : "12"}`,
      `Apply for ${recommendation.scholarships_available[0]} scholarship by December ${new Date().getFullYear()}`,
      `Research top 5 colleges in J&K offering ${stream} programs using our college finder`,
      `Start preparation for entrance exams relevant to ${stream} (${stream === "science" ? "JEE/NEET" : stream === "commerce" ? "CA Foundation" : "CUET"})`,
      `Connect with professionals in ${recommendation.career_paths[0]?.career} field through LinkedIn or local networks`,
    ];
  }

  /**
   * Get nearby colleges with enhanced Google Maps integration
   */
  async getNearbyCollegesForStream(
    userProfile: SarthiUserProfile,
    stream: string,
  ): Promise<Record<string, unknown>[]> {
    try {
      if (!userProfile.location?.city) {
        return [];
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003";
      const response = await fetch(`${baseUrl}/api/colleges/nearby-by-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: userProfile.location,
          stream: stream,
          radius: 50000, // 50km radius for J&K
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.colleges || [];
      }
    } catch (error) {
      console.error("Error fetching nearby colleges:", error);
    }

    return [];
  }
}

// Export singleton instance
export const sarthiAI = new SarthiAI();
