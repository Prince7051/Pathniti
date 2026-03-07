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
  Badge,
} from "@/components/ui";
import {
  GraduationCap,
  Search,
  ArrowLeft,
  DollarSign,
  Calendar,
  Users,
  Award,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { PathNitiLogo } from "@/components/PathNitiLogo";
import { DynamicHeader } from "@/components/DynamicHeader";
import { supabase } from "@/lib/supabase";

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  eligibility: string[];
  category: string;
  description: string;
  is_verified: boolean;
  application_link?: string;
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [filteredScholarships, setFilteredScholarships] = useState<
    Scholarship[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [sortBy, setSortBy] = useState("deadline");

  const fetchScholarships = async () => {
    try {
      // Try to fetch from database first
      const { data: dbScholarships, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("is_active", true)
        .order("application_deadline", { ascending: true });

      if (error) {
        console.error("Error fetching scholarships from database:", error);
        // Fallback to sample data
        const sampleScholarships: Scholarship[] = [
          {
            id: "1",
            name: "National Merit Scholarship",
            provider: "Government of India",
            amount: "₹50,000 per year",
            deadline: "2024-03-15",
            eligibility: [
              "Class 12 passed",
              "Minimum 85% marks",
              "Family income < ₹5 Lakh",
            ],
            category: "merit",
            description:
              "Merit-based scholarship for outstanding students pursuing higher education in government institutions.",
            is_verified: true,
            application_link: "https://scholarships.gov.in",
          },
          {
            id: "2",
            name: "Post Matric Scholarship for SC/ST",
            provider: "Ministry of Social Justice",
            amount: "₹20,000 - ₹1,20,000",
            deadline: "2024-04-30",
            eligibility: [
              "SC/ST category",
              "Class 10+ passed",
              "Admitted to recognized institution",
            ],
            category: "reservation",
            description:
              "Financial assistance for SC/ST students pursuing post-matriculation courses.",
            is_verified: true,
            application_link: "https://scholarships.gov.in",
          },
          {
            id: "3",
            name: "Prime Minister's Scholarship Scheme",
            provider: "Ministry of Home Affairs",
            amount: "₹2,500 - ₹3,000 per month",
            deadline: "2024-05-20",
            eligibility: [
              "Children of armed forces personnel",
              "Class 12 passed",
              "Admitted to technical courses",
            ],
            category: "defense",
            description:
              "Scholarship for children of armed forces personnel pursuing technical education.",
            is_verified: true,
            application_link: "https://scholarships.gov.in",
          },
          {
            id: "4",
            name: "Central Sector Scholarship",
            provider: "Ministry of Education",
            amount: "₹10,000 - ₹20,000 per year",
            deadline: "2024-06-10",
            eligibility: [
              "Class 12 passed",
              "Minimum 80% marks",
              "Family income < ₹8 Lakh",
            ],
            category: "merit",
            description:
              "Central sector scholarship for meritorious students from economically weaker sections.",
            is_verified: true,
            application_link: "https://scholarships.gov.in",
          },
          {
            id: "5",
            name: "Girl Child Scholarship",
            provider: "Ministry of Women & Child Development",
            amount: "₹5,000 - ₹15,000 per year",
            deadline: "2024-07-15",
            eligibility: [
              "Female students",
              "Class 10+ passed",
              "Family income < ₹6 Lakh",
            ],
            category: "gender",
            description:
              "Special scholarship scheme to promote education among girl children.",
            is_verified: true,
            application_link: "https://scholarships.gov.in",
          },
          {
            id: "6",
            name: "Minority Scholarship",
            provider: "Ministry of Minority Affairs",
            amount: "₹3,000 - ₹12,000 per year",
            deadline: "2024-08-30",
            eligibility: [
              "Minority community",
              "Class 10+ passed",
              "Family income < ₹2.5 Lakh",
            ],
            category: "minority",
            description:
              "Scholarship for students from minority communities pursuing higher education.",
            is_verified: true,
            application_link: "https://scholarships.gov.in",
          },
        ];

        setScholarships(sampleScholarships);
      } else {
        // Use database data
        const formattedScholarships: Scholarship[] = dbScholarships.map(
          (scholarship: Record<string, unknown>) => ({
            id: (scholarship.id as string) || "",
            name: (scholarship.name as string) || "",
            provider: (scholarship.provider as string) || "",
            amount:
              (scholarship.amount as { min?: number; max?: number })?.min && (scholarship.amount as { min?: number; max?: number })?.max
                ? `₹${((scholarship.amount as { min?: number; max?: number }).min! / 100000)}L - ₹${((scholarship.amount as { min?: number; max?: number }).max! / 100000)}L`
                : "Amount varies",
            deadline: (scholarship.application_deadline as string) || "",
            eligibility: Array.isArray(scholarship.eligibility) 
              ? scholarship.eligibility as string[]
              : typeof scholarship.eligibility === 'string' 
                ? [scholarship.eligibility as string]
                : [],
            category: ((scholarship.provider as string) || "").toLowerCase().includes("government")
              ? "government"
              : "private",
            description: (scholarship.description as string) || "",
            is_verified: true,
            application_link: (scholarship.website as string),
          }),
        );
        setScholarships(formattedScholarships);
      }
    } catch (error) {
      console.error("Error fetching scholarships:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterScholarships = useCallback(() => {
    let filtered = scholarships;

    if (searchTerm) {
      filtered = filtered.filter(
        (scholarship) =>
          scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scholarship.provider
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          scholarship.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (scholarship) => scholarship.category === selectedCategory,
      );
    }

    if (selectedProvider) {
      filtered = filtered.filter((scholarship) =>
        scholarship.provider
          .toLowerCase()
          .includes(selectedProvider.toLowerCase()),
      );
    }

    // Sort scholarships
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        case "amount":
          // Extract numeric value from amount string for sorting
          const amountA = parseInt(a.amount.replace(/[^\d]/g, "")) || 0;
          const amountB = parseInt(b.amount.replace(/[^\d]/g, "")) || 0;
          return amountB - amountA;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredScholarships(filtered);
  }, [scholarships, searchTerm, selectedCategory, selectedProvider, sortBy]);

  useEffect(() => {
    fetchScholarships();
  }, []);

  useEffect(() => {
    filterScholarships();
  }, [filterScholarships]);

  const categories = Array.from(
    new Set(scholarships.map((scholarship) => scholarship.category)),
  );

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "merit":
        return "default";
      case "reservation":
        return "secondary";
      case "defense":
        return "info";
      case "gender":
        return "success";
      case "minority":
        return "warning";
      default:
        return "outline";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "merit":
        return "Merit-Based";
      case "reservation":
        return "Reservation";
      case "defense":
        return "Defense";
      case "gender":
        return "Gender";
      case "minority":
        return "Minority";
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading scholarships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <DynamicHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Government Scholarships
          </h1>
          <p className="text-gray-600">
            Discover and apply for government scholarships and financial aid
            opportunities across India.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search scholarships, providers, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="deadline">Sort by Deadline</option>
                <option value="amount">Sort by Amount</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Quick filters:</span>
            <button
              onClick={() => setSelectedProvider("Government")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedProvider === "Government"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Government
            </button>
            <button
              onClick={() => setSelectedProvider("Ministry")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedProvider === "Ministry"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ministry
            </button>
            <button
              onClick={() => setSelectedProvider("")}
              className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredScholarships.length} of {scholarships.length}{" "}
            scholarships
          </p>
        </div>

        {/* Scholarships Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships.map((scholarship) => (
            <Card
              key={scholarship.id}
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {scholarship.name}
                    </CardTitle>
                    <CardDescription className="flex items-center mb-3">
                      <Award className="h-4 w-4 mr-1" />
                      {scholarship.provider}
                    </CardDescription>
                    <Badge
                      variant={getCategoryBadgeVariant(scholarship.category)}
                    >
                      {getCategoryLabel(scholarship.category)}
                    </Badge>
                  </div>
                  {scholarship.is_verified && (
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-medium">Amount:</span>
                    <span className="ml-2 text-green-600 font-semibold">
                      {scholarship.amount}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-red-600" />
                    <span className="font-medium">Deadline:</span>
                    <span className="ml-2 text-red-600 font-semibold">
                      {new Date(scholarship.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {scholarship.description}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Key Eligibility:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(scholarship.eligibility) ? scholarship.eligibility : []).slice(0, 2).map((item, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                    {Array.isArray(scholarship.eligibility) && scholarship.eligibility.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{scholarship.eligibility.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Verified by Government</span>
                  </div>

                  {scholarship.application_link && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={scholarship.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Apply
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredScholarships.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No scholarships found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
