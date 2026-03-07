"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface StudentApplication {
  id: string;
  student_id: string;
  college_id: string;
  full_name: string;
  email: string;
  phone: string;
  class_stream: string;
  documents: {
    marksheet_10th?: string;
    marksheet_12th?: string;
    other_documents?: string[];
  };
  status: "pending" | "approved" | "rejected";
  feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ApplicationManagerProps {
  collegeId: string;
  collegeName: string;
}

export default function CollegeApplicationManager({
  collegeName,
}: ApplicationManagerProps) {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<StudentApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(
        `/api/colleges/admin/applications?${params}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();
      setApplications(data.applications);
      setTotalPages(data.pagination.totalPages);
      setTotalApplications(data.pagination.total);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: "approved" | "rejected",
  ) => {
    try {
      setProcessingStatus(applicationId);

      const response = await fetch(
        `/api/colleges/admin/applications/${applicationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            feedback: feedback.trim() || undefined,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      await response.json();

      // Update the application in the list
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                status: newStatus,
                feedback: feedback.trim() || undefined,
                reviewed_at: new Date().toISOString(),
              }
            : app,
        ),
      );

      // Update selected application if it's the one being updated
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                feedback: feedback.trim() || undefined,
                reviewed_at: new Date().toISOString(),
              }
            : null,
        );
      }

      setFeedback("");
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update application status. Please try again.");
    } finally {
      setProcessingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const handleDocumentView = (url: string) => {
    window.open(url, "_blank");
  };

  if (selectedApplication) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Applications
                </Button>
              </CardTitle>
              <CardDescription>
                Application Details - {selectedApplication.full_name}
              </CardDescription>
            </div>
            {getStatusBadge(selectedApplication.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{selectedApplication.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{selectedApplication.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{selectedApplication.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{selectedApplication.class_stream}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Applied:{" "}
                    {format(new Date(selectedApplication.submitted_at), "PPP")}
                  </span>
                </div>
                {selectedApplication.reviewed_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Reviewed:{" "}
                      {format(new Date(selectedApplication.reviewed_at), "PPP")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </h3>
              <div className="space-y-2">
                {selectedApplication.documents.marksheet_10th && (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>10th Marksheet</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDocumentView(
                          selectedApplication.documents.marksheet_10th!,
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                )}
                {selectedApplication.documents.marksheet_12th && (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>12th Marksheet</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDocumentView(
                          selectedApplication.documents.marksheet_12th!,
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                )}
                {selectedApplication.documents.other_documents?.map(
                  (doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span>Other Document {index + 1}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDocumentView(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          {selectedApplication.feedback && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Previous Feedback</h3>
              <div className="p-3 bg-gray-50 rounded border">
                {selectedApplication.feedback}
              </div>
            </div>
          )}

          {/* Action Section */}
          {selectedApplication.status === "pending" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Review Application</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Feedback (Optional)
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      handleStatusUpdate(selectedApplication.id, "approved")
                    }
                    disabled={processingStatus === selectedApplication.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    onClick={() =>
                      handleStatusUpdate(selectedApplication.id, "rejected")
                    }
                    disabled={processingStatus === selectedApplication.id}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Applications</CardTitle>
        <CardDescription>
          Manage applications to {collegeName} ({totalApplications} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No applications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{application.full_name}</h3>
                      {getStatusBadge(application.status)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {application.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {application.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {application.class_stream}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Applied:{" "}
                      {format(new Date(application.submitted_at), "PPP")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {application.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(application.id, "approved")
                          }
                          disabled={processingStatus === application.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleStatusUpdate(application.id, "rejected")
                          }
                          disabled={processingStatus === application.id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
