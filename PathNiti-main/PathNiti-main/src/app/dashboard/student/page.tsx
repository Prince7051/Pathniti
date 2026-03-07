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
import { StudentApplicationTracker } from "@/components/StudentApplicationTracker";
import { ApplicationNotifications } from "@/components/ApplicationNotifications";
import { AuthGuard } from "@/components/AuthGuard";
import {
  GraduationCap,
  BarChart3,
  TrendingUp,
  Target,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface StudentAnalytics {
  quizScoreAverage: number;
  lastAssessmentScore: number;
  scoreChange: number;
  collegesExplored: number;
  collegesThisWeek: number;
  applicationsTracked: number;
  upcomingDeadlines: number;
  scholarshipsFound: number;
  totalScholarshipValue: number;
  recentActivity: Array<{
    action: string;
    description: string;
    timestamp: string;
    timeAgo: string;
  }>;
  progressMilestones: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    inProgress?: boolean;
    completedAt?: string;
  }>;
}

export default function StudentDashboardPage() {
  const { loading, user, profile } = useAuth();
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;

      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        const response = await fetch(
          `/api/student/analytics?user_id=${user.id}`,
        );

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
  }, [user?.id]);

  // Use central loading state from useAuth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true} requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
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
                Student Analytics Dashboard
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome back, {profile?.first_name || "Student"}!
                  </h2>
                  <p className="text-blue-100">
                    Track your progress, view your analytics, and monitor your
                    educational journey.
                  </p>
                </div>
                <GraduationCap className="h-16 w-16 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quiz Score Average
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
                    {analytics?.quizScoreAverage || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.scoreChange ? (
                      analytics.scoreChange > 0 ? (
                        <span className="text-green-600">
                          +{analytics.scoreChange}% from last assessment
                        </span>
                      ) : (
                        <span className="text-red-600">
                          {analytics.scoreChange}% from last assessment
                        </span>
                      )
                    ) : (
                      "No previous assessment"
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Colleges Explored
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
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
                    {analytics?.collegesExplored || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.collegesThisWeek || 0} new this week
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications Tracked
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
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
                    {analytics?.applicationsTracked || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.upcomingDeadlines || 0} deadlines approaching
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Scholarships Found
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
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
                    {analytics?.scholarshipsFound || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Worth ₹
                    {(analytics?.totalScholarshipValue || 0).toLocaleString()}{" "}
                    total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Tracking and Notifications */}
        {user?.id && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <StudentApplicationTracker userId={user.id} />
            <ApplicationNotifications userId={user.id} />
          </div>
        )}


        {/* Progress Tracking */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Progress Overview
                </CardTitle>
                <CardDescription>
                  Your educational journey milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Loading progress...
                    </span>
                  </div>
                ) : analyticsError ? (
                  <div className="flex items-center justify-center py-8">
                    <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                    <span className="text-sm text-red-500">
                      Failed to load progress
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics?.progressMilestones?.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center space-x-3"
                      >
                        {milestone.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : milestone.inProgress ? (
                          <div className="h-5 w-5 border-2 border-blue-300 rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                          </div>
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-sm text-gray-500">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          No progress data available
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Continue your journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/quiz">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Retake Assessment
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/timeline">
                    <Clock className="h-4 w-4 mr-2" />
                    Check Deadlines
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/colleges">
                    <Target className="h-4 w-4 mr-2" />
                    Find More Colleges
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/scholarships">
                    <Award className="h-4 w-4 mr-2" />
                    Explore Scholarships
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
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
                          activity.action.includes("quiz")
                            ? "bg-blue-600"
                            : activity.action.includes("college")
                              ? "bg-green-600"
                              : activity.action.includes("application")
                                ? "bg-purple-600"
                                : "bg-gray-600"
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
                    <p className="text-sm text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Start exploring to see your activity here
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </AuthGuard>
  );
}
