"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/app/providers";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  BookOpen, 
  Briefcase, 
  Star,
  CheckCircle,
  AlertCircle,
  Brain,
  Calculator,
  Lightbulb,
  Globe
} from "lucide-react";

interface CareerRecommendation {
  stream_or_course: string;
  reasoning: string;
  career_opportunities: string[];
  confidence_score: number;
  time_to_earn: string;
  average_salary: string;
  job_demand_trend: string;
}

interface TestPerformance {
  accuracy: number;
  speed: number;
  weighted_score: number;
  subject_breakdown: {
    science_aptitude: { accuracy: number; speed: number; score: number };
    math_aptitude: { accuracy: number; speed: number; score: number };
    logical_reasoning: { accuracy: number; speed: number; score: number };
    general_knowledge: { accuracy: number; speed: number; score: number };
  };
}

interface AIInsights {
  strengths: string[];
  areas_for_improvement: string[];
  overall_assessment: string;
}

interface CareerResults {
  student_class: "10th" | "12th";
  recommended_path: CareerRecommendation[];
  test_performance: TestPerformance;
  ai_insights: AIInsights;
}

const CATEGORY_ICONS = {
  science_aptitude: Brain,
  math_aptitude: Calculator,
  logical_reasoning: Lightbulb,
  general_knowledge: Globe,
};

const CATEGORY_COLORS = {
  science_aptitude: "bg-blue-100 text-blue-800",
  math_aptitude: "bg-green-100 text-green-800",
  logical_reasoning: "bg-purple-100 text-purple-800",
  general_knowledge: "bg-orange-100 text-orange-800",
};

const DEMAND_COLORS = {
  very_high: "bg-green-100 text-green-800",
  high: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
};

function CareerResultsContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessment_id");

  const [results, setResults] = useState<CareerResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    try {
      setLoadingResults(true);
      
      // First, get the assessment session to get user_id
      const sessionResponse = await fetch(`/api/assessment-session/${assessmentId}`);
      if (!sessionResponse.ok) {
        throw new Error("Assessment session not found");
      }
      
      const sessionData = await sessionResponse.json();
      
      // Then get the career recommendations
      const response = await fetch("/api/career-recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: sessionData.user_id,
          student_class: sessionData.student_class || "10th",
          assessment_data: {
            aptitude_scores: sessionData.aptitude_scores || {},
            riasec_scores: sessionData.riasec_scores || {},
            personality_scores: sessionData.personality_scores || {},
            subject_performance: sessionData.subject_performance || {},
            practical_constraints: sessionData.practical_constraints || {},
          },
          test_performance: {
            total_questions: sessionData.total_questions || 30,
            answered_questions: sessionData.answered_questions || 30,
            correct_answers: Math.round((sessionData.total_score || 0) * (sessionData.answered_questions || 30) / 100),
            total_time_seconds: sessionData.time_spent || 1800,
            responses: [], // This would be populated from assessment_responses table
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load career recommendations");
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error loading results:", error);
      setError("Failed to load results. Please try again.");
    } finally {
      setLoadingResults(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!loading && user && assessmentId) {
      loadResults();
    }
  }, [user, loading, assessmentId, loadResults]);

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Brain;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "bg-gray-100 text-gray-800";
  };

  const getDemandColor = (trend: string) => {
    return DEMAND_COLORS[trend as keyof typeof DEMAND_COLORS] || "bg-gray-100 text-gray-800";
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading || loadingResults) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your assessment results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Results</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
              <p className="text-gray-600">Unable to load career recommendations.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="text-center">
              <CardTitle className="text-3xl mb-2">Your Career Assessment Results</CardTitle>
              <p className="text-gray-600">
                Class {results.student_class} • Based on your comprehensive assessment
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Performance Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Assessment Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {results.test_performance.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall Accuracy</div>
                <Progress 
                  value={results.test_performance.accuracy} 
                  className="mt-2"
                />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {results.test_performance.speed.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Avg Time per Question</div>
                <Progress 
                  value={Math.min(results.test_performance.speed * 2, 100)} 
                  className="mt-2"
                />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {results.test_performance.weighted_score.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Weighted Score</div>
                <Progress 
                  value={results.test_performance.weighted_score} 
                  className="mt-2"
                />
              </div>
            </div>

            {/* Subject Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Subject-wise Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(results.test_performance.subject_breakdown).map(([category, data]) => (
                  <div key={category} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      {getCategoryIcon(category)}
                      <Badge className={getCategoryColor(category)}>
                        {category.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accuracy:</span>
                        <span className="font-medium">{data.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Speed:</span>
                        <span className="font-medium">{data.speed.toFixed(1)}s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Score:</span>
                        <span className="font-medium">{data.score.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Career Recommendation */}
        <Card className="mb-6 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-green-600" />
              Your Best Career Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.recommended_path.length > 0 && (
              <div className="border rounded-lg p-6 bg-green-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-green-800">
                      {results.recommended_path[0].stream_or_course}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getDemandColor(results.recommended_path[0].job_demand_trend)}>
                        {results.recommended_path[0].job_demand_trend.replace('_', ' ').toUpperCase()} DEMAND
                      </Badge>
                      <Badge variant="outline">
                        {results.recommended_path[0].time_to_earn}
                      </Badge>
                      <Badge variant="outline">
                        {results.recommended_path[0].average_salary}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getConfidenceColor(results.recommended_path[0].confidence_score)}`}>
                      {(results.recommended_path[0].confidence_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Match Confidence</div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 text-lg">{results.recommended_path[0].reasoning}</p>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5" />
                    Career Opportunities
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results.recommended_path[0].career_opportunities.map((career, careerIndex) => (
                      <div key={careerIndex} className="flex items-center gap-2 text-sm bg-white p-2 rounded">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{career}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alternative Career Recommendations */}
        {results.recommended_path.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Alternative Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.recommended_path.slice(1).map((recommendation, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {index + 2}. {recommendation.stream_or_course}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getDemandColor(recommendation.job_demand_trend)}>
                            {recommendation.job_demand_trend.replace('_', ' ').toUpperCase()} DEMAND
                          </Badge>
                          <Badge variant="outline">
                            {recommendation.time_to_earn}
                          </Badge>
                          <Badge variant="outline">
                            {recommendation.average_salary}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getConfidenceColor(recommendation.confidence_score)}`}>
                          {(recommendation.confidence_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Confidence</div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{recommendation.reasoning}</p>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Career Opportunities
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {recommendation.career_opportunities.slice(0, 4).map((career, careerIndex) => (
                          <div key={careerIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{career}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {results.ai_insights.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {results.ai_insights.areas_for_improvement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Overall Assessment</h3>
              <p className="text-gray-700">{results.ai_insights.overall_assessment}</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => window.print()}
            variant="outline"
            className="px-6"
          >
            Print Results
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="px-6"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CareerResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CareerResultsContent />
    </Suspense>
  );
}
