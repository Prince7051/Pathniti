/**
 * Custom AI Engine for PathNiti
 * Replaces Google Gemini with in-house models for SIH finals
 */

import { AssessmentScores, StreamRecommendation, CollegeRecommendation, CareerRecommendation } from './types';

export interface CustomAIConfig {
  modelVersion: string;
  confidenceThreshold: number;
  enableRegionalContext: boolean;
  enableROIAnalysis: boolean;
  enableParentAppeal: boolean;
}

export interface CustomAIResponse {
  success: boolean;
  data: any;
  confidence: number;
  processingTime: number;
  modelVersion: string;
  fallbackUsed: boolean;
}

export class CustomAIEngine {
  private config: CustomAIConfig;
  private modelCache: Map<string, any> = new Map();
  private isOnline: boolean = true;

  constructor(config: Partial<CustomAIConfig> = {}) {
    this.config = {
      modelVersion: '1.0.0',
      confidenceThreshold: 0.7,
      enableRegionalContext: true,
      enableROIAnalysis: true,
      enableParentAppeal: true,
      ...config
    };
  }

  /**
   * Stream Recommendation Engine
   * Uses custom ML models instead of Gemini
   */
  async getStreamRecommendations(
    scores: AssessmentScores,
    practicalConstraints?: Record<string, string>
  ): Promise<CustomAIResponse> {
    const startTime = Date.now();
    
    try {
      // Use custom ML model for stream prediction
      const streamModel = await this.loadModel('stream_prediction');
      const prediction = await this.predictStream(streamModel, scores, practicalConstraints);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: prediction,
        confidence: prediction.length > 0 ? prediction[0].confidence_score || 0.8 : 0.8,
        processingTime,
        modelVersion: this.config.modelVersion,
        fallbackUsed: false
      };
    } catch (error) {
      console.error('Custom AI stream prediction failed:', error);
      return this.getFallbackStreamRecommendations(scores, startTime);
    }
  }

  /**
   * College Recommendation Engine
   */
  async getCollegeRecommendations(
    scores: AssessmentScores,
    location?: { lat: number; lng: number },
    budget?: number
  ): Promise<CustomAIResponse> {
    const startTime = Date.now();
    
    try {
      const collegeModel = await this.loadModel('college_recommendation');
      const recommendations = await this.recommendColleges(collegeModel, scores, location, budget);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: recommendations,
        confidence: recommendations.length > 0 ? recommendations[0].match_score || 0.8 : 0.8,
        processingTime,
        modelVersion: this.config.modelVersion,
        fallbackUsed: false
      };
    } catch (error) {
      console.error('Custom AI college recommendation failed:', error);
      return this.getFallbackCollegeRecommendations(scores, startTime);
    }
  }

  /**
   * Career Recommendation Engine
   */
  async getCareerRecommendations(
    scores: AssessmentScores,
    stream?: string,
    interests?: string[]
  ): Promise<CustomAIResponse> {
    const startTime = Date.now();
    
    try {
      const careerModel = await this.loadModel('career_recommendation');
      const recommendations = await this.recommendCareers(careerModel, scores, stream, interests);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: recommendations,
        confidence: recommendations.length > 0 ? recommendations[0].confidence_score || 0.8 : 0.8,
        processingTime,
        modelVersion: this.config.modelVersion,
        fallbackUsed: false
      };
    } catch (error) {
      console.error('Custom AI career recommendation failed:', error);
      return this.getFallbackCareerRecommendations(scores, startTime);
    }
  }

  /**
   * Dropout Prediction Engine
   */
  async predictDropoutRisk(
    studentProfile: any,
    academicHistory: any[],
    engagementMetrics: any
  ): Promise<CustomAIResponse> {
    const startTime = Date.now();
    
    try {
      const dropoutModel = await this.loadModel('dropout_prediction');
      const riskAssessment = await this.assessDropoutRisk(dropoutModel, studentProfile, academicHistory, engagementMetrics);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: riskAssessment,
        confidence: riskAssessment.confidence || 0.8,
        processingTime,
        modelVersion: this.config.modelVersion,
        fallbackUsed: false
      };
    } catch (error) {
      console.error('Custom AI dropout prediction failed:', error);
      return this.getFallbackDropoutPrediction(studentProfile, startTime);
    }
  }

  /**
   * Mentor Matching Engine
   */
  async findMentors(
    studentProfile: any,
    preferences: any,
    location?: { lat: number; lng: number }
  ): Promise<CustomAIResponse> {
    const startTime = Date.now();
    
    try {
      const mentorModel = await this.loadModel('mentor_matching');
      const matches = await this.matchMentors(mentorModel, studentProfile, preferences, location);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: matches,
        confidence: matches.length > 0 ? matches[0].match_score || 0.8 : 0.8,
        processingTime,
        modelVersion: this.config.modelVersion,
        fallbackUsed: false
      };
    } catch (error) {
      console.error('Custom AI mentor matching failed:', error);
      return this.getFallbackMentorMatching(studentProfile, startTime);
    }
  }

  /**
   * Load ML model from cache or API
   */
  private async loadModel(modelType: string): Promise<any> {
    const cacheKey = `${modelType}_${this.config.modelVersion}`;
    
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey);
    }

    try {
      // Load model from API endpoint
      const response = await fetch(`/api/ml-models/${modelType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Model-Version': this.config.modelVersion
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.statusText}`);
      }

      const model = await response.json();
      this.modelCache.set(cacheKey, model);
      return model;
    } catch (error) {
      console.error(`Failed to load ${modelType} model:`, error);
      throw error;
    }
  }

  /**
   * Stream prediction using custom ML model
   */
  private async predictStream(model: any, scores: AssessmentScores, constraints?: Record<string, string>): Promise<StreamRecommendation[]> {
    // Implement custom ML logic here
    const features = this.extractFeatures(scores, constraints);
    const prediction = await this.runModelInference(model, features);
    
    return this.formatStreamRecommendations(prediction);
  }

  /**
   * College recommendation using custom ML model
   */
  private async recommendColleges(model: any, scores: AssessmentScores, location?: { lat: number; lng: number }, budget?: number): Promise<CollegeRecommendation[]> {
    const features = this.extractCollegeFeatures(scores, location, budget);
    const prediction = await this.runModelInference(model, features);
    
    return this.formatCollegeRecommendations(prediction);
  }

  /**
   * Career recommendation using custom ML model
   */
  private async recommendCareers(model: any, scores: AssessmentScores, stream?: string, interests?: string[]): Promise<CareerRecommendation[]> {
    const features = this.extractCareerFeatures(scores, stream, interests);
    const prediction = await this.runModelInference(model, features);
    
    return this.formatCareerRecommendations(prediction);
  }

  /**
   * Dropout risk assessment using custom ML model
   */
  private async assessDropoutRisk(model: any, profile: any, history: any[], engagement: any): Promise<any> {
    const features = this.extractDropoutFeatures(profile, history, engagement);
    const prediction = await this.runModelInference(model, features);
    
    return {
      riskLevel: prediction.riskLevel,
      riskScore: prediction.riskScore,
      factors: prediction.factors,
      recommendations: prediction.recommendations,
      confidence: prediction.confidence || 0.8
    };
  }

  /**
   * Mentor matching using custom ML model
   */
  private async matchMentors(model: any, profile: any, preferences: any, location?: { lat: number; lng: number }): Promise<any[]> {
    const features = this.extractMentorFeatures(profile, preferences, location);
    const prediction = await this.runModelInference(model, features);
    
    return this.formatMentorMatches(prediction);
  }

  /**
   * Extract features for ML models
   */
  private extractFeatures(scores: AssessmentScores, constraints?: Record<string, string>): number[] {
    const features: number[] = [];
    
    // RIASEC scores
    features.push(scores.riasec?.realistic || 0);
    features.push(scores.riasec?.investigative || 0);
    features.push(scores.riasec?.artistic || 0);
    features.push(scores.riasec?.social || 0);
    features.push(scores.riasec?.enterprising || 0);
    features.push(scores.riasec?.conventional || 0);
    
    // Aptitude scores
    features.push(scores.aptitude?.logical_reasoning || 0);
    features.push(scores.aptitude?.quantitative_skills || 0);
    features.push(scores.aptitude?.language_verbal_skills || 0);
    features.push(scores.aptitude?.spatial_visual_skills || 0);
    features.push(scores.aptitude?.memory_attention || 0);
    
    // Personality scores
    features.push(scores.personality?.introvert_extrovert || 0);
    features.push(scores.personality?.risk_taking_vs_risk_averse || 0);
    features.push(scores.personality?.structured_vs_flexible || 0);
    features.push(scores.personality?.leadership_vs_supportive || 0);
    
    // Subject performance
    Object.values(scores.subject_performance || {}).forEach(subject => {
      features.push(subject.accuracy || 0);
      features.push(subject.speed || 0);
    });
    
    // Practical constraints
    if (constraints) {
      features.push(constraints.financial_constraints === 'high' ? 1 : 0);
      features.push(constraints.location_preference === 'local' ? 1 : 0);
      features.push(constraints.family_expectations === 'high' ? 1 : 0);
    }
    
    return features;
  }

  private extractCollegeFeatures(scores: AssessmentScores, location?: { lat: number; lng: number }, budget?: number): number[] {
    const features = this.extractFeatures(scores);
    
    if (location) {
      features.push(location.lat);
      features.push(location.lng);
    }
    
    if (budget) {
      features.push(budget);
    }
    
    return features;
  }

  private extractCareerFeatures(scores: AssessmentScores, stream?: string, interests?: string[]): number[] {
    const features = this.extractFeatures(scores);
    
    // Stream encoding
    const streamMap = { 'science': 1, 'commerce': 2, 'arts': 3, 'other': 0 };
    features.push(streamMap[stream as keyof typeof streamMap] || 0);
    
    // Interest encoding
    if (interests) {
      const interestMap = { 'technology': 1, 'business': 2, 'healthcare': 3, 'education': 4, 'other': 0 };
      interests.forEach(interest => {
        features.push(interestMap[interest as keyof typeof interestMap] || 0);
      });
    }
    
    return features;
  }

  private extractDropoutFeatures(profile: any, history: any[], engagement: any): number[] {
    const features: number[] = [];
    
    // Profile features
    features.push(profile.age || 0);
    features.push(profile.grade_level || 0);
    features.push(profile.family_income || 0);
    features.push(profile.parent_education || 0);
    
    // Academic history
    const avgScore = history.reduce((sum, record) => sum + (record.score || 0), 0) / history.length;
    features.push(avgScore || 0);
    features.push(history.length || 0);
    
    // Engagement features
    features.push(engagement.login_frequency || 0);
    features.push(engagement.quiz_completion_rate || 0);
    features.push(engagement.time_spent || 0);
    features.push(engagement.help_seeking_behavior || 0);
    
    return features;
  }

  private extractMentorFeatures(profile: any, preferences: any, location?: { lat: number; lng: number }): number[] {
    const features: number[] = [];
    
    // Student profile
    features.push(profile.grade_level || 0);
    features.push(profile.interests?.length || 0);
    features.push(profile.learning_style || 0);
    
    // Preferences
    features.push(preferences.mentor_experience || 0);
    features.push(preferences.communication_style || 0);
    features.push(preferences.availability || 0);
    
    // Location
    if (location) {
      features.push(location.lat);
      features.push(location.lng);
    }
    
    return features;
  }

  /**
   * Run model inference
   */
  private async runModelInference(model: any, features: number[]): Promise<any> {
    // This would integrate with your Python ML models
    // For now, return mock predictions
    return {
      predictions: ['science', 'commerce', 'arts'],
      confidence: 0.85,
      reasoning: 'Based on RIASEC scores and aptitude assessment'
    };
  }

  /**
   * Format recommendations
   */
  private formatStreamRecommendations(prediction: any): StreamRecommendation[] {
    return prediction.predictions.map((stream: string, index: number) => ({
      stream,
      confidence: prediction.confidence || 0.8,
      reasoning: prediction.reasoning,
      rank: index + 1
    }));
  }

  private formatCollegeRecommendations(prediction: any): CollegeRecommendation[] {
    return prediction.predictions.map((college: any, index: number) => ({
      college_id: college.id,
      name: college.name,
      confidence: prediction.confidence || 0.8,
      reasoning: prediction.reasoning,
      rank: index + 1
    }));
  }

  private formatCareerRecommendations(prediction: any): CareerRecommendation[] {
    return prediction.predictions.map((career: any, index: number) => ({
      career_id: career.id,
      title: career.title,
      confidence: prediction.confidence || 0.8,
      reasoning: prediction.reasoning,
      rank: index + 1
    }));
  }

  private formatMentorMatches(prediction: any): any[] {
    return prediction.predictions.map((mentor: any, index: number) => ({
      mentor_id: mentor.id,
      name: mentor.name,
      match_score: mentor.score,
      reasoning: prediction.reasoning,
      rank: index + 1
    }));
  }

  /**
   * Fallback methods for when custom models fail
   */
  private async getFallbackStreamRecommendations(scores: AssessmentScores, startTime: number): Promise<CustomAIResponse> {
    // Simple rule-based fallback
    const topRIASEC = Object.entries(scores.riasec || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    const streamMap: Record<string, string> = {
      'realistic': 'science',
      'investigative': 'science', 
      'artistic': 'arts',
      'social': 'arts',
      'enterprising': 'commerce',
      'conventional': 'commerce'
    };
    
    const recommendedStream = streamMap[topRIASEC?.[0] || 'realistic'] || 'science';
    
    return {
      success: true,
      data: [{ stream: recommendedStream, confidence: 0.6, reasoning: 'Fallback rule-based recommendation' }],
      confidence: 0.6,
      processingTime: Date.now() - startTime,
      modelVersion: 'fallback',
      fallbackUsed: true
    };
  }

  private async getFallbackCollegeRecommendations(scores: AssessmentScores, startTime: number): Promise<CustomAIResponse> {
    return {
      success: true,
      data: [],
      confidence: 0.5,
      processingTime: Date.now() - startTime,
      modelVersion: 'fallback',
      fallbackUsed: true
    };
  }

  private async getFallbackCareerRecommendations(scores: AssessmentScores, startTime: number): Promise<CustomAIResponse> {
    return {
      success: true,
      data: [],
      confidence: 0.5,
      processingTime: Date.now() - startTime,
      modelVersion: 'fallback',
      fallbackUsed: true
    };
  }

  private async getFallbackDropoutPrediction(profile: any, startTime: number): Promise<CustomAIResponse> {
    return {
      success: true,
      data: { riskLevel: 'medium', riskScore: 0.5, factors: [], recommendations: [] },
      confidence: 0.5,
      processingTime: Date.now() - startTime,
      modelVersion: 'fallback',
      fallbackUsed: true
    };
  }

  private async getFallbackMentorMatching(profile: any, startTime: number): Promise<CustomAIResponse> {
    return {
      success: true,
      data: [],
      confidence: 0.5,
      processingTime: Date.now() - startTime,
      modelVersion: 'fallback',
      fallbackUsed: true
    };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<CustomAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    this.modelCache.clear();
  }

  /**
   * Get model statistics
   */
  getModelStats(): any {
    return {
      cacheSize: this.modelCache.size,
      modelVersion: this.config.modelVersion,
      isOnline: this.isOnline
    };
  }
}

// Export singleton instance
export const customAIEngine = new CustomAIEngine();
