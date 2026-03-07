"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../providers";
import { AuthGuard } from "@/components/AuthGuard";
import { DynamicHeader } from "@/components/DynamicHeader";
import LastTestReview from "@/components/LastTestReview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TestReviewPage() {
  const { user, loading } = useAuth();
  const [hasCompletedTest, setHasCompletedTest] = useState<boolean | null>(null);

  useEffect(() => {
    const checkTestStatus = async () => {
      if (!user) return;

      try {
        const response = await fetch(
          `/api/assessment/last-test?user_id=${user.id}`,
        );
        const result = await response.json();
        setHasCompletedTest(result.success);
      } catch (error) {
        console.error("Error checking test status:", error);
        setHasCompletedTest(false);
      }
    };

    checkTestStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <DynamicHeader />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <DynamicHeader />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Test Review
                </h1>
                <p className="text-gray-600">
                  Review your last assessment with detailed analysis
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {hasCompletedTest === null ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Checking for completed tests...</p>
              </CardContent>
            </Card>
          ) : hasCompletedTest ? (
            <LastTestReview userId={user!.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  No Test Found
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Completed Tests Found
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven&apos;t completed any assessments yet. Take an assessment to see your detailed review here.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/comprehensive-assessment">
                    <Button>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Take Assessment
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
