"use client";

import { Metadata } from "next";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { useAuth } from "@/app/providers";
import { useState, useEffect } from "react";

// Define comprehensive College interface
interface CollegeData {
  id: string;
  name: string;
  slug?: string;
  college_courses?: unknown[];
  college_notices?: unknown[];
  location?: { city?: string; state?: string };
  is_verified?: boolean;
  [key: string]: unknown; // For additional properties
}
import CollegeProfileManager from "@/components/CollegeProfileManager";
import CollegeApplicationManager from "@/components/CollegeApplicationManager";
import CollegeCourseManager from "@/components/CollegeCourseManager";
import CollegeNoticeManager from "@/components/CollegeNoticeManager";
import { CollegeNotifications } from "@/components/CollegeNotifications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Plus,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
} from "lucide-react";
import Link from "next/link";

// Metadata is not available in client components

// Transform function to convert college data to CollegeProfileData format
function transformToCollegeProfileData(collegeData: CollegeData): any {
  return {
    id: collegeData.id,
    slug: collegeData.slug || '',
    name: collegeData.name,
    type: collegeData.type || 'private',
    location: collegeData.location || { state: '', city: '' },
    address: collegeData.address || '',
    website: collegeData.website || null,
    phone: collegeData.phone || null,
    email: collegeData.email || null,
    established_year: collegeData.established_year || null,
    accreditation: collegeData.accreditation || null,
    about: collegeData.about || null,
    admission_criteria: collegeData.admission_criteria || null,
    scholarships: collegeData.scholarships || null,
    entrance_tests: collegeData.entrance_tests || null,
    fee_structure: collegeData.fee_structure || null,
    gallery: collegeData.gallery || null,
    facilities: collegeData.facilities || null,
    programs: collegeData.programs || null,
    cut_off_data: collegeData.cut_off_data || null,
    admission_process: collegeData.admission_process || null,
    fees: collegeData.fees || null,
    images: collegeData.images || null,
    is_verified: collegeData.is_verified || false,
    is_active: collegeData.is_active || true,
    courses: Array.isArray(collegeData.courses) ? collegeData.courses : [],
    notices: Array.isArray(collegeData.notices) ? collegeData.notices : [],
    events: Array.isArray(collegeData.events) ? collegeData.events : [],
    created_at: collegeData.created_at || new Date().toISOString(),
    updated_at: collegeData.updated_at || new Date().toISOString(),
  };
}

export default function CollegeDashboardPage() {
  // This will be handled by client-side authentication
  return <CollegeDashboardClient />;
}

function CollegeDashboardClient() {
  const { loading, requireAuth, requireRole, profile } = useAuth();
  const [collegeData, setCollegeData] = useState<CollegeData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use centralized authentication enforcement
  // TODO: Re-enable authentication after fixing auth issues
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // await requireAuth();
        // await requireRole("college");
        console.log("Authentication bypassed for development");
      } catch (error) {
        console.error("Authentication check failed:", error);
        setError("Authentication failed");
      }
    };
    checkAuth();
  }, [requireAuth, requireRole]);

  // Fetch college data
  useEffect(() => {
    const fetchCollegeData = async () => {
      // TODO: Re-enable profile check after fixing auth issues
      // if (!profile?.id) return;

      try {
        setLoadingData(true);
        setError(null);

        const response = await fetch('/api/colleges/manage/', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setError("Authentication required. Please log in.");
            return;
          }
          if (response.status === 403) {
            setError("Access denied. You need college role to access this page.");
            return;
          }
          throw new Error(`HTTP ${response.status}: Failed to fetch college data`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        setCollegeData(result.college);
      } catch (error) {
        console.error("Error fetching college data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch college data");
      } finally {
        setLoadingData(false);
      }
    };

    if (profile?.id) {
      fetchCollegeData();
    }
  }, [profile?.id]);

  // Show loading state
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading college dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!collegeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No College Data</h2>
          <p className="text-gray-600 mb-4">Unable to load college information.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Calculate application statistics from college data
  const totalApplications = Array.isArray(collegeData?.courses) ? collegeData.courses.length : 0;
  const pendingApplications = 0; // This would need to be fetched separately

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">
              College Dashboard
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {collegeData.slug && (
              <Button variant="outline" asChild>
                <Link href={`/colleges/${collegeData.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Profile
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Building className="h-4 w-4 mr-2" />
                Back to Main Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {collegeData.name}
          </h1>
          <p className="text-gray-600">
            Manage your college profile, courses, and student applications.
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <Badge variant={collegeData.is_verified ? "default" : "secondary"}>
              {collegeData.is_verified ? (                 <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Pending Verification
                </>
              )}
            </Badge>
            <span className="text-sm text-gray-600">
              {(collegeData as CollegeData).location?.city}, {(collegeData as CollegeData).location?.state}
            </span>
            {(collegeData as CollegeData).slug && (               <span className="text-sm text-blue-600">
                /colleges/{(collegeData as CollegeData).slug}
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Courses
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Array.isArray(collegeData.courses) ? collegeData.courses.length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Applications
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalApplications}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingApplications}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Notices
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Array.isArray(collegeData.notices) ? collegeData.notices.length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Section */}
        <div className="mb-8">
          <CollegeNotifications userId={profile?.id || ''} />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              College Profile
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Courses ({Array.isArray(collegeData.courses) ? collegeData.courses.length : 0})
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Notices ({Array.isArray(collegeData.notices) ? collegeData.notices.length : 0})
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Applications ({pendingApplications} pending)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks for managing your college
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    className="justify-start h-auto p-4"
                    variant="outline"
                  >
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Course
                      </div>
                      <p className="text-xs text-gray-500">
                        Create new course offerings
                      </p>
                    </div>
                  </Button>
                  <Button
                    className="justify-start h-auto p-4"
                    variant="outline"
                  >
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Post Notice
                      </div>
                      <p className="text-xs text-gray-500">
                        Share important updates
                      </p>
                    </div>
                  </Button>
                  <Button
                    className="justify-start h-auto p-4"
                    variant="outline"
                  >
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Users className="h-4 w-4 mr-2" />
                        View Applications
                      </div>
                      <p className="text-xs text-gray-500">
                        Manage student applications
                      </p>
                    </div>
                  </Button>
                  <Button
                    className="justify-start h-auto p-4"
                    variant="outline"
                  >
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </div>
                      <p className="text-xs text-gray-500">
                        Update college information
                      </p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* College Profile Manager */}
            <CollegeProfileManager initialData={transformToCollegeProfileData(collegeData)} />
          </TabsContent>

          <TabsContent value="courses">
            <CollegeCourseManager
              collegeId={collegeData.id}
              collegeName={collegeData.name}
            />
          </TabsContent>

          <TabsContent value="notices">
            <CollegeNoticeManager collegeId={collegeData.id} />
          </TabsContent>

          <TabsContent value="applications">
            <CollegeApplicationManager
              collegeId={collegeData.id}
              collegeName={collegeData.name}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
