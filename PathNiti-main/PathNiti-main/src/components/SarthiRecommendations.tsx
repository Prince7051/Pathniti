"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Clock,
  DollarSign,
  MapPin,
  GraduationCap,
  Users,
  Briefcase,
  Heart,
  CheckCircle,
  AlertTriangle,
  School,
  Trophy,
  Target,
} from "lucide-react";
import type { SarthiUserProfile } from "@/lib/sarthi-ai";

interface SarthiRecommendationsProps {
  userProfile: SarthiUserProfile;
  className?: string;
}

interface SarthiRecommendation {
  primary_recommendation: {
    stream: string;
    confidence: number;
    reasoning: string;
    parent_appeal_factors: string[];
    career_paths: string[];
    concerns_addressed: string[];
    scholarships_available: string[];
    nearby_colleges: string[];
    roi_analysis: {
      average_salary: number;
      job_demand_trend: string;
      time_to_earn: number;
      investment_required: number;
      return_period: number;
      growth_potential: string;
      market_stability: string;
      skill_demand: string;
      future_prospects: string;
      study_duration_years: number;
      earning_start_year: number;
      break_even_years: number;
      total_education_cost: number;
      early_career_salary: number;
      mid_career_salary: number;
      roi_percentage: number;
    };
  };
  alternatives: Array<{
    stream: string;
    confidence: number;
    alternatives: string[];
  }>;
  parent_friendly_summary: string;
  student_motivation: string;
  action_plan: string[];
}

export default function SarthiRecommendations({
  userProfile,
  className = "",
}: SarthiRecommendationsProps) {
  const [recommendations, setRecommendations] =
    useState<SarthiRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showParentView, setShowParentView] = useState(false);

  const fetchSarthiRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sarthi/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: userProfile,
          request_type: "full_recommendation",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Sarthi recommendations");
      }

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error(data.message || "Failed to get recommendations");
      }
    } catch (err) {
      console.error("Error fetching Sarthi recommendations:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchSarthiRecommendations();
  }, [fetchSarthiRecommendations]);

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)} LPA`;
  };

  const formatRupees = (amount: number) => {
    return `₹${(amount / 100000).toFixed(0)} Lakh`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Sarthi is analyzing your profile and generating personalized
              recommendations...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load recommendations. Please try again."}
          <Button
            onClick={fetchSarthiRecommendations}
            className="ml-4"
            size="sm"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const {
    primary_recommendation,
    alternatives,
    parent_friendly_summary,
    student_motivation,
    action_plan,
  } = recommendations;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Sarthi AI Recommendations
          </h2>
          <p className="text-gray-600 mt-1">
            Personalized career guidance with parental mindset awareness
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!showParentView ? "default" : "outline"}
            onClick={() => setShowParentView(false)}
            size="sm"
          >
            <Users className="h-4 w-4 mr-1" />
            Student View
          </Button>
          <Button
            variant={showParentView ? "default" : "outline"}
            onClick={() => setShowParentView(true)}
            size="sm"
          >
            <Heart className="h-4 w-4 mr-1" />
            Parent View
          </Button>
        </div>
      </div>

      {/* Parent/Student Summary */}
      <Alert className="border-blue-200 bg-blue-50">
        <Heart className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>{showParentView ? "For Parents:" : "For You:"}</strong>{" "}
          {showParentView ? parent_friendly_summary : student_motivation}
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          <TabsTrigger value="action">Action Plan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Primary Recommendation:{" "}
                {primary_recommendation.stream.charAt(0).toUpperCase() +
                  primary_recommendation.stream.slice(1)}
                <Badge variant="secondary" className="ml-2">
                  {Math.round(primary_recommendation.confidence * 100)}% Match
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress
                  value={primary_recommendation.confidence * 100}
                  className="w-full"
                />

                <p className="text-gray-700">
                  {primary_recommendation.reasoning}
                </p>

                {/* Key Appeal Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Why Parents Will Love This
                    </h4>
                    <ul className="space-y-1">
                      {primary_recommendation.parent_appeal_factors.map(
                        (factor: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start gap-1"
                          >
                            <span className="text-green-600 text-xs mt-1">
                              •
                            </span>
                            {factor}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      Career Opportunities
                    </h4>
                    <div className="space-y-2">
                      {primary_recommendation.career_paths
                        .slice(0, 3)
                        .map(
                          (career: string, index: number) => (
                            <div key={index} className="bg-gray-50 p-2 rounded">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-sm">
                                  {career}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                    </div>
                  </div>
                </div>

                {/* Concerns Addressed */}
                {primary_recommendation.concerns_addressed &&
                  primary_recommendation.concerns_addressed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Addressing Your Concerns
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {primary_recommendation.concerns_addressed.map(
                          (concern: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-green-700 border-green-300"
                            >
                              {concern}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Scholarships */}
          {primary_recommendation.scholarships_available &&
            primary_recommendation.scholarships_available.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    Available Scholarships in J&K
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {primary_recommendation.scholarships_available.map(
                      (scholarship: string, index: number) => (
                        <div
                          key={index}
                          className="bg-purple-50 p-3 rounded border border-purple-200"
                        >
                          <p className="text-sm font-medium text-purple-900">
                            {scholarship}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    💡 Apply early as these scholarships have limited seats and
                    specific deadlines.
                  </p>
                </CardContent>
              </Card>
            )}

          {/* Nearby Colleges */}
          {primary_recommendation.nearby_colleges &&
            primary_recommendation.nearby_colleges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Nearby Colleges for{" "}
                    {primary_recommendation.stream.charAt(0).toUpperCase() +
                      primary_recommendation.stream.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {primary_recommendation.nearby_colleges
                      .slice(0, 3)
                      .map(
                        (college: string, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded"
                          >
                            <div>
                              <h4 className="font-medium">{college}</h4>
                            </div>
                          </div>
                        ),
                      )}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* ROI Analysis Tab */}
        <TabsContent value="roi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Return on Investment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Investment Timeline */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Investment Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Study Duration</span>
                      <span className="font-medium">
                        {
                          primary_recommendation.roi_analysis
                            .study_duration_years
                        }{" "}
                        years
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Earning Starts</span>
                      <span className="font-medium">
                        Year{" "}
                        {primary_recommendation.roi_analysis.earning_start_year}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                      <span className="text-sm">Break-even Point</span>
                      <span className="font-medium">
                        {primary_recommendation.roi_analysis.break_even_years}{" "}
                        years
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Projections */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Projections
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm">Education Cost</span>
                      <span className="font-medium">
                        {formatRupees(
                          primary_recommendation.roi_analysis
                            .total_education_cost,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Starting Salary</span>
                      <span className="font-medium">
                        {formatCurrency(
                          primary_recommendation.roi_analysis
                            .early_career_salary,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Mid-career Salary</span>
                      <span className="font-medium">
                        {formatCurrency(
                          primary_recommendation.roi_analysis.mid_career_salary,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                <h4 className="font-semibold text-center mb-2">
                  10-Year ROI Projection
                </h4>
                <div className="text-center">
                  <span className="text-3xl font-bold text-green-600">
                    {primary_recommendation.roi_analysis.roi_percentage}%
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Expected return on your education investment over 10 years
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alternatives Tab */}
        <TabsContent value="alternatives" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alternatives
              .slice(0, 2)
              .map((alternative, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {alternative.stream.charAt(0).toUpperCase() +
                          alternative.stream.slice(1)}
                      </span>
                      <Badge variant="outline">
                        {Math.round(alternative.confidence * 100)}% Match
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress
                        value={alternative.confidence * 100}
                        className="w-full"
                      />

                      <p className="text-sm text-gray-700">
                        Alternative career paths for this stream
                      </p>

                      {/* Alternative Paths */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-blue-700 mb-1 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Alternative Paths
                        </h5>
                        <ul className="space-y-1">
                          {alternative.alternatives.map(
                            (alt: string, i: number) => (
                              <li
                                key={i}
                                className="text-xs text-gray-600 flex items-start gap-1"
                              >
                                <span className="text-blue-500 text-xs mt-0.5">
                                  •
                                </span>
                                {alt}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>

                      {/* ROI Comparison */}
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-700">
                          <strong>ROI:</strong>{" "}
                          Good return on investment potential
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="action" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-600" />
                Your Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {action_plan.map((step: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>

              <Alert className="mt-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Remember:</strong> Start with step 1 and complete each
                  action within the next 2-4 weeks. Sarthi AI will track your
                  progress and provide updated recommendations as you advance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
