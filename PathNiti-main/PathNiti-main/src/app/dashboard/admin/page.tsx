"use client";

import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useAuth } from "../../providers";
import {
  Shield,
  Users,
  Building,
  BarChart3,
  Activity,
  BookOpen,
  ArrowLeft,
  Settings,
  Brain,
  Target,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface AdminAnalytics {
  totalUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  totalColleges: number;
  verifiedColleges: number;
  newCollegesThisWeek: number;
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  totalAiInteractions: number;
  aiInteractionsToday: number;
  aiAccuracy: {
    streamPredictions: number;
    careerMatching: number;
    roiPredictions: number;
    parentSatisfaction: number;
  };
  regionalInsights: {
    localCollegeMatches: number;
    scholarshipEligibility: number;
    govtJobPreferences: number;
    fastEarningConcerns: number;
  };
  recentActivity: Array<{
    action: string;
    description: string;
    timestamp: string;
    timeAgo: string;
  }>;
  platformMetrics: {
    userRegistrationRate: number;
    quizCompletionRate: number;
    collegeVerificationRate: number;
  };
}

export default function AdminDashboardPage() {
  const { loading, requireAuth, requireRole } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Use centralized authentication enforcement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireAuth();
        await requireRole("admin");
      } catch (error) {
        console.error("Authentication check failed:", error);
      }
    };
    checkAuth();
  }, [requireAuth, requireRole]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        const response = await fetch("/api/admin/analytics");

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const result = await response.json();

        if (result.success) {
          setAnalytics(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch analytics");
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setAnalyticsError(
          error instanceof Error ? error.message : "Failed to fetch analytics",
        );
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Use central loading state from useAuth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Main Site
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Analytics Dashboard
              </h1>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin">
                <Settings className="h-4 w-4 mr-2" />
                Full Admin Panel
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
                  <p className="text-slate-200">
                    Monitor platform metrics, user analytics, and system
                    performance.
                  </p>
                </div>
                <Shield className="h-16 w-16 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : analyticsError ? (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">Error</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {analytics?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics?.userGrowthRate || 0}% from last month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Colleges
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : analyticsError ? (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">Error</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {analytics?.totalColleges || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.verifiedColleges || 0} verified,{" "}
                    {analytics?.newCollegesThisWeek || 0} new this week
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quiz Completions
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : analyticsError ? (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">Error</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {analytics?.completedAssessments || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg score: {analytics?.averageScore || 0}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Interactions
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : analyticsError ? (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">Error</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {analytics?.totalAiInteractions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.aiInteractionsToday || 0} today
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sarthi AI Monitoring */}
        <div className="mb-8">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Brain className="h-6 w-6 mr-2" />
                Sarthi AI Performance Dashboard
              </CardTitle>
              <CardDescription className="text-blue-700">
                Monitor AI recommendation accuracy, usage patterns, and user
                satisfaction for the enhanced career guidance system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* AI Recommendation Stats */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-900 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Recommendation Accuracy
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Stream Predictions</span>
                      <span className="font-medium text-green-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.aiAccuracy?.streamPredictions || 0}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Career Matching</span>
                      <span className="font-medium text-green-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.aiAccuracy?.careerMatching || 0}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ROI Predictions</span>
                      <span className="font-medium text-blue-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.aiAccuracy?.roiPredictions || 0}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Parent Satisfaction</span>
                      <span className="font-medium text-green-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.aiAccuracy?.parentSatisfaction || 0}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-900 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Sarthi AI Usage
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daily Recommendations</span>
                      <span className="font-medium">
                        {analyticsLoading
                          ? "..."
                          : analytics?.aiInteractionsToday || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Interactions</span>
                      <span className="font-medium">
                        {analyticsLoading
                          ? "..."
                          : analytics?.totalAiInteractions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quiz Completions</span>
                      <span className="font-medium">
                        {analyticsLoading
                          ? "..."
                          : analytics?.completedAssessments || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">API Success Rate</span>
                      <span className="font-medium text-green-600">99.2%</span>
                    </div>
                  </div>
                </div>

                {/* Regional Insights */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-900 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    J&K Insights
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Local College Matches</span>
                      <span className="font-medium">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.regionalInsights?.localCollegeMatches || 0}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Scholarship Eligibility</span>
                      <span className="font-medium text-green-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.regionalInsights?.scholarshipEligibility || 0}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Govt. Job Preferences</span>
                      <span className="font-medium">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.regionalInsights?.govtJobPreferences || 0}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Fast Earning Concerns</span>
                      <span className="font-medium text-orange-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.regionalInsights?.fastEarningConcerns || 0}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Adjust AI Parameters
                  </Button>
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Export Reports
                  </Button>
                  <Button variant="outline" size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Training Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts and Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Platform Usage Analytics
                </CardTitle>
                <CardDescription>
                  Key metrics and trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        User Registration Rate
                      </span>
                      <span className="text-sm text-green-600">
                        {analyticsLoading
                          ? "..."
                          : `+${analytics?.platformMetrics?.userRegistrationRate || 0}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(analytics?.platformMetrics?.userRegistrationRate || 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Quiz Completion Rate
                      </span>
                      <span className="text-sm text-blue-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.platformMetrics?.quizCompletionRate || 0}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(analytics?.platformMetrics?.quizCompletionRate || 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        College Verification Rate
                      </span>
                      <span className="text-sm text-purple-600">
                        {analyticsLoading
                          ? "..."
                          : `${analytics?.platformMetrics?.collegeVerificationRate || 0}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(analytics?.platformMetrics?.collegeVerificationRate || 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Management</CardTitle>
                <CardDescription>
                  Direct access to admin functions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/admin">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/admin">
                    <Building className="h-4 w-4 mr-2" />
                    Manage Colleges
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/admin">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Content Management
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Admin Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>
              Latest administrative actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Loading activity...
                </span>
              </div>
            ) : analyticsError ? (
              <div className="flex items-center justify-center py-8">
                <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                <span className="text-sm text-red-500">
                  Failed to load activity
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics?.recentActivity?.length ? (
                  analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.action.includes("college")
                            ? "bg-green-600"
                            : activity.action.includes("user")
                              ? "bg-blue-600"
                              : activity.action.includes("content")
                                ? "bg-purple-600"
                                : "bg-orange-600"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.timeAgo}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      No recent admin activity
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Admin actions will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
