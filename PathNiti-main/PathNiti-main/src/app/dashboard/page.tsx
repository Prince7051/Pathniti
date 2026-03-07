"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useAuth } from "../providers";
import {
  GraduationCap,
  Brain,
  MapPin,
  Calendar,
  BookOpen,
  LogOut,
  User,
  Settings,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import NotificationSystem from "@/components/NotificationSystem";
import { AuthGuard } from "@/components/AuthGuard";
import { DynamicHeader } from "@/components/DynamicHeader";
import LastTestReview from "@/components/LastTestReview";

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [collegeCount, setCollegeCount] = useState<number>(0);
  const [collegeCountLoading, setCollegeCountLoading] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Fetch college count
  useEffect(() => {
    const fetchCollegeCount = async () => {
      try {
        setCollegeCountLoading(true);
        const response = await fetch("/api/colleges/count");
        const result = await response.json();
        
        if (result.success) {
          setCollegeCount(result.data.totalColleges);
        }
      } catch (error) {
        console.error("Error fetching college count:", error);
      } finally {
        setCollegeCountLoading(false);
      }
    };

    fetchCollegeCount();
  }, []);

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
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <DynamicHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-primary/10 via-blue-50 to-purple-50 rounded-3xl p-8 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Welcome back, {profile?.first_name}! 👋
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Ready to continue your career journey? Let&apos;s explore
                  what&apos;s next for you.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Profile Complete</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Ready to explore</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Quiz Status
                  </p>
                  <p className="text-2xl font-bold text-gray-900">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Colleges Available
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {collegeCountLoading ? "..." : collegeCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Upcoming Deadlines
                  </p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Scholarships
                  </p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link
            href="/quiz"
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-6 w-6 text-primary mr-2" />
                  Aptitude Assessment
                </CardTitle>
                <CardDescription>
                  Discover your strengths and interests with our comprehensive
                  quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <span>Start Assessment</span>
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/colleges"
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-6 w-6 text-green-600 mr-2" />
                  Find Colleges
                </CardTitle>
                <CardDescription>
                  Explore government colleges near you with detailed information
                  and interactive maps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" asChild>
                  <span>Browse Colleges</span>
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/colleges?tab=nearby"
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <Card className="h-full border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Navigation className="h-6 w-6 text-green-600 mr-2" />
                  <span className="text-green-800">Nearby Colleges</span>
                  <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    NEW
                  </div>
                </CardTitle>
                <CardDescription className="text-green-700">
                  Find colleges near your location using Google Maps with
                  real-time data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  asChild
                >
                  <span>Find Nearby</span>
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/timeline"
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  Timeline Tracker
                </CardTitle>
                <CardDescription>
                  Never miss important deadlines for admissions and scholarships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" asChild>
                  <span>View Timeline</span>
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/test-review"
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-6 w-6 text-purple-600 mr-2" />
                  Test Review
                </CardTitle>
                <CardDescription>
                  Review your last assessment with detailed analysis and explanations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" asChild>
                  <span>Review Test</span>
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-1 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest actions on PathNiti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Profile completed</p>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Account created</p>
                      <p className="text-xs text-gray-500">Today</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Last Test Review */}
        {user && (
          <div className="mt-6">
            <LastTestReview userId={user.id} />
          </div>
        )}

        {/* Quick Recommendations */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Recommendations</CardTitle>
              <CardDescription>Based on your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Complete your aptitude assessment
                  </p>
                  <p className="text-xs text-blue-700">
                    Get personalized career recommendations
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">
                    Find nearby colleges with Google Maps
                  </p>
                  <p className="text-xs text-green-700">
                    Discover colleges near your location with real-time data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}
