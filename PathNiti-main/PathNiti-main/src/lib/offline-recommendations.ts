/**
 * Offline-First Recommendations System for PathNiti
 * Provides rule-based recommendations with AI fallback for offline scenarios
 */

import { offlineStorage } from "./offline-storage";
import { supabase } from "./supabase";

export interface RecommendationRequest {
  user_id: string;
  assessment_scores?: {
    aptitude_scores: Record<string, number>;
    riasec_scores: Record<string, number>;
    personality_scores: Record<string, number>;
    subject_performance: Record<string, { accuracy: number; speed: number }>;
  };
  practical_constraints?: {
    location: string;
    financial_background: string;
    parental_expectation: string;
  };
  user_profile?: {
    class_level: string;
    stream?: string;
    interests: string[];
    location: Record<string, unknown>;
  };
}

export interface StreamRecommendation {
  stream: string;
  confidence: number;
  reasoning: string[];
  career_prospects: string[];
  required_subjects: string[];
  difficulty_level: "easy" | "medium" | "hard";
  job_market_demand: "low" | "medium" | "high";
}

export interface CollegeRecommendation {
  college_id: string;
  college_name: string;
  match_score: number;
  reasons: string[];
  programs_offered: string[];
  admission_criteria: string;
  fee_structure: string;
  location: string;
  distance_from_user?: number;
}

export interface CareerRecommendation {
  career_name: string;
  description: string;
  required_education: string;
  salary_range: string;
  job_market_demand: "low" | "medium" | "high";
  growth_prospects: "low" | "medium" | "high";
  required_skills: string[];
  related_streams: string[];
}

export interface ScholarshipRecommendation {
  scholarship_id: string;
  scholarship_name: string;
  amount: string;
  eligibility_match: number;
  application_deadline: string;
  application_process: string;
  reasons: string[];
}

export interface RecommendationResult {
  stream_recommendations: StreamRecommendation[];
  college_recommendations: CollegeRecommendation[];
  career_recommendations: CareerRecommendation[];
  scholarship_recommendations: ScholarshipRecommendation[];
  offline_mode: boolean;
  confidence_score: number;
  generated_at: string;
}

class OfflineRecommendationsEngine {
  private isOnline = typeof window !== "undefined" ? navigator.onLine : true;
  private cachedColleges: unknown[] = [];
  private cachedScholarships: unknown[] = [];
  private cachedCareers: unknown[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners();
      this.initializeCache();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.refreshCache();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private async initializeCache(): Promise<void> {
    try {
      await offlineStorage.initialize();
      await this.loadCachedData();
    } catch (error) {
      console.error("Failed to initialize recommendations engine:", error);
    }
  }

  private async loadCachedData(): Promise<void> {
    try {
      this.cachedColleges = await offlineStorage.getCachedColleges();
      this.cachedScholarships = await offlineStorage.getCachedScholarships();
      this.cachedCareers = await this.getCachedCareers();
    } catch (error) {
      console.error("Failed to load cached data:", error);
    }
  }

  private async refreshCache(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Refresh colleges cache
      const { data: colleges, error: collegeError } = await supabase
        .from("colleges")
        .select(
          `
          id, name, type, location, address, website, phone, email,
          established_year, accreditation, facilities, is_active,
          programs(name, stream, level, duration, eligibility, fees)
        `,
        )
        .eq("is_active", true)
        .limit(100);

      if (!collegeError && colleges) {
        this.cachedColleges = colleges;
        await offlineStorage.cacheColleges(
          colleges.map((college) => ({
            ...(college as any),
            cached_at: new Date().toISOString(),
            last_synced: new Date().toISOString(),
          })) as any,
        );
      }

      // Refresh scholarships cache
      const { data: scholarships, error: scholarshipError } = await supabase
        .from("scholarships")
        .select("*")
        .eq("is_active", true)
        .limit(50);

      if (!scholarshipError && scholarships) {
        this.cachedScholarships = scholarships;
        await offlineStorage.cacheScholarships(
          scholarships.map((scholarship) => ({
            ...(scholarship as any),
            cached_at: new Date().toISOString(),
            last_synced: new Date().toISOString(),
          })) as any,
        );
      }
    } catch (error) {
      console.error("Failed to refresh cache:", error);
    }
  }

  private getCachedCareers(): unknown[] {
    // Static career data for offline use
    return [
      {
        id: "career_1",
        name: "Software Engineer",
        description: "Design and develop software applications",
        required_education: "Bachelor in Computer Science/Engineering",
        salary_range: "₹4-15 LPA",
        job_market_demand: "high",
        growth_prospects: "high",
        required_skills: ["Programming", "Problem Solving", "Mathematics"],
        related_streams: ["science", "engineering"],
        riasec_types: ["investigative", "realistic"],
      },
      {
        id: "career_2",
        name: "Doctor",
        description: "Diagnose and treat medical conditions",
        required_education: "MBBS + Specialization",
        salary_range: "₹6-25 LPA",
        job_market_demand: "high",
        growth_prospects: "high",
        required_skills: ["Biology", "Chemistry", "Empathy", "Problem Solving"],
        related_streams: ["science", "medical"],
        riasec_types: ["investigative", "social"],
      },
      {
        id: "career_3",
        name: "Teacher",
        description: "Educate and mentor students",
        required_education: "Bachelor + B.Ed",
        salary_range: "₹3-8 LPA",
        job_market_demand: "medium",
        growth_prospects: "medium",
        required_skills: ["Communication", "Patience", "Subject Knowledge"],
        related_streams: ["arts", "science", "commerce"],
        riasec_types: ["social", "artistic"],
      },
      {
        id: "career_4",
        name: "Business Analyst",
        description: "Analyze business processes and recommend improvements",
        required_education: "Bachelor in Commerce/Business",
        salary_range: "₹4-12 LPA",
        job_market_demand: "high",
        growth_prospects: "high",
        required_skills: ["Analytics", "Communication", "Problem Solving"],
        related_streams: ["commerce", "science"],
        riasec_types: ["investigative", "enterprising"],
      },
      {
        id: "career_5",
        name: "Graphic Designer",
        description: "Create visual content for various media",
        required_education: "Bachelor in Fine Arts/Design",
        salary_range: "₹3-10 LPA",
        job_market_demand: "medium",
        growth_prospects: "medium",
        required_skills: [
          "Creativity",
          "Design Software",
          "Visual Communication",
        ],
        related_streams: ["arts"],
        riasec_types: ["artistic", "realistic"],
      },
    ];
  }

  public async generateRecommendations(
    request: RecommendationRequest,
  ): Promise<RecommendationResult> {
    // const startTime = Date.now(); // Performance tracking disabled for offline mode

    try {
      // Generate recommendations based on available data
      const streamRecommendations =
        await this.generateStreamRecommendations(request);
      const collegeRecommendations =
        await this.generateCollegeRecommendations(request);
      const careerRecommendations =
        await this.generateCareerRecommendations(request);
      const scholarshipRecommendations =
        await this.generateScholarshipRecommendations(request);

      // Calculate overall confidence score
      const confidenceScore = this.calculateConfidenceScore(
        streamRecommendations,
        collegeRecommendations,
        careerRecommendations,
        scholarshipRecommendations,
      );

      return {
        stream_recommendations: streamRecommendations,
        college_recommendations: collegeRecommendations,
        career_recommendations: careerRecommendations,
        scholarship_recommendations: scholarshipRecommendations,
        offline_mode: !this.isOnline,
        confidence_score: confidenceScore,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      throw error;
    }
  }

  private async generateStreamRecommendations(
    request: RecommendationRequest,
  ): Promise<StreamRecommendation[]> {
    const recommendations: StreamRecommendation[] = [];
    const { assessment_scores, user_profile } = request;

    if (!assessment_scores?.riasec_scores) {
      // Fallback recommendations based on user profile
      return this.getFallbackStreamRecommendations(user_profile);
    }

    const riasecScores = assessment_scores.riasec_scores;
    const aptitudeScores = assessment_scores.aptitude_scores || {};

    // Sort RIASEC scores to find top interests
    const sortedInterests = Object.entries(riasecScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [interest, score] of sortedInterests) {
      const streamRec = this.mapInterestToStream(
        interest,
        score,
      );
      if (streamRec) {
        recommendations.push(streamRec);
      }
    }

    // Add science stream if logical reasoning is high
    if (
      aptitudeScores.logical_reasoning &&
      aptitudeScores.logical_reasoning > 70
    ) {
      const scienceRec = this.createStreamRecommendation(
        "science",
        0.8,
        [
          "Strong logical reasoning skills",
          "Good foundation for science subjects",
        ],
        ["Engineering", "Medicine", "Research", "Technology"],
        ["Mathematics", "Physics", "Chemistry", "Biology"],
        "medium",
        "high",
      );
      recommendations.push(scienceRec);
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  private mapInterestToStream(
    interest: string,
    score: number,
    // aptitudeScores: Record<string, number>, // Unused in offline mode
  ): StreamRecommendation | null {
    const confidence = Math.min(score / 100, 1);

    switch (interest) {
      case "realistic":
        return this.createStreamRecommendation(
          "science",
          confidence,
          [`High realistic interest (${score}%)`, "Good for hands-on careers"],
          ["Engineering", "Agriculture", "Technical Trades", "Architecture"],
          ["Mathematics", "Physics", "Chemistry"],
          "medium",
          "high",
        );

      case "investigative":
        return this.createStreamRecommendation(
          "science",
          confidence,
          [
            `High investigative interest (${score}%)`,
            "Strong analytical thinking",
          ],
          ["Research", "Medicine", "Engineering", "Data Science"],
          ["Mathematics", "Physics", "Chemistry", "Biology"],
          "hard",
          "high",
        );

      case "artistic":
        return this.createStreamRecommendation(
          "arts",
          confidence,
          [`High artistic interest (${score}%)`, "Creative and expressive"],
          ["Design", "Media", "Literature", "Fine Arts"],
          ["English", "History", "Fine Arts", "Literature"],
          "easy",
          "medium",
        );

      case "social":
        return this.createStreamRecommendation(
          "arts",
          confidence,
          [
            `High social interest (${score}%)`,
            "People-oriented and empathetic",
          ],
          ["Teaching", "Counseling", "Social Work", "Psychology"],
          ["English", "History", "Psychology", "Sociology"],
          "easy",
          "medium",
        );

      case "enterprising":
        return this.createStreamRecommendation(
          "commerce",
          confidence,
          [
            `High enterprising interest (${score}%)`,
            "Leadership and business acumen",
          ],
          ["Business", "Management", "Sales", "Entrepreneurship"],
          ["Mathematics", "Economics", "Business Studies", "Accountancy"],
          "medium",
          "high",
        );

      case "conventional":
        return this.createStreamRecommendation(
          "commerce",
          confidence,
          [
            `High conventional interest (${score}%)`,
            "Organized and detail-oriented",
          ],
          ["Banking", "Finance", "Administration", "Accounting"],
          ["Mathematics", "Economics", "Accountancy", "Business Studies"],
          "easy",
          "high",
        );

      default:
        return null;
    }
  }

  private createStreamRecommendation(
    stream: string,
    confidence: number,
    reasoning: string[],
    careerProspects: string[],
    requiredSubjects: string[],
    difficultyLevel: "easy" | "medium" | "hard",
    jobMarketDemand: "low" | "medium" | "high",
  ): StreamRecommendation {
    return {
      stream,
      confidence,
      reasoning,
      career_prospects: careerProspects,
      required_subjects: requiredSubjects,
      difficulty_level: difficultyLevel,
      job_market_demand: jobMarketDemand,
    };
  }

  private getFallbackStreamRecommendations(
    userProfile?: Record<string, unknown>,
  ): StreamRecommendation[] {
    const recommendations: StreamRecommendation[] = [];

    // Default recommendations based on class level
    if (userProfile?.class_level === "10") {
      recommendations.push(
        this.createStreamRecommendation(
          "science",
          0.7,
          ["Most popular choice", "Good career prospects", "Flexible options"],
          ["Engineering", "Medicine", "Research", "Technology"],
          ["Mathematics", "Physics", "Chemistry", "Biology"],
          "medium",
          "high",
        ),
        this.createStreamRecommendation(
          "commerce",
          0.6,
          ["Growing demand", "Business opportunities", "Stable career paths"],
          ["Business", "Finance", "Management", "Banking"],
          ["Mathematics", "Economics", "Business Studies", "Accountancy"],
          "easy",
          "high",
        ),
        this.createStreamRecommendation(
          "arts",
          0.5,
          ["Creative fields", "Humanities", "Social sciences"],
          ["Teaching", "Media", "Design", "Literature"],
          ["English", "History", "Political Science", "Psychology"],
          "easy",
          "medium",
        ),
      );
    }

    return recommendations;
  }

  private async generateCollegeRecommendations(
    request: RecommendationRequest,
  ): Promise<CollegeRecommendation[]> {
    const recommendations: CollegeRecommendation[] = [];
    const { user_profile, practical_constraints } = request;

    if (this.cachedColleges.length === 0) {
      await this.loadCachedData();
    }

    // Filter colleges based on user preferences
    let filteredColleges = this.cachedColleges;

    if (user_profile?.location?.state) {
      filteredColleges = filteredColleges.filter(
        (college) => (college as { location?: { state?: string } }).location?.state === user_profile.location.state,
      );
    }

    if (practical_constraints?.financial_background === "low") {
      filteredColleges = filteredColleges.filter(
        (college) => {
          const collegeType = (college as { type?: string }).type;
          return collegeType === "government" || collegeType === "government_aided";
        },
      );
    }

    // Score and rank colleges
    for (const college of filteredColleges.slice(0, 10)) {
      const collegeData = college as {
        id: string;
        name: string;
        programs?: Array<{ name: string; eligibility?: string; fees?: string }>;
        location?: { city?: string; state?: string };
      };
      const matchScore = this.calculateCollegeMatchScore(college as Record<string, unknown>, request);
      const reasons = this.generateCollegeMatchReasons(college as Record<string, unknown>, request);

      if (matchScore > 0.3) {
        // Only include colleges with reasonable match
        recommendations.push({
          college_id: collegeData.id,
          college_name: collegeData.name,
          match_score: matchScore,
          reasons,
          programs_offered: collegeData.programs?.map((p) => p.name) || [],
          admission_criteria:
            collegeData.programs?.[0]?.eligibility || "Check college website",
          fee_structure: collegeData.programs?.[0]?.fees || "Contact college",
          location: `${collegeData.location?.city}, ${collegeData.location?.state}`,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);
  }

  private calculateCollegeMatchScore(
    college: Record<string, unknown>,
    request: RecommendationRequest,
  ): number {
    let score = 0.5; // Base score

    const { user_profile, practical_constraints } = request;

    // Location preference
    if (user_profile?.location?.state === (college as { location?: { state?: string } }).location?.state) {
      score += 0.2;
    }

    // Financial background match
    if (
      practical_constraints?.financial_background === "low" &&
      ((college as { type?: string }).type === "government" || (college as { type?: string }).type === "government_aided")
    ) {
      score += 0.2;
    }

    // College reputation (simplified)
    if ((college as { type?: string }).type === "government") {
      score += 0.1;
    }

    // Program availability
    const programs = (college as { programs?: unknown[] }).programs;
    if (programs && programs.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private generateCollegeMatchReasons(
    college: Record<string, unknown>,
    request: RecommendationRequest,
  ): string[] {
    const reasons: string[] = [];
    const { user_profile, practical_constraints } = request;

    if (user_profile?.location?.state === (college as { location?: { state?: string } }).location?.state) {
      reasons.push("Located in your preferred state");
    }

    if (
      practical_constraints?.financial_background === "low" &&
      ((college as { type?: string }).type === "government" || (college as { type?: string }).type === "government_aided")
    ) {
      reasons.push("Affordable fee structure");
    }

    if (college.type === "government") {
      reasons.push("Government college with good reputation");
    }

    const programs = (college as { programs?: unknown[] }).programs;
    if (programs && programs.length > 0) {
      reasons.push(`Offers ${programs.length} programs`);
    }

    return reasons;
  }

  private async generateCareerRecommendations(
    request: RecommendationRequest,
  ): Promise<CareerRecommendation[]> {
    const recommendations: CareerRecommendation[] = [];
    const { assessment_scores } = request;

    if (!assessment_scores?.riasec_scores) {
      return this.getFallbackCareerRecommendations();
    }

    const riasecScores = assessment_scores.riasec_scores;
    const topInterests = Object.entries(riasecScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    for (const [interest] of topInterests) {
      const matchingCareers = this.cachedCareers.filter((career) =>
        (career as { riasec_types?: string[] }).riasec_types?.includes(interest),
      );

      for (const career of matchingCareers.slice(0, 2)) {
        // const eligibilityMatch = this.calculateCareerEligibilityMatch(
        //   career as Record<string, unknown>,
        //   assessment_scores,
        // ); // Unused in offline mode

        const careerData = career as {
          name: string;
          description: string;
          required_education: string;
          salary_range: string;
          job_market_demand: string;
          growth_prospects: string;
          required_skills: string[];
          related_streams: string[];
        };
        recommendations.push({
          career_name: careerData.name,
          description: careerData.description,
          required_education: careerData.required_education,
          salary_range: careerData.salary_range,
          job_market_demand: careerData.job_market_demand as "high" | "medium" | "low",
          growth_prospects: careerData.growth_prospects as "high" | "medium" | "low",
          required_skills: careerData.required_skills,
          related_streams: careerData.related_streams,
        });
      }
    }

    return recommendations.slice(0, 5);
  }

  private calculateCareerEligibilityMatch(
    // career: Record<string, unknown>, // Unused in offline mode
    // assessmentScores: Record<string, unknown>, // Unused in offline mode
  ): number {
    // Simplified eligibility matching
    return 0.7; // Default match score
  }

  private getFallbackCareerRecommendations(): CareerRecommendation[] {
    return this.cachedCareers.slice(0, 3).map((career) => {
      const careerData = career as {
        name: string;
        description: string;
        required_education: string;
        salary_range: string;
        job_market_demand: "low" | "medium" | "high";
        growth_prospects: string;
        required_skills: string[];
        related_streams: string[];
      };
      return {
        career_name: careerData.name,
        description: careerData.description,
        required_education: careerData.required_education,
        salary_range: careerData.salary_range,
        job_market_demand: careerData.job_market_demand,
        growth_prospects: careerData.growth_prospects as "low" | "medium" | "high",
        required_skills: careerData.required_skills,
        related_streams: careerData.related_streams,
      };
    });
  }

  private async generateScholarshipRecommendations(
    request: RecommendationRequest,
  ): Promise<ScholarshipRecommendation[]> {
    const recommendations: ScholarshipRecommendation[] = [];
    // const { user_profile, practical_constraints } = request; // Unused in offline mode

    if (this.cachedScholarships.length === 0) {
      await this.loadCachedData();
    }

    for (const scholarship of this.cachedScholarships.slice(0, 5)) {
      const eligibilityMatch = this.calculateScholarshipEligibilityMatch(
        scholarship as Record<string, unknown>,
        request,
      );
      const reasons = this.generateScholarshipMatchReasons(
        scholarship as Record<string, unknown>,
        request,
      );

      if (eligibilityMatch > 0.3) {
        const scholarshipData = scholarship as {
          id: string;
          name: string;
          amount: string;
          application_deadline: string;
          application_process: string;
        };
        recommendations.push({
          scholarship_id: scholarshipData.id,
          scholarship_name: scholarshipData.name,
          amount: scholarshipData.amount,
          eligibility_match: eligibilityMatch,
          application_deadline: scholarshipData.application_deadline,
          application_process: scholarshipData.application_process,
          reasons,
        });
      }
    }

    return recommendations.sort(
      (a, b) => b.eligibility_match - a.eligibility_match,
    );
  }

  private calculateScholarshipEligibilityMatch(
    scholarship: Record<string, unknown>,
    request: RecommendationRequest,
  ): number {
    let match = 0.5; // Base match

    // const { user_profile, practical_constraints } = request; // Unused in offline mode

    // Financial need
    if (request.practical_constraints?.financial_background === "low") {
      match += 0.3;
    }

    // Academic performance (simplified)
    if (request.assessment_scores?.aptitude_scores) {
      const avgAptitude =
        Object.values(request.assessment_scores.aptitude_scores).reduce(
          (a, b) => a + b,
          0,
        ) / Object.keys(request.assessment_scores.aptitude_scores).length;

      if (avgAptitude > 70) {
        match += 0.2;
      }
    }

    return Math.min(match, 1.0);
  }

  private generateScholarshipMatchReasons(
    scholarship: Record<string, unknown>,
    request: RecommendationRequest,
  ): string[] {
    const reasons: string[] = [];
    const { practical_constraints } = request;

    if (practical_constraints?.financial_background === "low") {
      reasons.push("Matches your financial need");
    }

    if (request.assessment_scores?.aptitude_scores) {
      const avgAptitude =
        Object.values(request.assessment_scores.aptitude_scores).reduce(
          (a, b) => a + b,
          0,
        ) / Object.keys(request.assessment_scores.aptitude_scores).length;

      if (avgAptitude > 70) {
        reasons.push("Good academic performance");
      }
    }

    reasons.push("Active scholarship program");

    return reasons;
  }

  private calculateConfidenceScore(
    streamRecs: StreamRecommendation[],
    collegeRecs: CollegeRecommendation[],
    careerRecs: CareerRecommendation[],
    scholarshipRecs: ScholarshipRecommendation[],
  ): number {
    const streamConfidence =
      streamRecs.length > 0
        ? streamRecs.reduce((sum, rec) => sum + rec.confidence, 0) /
          streamRecs.length
        : 0;

    const collegeConfidence =
      collegeRecs.length > 0
        ? collegeRecs.reduce((sum, rec) => sum + rec.match_score, 0) /
          collegeRecs.length
        : 0;

    const scholarshipConfidence =
      scholarshipRecs.length > 0
        ? scholarshipRecs.reduce((sum, rec) => sum + rec.eligibility_match, 0) /
          scholarshipRecs.length
        : 0;

    const overallConfidence =
      (streamConfidence + collegeConfidence + scholarshipConfidence) / 3;

    // Reduce confidence if in offline mode
    return this.isOnline ? overallConfidence : overallConfidence * 0.8;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

}

// Export singleton instance
export const offlineRecommendationsEngine = new OfflineRecommendationsEngine();
