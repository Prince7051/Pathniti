/**
 * Offline-First Quiz Manager for PathNiti
 * Handles quiz functionality with offline capabilities and intelligent sync
 */

import { offlineStorage } from "./offline-storage";
import { syncEngine } from "./sync-engine";
import { supabase } from "./supabase";

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  category: string;
  subcategory?: string;
  options: string[];
  correct_answer?: number;
  time_limit: number;
  scoring_weight: number;
  is_active: boolean;
}

export interface QuizResponse {
  question_id: string;
  selected_answer: number;
  time_taken: number;
  question_type: string;
  category: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  status: "not_started" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
  total_questions: number;
  answered_questions: number;
  time_spent: number;
  session_type: string;
  synced: boolean;
}

export interface QuizResult {
  session_id: string;
  total_score: number;
  aptitude_scores: Record<string, number>;
  riasec_scores: Record<string, number>;
  personality_scores: Record<string, number>;
  subject_performance: Record<string, { accuracy: number; speed: number }>;
  practical_constraints?: Record<string, string>;
  recommendations?: unknown[];
}

class OfflineQuizManager {
  private isOnline = typeof window !== "undefined" ? navigator.onLine : true;
  private questionsCache: QuizQuestion[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners();
      this.initializeQuestionsCache();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private async initializeQuestionsCache(): Promise<void> {
    try {
      await offlineStorage.initialize();
      await this.loadQuestionsCache();
    } catch (error) {
      console.error("Failed to initialize quiz manager:", error);
    }
  }

  private async loadQuestionsCache(): Promise<void> {
    const now = Date.now();

    // Check if cache is still valid
    if (
      this.questionsCache.length > 0 &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return;
    }

    try {
      if (this.isOnline) {
        // Fetch fresh questions from server
        const { data: questions, error } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("is_active", true)
          .order("category, question_type");

        if (error) {
          console.error("Failed to fetch questions:", error);
          return;
        }

        this.questionsCache = questions || [];
        this.cacheTimestamp = now;

        // Cache questions for offline use
        await this.cacheQuestionsForOffline(questions || []);
      } else {
        // Load from offline cache
        await this.loadQuestionsFromOfflineCache();
      }
    } catch (error) {
      console.error("Error loading questions cache:", error);
      // Fallback to offline cache
      await this.loadQuestionsFromOfflineCache();
    }
  }

  private async cacheQuestionsForOffline(
    questions: QuizQuestion[],
  ): Promise<void> {
    try {
      // Store questions in localStorage for offline access
      localStorage.setItem(
        "quiz_questions_cache",
        JSON.stringify({
          questions,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error("Failed to cache questions:", error);
    }
  }

  private async loadQuestionsFromOfflineCache(): Promise<void> {
    try {
      const cached = localStorage.getItem("quiz_questions_cache");
      if (cached) {
        const { questions, timestamp } = JSON.parse(cached);
        this.questionsCache = questions || [];
        this.cacheTimestamp = timestamp || 0;
      }
    } catch (error) {
      console.error("Failed to load questions from cache:", error);
    }
  }

  public async startQuizSession(
    userId: string,
    sessionType: string = "comprehensive",
  ): Promise<QuizSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: QuizSession = {
      id: sessionId,
      user_id: userId,
      status: "in_progress",
      started_at: new Date().toISOString(),
      total_questions: 0,
      answered_questions: 0,
      time_spent: 0,
      session_type: sessionType,
      synced: false,
    };

    try {
      // Save session to offline storage
      await offlineStorage.saveAssessmentSession({
        user_id: userId,
        status: "in_progress",
        started_at: session.started_at,
        total_score: 0,
        total_questions: 0,
        answered_questions: 0,
        time_spent: 0,
        session_type: sessionType,
      });

      return session;
    } catch (error) {
      console.error("Failed to start quiz session:", error);
      throw error;
    }
  }

  public async getQuestionsForSession(
    sessionType: string = "comprehensive",
    limit: number = 50,
  ): Promise<QuizQuestion[]> {
    await this.loadQuestionsCache();

    if (this.questionsCache.length === 0) {
      throw new Error(
        "No questions available. Please check your internet connection.",
      );
    }

    // Filter questions based on session type
    let filteredQuestions = this.questionsCache;

    if (sessionType === "aptitude_only") {
      filteredQuestions = this.questionsCache.filter(
        (q) => q.question_type === "aptitude",
      );
    } else if (sessionType === "interest_only") {
      filteredQuestions = this.questionsCache.filter(
        (q) => q.question_type === "riasec_interest",
      );
    } else if (sessionType === "personality_only") {
      filteredQuestions = this.questionsCache.filter(
        (q) => q.question_type === "personality",
      );
    }

    // Shuffle and limit questions
    const shuffled = this.shuffleArray([...filteredQuestions]);
    return shuffled.slice(0, limit);
  }

  public async submitAnswer(
    sessionId: string,
    response: QuizResponse,
  ): Promise<void> {
    try {
      // Save response to offline storage
      await offlineStorage.saveQuizResponse({
        session_id: sessionId,
        question_id: response.question_id,
        user_answer: response.selected_answer,
        time_taken: response.time_taken,
        is_correct: this.calculateCorrectness(response),
        answered_at: new Date().toISOString(),
      });

      // Update session progress
      await this.updateSessionProgress(sessionId, response.time_taken);

      // If online, try to sync immediately
      if (this.isOnline) {
        await this.syncPendingData();
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      throw error;
    }
  }

  private calculateCorrectness(response: QuizResponse): boolean | undefined {
    const question = this.questionsCache.find(
      (q) => q.id === response.question_id,
    );
    if (!question || question.correct_answer === undefined) {
      return undefined; // No correct answer defined (e.g., for interest/personality questions)
    }
    return response.selected_answer === question.correct_answer;
  }

  private async updateSessionProgress(
    sessionId: string,
    timeSpent: number,
  ): Promise<void> {
    try {
      const session = await offlineStorage.getAssessmentSession(sessionId);
      if (session) {
        await offlineStorage.updateAssessmentSession(sessionId, {
          answered_questions: session.answered_questions + 1,
          time_spent: session.time_spent + timeSpent,
        });
      }
    } catch (error) {
      console.error("Failed to update session progress:", error);
    }
  }

  public async completeQuizSession(
    sessionId: string,
    practicalConstraints?: Record<string, string>,
  ): Promise<QuizResult> {
    try {
      // Get all responses for this session
      const responses = await offlineStorage.getQuizResponses(sessionId);
      const session = await offlineStorage.getAssessmentSession(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      // Calculate scores
      const scores = this.calculateScores(responses);

      // Update session with final data
      await offlineStorage.updateAssessmentSession(sessionId, {
        status: "completed",
        completed_at: new Date().toISOString(),
        aptitude_scores: scores.aptitude_scores,
        riasec_scores: scores.riasec_scores,
        personality_scores: scores.personality_scores,
        subject_performance: scores.subject_performance,
        practical_constraints: practicalConstraints,
        total_score: scores.total_score,
      });

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        scores,
      );

      const result: QuizResult = {
        session_id: sessionId,
        total_score: scores.total_score,
        aptitude_scores: scores.aptitude_scores,
        riasec_scores: scores.riasec_scores,
        personality_scores: scores.personality_scores,
        subject_performance: scores.subject_performance,
        practical_constraints: practicalConstraints,
        recommendations,
      };

      // If online, sync immediately
      if (this.isOnline) {
        await this.syncPendingData();
      }

      return result;
    } catch (error) {
      console.error("Failed to complete quiz session:", error);
      throw error;
    }
  }

  private calculateScores(responses: unknown[]): {
    total_score: number;
    aptitude_scores: Record<string, number>;
    riasec_scores: Record<string, number>;
    personality_scores: Record<string, number>;
    subject_performance: Record<string, { accuracy: number; speed: number }>;
  } {
    const aptitudeScores: Record<string, number[]> = {};
    const riasecScores: Record<string, number[]> = {};
    const personalityScores: Record<string, number[]> = {};
    const subjectScores: Record<
      string,
      { accuracy: number[]; speed: number[] }
    > = {};

    (responses as { question_id: string; [key: string]: unknown }[]).forEach((response) => {
      const question = this.questionsCache.find(
        (q) => q.id === response.question_id,
      );
      if (!question) return;

      const score = (response.user_answer as number) + 1; // Convert 0-based to 1-based scoring

      if (question.question_type === "aptitude") {
        if (!aptitudeScores[question.category])
          aptitudeScores[question.category] = [];
        aptitudeScores[question.category].push(score);
      } else if (question.question_type === "riasec_interest") {
        if (!riasecScores[question.category])
          riasecScores[question.category] = [];
        riasecScores[question.category].push(score);
      } else if (question.question_type === "personality") {
        if (!personalityScores[question.category])
          personalityScores[question.category] = [];
        personalityScores[question.category].push(score);
      } else if (question.question_type === "subject_performance") {
        if (!subjectScores[question.category]) {
          subjectScores[question.category] = { accuracy: [], speed: [] };
        }
        subjectScores[question.category].accuracy.push(score);
        subjectScores[question.category].speed.push(score);
      }
    });

    // Calculate averages
    const calculateAverage = (scores: number[]) =>
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 20)
        : 50;

    const aptitude_scores = Object.fromEntries(
      Object.entries(aptitudeScores).map(([category, scores]) => [
        category,
        calculateAverage(scores),
      ]),
    );

    const riasec_scores = Object.fromEntries(
      Object.entries(riasecScores).map(([category, scores]) => [
        category,
        calculateAverage(scores),
      ]),
    );

    const personality_scores = Object.fromEntries(
      Object.entries(personalityScores).map(([category, scores]) => [
        category,
        calculateAverage(scores),
      ]),
    );

    const subject_performance = Object.fromEntries(
      Object.entries(subjectScores).map(([category, scores]) => [
        category,
        {
          accuracy: calculateAverage(scores.accuracy),
          speed: calculateAverage(scores.speed),
        },
      ]),
    );

    const total_score = Math.round(
      (Object.values(aptitude_scores).reduce((a, b) => a + b, 0) +
        Object.values(riasec_scores).reduce((a, b) => a + b, 0) +
        Object.values(personality_scores).reduce((a, b) => a + b, 0)) /
        3,
    );

    return {
      total_score,
      aptitude_scores,
      riasec_scores,
      personality_scores,
      subject_performance,
    };
  }

  private async generateRecommendations(
    scores: Record<string, unknown>,
    // practicalConstraints?: Record<string, string>, // Unused in offline mode
  ): Promise<unknown[]> {
    // Generate rule-based recommendations for offline use
    const recommendations = [];

    // Stream recommendations based on RIASEC scores
    const riasecScores = scores.riasec_scores;
    const topInterest = Object.entries(riasecScores as Record<string, number>).sort(
      ([, a], [, b]) => (b as number) - (a as number),
    )[0];

    if (topInterest) {
      const [interest, score] = topInterest;
      let recommendedStream = "arts";

      switch (interest) {
        case "realistic":
          recommendedStream = "science";
          break;
        case "investigative":
          recommendedStream = "science";
          break;
        case "artistic":
          recommendedStream = "arts";
          break;
        case "social":
          recommendedStream = "arts";
          break;
        case "enterprising":
          recommendedStream = "commerce";
          break;
        case "conventional":
          recommendedStream = "commerce";
          break;
      }

      recommendations.push({
        type: "stream_recommendation",
        title: `Recommended Stream: ${recommendedStream.toUpperCase()}`,
        description: `Based on your ${interest} interests (score: ${score}), we recommend the ${recommendedStream} stream.`,
        confidence: Math.min((score as number) / 100, 1),
        reasoning: [
          `High ${interest} interest score (${score}%)`,
          `Strong alignment with ${recommendedStream} stream requirements`,
          "Good career prospects in this field",
        ],
      });
    }

    // Career recommendations based on aptitude scores
    const aptitudeScores = scores.aptitude_scores;
    const topAptitude = Object.entries(aptitudeScores as Record<string, number>).sort(
      ([, a], [, b]) => (b as number) - (a as number),
    )[0];

    if (topAptitude) {
      const [aptitude, score] = topAptitude;
      let careerSuggestion = "General career guidance";

      switch (aptitude) {
        case "logical_reasoning":
          careerSuggestion = "Engineering, Computer Science, Mathematics";
          break;
        case "quantitative_skills":
          careerSuggestion = "Finance, Economics, Statistics, Engineering";
          break;
        case "language_verbal_skills":
          careerSuggestion = "Literature, Journalism, Law, Teaching";
          break;
        case "spatial_visual_skills":
          careerSuggestion = "Architecture, Design, Engineering, Art";
          break;
        case "memory_attention":
          careerSuggestion = "Medicine, Research, Law, Teaching";
          break;
      }

      recommendations.push({
        type: "career_recommendation",
        title: "Career Suggestions",
        description: `Your strong ${aptitude.replace("_", " ")} skills (${score}%) suggest careers in: ${careerSuggestion}`,
        confidence: Math.min((score as number) / 100, 1),
        reasoning: [
          `High ${aptitude.replace("_", " ")} score (${score}%)`,
          "Strong foundation for related careers",
          "Good potential for success in these fields",
        ],
      });
    }

    return recommendations;
  }

  public async getQuizHistory(/* userId: string */): Promise<QuizSession[]> {
    try {
      // This would typically fetch from the server, but for offline-first,
      // we'll return cached sessions
      // const stats = await offlineStorage.getStorageStats(); // Unused in offline mode
      return []; // Placeholder - would implement proper history retrieval
    } catch (error) {
      console.error("Failed to get quiz history:", error);
      return [];
    }
  }

  public async syncPendingData(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      await syncEngine.triggerSync();
    } catch (error) {
      console.error("Failed to sync pending data:", error);
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public async getCachedQuestionsCount(): Promise<number> {
    await this.loadQuestionsCache();
    return this.questionsCache.length;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export singleton instance
export const offlineQuizManager = new OfflineQuizManager();
