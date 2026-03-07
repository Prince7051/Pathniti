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
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Star,
} from "lucide-react";
import type { SarthiUserProfile } from "@/lib/sarthi-ai";

interface StreamComparisonProps {
  userProfile: SarthiUserProfile;
  streamsToCompare?: string[];
  className?: string;
}

interface StreamData {
  stream: string;
  confidence: number;
  roi_analysis: {
    roi_percentage?: number;
    early_career_salary?: { max?: number };
  };
  career_paths: Array<{
    job_security?: string;
    growth_rate?: number;
  }>;
  parent_appeal_factors: string[];
  concerns_addressed: string[];
  alternatives: Record<string, unknown>[];
  match_score: number;
}

const STREAM_COLORS = {
  science: "bg-blue-500 text-white",
  engineering: "bg-purple-500 text-white",
  medical: "bg-red-500 text-white",
  commerce: "bg-green-500 text-white",
  arts: "bg-yellow-500 text-white",
  vocational: "bg-orange-500 text-white",
};

const STREAM_DESCRIPTIONS = {
  science: "Focus on scientific subjects and analytical thinking",
  engineering: "Technical and engineering problem-solving",
  medical: "Healthcare and medical sciences",
  commerce: "Business, finance, and commercial studies",
  arts: "Humanities, social sciences, and creative fields",
  vocational: "Practical skills and trade-specific education",
};

export default function StreamComparison({
  userProfile,
  streamsToCompare = ["science", "commerce", "arts"],
  className = "",
}: StreamComparisonProps) {
  const [comparisonData, setComparisonData] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<
    "roi" | "earning" | "security" | "growth"
  >("roi");

  const fetchStreamComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sarthi/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: userProfile,
          request_type: "stream_comparison",
          streams: streamsToCompare,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stream comparison");
      }

      const data = await response.json();
      if (data.success && data.recommendations.comparison) {
        setComparisonData(data.recommendations.comparison);
      } else {
        throw new Error(data.message || "Failed to get comparison data");
      }
    } catch (err) {
      console.error("Error fetching stream comparison:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userProfile, streamsToCompare]);

  useEffect(() => {
    fetchStreamComparison();
  }, [fetchStreamComparison]);

  const getMetricValue = (stream: StreamData, metric: string): number => {
    switch (metric) {
      case "roi":
        return stream.roi_analysis?.roi_percentage || 0;
      case "earning":
        return (stream.roi_analysis?.early_career_salary?.max || 0) / 100000;
      case "security":
        const secureJobs =
          stream.career_paths?.filter((c) => c.job_security === "high")
            .length || 0;
        return (secureJobs / (stream.career_paths?.length || 1)) * 100;
      case "growth":
        const avgGrowth =
          stream.career_paths?.reduce(
            (sum, c) => sum + (c.growth_rate || 0),
            0,
          ) || 0;
        return avgGrowth / (stream.career_paths?.length || 1);
      default:
        return 0;
    }
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case "roi":
        return "ROI (%)";
      case "earning":
        return "Max Salary (LPA)";
      case "security":
        return "Job Security (%)";
      case "growth":
        return "Growth Rate (%)";
      default:
        return "";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)} LPA`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Comparing streams based on your profile...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error || !comparisonData.length) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "No comparison data available."}
          <Button onClick={fetchStreamComparison} className="ml-4" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const bestStream = comparisonData.reduce((best, current) =>
    current.match_score > best.match_score ? current : best,
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Stream Comparison
          </h2>
          <p className="text-gray-600 mt-1">
            Compare different academic streams based on your profile and
            preferences
          </p>
        </div>
      </div>

      {/* Best Match Highlight */}
      <Alert className="border-green-200 bg-green-50">
        <Target className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Best Match:</strong>{" "}
          {bestStream.stream.charAt(0).toUpperCase() +
            bestStream.stream.slice(1)}
          with {Math.round(bestStream.confidence * 100)}% compatibility based on
          your interests, aptitude, and family expectations.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="careers">Career Paths</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisonData.map((stream) => (
              <Card key={stream.stream} className="relative overflow-hidden">
                <div
                  className={`h-2 ${STREAM_COLORS[stream.stream as keyof typeof STREAM_COLORS] || "bg-gray-500"}`}
                ></div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {stream.stream.charAt(0).toUpperCase() +
                        stream.stream.slice(1)}
                    </span>
                    {stream.stream === bestStream.stream && (
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    )}
                  </CardTitle>
                  <Progress
                    value={stream.confidence * 100}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">
                    {Math.round(stream.confidence * 100)}% match
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      {
                        STREAM_DESCRIPTIONS[
                          stream.stream as keyof typeof STREAM_DESCRIPTIONS
                        ]
                      }
                    </p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="font-medium text-blue-900">ROI</div>
                        <div className="text-blue-700">
                          {stream.roi_analysis?.roi_percentage || 0}%
                        </div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-medium text-green-900">
                          Start Salary
                        </div>
                        <div className="text-green-700">
                          {formatCurrency(
                            typeof stream.roi_analysis?.early_career_salary === 'number' 
                              ? stream.roi_analysis.early_career_salary 
                              : stream.roi_analysis?.early_career_salary?.max || 0,
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Top Career Path */}
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs font-medium text-gray-900 mb-1">
                        Top Career Path
                      </div>
                      <div className="text-sm text-gray-700">
                        {typeof stream.career_paths?.[0] === 'string' ? stream.career_paths[0] : "Various options"}
                      </div>
                    </div>

                    {/* Key Appeal */}
                    <div>
                      <div className="text-xs font-medium text-gray-900 mb-1">
                        Key Appeal
                      </div>
                      <div className="text-xs text-gray-600">
                        {stream.parent_appeal_factors?.[0] ||
                          "Good career prospects"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {/* Metric Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={selectedMetric === "roi" ? "default" : "outline"}
              onClick={() => setSelectedMetric("roi")}
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              ROI
            </Button>
            <Button
              variant={selectedMetric === "earning" ? "default" : "outline"}
              onClick={() => setSelectedMetric("earning")}
              size="sm"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Earning
            </Button>
            <Button
              variant={selectedMetric === "security" ? "default" : "outline"}
              onClick={() => setSelectedMetric("security")}
              size="sm"
            >
              <Shield className="h-4 w-4 mr-1" />
              Security
            </Button>
            <Button
              variant={selectedMetric === "growth" ? "default" : "outline"}
              onClick={() => setSelectedMetric("growth")}
              size="sm"
            >
              <Zap className="h-4 w-4 mr-1" />
              Growth
            </Button>
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {getMetricLabel(selectedMetric)} Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData
                  .sort(
                    (a, b) =>
                      getMetricValue(b, selectedMetric) -
                      getMetricValue(a, selectedMetric),
                  )
                  .map((stream, index) => {
                    const value = getMetricValue(stream, selectedMetric);
                    const maxValue = Math.max(
                      ...comparisonData.map((s) =>
                        getMetricValue(s, selectedMetric),
                      ),
                    );
                    const percentage =
                      maxValue > 0 ? (value / maxValue) * 100 : 0;

                    return (
                      <div key={stream.stream} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">
                            {stream.stream}
                          </span>
                          <span className="text-sm font-medium">
                            {selectedMetric === "earning"
                              ? formatCurrency(value * 100000)
                              : `${value.toFixed(1)}${selectedMetric === "roi" || selectedMetric === "security" || selectedMetric === "growth" ? "%" : ""}`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${STREAM_COLORS[stream.stream as keyof typeof STREAM_COLORS]?.replace("text-white", "") || "bg-gray-500"}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Best in {getMetricLabel(selectedMetric)}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Stream</th>
                      <th className="text-left p-2">Match %</th>
                      <th className="text-left p-2">ROI %</th>
                      <th className="text-left p-2">Starting Salary</th>
                      <th className="text-left p-2">Study Duration</th>
                      <th className="text-left p-2">Job Security</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((stream) => (
                      <tr
                        key={stream.stream}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${STREAM_COLORS[stream.stream as keyof typeof STREAM_COLORS]?.replace("text-white", "") || "bg-gray-500"}`}
                            ></div>
                            <span className="capitalize font-medium">
                              {stream.stream}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          {Math.round(stream.confidence * 100)}%
                        </td>
                        <td className="p-2">
                          {stream.roi_analysis?.roi_percentage || 0}%
                        </td>
                        <td className="p-2">
                          {formatCurrency(
                            typeof stream.roi_analysis?.early_career_salary === 'number' 
                              ? stream.roi_analysis.early_career_salary 
                              : stream.roi_analysis?.early_career_salary?.max || 0,
                          )}
                        </td>
                        <td className="p-2">
                          3 years
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {getMetricValue(stream, "security") > 70 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            {getMetricValue(stream, "security").toFixed(0)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career Paths Tab */}
        <TabsContent value="careers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonData.map((stream) => (
              <Card key={stream.stream}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full ${STREAM_COLORS[stream.stream as keyof typeof STREAM_COLORS]?.replace("text-white", "") || "bg-gray-500"}`}
                    ></div>
                    {stream.stream.charAt(0).toUpperCase() +
                      stream.stream.slice(1)}{" "}
                    Careers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stream.career_paths?.slice(0, 4).map((career, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm">
                            {typeof career === 'string' ? career : 'Career Path'}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detailed Analysis Tab */}
        <TabsContent value="detailed" className="space-y-6">
          {comparisonData.map((stream) => (
            <Card key={stream.stream}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full ${STREAM_COLORS[stream.stream as keyof typeof STREAM_COLORS]?.replace("text-white", "") || "bg-gray-500"}`}
                  ></div>
                  {stream.stream.charAt(0).toUpperCase() +
                    stream.stream.slice(1)}{" "}
                  - Detailed Analysis
                  {stream.stream === bestStream.stream && (
                    <Badge variant="secondary" className="ml-2">
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pros and Cons */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Advantages
                      </h4>
                      <ul className="space-y-1">
                        {stream.parent_appeal_factors
                          ?.slice(0, 3)
                          .map((factor: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-gray-600 flex items-start gap-1"
                            >
                              <span className="text-green-500 text-xs mt-1">
                                •
                              </span>
                              {factor}
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Challenges
                      </h4>
                      <ul className="space-y-1">
                        {[
                          "Competition for top positions",
                          "Requires dedicated study time",
                          "Market conditions may vary",
                        ].map((con: string, i: number) => (
                          <li
                            key={i}
                            className="text-sm text-gray-600 flex items-start gap-1"
                          >
                            <span className="text-red-500 text-xs mt-1">
                              •
                            </span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Parent Appeals and Concerns */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Parent Appeal Factors
                      </h4>
                      <ul className="space-y-1">
                        {stream.parent_appeal_factors?.map(
                          (factor: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-gray-600 flex items-start gap-1"
                            >
                              <span className="text-blue-500 text-xs mt-1">
                                •
                              </span>
                              {factor}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Concerns Addressed
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {stream.concerns_addressed?.map(
                          (concern: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs text-purple-700 border-purple-300"
                            >
                              {concern}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>

                    {/* ROI Summary */}
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        ROI Summary
                      </h4>
                      <div className="text-sm text-gray-700">
                        <p>
                          <strong>Study Duration:</strong>{" "}
                          3 years
                        </p>
                        <p>
                          <strong>Break-even:</strong>{" "}
                          5 years
                        </p>
                        <p>
                          <strong>10-year ROI:</strong>{" "}
                          {stream.roi_analysis?.roi_percentage || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
