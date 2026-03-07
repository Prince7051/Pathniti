"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import NearbyColleges from "@/components/NearbyColleges";
import type { CollegeProfileData } from "@/lib/types/college-profile";
import {
  GraduationCap,
  MapPin,
  Phone,
  Globe,
  Star,
  Search,
  ArrowLeft,
  Heart,
  ExternalLink,
  Navigation,
  Sparkles,
  Filter,
  Building2,
  Award,
  Users,
  Calendar,
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { PathNitiLogo } from "@/components/PathNitiLogo";
import { DynamicHeader } from "@/components/DynamicHeader";

export default function CollegesPage() {
  const [colleges, setColleges] = useState<CollegeProfileData[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<
    CollegeProfileData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [activeTab, setActiveTab] = useState<"directory" | "nearby">(
    "directory",
  );

  // Check URL params for tab selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab === "nearby") {
        setActiveTab("nearby");
      }
    }
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch colleges from API route instead of direct database access
      const response = await fetch('/api/colleges');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log("API response:", result);

      if (result.error) {
        console.error("Error fetching colleges:", result.error);
        setError(result.error);
        setColleges([]);
        return;
      }

      if (!result.data || result.data.length === 0) {
        console.log("No colleges found in database");
        setColleges([]);
        return;
      }

      // Data is already filtered and sorted by the API
      setColleges(result.data);
    } catch (err) {
      console.error("Unexpected error fetching colleges:", err);
      setError("Failed to load colleges. Please try again.");
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshColleges = async () => {
    await fetchColleges();
  };

  const filterColleges = useCallback(() => {
    let filtered = colleges;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (college) =>
          college.name.toLowerCase().includes(searchLower) ||
          college.location.city.toLowerCase().includes(searchLower) ||
          college.location.state.toLowerCase().includes(searchLower) ||
          college.address.toLowerCase().includes(searchLower) ||
          (college.about && college.about.toLowerCase().includes(searchLower)),
      );
    }

    if (selectedState) {
      filtered = filtered.filter(
        (college) => college.location.state === selectedState,
      );
    }

    if (selectedType) {
      filtered = filtered.filter((college) => college.type === selectedType);
    }

    setFilteredColleges(filtered);
  }, [colleges, searchTerm, selectedState, selectedType]);

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    filterColleges();
  }, [filterColleges]);

  // Set up real-time subscription for college updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Use static import instead of dynamic import for better reliability
        const { supabase } = await import("@/lib/supabase");

      const subscription = supabase
        .channel("colleges-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "colleges",
          },
          async (payload) => {
            console.log("College data changed:", payload);

            // Refresh colleges when data changes
            fetchColleges();

            // Send email notification for college changes
            try {
              const { eventType, new: newRecord, old: oldRecord } = payload;

              if (eventType === "INSERT" && newRecord) {
                // New college added
                await fetch("/api/colleges/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "created",
                    college: newRecord,
                  }),
                });
              } else if (eventType === "UPDATE" && newRecord && oldRecord) {
                // College updated
                const changes = getCollegeChanges(oldRecord, newRecord);
                if (changes.length > 0) {
                  await fetch("/api/colleges/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: "updated",
                      college: newRecord,
                      changes,
                    }),
                  });
                }
              } else if (eventType === "DELETE" && oldRecord) {
                // College deleted
                await fetch("/api/colleges/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "deleted",
                    college: oldRecord,
                  }),
                });
              }
            } catch (error) {
              console.error("Failed to send email notification:", error);
            }
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
      } catch (error) {
        console.error("Failed to setup realtime subscription:", error);
        return () => {}; // Return empty cleanup function
      }
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, []);

  // Helper function to detect changes between old and new college records
  const getCollegeChanges = (
    oldRecord: Record<string, unknown>,
    newRecord: Record<string, unknown>,
  ): string[] => {
    const changes: string[] = [];

    if (oldRecord.name !== newRecord.name) {
      changes.push(
        `Name changed from "${oldRecord.name}" to "${newRecord.name}"`,
      );
    }

    if (oldRecord.type !== newRecord.type) {
      changes.push(
        `Type changed from "${oldRecord.type}" to "${newRecord.type}"`,
      );
    }

    if (
      JSON.stringify(oldRecord.location) !== JSON.stringify(newRecord.location)
    ) {
      changes.push("Location information updated");
    }

    if (oldRecord.website !== newRecord.website) {
      changes.push("Website information updated");
    }

    if (oldRecord.phone !== newRecord.phone) {
      changes.push("Contact information updated");
    }

    if (oldRecord.about !== newRecord.about) {
      changes.push("Description updated");
    }

    if (
      JSON.stringify(oldRecord.accreditation) !==
      JSON.stringify(newRecord.accreditation)
    ) {
      changes.push("Accreditation information updated");
    }

    if (oldRecord.is_verified !== newRecord.is_verified) {
      changes.push(
        newRecord.is_verified
          ? "College verified"
          : "Verification status changed",
      );
    }

    if (oldRecord.is_active !== newRecord.is_active) {
      changes.push(
        newRecord.is_active ? "College reactivated" : "College deactivated",
      );
    }

    return changes;
  };

  const states = Array.from(
    new Set(colleges.map((college) => college.location.state)),
  );
  const types = Array.from(new Set(colleges.map((college) => college.type)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading colleges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <DynamicHeader />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Building2 className="h-4 w-4 text-yellow-300 fill-current" />
              <span className="text-sm font-medium">Discover Your Future</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              College{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Directory
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Explore government colleges across India with detailed information
              about programs, facilities, admissions, and everything you need to
              make informed decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="relative overflow-hidden text-lg px-8 py-4 bg-white text-blue-800 hover:bg-gray-50 transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-3xl group border-2 border-white/20"
                asChild
              >
                <Link
                  href="/comprehensive-assessment"
                  className="flex items-center gap-3 relative z-10"
                >
                  <Star className="h-6 w-6 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-bold text-lg">Take AI Assessment</span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-2 border-white/50 text-white hover:bg-white/20 hover:border-white/70 transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-sm bg-white/10"
                asChild
              >
                <Link href="#colleges" className="flex items-center gap-3">
                  <MapPin className="h-6 w-6" />
                  <span className="font-bold">Browse Colleges</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="container mx-auto px-4 py-12 -mt-8 relative z-10"
        id="colleges"
      >
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/20">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab("directory")}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === "directory"
                    ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                College Directory
              </button>
              <button
                onClick={() => setActiveTab("nearby")}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === "nearby"
                    ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
              >
                <Navigation className="h-5 w-5" />
                Find Nearby Colleges
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "directory" && (
          <>
            {/* Search and Filters */}
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Search & Filter Colleges
                </h2>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search colleges, cities, or states..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-primary rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full h-12 p-3 border-2 border-gray-200 focus:border-primary rounded-xl text-lg"
                  >
                    <option value="">All States</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full h-12 p-3 border-2 border-gray-200 focus:border-primary rounded-xl text-lg"
                  >
                    <option value="">All Types</option>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() +
                          type.slice(1).replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {(searchTerm || selectedState || selectedType) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-600">
                      Active filters:
                    </span>
                    {searchTerm && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Search: &quot;{searchTerm}&quot;
                        <button
                          onClick={() => setSearchTerm("")}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {selectedState && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        State: {selectedState}
                        <button
                          onClick={() => setSelectedState("")}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {selectedType && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        Type: {selectedType}
                        <button
                          onClick={() => setSelectedType("")}
                          className="hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "nearby" && <NearbyColleges />}

        {/* Directory Results */}
        {activeTab === "directory" && (
          <>
            {/* Error State */}
            {error && (
              <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">
                    Unable to Load Colleges
                  </h3>
                </div>
                <p className="text-red-700 mb-4">{error}</p>
                <Button
                  onClick={refreshColleges}
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Results Header */}
            {!error && (
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {filteredColleges.length} Colleges Found
                    </h2>
                    <p className="text-gray-600">
                      Showing {filteredColleges.length} of {colleges.length}{" "}
                      colleges
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>Live from database</span>
                    </div>
                    <Button
                      onClick={refreshColleges}
                      variant="outline"
                      size="sm"
                      className="hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Colleges Grid */}
            {!error && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredColleges.map((college, index) => (
                  <Card
                    key={college.id}
                    className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-105 hover:-translate-y-2 flex flex-col h-full"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-4 flex-shrink-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                              {college.name}
                            </CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-600 truncate">
                                {college.location.city},{" "}
                                {college.location.state}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        {college.is_verified && (
                          <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-grow space-y-4">
                      {/* Key Information */}
                      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                          <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Established</p>
                            <p className="font-semibold text-gray-900 truncate">
                              {college.established_year || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                          <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Type</p>
                            <p className="font-semibold text-gray-900 capitalize truncate">
                              {college.type.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Courses */}
                      {college.courses && college.courses.length > 0 && (
                        <div className="flex-shrink-0">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Courses:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {college.courses
                              .slice(0, 3)
                              .map((course, courseIndex) => (
                                <span
                                  key={courseIndex}
                                  className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm rounded-full font-medium"
                                >
                                  {course.name}
                                </span>
                              ))}
                            {college.courses.length > 3 && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                                +{college.courses.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Accreditation */}
                      {college.accreditation &&
                        college.accreditation.length > 0 && (
                          <div className="flex-shrink-0">
                            <p className="text-sm font-medium text-gray-700 mb-3">
                              Accreditation:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {college.accreditation
                                .slice(0, 2)
                                .map((acc, accIndex) => (
                                  <span
                                    key={accIndex}
                                    className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm rounded-full font-medium"
                                  >
                                    {acc}
                                  </span>
                                ))}
                              {college.accreditation.length > 2 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                                  +{college.accreditation.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      {/* About snippet - This will grow to fill available space */}
                      <div className="flex-grow">
                        {college.about && (
                          <div>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {college.about}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons - Fixed at bottom */}
                      <div className="space-y-4 mt-auto pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {college.website && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-blue-50 hover:border-blue-200"
                                asChild
                              >
                                <a
                                  href={college.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Globe className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {college.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-green-50 hover:border-green-200"
                                asChild
                              >
                                <a href={`tel:${college.phone}`}>
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 group-hover:scale-105"
                          variant="default"
                          asChild
                        >
                          <Link
                            href={
                              college.slug
                                ? `/colleges/${college.slug}`
                                : `/colleges/${college.id}`
                            }
                            className="flex items-center justify-center gap-2"
                          >
                            <span>View Details</span>
                            <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty States */}
            {!error &&
              filteredColleges.length === 0 &&
              colleges.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No colleges available
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    There are currently no colleges in the database. Check back
                    later or contact support.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={refreshColleges}
                      variant="outline"
                      className="hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button asChild>
                      <Link href="/career-pathways">Explore Career Paths</Link>
                    </Button>
                  </div>
                </div>
              )}

            {!error && filteredColleges.length === 0 && colleges.length > 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No colleges found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn&apos;t find any colleges matching your search
                  criteria. Try adjusting your filters or search terms.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedState("");
                      setSelectedType("");
                    }}
                    className="hover:bg-gray-50"
                  >
                    Clear All Filters
                  </Button>
                  <Button asChild>
                    <Link href="/career-pathways">Explore Career Paths</Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
