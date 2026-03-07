"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Mail,
  Calendar,
  Award,
  Users,
  BookOpen,
  Building2,
  ExternalLink,
  GraduationCap,
  Clock,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";
import { collegeProfileServiceClient } from "@/lib/services/college-profile-service-client";
import StudentApplicationForm from "@/components/StudentApplicationForm";
import { createClient } from "@/lib/supabase/client";
import type { CollegeProfileData } from "@/lib/types/college-profile";

interface CollegeProfilePageProps {
  params: Promise<{ slug: string }>;
}

export default function CollegeProfilePage({
  params,
}: CollegeProfilePageProps) {
  const [college, setCollege] = useState<CollegeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    role: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Use the singleton client instead of creating a new instance
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  // Initialize supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        // Use static import instead of dynamic import for better reliability
        const { supabase } = await import("@/lib/supabase");
        setSupabaseClient(supabase);
      } catch (error) {
        console.error("Failed to load supabase client:", error);
        // Set a fallback client or handle the error gracefully
        setSupabaseClient(null);
      }
    };
    initSupabase();
  }, []);

  useEffect(() => {
    if (!supabaseClient) return; // Wait for supabase to be initialized

    const fetchCollegeProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const resolvedParams = await params;
        const { data, error: fetchError } =
          await collegeProfileServiceClient.getProfileBySlug(resolvedParams.slug);

        if (fetchError) {
          setError(fetchError);
          return;
        }

        if (!data) {
          notFound();
          return;
        }

        setCollege(data);
      } catch (err) {
        console.error("Error fetching college profile:", err);
        setError("Failed to load college profile");
      } finally {
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        setUser(user ? {
          id: user.id,
          email: user.email || '',
          role: 'user'
        } : null);

        if (user) {
          // Get user profile to check role
          const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (!profileError && profile) {
            setUserRole((profile as { role?: string }).role || 'user');           }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchCollegeProfile();
    fetchUser();
  }, [params, supabaseClient]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading college profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Profile
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link href="/colleges">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Colleges
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!college) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/colleges"
            className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Colleges</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-xl animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* College Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 mb-12">
              {/* College Logo/Icon */}
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              
              {/* College Info */}
              <div className="flex-1">
                <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {college.name}
                </h1>
                
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors px-4 py-2 text-sm font-medium">
                    {college.type.charAt(0).toUpperCase() + college.type.slice(1).replace("_", " ")}
                  </Badge>
                  {college.is_verified && (
                    <Badge className="bg-green-500/20 text-green-100 border-green-400/30 hover:bg-green-500/30 transition-colors px-4 py-2 text-sm font-medium">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {college.established_year && (
                    <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30 hover:bg-blue-500/30 transition-colors px-4 py-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 mr-1" />
                      Est. {college.established_year}
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <MapPin className="h-6 w-6 text-white/90" />
                    <div>
                      <p className="text-white/70 text-sm">Location</p>
                      <p className="text-white font-semibold">
                        {college.location.city}, {college.location.state}
                      </p>
                    </div>
                  </div>
                  
                  {college.phone && (
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <Phone className="h-6 w-6 text-white/90" />
                      <div>
                        <p className="text-white/70 text-sm">Phone</p>
                        <p className="text-white font-semibold">{college.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {college.email && (
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <Mail className="h-6 w-6 text-white/90" />
                      <div>
                        <p className="text-white/70 text-sm">Email</p>
                        <p className="text-white font-semibold truncate">{college.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {college.website && (
                  <Button
                    size="lg"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    asChild
                  >
                    <a
                      href={college.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-5 w-5 mr-2" />
                      Visit Website
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
                
                {user && userRole === "student" && (
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-gray-50 font-semibold shadow-lg"
                    onClick={() => setShowApplicationForm(true)}
                  >
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Apply Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  About {college.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {college.about ? (
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {college.about}
                  </p>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      Detailed information about {college.name} will be available soon.
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      We&apos;re working on adding comprehensive details about this institution.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Courses Section */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  Courses Offered
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  {college.courses && college.courses.length > 0 
                    ? `${college.courses.length} course${college.courses.length !== 1 ? "s" : ""} available`
                    : "Course information coming soon"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {college.courses && college.courses.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {college.courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-6 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50/30"
                      >
                        <h4 className="font-bold text-gray-900 mb-3 text-lg">
                          {course.name}
                        </h4>
                        {course.description && (
                          <p className="text-gray-600 mb-4 leading-relaxed">
                            {course.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          {course.duration && (
                            <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{course.duration}</span>
                            </div>
                          )}
                          {course.seats && (
                            <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">{course.seats} seats</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      Course information for {college.name} will be available soon.
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      We&apos;re working on adding detailed course offerings and admission requirements.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notices Section */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-t-lg">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  Latest Notices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {college.notices && college.notices.length > 0 ? (
                  <div className="space-y-6">
                    {college.notices
                      .filter((notice) => notice.is_active)
                      .sort(
                        (a, b) =>
                          new Date(b.published_at).getTime() -
                          new Date(a.published_at).getTime(),
                      )
                      .slice(0, 5)
                      .map((notice) => (
                        <div
                          key={notice.id}
                          className="p-6 border-l-4 border-orange-400 bg-gradient-to-r from-orange-50/50 to-red-50/30 rounded-r-xl hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">
                                {notice.title}
                              </h4>
                              <p className="text-gray-700 mb-4 leading-relaxed">
                                {notice.content}
                              </p>
                              <div className="flex items-center gap-4">
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                  {notice.type.charAt(0).toUpperCase() +
                                    notice.type.slice(1)}
                                </Badge>
                                <span className="text-sm text-gray-500 font-medium">
                                  {new Date(
                                    notice.published_at,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      No notices available for {college.name} at the moment.
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Check back later for important announcements and updates.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Quick Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Type</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {college.type.charAt(0).toUpperCase() +
                      college.type.slice(1).replace("_", " ")}
                  </Badge>
                </div>
                {college.established_year && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Established</span>
                    <span className="font-bold text-primary">
                      {college.established_year}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Location</span>
                  <span className="font-semibold text-right text-gray-800">
                    {college.location.city}, {college.location.state}
                  </span>
                </div>
                {college.accreditation && college.accreditation.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium block mb-3">
                      Accreditation
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {college.accreditation.map((acc, index) => (
                        <Badge
                          key={index}
                          className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors"
                        >
                          {acc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admission Criteria */}
            {college.admission_criteria && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    Admission Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {college.admission_criteria.minimum_marks && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-gray-700 font-medium">Minimum Marks</span>
                      <span className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        {college.admission_criteria.minimum_marks}
                      </span>
                    </div>
                  )}
                  {college.admission_criteria.entrance_exam && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-gray-700 font-medium">Entrance Exam</span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {college.admission_criteria.entrance_exam}
                      </Badge>
                    </div>
                  )}
                  {college.admission_criteria.required_subjects && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-700 font-medium block mb-2">Required Subjects</span>
                      <div className="flex flex-wrap gap-2">
                        {college.admission_criteria.required_subjects.map((subject, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Fee Structure */}
            {college.fee_structure && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-t-lg">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                    Fee Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {college.fee_structure.tuition_fee && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-gray-700 font-medium">Tuition Fee</span>
                      <span className="font-bold text-yellow-700">
                        ₹{college.fee_structure.tuition_fee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {college.fee_structure.hostel_fee && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="text-gray-700 font-medium">Hostel Fee</span>
                      <span className="font-bold text-orange-700">
                        ₹{college.fee_structure.hostel_fee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {college.fee_structure.total_fee && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border-2 border-primary/20">
                      <span className="text-gray-900 font-bold text-lg">Total Fee</span>
                      <span className="font-bold text-2xl text-primary">
                        ₹{college.fee_structure.total_fee.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Phone className="h-5 w-5 text-purple-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">
                      {college.address}
                    </span>
                  </div>
                </div>
                {college.phone && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <a
                        href={`tel:${college.phone}`}
                        className="text-blue-700 font-medium hover:text-blue-800 transition-colors"
                      >
                        {college.phone}
                      </a>
                    </div>
                  </div>
                )}
                {college.email && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-green-600" />
                      <a
                        href={`mailto:${college.email}`}
                        className="text-green-700 font-medium hover:text-green-800 transition-colors"
                      >
                        {college.email}
                      </a>
                    </div>
                  </div>
                )}
                {college.website && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-purple-600" />
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 font-medium hover:text-purple-800 transition-colors flex items-center gap-2"
                      >
                        Visit Website
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Apply Button */}
            <Card className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-2xl mb-3">
                  Apply to this college
                </h3>
                <p className="text-white/90 text-base mb-6 leading-relaxed">
                  Submit your application with required documents and take the next step in your educational journey
                </p>

                {user && userRole === "student" ? (
                  <Button
                    size="lg"
                    className="w-full bg-white text-primary hover:bg-gray-50 font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setShowApplicationForm(true)}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Apply Now
                  </Button>
                ) : user && userRole !== "student" ? (
                  <div className="text-center">
                    <p className="text-white/90 text-sm mb-4">
                      Only students can apply to colleges
                    </p>
                    <Button
                      size="lg"
                      className="w-full bg-white text-primary hover:bg-gray-50 font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                      asChild
                    >
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-white/90 text-sm mb-4">
                      Please log in to apply
                    </p>
                    <Button
                      size="lg"
                      className="w-full bg-white text-primary hover:bg-gray-50 font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                      asChild
                    >
                      <Link href="/auth/login">Login to Apply</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && college && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StudentApplicationForm
              collegeId={college.id}
              collegeName={college.name}
              onSuccess={() => {
                setShowApplicationForm(false);
                // You could show a success message here
                alert("Application submitted successfully!");
              }}
              onCancel={() => setShowApplicationForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
