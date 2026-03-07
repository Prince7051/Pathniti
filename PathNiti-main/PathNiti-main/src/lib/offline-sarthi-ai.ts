/**
 * Offline-First Sarthi AI Chat Interface
 * Provides intelligent responses with offline fallback and online AI enhancement
 */

import { offlineStorage } from "./offline-storage";
// import { offlineRecommendationsEngine } from "./offline-recommendations"; // Unused in offline mode
// import { supabase } from "./supabase"; // Unused in offline mode

export interface SarthiMessage {
  id: string;
  session_id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    capability_used?: string;
    confidence_score?: number;
    processing_time_ms?: number;
    is_offline_response?: boolean;
    source?: "ai" | "rule_based" | "cached";
  };
}

export interface SarthiContext {
  user_profile?: {
    user_id: string;
    class_level: string;
    stream?: string;
    interests: string[];
    location: Record<string, unknown>;
  };
  assessment_results?: {
    aptitude_scores: Record<string, number>;
    riasec_scores: Record<string, number>;
    personality_scores: Record<string, number>;
  };
  conversation_history?: SarthiMessage[];
}

export interface SarthiResponse {
  response: string;
  capability_used: string;
  confidence_score: number;
  processing_time_ms: number;
  is_offline_response: boolean;
  suggestions?: string[];
  related_topics?: string[];
}

class OfflineSarthiAI {
  private isOnline = typeof window !== "undefined" ? navigator.onLine : true;
  private cachedFAQs: Map<string, string> = new Map();
  private cachedResponses: Map<string, SarthiResponse> = new Map();
  private conversationContext: Map<string, SarthiContext> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners();
      this.initializeOfflineData();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private async initializeOfflineData(): Promise<void> {
    try {
      await offlineStorage.initialize();
      await this.loadOfflineFAQs();
      await this.loadCachedResponses();
    } catch (error) {
      console.error("Failed to initialize Sarthi AI:", error);
    }
  }

  private async loadOfflineFAQs(): Promise<void> {
    // Load comprehensive FAQs for offline responses
    const faqs = [
      {
        question: "What stream should I choose after class 10?",
        answer:
          "The choice of stream depends on your interests, aptitude, and career goals. Science stream is good for engineering, medicine, and research careers. Commerce is ideal for business, finance, and management. Arts offers opportunities in humanities, social sciences, and creative fields. Consider taking our comprehensive assessment to get personalized recommendations.",
      },
      {
        question: "How do I prepare for competitive exams?",
        answer:
          "Start early with a structured study plan. Focus on understanding concepts rather than memorization. Practice regularly with mock tests. Join coaching classes if needed. Stay updated with current affairs. Maintain a healthy study-life balance. Remember, consistency is key to success.",
      },
      {
        question: "What are the career options in science stream?",
        answer:
          "Science stream offers diverse career paths including Engineering (Computer, Mechanical, Civil, etc.), Medicine (MBBS, BDS, Pharmacy), Pure Sciences (Physics, Chemistry, Biology), Research, Data Science, Biotechnology, and many more. Each field has specific requirements and opportunities.",
      },
      {
        question: "How to choose the right college?",
        answer:
          "Consider factors like accreditation, faculty quality, placement records, infrastructure, location, fees, and programs offered. Check if the college is recognized by relevant authorities. Visit the campus if possible. Talk to current students and alumni. Our platform can help you find colleges based on your preferences.",
      },
      {
        question: "What scholarships are available for students?",
        answer:
          "Various scholarships are available from government, private organizations, and colleges. These include merit-based, need-based, and category-specific scholarships. Some popular ones are National Scholarship Portal, state government scholarships, and college-specific scholarships. Check eligibility criteria and application deadlines.",
      },
      {
        question: "How to manage stress during exams?",
        answer:
          "Maintain a regular study schedule with breaks. Practice relaxation techniques like deep breathing and meditation. Get adequate sleep and exercise regularly. Eat healthy food. Avoid last-minute cramming. Stay positive and believe in your preparation. Seek help from teachers or counselors if needed.",
      },
      {
        question:
          "What is the difference between government and private colleges?",
        answer:
          "Government colleges are funded by the state/central government, have lower fees, and often better infrastructure. Private colleges are funded privately, may have higher fees, but often offer more modern facilities and industry connections. Both can provide quality education depending on the specific institution.",
      },
      {
        question: "How to improve my communication skills?",
        answer:
          "Practice speaking in front of a mirror or with friends. Read books, newspapers, and articles regularly. Join debate clubs or public speaking groups. Watch educational videos and listen to podcasts. Write daily to improve your writing skills. Don't be afraid to make mistakes - they help you learn.",
      },
      {
        question: "What are the benefits of vocational courses?",
        answer:
          "Vocational courses provide practical skills for specific careers. They are shorter in duration, cost-effective, and have good job prospects. They focus on hands-on training and industry-relevant skills. Many vocational courses also offer direct entry into the workforce or further education opportunities.",
      },
      {
        question: "How to balance studies and extracurricular activities?",
        answer:
          "Create a realistic schedule that includes both studies and activities. Prioritize your tasks based on importance and deadlines. Learn to say no to activities that don't align with your goals. Use time management techniques like the Pomodoro method. Remember that extracurricular activities can enhance your overall development.",
      },
    ];

    faqs.forEach((faq) => {
      this.cachedFAQs.set(this.normalizeQuestion(faq.question), faq.answer);
    });
  }

  private async loadCachedResponses(): Promise<void> {
    // Load previously cached responses for common queries
    try {
      const cached = localStorage.getItem("sarthi_cached_responses");
      if (cached) {
        const responses = JSON.parse(cached);
        Object.entries(responses).forEach(([key, value]) => {
          this.cachedResponses.set(key, value as SarthiResponse);
        });
      }
    } catch (error) {
      console.error("Failed to load cached responses:", error);
    }
  }

  private async saveCachedResponse(
    question: string,
    response: SarthiResponse,
  ): Promise<void> {
    try {
      const normalizedQuestion = this.normalizeQuestion(question);
      this.cachedResponses.set(normalizedQuestion, response);

      // Save to localStorage
      const cached = Object.fromEntries(this.cachedResponses);
      localStorage.setItem("sarthi_cached_responses", JSON.stringify(cached));
    } catch (error) {
      console.error("Failed to save cached response:", error);
    }
  }

  public async processMessage(
    message: string,
    sessionId: string,
    context: SarthiContext,
  ): Promise<SarthiResponse> {
    const startTime = Date.now();

    try {
      // Store conversation context
      this.conversationContext.set(sessionId, context);

      // Check for cached response first
      const cachedResponse = this.getCachedResponse(message);
      if (cachedResponse) {
        return {
          ...cachedResponse,
          processing_time_ms: Date.now() - startTime,
        };
      }

      // Try online AI first if available
      if (this.isOnline) {
        try {
          const aiResponse = await this.getAIResponse(message, context);
          if (aiResponse) {
            await this.saveCachedResponse(message, aiResponse);
            return aiResponse;
          }
        } catch (error) {
          console.error("AI response failed, falling back to offline:", error);
        }
      }

      // Fallback to offline rule-based response
      const offlineResponse = await this.getOfflineResponse(message, context);
      await this.saveCachedResponse(message, offlineResponse);

      return {
        ...offlineResponse,
        processing_time_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Failed to process message:", error);
      return this.getErrorResponse();
    }
  }

  private getCachedResponse(message: string): SarthiResponse | null {
    const normalizedQuestion = this.normalizeQuestion(message);
    return this.cachedResponses.get(normalizedQuestion) || null;
  }

  private async getAIResponse(
    message: string,
    context: SarthiContext,
  ): Promise<SarthiResponse | null> {
    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: context.user_profile?.user_id || "anonymous",
          message,
          user_profile: context.user_profile,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          response: data.response,
          capability_used: data.capability_used || "ai",
          confidence_score: data.confidence_score || 0.8,
          processing_time_ms: data.processing_time_ms || 0,
          is_offline_response: false,
          suggestions: data.suggestions,
          related_topics: data.related_topics,
        };
      }
    } catch (error) {
      console.error("AI API call failed:", error);
    }
    return null;
  }

  private async getOfflineResponse(
    message: string,
    context: SarthiContext,
  ): Promise<SarthiResponse> {
    const normalizedMessage = this.normalizeQuestion(message);

    // Check FAQ database first
    const faqAnswer = this.cachedFAQs.get(normalizedMessage);
    if (faqAnswer) {
      return {
        response: faqAnswer,
        capability_used: "faq",
        confidence_score: 0.9,
        processing_time_ms: 0,
        is_offline_response: true,
        suggestions: this.generateSuggestions("faq"),
        related_topics: this.getRelatedTopics("faq"),
      };
    }

    // Try pattern matching for common queries
    const patternResponse = this.matchPatterns(message, context);
    if (patternResponse) {
      return patternResponse;
    }

    // Generate contextual response based on user profile and assessment results
    const contextualResponse = this.generateContextualResponse(
      message,
      context,
    );
    if (contextualResponse) {
      return contextualResponse;
    }

    // Default fallback response
    return this.getDefaultResponse();
  }

  private matchPatterns(
    message: string,
    context: SarthiContext,
  ): SarthiResponse | null {
    const lowerMessage = message.toLowerCase();

    // Stream selection patterns
    if (
      this.matchesPattern(lowerMessage, ["stream", "choose", "select", "which"])
    ) {
      return this.getStreamSelectionResponse(context);
    }

    // Career guidance patterns
    if (
      this.matchesPattern(lowerMessage, ["career", "job", "profession", "work"])
    ) {
      return this.getCareerGuidanceResponse(context);
    }

    // College selection patterns
    if (
      this.matchesPattern(lowerMessage, ["college", "university", "institute"])
    ) {
      return this.getCollegeSelectionResponse(context);
    }

    // Study tips patterns
    if (
      this.matchesPattern(lowerMessage, ["study", "prepare", "exam", "tips"])
    ) {
      return this.getStudyTipsResponse();
    }

    // Scholarship patterns
    if (
      this.matchesPattern(lowerMessage, [
        "scholarship",
        "financial",
        "aid",
        "money",
      ])
    ) {
      return this.getScholarshipResponse(context);
    }

    return null;
  }

  private matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some((pattern) => message.includes(pattern));
  }

  private getStreamSelectionResponse(context: SarthiContext): SarthiResponse {
    let response =
      "Choosing the right stream after Class 10 is crucial for your future career. ";

    if (context.assessment_results?.riasec_scores) {
      const topInterest = Object.entries(
        context.assessment_results.riasec_scores,
      ).sort(([, a], [, b]) => b - a)[0];

      if (topInterest) {
        const [interest, score] = topInterest;
        response += `Based on your assessment results, you show strong ${interest} interests (${score}% score). `;

        switch (interest) {
          case "realistic":
          case "investigative":
            response +=
              "I recommend the Science stream for careers in engineering, medicine, or research.";
            break;
          case "artistic":
          case "social":
            response +=
              "I recommend the Arts stream for careers in humanities, social sciences, or creative fields.";
            break;
          case "enterprising":
          case "conventional":
            response +=
              "I recommend the Commerce stream for careers in business, finance, or management.";
            break;
        }
      }
    } else {
      response +=
        "I recommend taking our comprehensive assessment to get personalized stream recommendations based on your interests and aptitude.";
    }

    return {
      response,
      capability_used: "stream_recommendation",
      confidence_score: 0.8,
      processing_time_ms: 0,
      is_offline_response: true,
      suggestions: [
        "Take Assessment",
        "Explore Career Options",
        "Compare Streams",
      ],
      related_topics: ["Stream Selection", "Career Planning", "Assessment"],
    };
  }

  private getCareerGuidanceResponse(context: SarthiContext): SarthiResponse {
    let response =
      "Career guidance is essential for making informed decisions about your future. ";

    if (context.user_profile?.class_level) {
      response += `As a Class ${context.user_profile.class_level} student, you have several career paths to explore. `;
    }

    if (context.assessment_results?.aptitude_scores) {
      const topAptitude = Object.entries(
        context.assessment_results.aptitude_scores,
      ).sort(([, a], [, b]) => b - a)[0];

      if (topAptitude) {
        const [aptitude, score] = topAptitude;
        response += `Your strong ${aptitude.replace("_", " ")} skills (${score}%) suggest careers in related fields. `;
      }
    }

    response +=
      "Consider your interests, skills, and market demand when choosing a career path.";

    return {
      response,
      capability_used: "career_guidance",
      confidence_score: 0.7,
      processing_time_ms: 0,
      is_offline_response: true,
      suggestions: [
        "Explore Careers",
        "Take Assessment",
        "Research Job Market",
      ],
      related_topics: ["Career Planning", "Job Market", "Skills Assessment"],
    };
  }

  private getCollegeSelectionResponse(context: SarthiContext): SarthiResponse {
    let response =
      "Choosing the right college is important for your academic and career success. ";

    if (context.user_profile?.location) {
      response += `I can help you find colleges in ${context.user_profile.location.state || "your area"}. `;
    }

    response +=
      "Consider factors like accreditation, faculty quality, placement records, infrastructure, and fees. Our platform can help you compare colleges based on your preferences.";

    return {
      response,
      capability_used: "college_guidance",
      confidence_score: 0.8,
      processing_time_ms: 0,
      is_offline_response: true,
      suggestions: ["Browse Colleges", "Compare Options", "Check Rankings"],
      related_topics: ["College Selection", "Admissions", "Rankings"],
    };
  }

  private getStudyTipsResponse(/* context: SarthiContext */): SarthiResponse {
    const response =
      "Here are some effective study tips: 1) Create a study schedule and stick to it, 2) Use active learning techniques like summarizing and teaching others, 3) Take regular breaks to maintain focus, 4) Practice with mock tests and previous year papers, 5) Stay organized with notes and materials, 6) Get adequate sleep and maintain a healthy diet, 7) Seek help when needed from teachers or peers.";

    return {
      response,
      capability_used: "study_tips",
      confidence_score: 0.9,
      processing_time_ms: 0,
      is_offline_response: true,
      suggestions: ["Create Study Plan", "Practice Tests", "Time Management"],
      related_topics: [
        "Study Techniques",
        "Exam Preparation",
        "Time Management",
      ],
    };
  }

  private getScholarshipResponse(context: SarthiContext): SarthiResponse {
    let response =
      "Various scholarships are available for students based on merit, need, and category. ";

    if (context.user_profile?.class_level) {
      response += `As a Class ${context.user_profile.class_level} student, you can explore scholarships from government, private organizations, and colleges. `;
    }

    response +=
      "Check the National Scholarship Portal and state government websites for available opportunities. Our platform can help you find scholarships that match your profile.";

    return {
      response,
      capability_used: "scholarship_info",
      confidence_score: 0.8,
      processing_time_ms: 0,
      is_offline_response: true,
      suggestions: ["Browse Scholarships", "Check Eligibility", "Apply Now"],
      related_topics: ["Scholarships", "Financial Aid", "Applications"],
    };
  }

  private generateContextualResponse(
    message: string,
    context: SarthiContext,
  ): SarthiResponse | null {
    // Generate responses based on user's assessment results and profile
    if (context.assessment_results && context.user_profile) {
      const response = this.generatePersonalizedResponse(message, context);
      if (response) {
        return response;
      }
    }

    return null;
  }

  private generatePersonalizedResponse(
    message: string,
    context: SarthiContext,
  ): SarthiResponse | null {
    const lowerMessage = message.toLowerCase();

    // Generate personalized responses based on assessment results
    if (
      lowerMessage.includes("recommend") ||
      lowerMessage.includes("suggest")
    ) {
      const topInterest = Object.entries(
        context.assessment_results!.riasec_scores,
      ).sort(([, a], [, b]) => b - a)[0];

      if (topInterest) {
        const [interest, score] = topInterest;
        const response = `Based on your assessment results showing strong ${interest} interests (${score}% score), I recommend exploring careers and educational paths that align with this interest. This will help you stay motivated and achieve success in your chosen field.`;

        return {
          response,
          capability_used: "personalized_recommendation",
          confidence_score: 0.8,
          processing_time_ms: 0,
          is_offline_response: true,
          suggestions: ["Explore Careers", "Find Colleges", "Plan Education"],
          related_topics: [
            "Personalized Guidance",
            "Career Planning",
            "Education Planning",
          ],
        };
      }
    }

    return null;
  }

  private getDefaultResponse(): SarthiResponse {
    const responses = [
      "I'm here to help you with career and education guidance. Could you please be more specific about what you'd like to know?",
      "I'd be happy to assist you with your career and education questions. What specific information are you looking for?",
      "Let me help you with your career and education journey. What would you like to explore today?",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      response: randomResponse,
      capability_used: "general_guidance",
      confidence_score: 0.5,
      processing_time_ms: 0,
      is_offline_response: true,
      suggestions: ["Take Assessment", "Browse Colleges", "Explore Careers"],
      related_topics: ["General Guidance", "Getting Started", "Help"],
    };
  }

  private getErrorResponse(): SarthiResponse {
    return {
      response:
        "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question.",
      capability_used: "error_handling",
      confidence_score: 0.1,
      processing_time_ms: 0,
      is_offline_response: true,
      suggestions: ["Try Again", "Rephrase Question", "Contact Support"],
      related_topics: ["Help", "Support", "Troubleshooting"],
    };
  }

  private generateSuggestions(capability: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      faq: ["Ask Another Question", "Take Assessment", "Browse Resources"],
      stream_recommendation: [
        "Take Assessment",
        "Explore Careers",
        "Compare Streams",
      ],
      career_guidance: ["Explore Careers", "Take Assessment", "Research Jobs"],
      college_guidance: [
        "Browse Colleges",
        "Compare Options",
        "Check Rankings",
      ],
      study_tips: ["Create Study Plan", "Practice Tests", "Time Management"],
      scholarship_info: [
        "Browse Scholarships",
        "Check Eligibility",
        "Apply Now",
      ],
      personalized_recommendation: [
        "Explore Careers",
        "Find Colleges",
        "Plan Education",
      ],
      general_guidance: [
        "Take Assessment",
        "Browse Colleges",
        "Explore Careers",
      ],
    };

    return (
      suggestionMap[capability] || [
        "Take Assessment",
        "Browse Resources",
        "Get Help",
      ]
    );
  }

  private getRelatedTopics(capability: string): string[] {
    const topicMap: Record<string, string[]> = {
      faq: ["General Information", "Common Questions", "Help"],
      stream_recommendation: [
        "Stream Selection",
        "Career Planning",
        "Assessment",
      ],
      career_guidance: ["Career Planning", "Job Market", "Skills Assessment"],
      college_guidance: ["College Selection", "Admissions", "Rankings"],
      study_tips: ["Study Techniques", "Exam Preparation", "Time Management"],
      scholarship_info: ["Scholarships", "Financial Aid", "Applications"],
      personalized_recommendation: [
        "Personalized Guidance",
        "Career Planning",
        "Education Planning",
      ],
      general_guidance: ["General Guidance", "Getting Started", "Help"],
    };

    return topicMap[capability] || ["General Guidance", "Help", "Support"];
  }

  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  public async saveMessage(message: SarthiMessage): Promise<void> {
    try {
      await offlineStorage.saveChatMessage({
        session_id: message.session_id,
        type: message.type,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  }

  public async getConversationHistory(
    sessionId: string,
  ): Promise<SarthiMessage[]> {
    try {
      const messages = await offlineStorage.getChatMessages(sessionId);
      return messages.map((msg) => ({
        id: msg.id,
        session_id: msg.session_id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      }));
    } catch (error) {
      console.error("Failed to get conversation history:", error);
      return [];
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public async clearConversationHistory(sessionId: string): Promise<void> {
    try {
      // This would clear the conversation history from offline storage
      // Implementation depends on your storage structure
      console.log("Clearing conversation history for session:", sessionId);
    } catch (error) {
      console.error("Failed to clear conversation history:", error);
    }
  }
}

// Export singleton instance
export const offlineSarthiAI = new OfflineSarthiAI();
