"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Brain, Calculator, Lightbulb, Globe } from "lucide-react";

interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: string;
  category: string;
  subcategory: string;
  options: string[];
  correct_answer: number;
  time_limit: number;
  scoring_weight: number;
  difficulty_level: number;
}

interface AssessmentData {
  assessment_id: string;
  user_id: string;
  student_class: "10th" | "12th";
  total_questions: number;
  estimated_time_minutes: number;
  questions: AssessmentQuestion[];
  subject_distribution: {
    science_aptitude: number;
    math_aptitude: number;
    logical_reasoning: number;
    general_knowledge: number;
  };
}

interface AssessmentResponse {
  question_id: string;
  selected_answer: number;
  time_taken: number;
  category: string;
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

export default function CareerAssessmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssessment = useCallback(async () => {
    try {
      setAssessmentLoading(true);
      const response = await fetch("/api/career-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id,
          student_class: "10th", // This should come from user profile
          assessment_type: "career_guidance",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load assessment");
      }

      const data = await response.json();
      setAssessmentData(data);
      setTimeRemaining(data.questions[0]?.time_limit || 60);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error("Error loading assessment:", error);
      setError("Failed to load assessment. Please try again.");
    } finally {
      setAssessmentLoading(false);
    }
  }, [user?.id]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const submitAssessment = useCallback(async (finalResponses: AssessmentResponse[]) => {
    if (!assessmentData) return;

    setIsSubmitting(true);
    try {
      const totalTime = finalResponses.reduce((sum, r) => sum + r.time_taken, 0);
      
      const response = await fetch("/api/career-assessment/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessment_id: assessmentData.assessment_id,
          user_id: user?.id,
          responses: finalResponses,
          total_time_seconds: totalTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assessment");
      }

      const result = await response.json();
      
      // Redirect to results page
      router.push(`/career-results?assessment_id=${assessmentData.assessment_id}`);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      setError("Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [assessmentData, user?.id, router]);

  const handleNextQuestion = useCallback(() => {
    if (!assessmentData || selectedAnswer === null || selectedAnswer === undefined || selectedAnswer < 0) return;

    const currentQuestion = assessmentData.questions[currentQuestionIndex];
    const timeTaken = (Date.now() - questionStartTime) / 1000; // Keep millisecond precision

    // Save current response
    const response: AssessmentResponse = {
      question_id: currentQuestion.id,
      selected_answer: selectedAnswer,
      time_taken: timeTaken,
      category: currentQuestion.category,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    // Move to next question or submit assessment
    if (currentQuestionIndex < assessmentData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeRemaining(assessmentData.questions[currentQuestionIndex + 1].time_limit);
      setQuestionStartTime(Date.now());
    } else {
      // Submit assessment
      submitAssessment(newResponses);
    }
  }, [assessmentData, selectedAnswer, currentQuestionIndex, responses, questionStartTime, submitAssessment]);

  // Load assessment on component mount
  useEffect(() => {
    if (!loading && user) {
      loadAssessment();
    }
  }, [user, loading, loadAssessment]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && assessmentData) {
      // Auto-submit current question when time runs out
      handleNextQuestion();
    }
  }, [timeRemaining, assessmentData, handleNextQuestion]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Brain;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "bg-gray-100 text-gray-800";
  };

  if (loading || assessmentLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? "Loading..." : "Preparing your career assessment..."}
          </p>
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
              <h2 className="text-xl font-semibold mb-2">Assessment Error</h2>
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

  if (!assessmentData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Assessment Available</h2>
              <p className="text-gray-600">Unable to load assessment data.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = assessmentData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessmentData.total_questions) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Career Assessment</CardTitle>
                <p className="text-gray-600 mt-1">
                  Class {assessmentData.student_class} • {assessmentData.total_questions} Questions
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Question {currentQuestionIndex + 1} of {assessmentData.total_questions}
                </div>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(currentQuestion.category)}
              <Badge className={getCategoryColor(currentQuestion.category)}>
                {currentQuestion.category.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {currentQuestion.difficulty_level === 1 ? 'Easy' : 
                 currentQuestion.difficulty_level === 2 ? 'Medium' : 'Hard'}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-relaxed">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswer === index && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {responses.length} questions answered
          </div>
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null || selectedAnswer === undefined || selectedAnswer < 0 || isSubmitting}
            className="px-8"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : currentQuestionIndex < assessmentData.questions.length - 1 ? (
              "Next Question"
            ) : (
              "Submit Assessment"
            )}
          </Button>
        </div>

        {/* Subject Distribution Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Assessment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(assessmentData.subject_distribution).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getCategoryIcon(category)}
                    <span className="text-sm font-medium">
                      {category.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-xs text-gray-500">questions</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
