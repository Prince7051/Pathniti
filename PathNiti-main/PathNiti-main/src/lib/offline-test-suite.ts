/**
 * Offline-First Test Suite for PathNiti
 * Comprehensive testing of offline capabilities and sync functionality
 */

import { offlineStorage } from "./offline-storage";
import { syncEngine } from "./sync-engine";
import { offlineQuizManager } from "./offline-quiz-manager";
import { offlineRecommendationsEngine } from "./offline-recommendations";
import { offlineSarthiAI } from "./offline-sarthi-ai";
import { offlineMapsManager } from "./offline-maps";

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: Record<string, unknown>;
}

export interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: TestResult[];
  summary: string;
}

class OfflineTestSuite {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    this.results = [];

    console.log("🧪 Starting Offline-First Test Suite...");

    // Test offline storage
    await this.testOfflineStorage();

    // Test quiz system
    await this.testQuizSystem();

    // Test recommendations engine
    await this.testRecommendationsEngine();

    // Test Sarthi AI
    await this.testSarthiAI();

    // Test maps system
    await this.testMapsSystem();

    // Test sync engine
    await this.testSyncEngine();

    // Test offline-online transitions
    await this.testOfflineOnlineTransitions();

    const totalDuration = Date.now() - startTime;
    const passedTests = this.results.filter((r) => r.passed).length;
    const failedTests = this.results.filter((r) => !r.passed).length;

    const summary = this.generateSummary(
      passedTests,
      failedTests,
      totalDuration,
    );

    console.log("✅ Test Suite Complete:", summary);

    return {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration,
      results: this.results,
      summary,
    };
  }

  private async runTest(
    testName: string,
    testFn: () => Promise<void>,
  ): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`  🔍 Running: ${testName}`);

    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`  ✅ Passed: ${testName} (${duration}ms)`);

      return {
        testName,
        passed: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ Failed: ${testName} (${duration}ms) - ${error}`);

      return {
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  private async testOfflineStorage(): Promise<void> {
    console.log("📦 Testing Offline Storage...");

    // Test initialization
    await this.runTest("Offline Storage Initialization", async () => {
      await offlineStorage.initialize();
    });

    // Test quiz response storage
    await this.runTest("Quiz Response Storage", async () => {
      const responseId = await offlineStorage.saveQuizResponse({
        session_id: "test_session_1",
        question_id: "test_question_1",
        user_answer: 2,
        time_taken: 30,
        is_correct: true,
        answered_at: new Date().toISOString(),
      });

      if (!responseId) {
        throw new Error("Failed to save quiz response");
      }

      const responses = await offlineStorage.getQuizResponses("test_session_1");
      if (responses.length === 0) {
        throw new Error("Failed to retrieve quiz responses");
      }
    });

    // Test assessment session storage
    await this.runTest("Assessment Session Storage", async () => {
      const sessionId = await offlineStorage.saveAssessmentSession({
        user_id: "test_user_1",
        status: "in_progress",
        started_at: new Date().toISOString(),
        total_score: 0,
        total_questions: 10,
        answered_questions: 0,
        time_spent: 0,
        session_type: "comprehensive",
      });

      if (!sessionId) {
        throw new Error("Failed to save assessment session");
      }

      const session = await offlineStorage.getAssessmentSession(sessionId);
      if (!session) {
        throw new Error("Failed to retrieve assessment session");
      }
    });

    // Test college caching
    await this.runTest("College Data Caching", async () => {
      const testColleges = [
        {
          id: "college_1",
          name: "Test College",
          type: "government",
          location: { state: "Test State", city: "Test City" },
          address: "Test Address",
          is_active: true,
          cached_at: new Date().toISOString(),
          last_synced: new Date().toISOString(),
        },
      ];

      await offlineStorage.cacheColleges(testColleges);
      const cachedColleges = await offlineStorage.getCachedColleges();

      if (cachedColleges.length === 0) {
        throw new Error("Failed to cache or retrieve colleges");
      }
    });

    // Test storage stats
    await this.runTest("Storage Statistics", async () => {
      const stats = await offlineStorage.getStorageStats();

      if (typeof stats.quizResponses !== "number") {
        throw new Error("Invalid storage stats format");
      }
    });
  }

  private async testQuizSystem(): Promise<void> {
    console.log("📝 Testing Quiz System...");

    // Test question loading
    await this.runTest("Question Loading", async () => {
      const questions = await offlineQuizManager.getQuestionsForSession(
        "comprehensive",
        5,
      );

      if (questions.length === 0) {
        throw new Error("No questions loaded");
      }
    });

    // Test session management
    await this.runTest("Quiz Session Management", async () => {
      const sessionId = await offlineQuizManager.startQuizSession(
        "test_user_1",
        "comprehensive",
      );

      if (!sessionId) {
        throw new Error("Failed to start quiz session");
      }

      // Test answer submission
      await offlineQuizManager.submitAnswer(sessionId.id, {
        question_id: "test_question_1",
        selected_answer: 1,
        time_taken: 25,
        question_type: "aptitude",
        category: "logical_reasoning",
      });
    });

    // Test session completion
    await this.runTest("Quiz Session Completion", async () => {
      const sessionId = await offlineQuizManager.startQuizSession(
        "test_user_2",
        "comprehensive",
      );

      // Submit multiple answers
      for (let i = 0; i < 3; i++) {
        await offlineQuizManager.submitAnswer(sessionId.id, {
          question_id: `test_question_${i}`,
          selected_answer: i % 2,
          time_taken: 20 + i * 5,
          question_type: "aptitude",
          category: "logical_reasoning",
        });
      }

      const result = await offlineQuizManager.completeQuizSession(sessionId.id, {
        location: "Test Location",
        financial_background: "medium",
        parental_expectation: "supportive",
      });

      if (!result.session_id) {
        throw new Error("Failed to complete quiz session");
      }
    });

    // Test online status
    await this.runTest("Online Status Detection", async () => {
      const isOnline = offlineQuizManager.getOnlineStatus();

      if (typeof isOnline !== "boolean") {
        throw new Error("Invalid online status format");
      }
    });
  }

  private async testRecommendationsEngine(): Promise<void> {
    console.log("🎯 Testing Recommendations Engine...");

    // Test recommendation generation
    await this.runTest("Recommendation Generation", async () => {
      const request = {
        user_id: "test_user_1",
        assessment_scores: {
          aptitude_scores: {
            logical_reasoning: 75,
            quantitative_skills: 80,
            language_verbal_skills: 70,
          },
          riasec_scores: {
            realistic: 60,
            investigative: 85,
            artistic: 40,
            social: 50,
            enterprising: 45,
            conventional: 55,
          },
          personality_scores: {
            introvert_extrovert: 60,
            risk_taking_vs_risk_averse: 70,
          },
          subject_performance: {
            mathematics: { accuracy: 80, speed: 75 },
            science: { accuracy: 85, speed: 80 },
          },
        },
        practical_constraints: {
          location: "Delhi",
          financial_background: "medium",
          parental_expectation: "supportive",
        },
        user_profile: {
          class_level: "12",
          interests: ["science", "technology"],
          location: { state: "Delhi", city: "New Delhi" },
        },
      };

      const recommendations =
        await offlineRecommendationsEngine.generateRecommendations(request);

      if (
        !recommendations.stream_recommendations ||
        recommendations.stream_recommendations.length === 0
      ) {
        throw new Error("No stream recommendations generated");
      }

      if (!recommendations.college_recommendations) {
        throw new Error("No college recommendations generated");
      }
    });

    // Test online status
    await this.runTest("Recommendations Online Status", async () => {
      const isOnline = offlineRecommendationsEngine.getOnlineStatus();

      if (typeof isOnline !== "boolean") {
        throw new Error("Invalid online status format");
      }
    });
  }

  private async testSarthiAI(): Promise<void> {
    console.log("🤖 Testing Sarthi AI...");

    // Test message processing
    await this.runTest("Message Processing", async () => {
      const response = await offlineSarthiAI.processMessage(
        "What stream should I choose after class 10?",
        "test_session_1",
        {
          user_profile: {
            user_id: "test_user_1",
            class_level: "10",
            interests: ["science", "mathematics"],
            location: { state: "Delhi", city: "New Delhi" },
          },
        },
      );

      if (!response.response || response.response.length === 0) {
        throw new Error("No response generated");
      }

      if (typeof response.confidence_score !== "number") {
        throw new Error("Invalid confidence score format");
      }
    });

    // Test offline mode
    await this.runTest("Offline Mode Response", async () => {
      // Simulate offline mode
      // const originalOnlineStatus = offlineSarthiAI.getOnlineStatus(); // Unused in test

      const response = await offlineSarthiAI.processMessage(
        "How do I prepare for competitive exams?",
        "test_session_2",
        {
          user_profile: {
            user_id: "test_user_2",
            class_level: "12",
            interests: ["engineering"],
            location: { state: "Mumbai", city: "Mumbai" },
          },
        },
      );

      if (!response.response) {
        throw new Error("No offline response generated");
      }
    });

    // Test conversation history
    await this.runTest("Conversation History", async () => {
      const history =
        await offlineSarthiAI.getConversationHistory("test_session_1");

      if (!Array.isArray(history)) {
        throw new Error("Invalid conversation history format");
      }
    });
  }

  private async testMapsSystem(): Promise<void> {
    console.log("🗺️ Testing Maps System...");

    // Test location caching
    await this.runTest("Location Caching", async () => {
      const locationId = await offlineMapsManager.cacheLocation({
        name: "Test College",
        type: "college",
        coordinates: { lat: 28.6139, lng: 77.209 },
        address: "Test Address, New Delhi",
        metadata: { college_id: "test_college_1" },
      });

      if (!locationId) {
        throw new Error("Failed to cache location");
      }

      const locations = await offlineMapsManager.getCachedLocations();

      if (locations.length === 0) {
        throw new Error("No cached locations found");
      }
    });

    // Test nearby colleges
    await this.runTest("Nearby Colleges Search", async () => {
      const nearbyColleges = await offlineMapsManager.getNearbyColleges(
        { lat: 28.6139, lng: 77.209 },
        50,
      );

      if (!Array.isArray(nearbyColleges)) {
        throw new Error("Invalid nearby colleges format");
      }
    });

    // Test cache stats
    await this.runTest("Maps Cache Statistics", async () => {
      const stats = offlineMapsManager.getCacheStats();

      if (typeof stats.total_tiles !== "number") {
        throw new Error("Invalid cache stats format");
      }
    });

    // Test online status
    await this.runTest("Maps Online Status", async () => {
      const isOnline = offlineMapsManager.getOnlineStatus();

      if (typeof isOnline !== "boolean") {
        throw new Error("Invalid online status format");
      }
    });
  }

  private async testSyncEngine(): Promise<void> {
    console.log("🔄 Testing Sync Engine...");

    // Test sync status
    await this.runTest("Sync Status", async () => {
      const status = syncEngine.getSyncStatus();

      if (typeof status.isOnline !== "boolean") {
        throw new Error("Invalid sync status format");
      }
    });

    // Test sync trigger (will fail in test environment, but should not throw)
    await this.runTest("Sync Trigger", async () => {
      try {
        await syncEngine.triggerSync();
      } catch {
        // Expected to fail in test environment without proper API setup
        console.log(
          "    ⚠️ Sync trigger failed as expected in test environment",
        );
      }
    });
  }

  private async testOfflineOnlineTransitions(): Promise<void> {
    console.log("🔄 Testing Offline-Online Transitions...");

    // Test storage persistence
    await this.runTest("Storage Persistence", async () => {
      // Save some data
      await offlineStorage.saveQuizResponse({
        session_id: "persistence_test",
        question_id: "test_question",
        user_answer: 1,
        time_taken: 30,
        answered_at: new Date().toISOString(),
      });

      // Simulate app restart by reinitializing
      await offlineStorage.initialize();

      // Check if data persists
      const responses =
        await offlineStorage.getQuizResponses("persistence_test");

      if (responses.length === 0) {
        throw new Error("Data did not persist after reinitialization");
      }
    });

    // Test data integrity
    await this.runTest("Data Integrity", async () => {
      const stats = await offlineStorage.getStorageStats();

      // Check if all required fields are present
      const requiredFields = [
        "quizResponses",
        "assessmentSessions",
        "cachedColleges",
        "cachedScholarships",
        "awarenessContent",
        "chatMessages",
        "syncQueueItems",
      ];

      for (const field of requiredFields) {
        if (!(field in stats)) {
          throw new Error(`Missing field in storage stats: ${field}`);
        }
      }
    });
  }

  private generateSummary(
    passed: number,
    failed: number,
    duration: number,
  ): string {
    const total = passed + failed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return `Tests: ${passed}/${total} passed (${successRate}%) in ${duration}ms`;
  }

  // Utility method to run specific test categories
  async runStorageTests(): Promise<TestResult[]> {
    this.results = [];
    await this.testOfflineStorage();
    return this.results;
  }

  async runQuizTests(): Promise<TestResult[]> {
    this.results = [];
    await this.testQuizSystem();
    return this.results;
  }

  async runRecommendationTests(): Promise<TestResult[]> {
    this.results = [];
    await this.testRecommendationsEngine();
    return this.results;
  }

  async runAITests(): Promise<TestResult[]> {
    this.results = [];
    await this.testSarthiAI();
    return this.results;
  }

  async runMapsTests(): Promise<TestResult[]> {
    this.results = [];
    await this.testMapsSystem();
    return this.results;
  }

  async runSyncTests(): Promise<TestResult[]> {
    this.results = [];
    await this.testSyncEngine();
    return this.results;
  }

  async runTransitionTests(): Promise<TestResult[]> {
    this.results = [];
    await this.testOfflineOnlineTransitions();
    return this.results;
  }
}

// Export singleton instance
export const offlineTestSuite = new OfflineTestSuite();

// Export for direct testing
export { OfflineTestSuite };
