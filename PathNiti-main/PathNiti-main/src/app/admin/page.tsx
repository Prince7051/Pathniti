"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { useAuth } from "../providers";
import { DynamicHeader } from "@/components/DynamicHeader";
import {
  GraduationCap,
  Users,
  Building,
  BookOpen,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Download,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalColleges: number;
  totalPrograms: number;
  totalScholarships: number;
  pendingVerifications: number;
  recentActivity: number;
}

interface College {
  id: string;
  name: string;
  type: string;
  location: {
    state: string;
    city: string;
  };
  is_verified: boolean;
  created_at: string;
  programs_count: number;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  is_verified: boolean;
}

export default function AdminPage() {
  const { user, profile, loading, requireRole, signOut } = useAuth();
  // const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalColleges: 0,
    totalPrograms: 0,
    totalScholarships: 0,
    pendingVerifications: 0,
    recentActivity: 0,
  });
  const [colleges, setColleges] = useState<College[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  // const [dataLoading, setDataLoading] = useState(false); // Temporarily unused

  // Use centralized authentication enforcement
  useEffect(() => {
    requireRole("admin");
  }, [requireRole]);

  // Fetch admin data only after authentication is confirmed
  useEffect(() => {
    if (!loading && user && profile) {
      fetchAdminData();
    }
  }, [loading, user, profile]);

  const fetchAdminData = async () => {
    // setDataLoading(true); // Temporarily disabled
    try {
      // For demo purposes, we'll use sample data
      // In production, this would fetch from the database
      const sampleStats: AdminStats = {
        totalUsers: 1250,
        totalColleges: 45,
        totalPrograms: 180,
        totalScholarships: 25,
        pendingVerifications: 8,
        recentActivity: 156,
      };

      const sampleColleges: College[] = [
        {
          id: "1",
          name: "Delhi University",
          type: "government",
          location: { state: "Delhi", city: "New Delhi" },
          is_verified: true,
          created_at: "2024-01-01T00:00:00Z",
          programs_count: 12,
        },
        {
          id: "2",
          name: "Jawaharlal Nehru University",
          type: "government",
          location: { state: "Delhi", city: "New Delhi" },
          is_verified: true,
          created_at: "2024-01-02T00:00:00Z",
          programs_count: 8,
        },
        {
          id: "3",
          name: "University of Mumbai",
          type: "government",
          location: { state: "Maharashtra", city: "Mumbai" },
          is_verified: false,
          created_at: "2024-01-03T00:00:00Z",
          programs_count: 15,
        },
        {
          id: "4",
          name: "Anna University",
          type: "government",
          location: { state: "Tamil Nadu", city: "Chennai" },
          is_verified: true,
          created_at: "2024-01-04T00:00:00Z",
          programs_count: 20,
        },
      ];

      const sampleUsers: User[] = [
        {
          id: "1",
          email: "john.doe@example.com",
          first_name: "John",
          last_name: "Doe",
          role: "student",
          created_at: "2024-01-01T00:00:00Z",
          is_verified: true,
        },
        {
          id: "2",
          email: "jane.smith@example.com",
          first_name: "Jane",
          last_name: "Smith",
          role: "student",
          created_at: "2024-01-02T00:00:00Z",
          is_verified: false,
        },
        {
          id: "3",
          email: "admin@pathniti.in",
          first_name: "Admin",
          last_name: "User",
          role: "admin",
          created_at: "2024-01-01T00:00:00Z",
          is_verified: true,
        },
      ];

      setStats(sampleStats);
      setColleges(sampleColleges);
      setUsers(sampleUsers);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      // setDataLoading(false); // Temporarily disabled
    }
  };

  const handleVerifyCollege = async (collegeId: string) => {
    try {
      // In production, this would update the database
      setColleges((prev) =>
        prev.map((college) =>
          college.id === collegeId
            ? { ...college, is_verified: true }
            : college,
        ),
      );
    } catch (error) {
      console.error("Error verifying college:", error);
    }
  };

  const handleDeleteCollege = async (collegeId: string) => {
    if (confirm("Are you sure you want to delete this college?")) {
      try {
        // In production, this would delete from the database
        setColleges((prev) =>
          prev.filter((college) => college.id !== collegeId),
        );
      } catch (error) {
        console.error("Error deleting college:", error);
      }
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      // In production, this would update the database
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_verified: true } : user,
        ),
      );
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  const filteredColleges = colleges.filter(
    (college) =>
      college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.location.state.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Use central loading state for authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (requireRole will handle redirect)
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <DynamicHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage colleges, users, and platform content.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "colleges", label: "Colleges", icon: Building },
                { id: "users", label: "Users", icon: Users },
                { id: "content", label: "Content", icon: BookOpen },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalUsers.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Colleges
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalColleges}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Programs
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalPrograms}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Scholarships
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalScholarships}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    Pending Verifications
                  </CardTitle>
                  <CardDescription>
                    Items requiring admin approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {colleges
                      .filter((c) => !c.is_verified)
                      .slice(0, 3)
                      .map((college) => (
                        <div
                          key={college.id}
                          className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {college.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {college.location.city}, {college.location.state}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleVerifyCollege(college.id)}
                          >
                            Verify
                          </Button>
                        </div>
                      ))}
                    {colleges.filter((c) => !c.is_verified).length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No pending verifications
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest platform activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">
                          New user registered
                        </p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">College added</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Quiz completed</p>
                        <p className="text-xs text-gray-500">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Colleges Tab */}
        {activeTab === "colleges" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search colleges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add College
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredColleges.map((college) => (
                <Card key={college.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {college.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              college.is_verified
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {college.is_verified ? (
                              <>
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 inline mr-1" />
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {college.location.city}, {college.location.state} •{" "}
                          {college.programs_count} programs
                        </p>
                        <p className="text-sm text-gray-500">
                          Added on{" "}
                          {new Date(college.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!college.is_verified && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyCollege(college.id)}
                          >
                            Verify
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCollege(college.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.is_verified
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {user.is_verified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Joined on{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!user.is_verified && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyUser(user.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Quiz Questions</h3>
                  <p className="text-gray-600 mb-4">
                    Manage aptitude and interest questions
                  </p>
                  <Button>Manage Questions</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Scholarships</h3>
                  <p className="text-gray-600 mb-4">
                    Manage scholarship information
                  </p>
                  <Button>Manage Scholarships</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Career Pathways
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Manage career guidance content
                  </p>
                  <Button>Manage Pathways</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure global platform settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Name
                    </label>
                    <Input defaultValue="PathNiti" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support Email
                    </label>
                    <Input defaultValue="support@pathniti.in" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max File Upload Size (MB)
                    </label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-verify New Colleges
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
