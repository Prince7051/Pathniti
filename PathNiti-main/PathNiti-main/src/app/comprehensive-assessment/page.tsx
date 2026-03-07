"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/index";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Brain,
  Heart,
  Users,
  BookOpen,
  MapPin,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Question data structures
interface Question {
  id: string;
  text: string;
  type: "aptitude" | "riasec_interest" | "personality" | "subject_performance";
  category: string;
  subcategory?: string;
  options: string[];
  correctAnswer?: number;
  timeLimit: number;
  weight: number;
}

// Assessment sections
interface AssessmentSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

type AssessmentSections = {
  [key: string]: AssessmentSection;
};

const ASSESSMENT_SECTIONS: AssessmentSections = {
  aptitude: {
    title: "Aptitude Assessment",
    description:
      "Test your logical reasoning, quantitative skills, and cognitive abilities",
    icon: Brain,
    color: "text-blue-600",
  },
  riasec: {
    title: "Interest Assessment (RIASEC)",
    description: "Discover your career interests and preferences",
    icon: Heart,
    color: "text-red-600",
  },
  personality: {
    title: "Personality Assessment",
    description: "Understand your personality traits and work style",
    icon: Users,
    color: "text-green-600",
  },
  subjects: {
    title: "Subject Performance",
    description: "Evaluate your performance in key academic subjects",
    icon: BookOpen,
    color: "text-purple-600",
  },
  constraints: {
    title: "Practical Constraints",
    description:
      "Tell us about your location, finances, and family expectations",
    icon: MapPin,
    color: "text-orange-600",
  },
};

// Sample questions (in a real implementation, these would come from the database)
const SAMPLE_QUESTIONS: Record<string, Question[]> = {
  aptitude: [
    {
      id: "apt_001",
      text: "If A is to the right of B, and C is to the left of B, then what is the arrangement?",
      type: "aptitude",
      category: "logical_reasoning",
      options: ["C-B-A", "A-B-C", "B-A-C", "C-A-B"],
      correctAnswer: 0,
      timeLimit: 60,
      weight: 1.0,
    },
    {
      id: "apt_002",
      text: "What is 15% of 240?",
      type: "aptitude",
      category: "quantitative_skills",
      options: ["36", "32", "40", "38"],
      correctAnswer: 0,
      timeLimit: 45,
      weight: 1.0,
    },
    {
      id: "apt_003",
      text: 'Choose the word that is most similar to "OCEAN": ',
      type: "aptitude",
      category: "language_verbal_skills",
      options: ["Lake", "Sea", "River", "Pond"],
      correctAnswer: 1,
      timeLimit: 30,
      weight: 1.0,
    },
  ],
  riasec: [
    {
      id: "ria_001",
      text: "I enjoy working with tools and machinery",
      type: "riasec_interest",
      category: "realistic",
      options: [
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree",
      ],
      timeLimit: 30,
      weight: 1.0,
    },
    {
      id: "ria_002",
      text: "I like to analyze data and solve complex problems",
      type: "riasec_interest",
      category: "investigative",
      options: [
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree",
      ],
      timeLimit: 30,
      weight: 1.0,
    },
    {
      id: "ria_003",
      text: "I enjoy creative activities like drawing, writing, or music",
      type: "riasec_interest",
      category: "artistic",
      options: [
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree",
      ],
      timeLimit: 30,
      weight: 1.0,
    },
  ],
  personality: [
    {
      id: "per_001",
      text: "I prefer to work alone rather than in groups",
      type: "personality",
      category: "introvert_extrovert",
      options: [
        "Strongly Agree",
        "Agree",
        "Neutral",
        "Disagree",
        "Strongly Disagree",
      ],
      timeLimit: 30,
      weight: 1.0,
    },
    {
      id: "per_002",
      text: "I am willing to take risks for potentially high rewards",
      type: "personality",
      category: "risk_taking_vs_risk_averse",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      timeLimit: 30,
      weight: 1.0,
    },
  ],
  subjects: [
    {
      id: "sub_001",
      text: "Solve: 2x + 5 = 15. What is x?",
      type: "subject_performance",
      category: "math",
      subcategory: "accuracy",
      options: ["3", "5", "7", "10"],
      correctAnswer: 1,
      timeLimit: 90,
      weight: 1.0,
    },
    {
      id: "sub_002",
      text: "What is the chemical symbol for Gold?",
      type: "subject_performance",
      category: "science",
      subcategory: "accuracy",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2,
      timeLimit: 30,
      weight: 1.0,
    },
  ],
};

export default function ComprehensiveAssessmentPage() {
  const { user, loading, requireAuth } = useAuth();
  const router = useRouter();

  // State management
  const [currentSection, setCurrentSection] = useState<string>("aptitude");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [sectionProgress, setSectionProgress] = useState<
    Record<string, number>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  
  // Questions state
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Practical constraints state
  const [practicalConstraints, setPracticalConstraints] = useState({
    location: "",
    financial_background: "",
    parental_expectation: "",
  });

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    try {
      setLoadingQuestions(true);
      setQuestionsError(null);

      const questionTypes = ['aptitude', 'riasec_interest', 'personality', 'subject_performance'];
      const questionsData: Record<string, Question[]> = {};

      for (const type of questionTypes) {
        const response = await fetch(`/api/questions?type=${type}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          questionsData[type] = data.questions;
        } else {
          console.error(`Failed to fetch ${type} questions`);
          // Fallback to sample questions if API fails
          questionsData[type] = SAMPLE_QUESTIONS[type] || [];
        }
      }

      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestionsError("Failed to load questions. Using sample questions.");
      // Fallback to sample questions
      setQuestions(SAMPLE_QUESTIONS);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Real-time timer effect - updates every 10ms for millisecond precision
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10); // Update every 10ms for smooth millisecond display

    return () => clearInterval(timer);
  }, []);

  const currentQuestions = questions[currentSection] || SAMPLE_QUESTIONS[currentSection] || [];
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const totalSections = Object.keys(ASSESSMENT_SECTIONS).length;
  const completedSections = Object.keys(sectionProgress).filter(
    (section) => sectionProgress[section] === 100,
  ).length;
  const overallProgress = (completedSections / totalSections) * 100;

  const handleAnswer = useCallback(
    (questionId: string, answer: number) => {
      const questionStartTime = startTime;
      const timeTaken = (currentTime - questionStartTime) / 1000; // Keep millisecond precision

      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      setTimeSpent((prev) => ({ ...prev, [questionId]: timeTaken }));
    },
    [startTime, currentTime],
  );

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setStartTime(Date.now());
    } else {
      // Section completed
      setSectionProgress((prev) => ({ ...prev, [currentSection]: 100 }));

      // Move to next section
      const sections = Object.keys(ASSESSMENT_SECTIONS);
      const currentIndex = sections.indexOf(currentSection);
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1]);
        setCurrentQuestionIndex(0);
        setStartTime(Date.now());
      }
    }
  }, [currentQuestionIndex, currentQuestions.length, currentSection]);

  const calculateScores = useCallback(() => {
    const aptitudeScores = {
      logical_reasoning: 0,
      quantitative_skills: 0,
      language_verbal_skills: 0,
      spatial_visual_skills: 0,
      memory_attention: 0,
    };

    const riasecScores = {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    };

    const personalityScores = {
      introvert_extrovert: 0,
      risk_taking_vs_risk_averse: 0,
      structured_vs_flexible: 0,
      leadership_vs_supportive: 0,
    };

    const subjectPerformance = {
      math: { accuracy: 0, speed: 0 },
      science: { accuracy: 0, speed: 0 },
      social_science: { accuracy: 0, speed: 0 },
      english: { accuracy: 0, speed: 0 },
      general_knowledge: { accuracy: 0, speed: 0 },
    };

    // Calculate scores based on answers
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = Object.values(questions)
        .flat()
        .find((q) => q.id === questionId);
      if (!question) return;

      const normalizedScore = answer / (question.options.length - 1); // Normalize to 0-1

      switch (question.type) {
        case "aptitude":
          if (question.category in aptitudeScores) {
            aptitudeScores[question.category as keyof typeof aptitudeScores] +=
              normalizedScore;
          }
          break;
        case "riasec_interest":
          if (question.category in riasecScores) {
            riasecScores[question.category as keyof typeof riasecScores] +=
              normalizedScore;
          }
          break;
        case "personality":
          if (question.category in personalityScores) {
            personalityScores[
              question.category as keyof typeof personalityScores
            ] += normalizedScore;
          }
          break;
        case "subject_performance":
          if (question.category in subjectPerformance) {
            const category =
              question.category as keyof typeof subjectPerformance;
            if (question.subcategory === "accuracy") {
              subjectPerformance[category].accuracy = normalizedScore;
            } else if (question.subcategory === "speed") {
              const timeTaken = timeSpent[questionId] || question.timeLimit;
              subjectPerformance[category].speed = Math.max(
                0,
                1 - timeTaken / question.timeLimit,
              );
            }
          }
          break;
      }
    });

    // Count questions per category to calculate averages
    const categoryCounts = {
      aptitude: {} as Record<string, number>,
      riasec: {} as Record<string, number>,
      personality: {} as Record<string, number>,
    };

    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = Object.values(questions)
        .flat()
        .find((q) => q.id === questionId);
      if (!question) return;

      switch (question.type) {
        case "aptitude":
          categoryCounts.aptitude[question.category] = (categoryCounts.aptitude[question.category] || 0) + 1;
          break;
        case "riasec_interest":
          categoryCounts.riasec[question.category] = (categoryCounts.riasec[question.category] || 0) + 1;
          break;
        case "personality":
          categoryCounts.personality[question.category] = (categoryCounts.personality[question.category] || 0) + 1;
          break;
      }
    });

    // Calculate averages and convert to percentages (0-100)
    Object.keys(aptitudeScores).forEach(category => {
      const count = categoryCounts.aptitude[category] || 1;
      aptitudeScores[category as keyof typeof aptitudeScores] = Math.round((aptitudeScores[category as keyof typeof aptitudeScores] / count) * 100);
    });

    Object.keys(riasecScores).forEach(category => {
      const count = categoryCounts.riasec[category] || 1;
      riasecScores[category as keyof typeof riasecScores] = Math.round((riasecScores[category as keyof typeof riasecScores] / count) * 100);
    });

    Object.keys(personalityScores).forEach(category => {
      const count = categoryCounts.personality[category] || 1;
      personalityScores[category as keyof typeof personalityScores] = Math.round((personalityScores[category as keyof typeof personalityScores] / count) * 100);
    });

    return {
      aptitude_scores: aptitudeScores,
      riasec_scores: riasecScores,
      personality_scores: personalityScores,
      subject_performance: subjectPerformance,
      practical_constraints: practicalConstraints,
    };
  }, [answers, timeSpent, practicalConstraints, questions]);

  const handleSubmitAssessment = useCallback(async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const assessmentData = calculateScores();

      // Prepare responses data
      const responses = Object.entries(answers).map(([questionId, answer]) => {
        const question = Object.values(questions)
          .flat()
          .find((q) => q.id === questionId);
        return {
          question_id: questionId,
          selected_answer: answer,
          time_taken: timeSpent[questionId] || 0,
          question_type: question?.type || "unknown",
          category: question?.category || "unknown",
        };
      });

      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          assessment_data: assessmentData,
          responses,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to results page
        router.push(`/assessment-results?session_id=${result.session_id}`);
      } else {
        console.error("Assessment submission failed");
        alert("Failed to submit assessment. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, calculateScores, answers, timeSpent, router, questions]);

  // Loading check
  if (loading || loadingQuestions) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? "Loading assessment..." : "Loading questions..."}
          </p>
        </div>
      </div>
    );
  }

  requireAuth();

  // Show error if questions failed to load
  if (questionsError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-yellow-600 mb-4">
            <Brain className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{questionsError}</p>
          <Button onClick={fetchQuestions}>Retry Loading Questions</Button>
        </div>
      </div>
    );
  }

  if (currentSection === "constraints") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Comprehensive Career Assessment
            </h1>
            <div className="text-sm text-gray-500">
              Section {totalSections} of {totalSections}
            </div>
          </div>
          <Progress value={overallProgress} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            {Math.round(overallProgress)}% Complete
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Practical Constraints
            </CardTitle>
            <CardDescription>
              Help us understand your practical considerations for career
              planning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="location">
                Preferred Location for Studies/Career
              </Label>
              <Select
                value={practicalConstraints.location}
                onValueChange={(value) =>
                  setPracticalConstraints((prev) => ({
                    ...prev,
                    location: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your preferred location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_state">Same state as home</SelectItem>
                  <SelectItem value="anywhere_india">
                    Anywhere in India
                  </SelectItem>
                  <SelectItem value="metro_cities">
                    Metro cities only
                  </SelectItem>
                  <SelectItem value="tier2_cities">Tier 2 cities</SelectItem>
                  <SelectItem value="abroad">
                    Open to studying abroad
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="financial">Family Financial Background</Label>
              <Select
                value={practicalConstraints.financial_background}
                onValueChange={(value) =>
                  setPracticalConstraints((prev) => ({
                    ...prev,
                    financial_background: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select financial background" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low income (&lt; 3 LPA)</SelectItem>
                  <SelectItem value="middle">
                    Middle income (3-8 LPA)
                  </SelectItem>
                  <SelectItem value="upper_middle">
                    Upper middle (8-20 LPA)
                  </SelectItem>
                  <SelectItem value="high">
                    High income (&gt; 20 LPA)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parental">
                Primary Parental/Family Expectation
              </Label>
              <Select
                value={practicalConstraints.parental_expectation}
                onValueChange={(value) =>
                  setPracticalConstraints((prev) => ({
                    ...prev,
                    parental_expectation: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select family expectation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Become a doctor</SelectItem>
                  <SelectItem value="engineer">Become an engineer</SelectItem>
                  <SelectItem value="government_job">
                    Secure government job
                  </SelectItem>
                  <SelectItem value="business">Start own business</SelectItem>
                  <SelectItem value="stable_career">
                    Any stable, well-paying career
                  </SelectItem>
                  <SelectItem value="follow_passion">
                    Follow your passion
                  </SelectItem>
                  <SelectItem value="no_pressure">
                    No specific expectation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6">
              <Button
                onClick={handleSubmitAssessment}
                className="w-full"
                size="lg"
                disabled={
                  isSubmitting ||
                  !practicalConstraints.location ||
                  !practicalConstraints.financial_background ||
                  !practicalConstraints.parental_expectation
                }
              >
                {isSubmitting
                  ? "Generating Recommendations..."
                  : "Submit Assessment & Get Recommendations"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Section Completed!</h2>
            <p className="text-gray-600 mb-6">Moving to the next section...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SectionIcon = (ASSESSMENT_SECTIONS as { [key: string]: { icon?: React.ComponentType } })[currentSection]?.icon || Brain;   const sectionColor =
    (ASSESSMENT_SECTIONS as { [key: string]: { color?: string } })[currentSection]?.color || "text-gray-600"; 
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Comprehensive Career Assessment
          </h1>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {currentQuestions.length}
          </div>
        </div>
        <Progress value={overallProgress} className="w-full" />
        <p className="text-sm text-gray-600 mt-2">
          {Math.round(overallProgress)}% Complete
        </p>
      </div>

      {/* Current Section Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SectionIcon className={`h-5 w-5 ${sectionColor}`} />
            {ASSESSMENT_SECTIONS[currentSection]?.title}
          </CardTitle>
          <CardDescription>
            {ASSESSMENT_SECTIONS[currentSection]?.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Limit: {currentQuestion.timeLimit}s</span>
              </div>
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                <span>Elapsed: {((currentTime - startTime) / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id]?.toString() || ""}
            onValueChange={(value) =>
              handleAnswer(currentQuestion.id, parseInt(value))
            }
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${index}`}
                />
                <Label
                  htmlFor={`option-${index}`}
                  className="cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex((prev) => prev - 1);
                }
              }}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <Button
              onClick={handleNextQuestion}
              disabled={answers[currentQuestion.id] === null || answers[currentQuestion.id] === undefined}
            >
              {currentQuestionIndex === currentQuestions.length - 1
                ? "Complete Section"
                : "Next Question"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section Progress */}
      <div className="mt-6">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Object.entries(ASSESSMENT_SECTIONS).map(([key, section]) => {
            const Icon = section.icon;
            const isCompleted = sectionProgress[key] === 100;
            const isCurrent = key === currentSection;

            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border min-w-fit ${
                  isCurrent
                    ? "border-blue-500 bg-blue-50"
                    : isCompleted
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isCurrent
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-blue-900"
                      : isCompleted
                        ? "text-green-900"
                        : "text-gray-600"
                  }`}
                >
                  {section.title}
                </span>
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
