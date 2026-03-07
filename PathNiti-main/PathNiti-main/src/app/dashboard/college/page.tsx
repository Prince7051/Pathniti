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
  Building,
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  UserPlus,
  MapPin,
  Star,
  ArrowLeft,
  Settings,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface CollegeAnalytics {
  collegeInfo: {
    name: string;
    type: string;
    location: {
      state?: string;
      city?: string;
      coordinates?: { lat: number; lng: number };
    };
    is_verified: boolean;
    created_at: string;
  };
  totalInterests: number;
  interestsThisMonth: number;
  totalApplications: number;
  applicationsThisMonth: number;
  totalPrograms: number;
  averageFees: number;
  streamDistribution: Record<string, number>;
  recentActivity: Array<{
    action: string;
    description: string;
    timestamp: string;
    timeAgo: string;
  }>;
  engagementMetrics: {
    interestGrowthRate: number;
    applicationConversionRate: number;
    averageProgramFees: number;
  };
}

export default function CollegeDashboardPage() {
  const { loading, requireAuth, requireRole, profile } = useAuth();
  const [analytics, setAnalytics] = useState<CollegeAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Use centralized authentication enforcement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireAuth();
        await requireRole("college");
      } catch (error) {
        console.error("Authentication check failed:", error);
      }
    };
    checkAuth();
  }, [requireAuth, requireRole]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!profile?.id) return;

      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        const response = await fetch(
          `/api/college/analytics?college_id=${profile.id}`,
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
  }, [profile?.id]);

  // Use central loading state from useAuth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading college dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
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
                College Analytics Dashboard
              </h1>
            </div>
            <Button variant="outline" asChild>
              <Link href="/colleges/dashboard">
                <Settings className="h-4 w-4 mr-2" />
                Manage Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome, {profile?.first_name || "College"}!
                  </h2>
                  <p className="text-green-100">
                    Monitor your college&apos;s visibility, student engagement,
                    and application metrics.
                  </p>
                </div>
                <Building className="h-16 w-16 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Student Interests
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
                    {analytics?.totalInterests || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.interestsThisMonth || 0} this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
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
                    {analytics?.totalApplications || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.applicationsThisMonth || 0} this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Programs Offered
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
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
                    {analytics?.totalPrograms || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg fees: ₹{(analytics?.averageFees || 0).toLocaleString()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
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
                    {Math.round(
                      analytics?.engagementMetrics?.applicationConversionRate ||
                        0,
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Interest to application
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics and Performance */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Engagement Analytics
                </CardTitle>
                <CardDescription>
                  Student interaction and interest trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Interest Growth Rate
                      </span>
                      <span className="text-sm text-green-600">
                        {analyticsLoading
                          ? "..."
                          : `+${Math.round(analytics?.engagementMetrics?.interestGrowthRate || 0)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(analytics?.engagementMetrics?.interestGrowthRate || 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Application Conversion Rate
                      </span>
                      <span className="text-sm text-blue-600">
                        {analyticsLoading
                          ? "..."
                          : `${Math.round(analytics?.engagementMetrics?.applicationConversionRate || 0)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(analytics?.engagementMetrics?.applicationConversionRate || 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Average Program Fees
                      </span>
                      <span className="text-sm text-purple-600">
                        {analyticsLoading
                          ? "..."
                          : `₹${(analytics?.engagementMetrics?.averageProgramFees || 0).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: "75%" }}
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
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your college presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/colleges/manage">
                    <Building className="h-4 w-4 mr-2" />
                    Update Profile
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/colleges/manage">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Programs
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/colleges/manage">
                    <Users className="h-4 w-4 mr-2" />
                    View Inquiries
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/colleges">
                    <MapPin className="h-4 w-4 mr-2" />
                    Public Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Student Interest Trends */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Popular Programs</CardTitle>
              <CardDescription>Most viewed programs this month</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Loading programs...
                  </span>
                </div>
              ) : analyticsError ? (
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                  <span className="text-sm text-red-500">
                    Failed to load programs
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics?.streamDistribution &&
                  Object.keys(analytics.streamDistribution).length > 0 ? (
                    Object.entries(analytics.streamDistribution).map(
                      ([stream, count], index) => {
                        const colors = [
                          "text-green-600",
                          "text-blue-600",
                          "text-purple-600",
                          "text-orange-600",
                        ];
                        return (
                          <div
                            key={stream}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm font-medium">
                              {stream.replace("_", " ").toUpperCase()}
                            </span>
                            <span
                              className={`text-sm ${colors[index % colors.length]}`}
                            >
                              {count} programs
                            </span>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        No program data available
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geographic Interest</CardTitle>
              <CardDescription>Where your applicants are from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Same State</span>
                  <span className="text-sm text-green-600">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Neighboring States
                  </span>
                  <span className="text-sm text-blue-600">22%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Other States</span>
                  <span className="text-sm text-purple-600">8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">International</span>
                  <span className="text-sm text-orange-600">2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and student interactions
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
                            : activity.action.includes("program")
                              ? "bg-blue-600"
                              : activity.action.includes("application")
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
                    <p className="text-sm text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Student interactions will appear here
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
