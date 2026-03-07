"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  TrendingUp,
  Target,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

interface LastTestReviewProps {
  userId: string;
  className?: string;
}

interface Question {
  question_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  user_answer: number;
  is_correct: boolean | null;
  time_taken: number;
  category: string;
  difficulty_level: string;
  explanation: string;
  answered_at: string;
}

interface TestData {
  session: {
    id: string;
    completed_at: string;
    aptitude_scores: Record<string, number>;
    riasec_scores: Record<string, number>;
    personality_scores: Record<string, number>;
  };
  questions: Question[];
  summary: {
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    unanswered: number;
    average_time_per_question: number;
  };
}

export default function LastTestReview({
  userId,
  className = "",
}: LastTestReviewProps) {
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchLastTest = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/assessment/last-test?user_id=${userId}`,
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setTestData(result.data);
        } else if (response.status === 404) {
          // No quiz sessions found - this is normal for new users
          setTestData(null);
          setError("No completed assessments found. Complete a quiz to see your results here!");
        } else {
          setError(result.error || "Failed to fetch last test");
        }
      } catch (err) {
        console.error("Error fetching last test:", err);
        setError("Failed to load last test data");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchLastTest();
    }
  }, [userId]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "aptitude":
        return "bg-blue-100 text-blue-800";
      case "interest":
        return "bg-purple-100 text-purple-800";
      case "personality":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Last Test Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading your last test...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !testData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Last Test Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || "No test data found. Please complete an assessment first."}
              {!error && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = '/assessment'}
                  >
                    Take Assessment
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { session, questions, summary } = testData;
  const accuracy = summary.total_questions > 0 ? (summary.correct_answers / summary.total_questions) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Last Test Review
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
            >
              {showAnswers ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Answers
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Answers
                </>
              )}
            </Button>
            <Badge variant="secondary">
              {new Date(session.completed_at).toLocaleDateString()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {summary.correct_answers}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.incorrect_answers}
                  </div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(accuracy)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatTime(Math.round(summary.average_time_per_question))}
                  </div>
                  <div className="text-sm text-gray-600">Avg Time</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Test Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <span className="font-medium">{summary.total_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correct Answers:</span>
                    <span className="font-medium text-green-600">
                      {summary.correct_answers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incorrect Answers:</span>
                    <span className="font-medium text-red-600">
                      {summary.incorrect_answers}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Unanswered:</span>
                    <span className="font-medium text-gray-600">
                      {summary.unanswered}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-medium">{Math.round(accuracy)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Time:</span>
                    <span className="font-medium">
                      {formatTime(Math.round(summary.average_time_per_question))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.question_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Badge className={getCategoryColor(question.category)}>
                            {question.category}
                          </Badge>
                          <Badge className={getDifficultyColor(question.difficulty_level)}>
                            {question.difficulty_level}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">
                          {question.question_text}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.is_correct === true && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {question.is_correct === false && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {question.is_correct === null && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {formatTime(question.time_taken)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isCorrect = optionIndex === question.correct_answer;
                        const isUserAnswer = optionIndex === question.user_answer;
                        const isWrong = isUserAnswer && !isCorrect;

                        return (
                          <div
                            key={optionIndex}
                            className={`p-3 rounded-lg border ${
                              showAnswers
                                ? isCorrect
                                  ? "bg-green-50 border-green-200"
                                  : isWrong
                                  ? "bg-red-50 border-red-200"
                                  : "bg-gray-50 border-gray-200"
                                : isUserAnswer
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option}</span>
                              {showAnswers && isCorrect && (
                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                              )}
                              {showAnswers && isWrong && (
                                <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                              )}
                              {!showAnswers && isUserAnswer && (
                                <Badge variant="secondary" className="ml-auto">
                                  Your Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {showAnswers && question.explanation && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">
                          Explanation:
                        </h4>
                        <p className="text-blue-800 text-sm">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Performance by Category</h3>
                <div className="space-y-2">
                  {Object.entries(
                    questions.reduce((acc, q) => {
                      if (!acc[q.category]) {
                        acc[q.category] = { total: 0, correct: 0 };
                      }
                      acc[q.category].total++;
                      if (q.is_correct) acc[q.category].correct++;
                      return acc;
                    }, {} as Record<string, { total: number; correct: number }>)
                  ).map(([category, stats]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                        <span>{stats.correct}/{stats.total} correct</span>
                      </div>
                      <span className="font-medium">
                        {Math.round((stats.correct / stats.total) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Performance by Difficulty</h3>
                <div className="space-y-2">
                  {Object.entries(
                    questions.reduce((acc, q) => {
                      if (!acc[q.difficulty_level]) {
                        acc[q.difficulty_level] = { total: 0, correct: 0 };
                      }
                      acc[q.difficulty_level].total++;
                      if (q.is_correct) acc[q.difficulty_level].correct++;
                      return acc;
                    }, {} as Record<string, { total: number; correct: number }>)
                  ).map(([difficulty, stats]) => (
                    <div key={difficulty} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(difficulty)}>
                          {difficulty}
                        </Badge>
                        <span>{stats.correct}/{stats.total} correct</span>
                      </div>
                      <span className="font-medium">
                        {Math.round((stats.correct / stats.total) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Time Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {formatTime(Math.round(summary.average_time_per_question))}
                      </div>
                      <div className="text-sm text-gray-600">Average per Question</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formatTime(Math.round(
                          questions
                            .filter(q => q.is_correct)
                            .reduce((sum, q) => sum + q.time_taken, 0) /
                            questions.filter(q => q.is_correct).length || 0
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">Avg for Correct</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-lg font-bold text-red-600">
                        {formatTime(Math.round(
                          questions
                            .filter(q => q.is_correct === false)
                            .reduce((sum, q) => sum + q.time_taken, 0) /
                            questions.filter(q => q.is_correct === false).length || 0
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">Avg for Incorrect</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
