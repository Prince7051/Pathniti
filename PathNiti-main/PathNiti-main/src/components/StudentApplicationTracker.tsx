"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { StudentApplication } from "@/lib/supabase/types";

interface ApplicationWithCollege extends StudentApplication {
  college_name: string;
  college_slug: string;
  college_type: string;
  college_location: Record<string, unknown>;
  college_address: string;
  college_website: string | null;
  college_phone: string | null;
  college_email: string | null;
}

interface StudentApplicationTrackerProps {
  userId: string;
}

export function StudentApplicationTracker({
  userId,
}: StudentApplicationTrackerProps) {
  const [applications, setApplications] = useState<ApplicationWithCollege[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingDocuments, setUpdatingDocuments] = useState<string | null>(
    null,
  );

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/student/applications");

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const result = await response.json();

      if (result.success) {
        setApplications(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch applications",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchApplications();
    }
  }, [userId]);

  const handleDocumentUpdate = async (applicationId: string) => {
    // Create a file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    fileInput.multiple = true;

    fileInput.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      try {
        setUpdatingDocuments(applicationId);

        // Upload files to Supabase Storage
        const uploadPromises = Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("bucket", "student-documents");
          formData.append("path", `${userId}/${applicationId}/${file.name}`);

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const uploadResult = await uploadResponse.json();
          return {
            name: file.name,
            url: uploadResult.url,
            type: file.type,
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // Update the application with new documents
        const documents = {
          marksheet_10th:
            uploadedFiles.find(
              (f) =>
                f.name.toLowerCase().includes("10th") ||
                f.name.toLowerCase().includes("tenth"),
            )?.url || "",
          marksheet_12th:
            uploadedFiles.find(
              (f) =>
                f.name.toLowerCase().includes("12th") ||
                f.name.toLowerCase().includes("twelfth"),
            )?.url || "",
          other_documents: uploadedFiles
            .filter(
              (f) =>
                !f.name.toLowerCase().includes("10th") &&
                !f.name.toLowerCase().includes("12th") &&
                !f.name.toLowerCase().includes("tenth") &&
                !f.name.toLowerCase().includes("twelfth"),
            )
            .map((f) => f.url),
        };

        const updateResponse = await fetch(
          `/api/student/applications/${applicationId}/documents`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ documents }),
          },
        );

        if (!updateResponse.ok) {
          throw new Error("Failed to update documents");
        }

        // Refresh applications list
        await fetchApplications();
      } catch (error) {
        console.error("Error updating documents:", error);
        setError(
          error instanceof Error ? error.message : "Failed to update documents",
        );
      } finally {
        setUpdatingDocuments(null);
      }
    };

    fileInput.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Application Tracker
          </CardTitle>
          <CardDescription>
            Track your college application status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading applications...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Application Tracker
          </CardTitle>
          <CardDescription>
            Track your college application status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-2">No applications yet</p>
            <p className="text-xs text-gray-400">
              Start applying to colleges to track your progress here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Application Tracker
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Track your college application status and manage documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-2">No applications found</p>
            <p className="text-xs text-gray-400 mb-4">
              Start by exploring colleges and submitting applications
            </p>
            <Button asChild>
              <Link href="/colleges">Explore Colleges</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {application.college_name}
                      </h3>
                      {getStatusIcon(application.status)}
                      {getStatusBadge(application.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Stream: {application.class_stream}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted: {formatDate(application.submitted_at)}
                    </p>
                    {application.reviewed_at && (
                      <p className="text-sm text-gray-500">
                        Reviewed: {formatDate(application.reviewed_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {application.college_slug && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/colleges/${application.college_slug}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View College
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {application.feedback && (
                  <div className="bg-gray-50 rounded-md p-3 mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Feedback:
                    </p>
                    <p className="text-sm text-gray-600">
                      {application.feedback}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Application ID: {application.id.slice(0, 8)}...
                  </div>

                  {application.status === "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDocumentUpdate(application.id)}
                      disabled={updatingDocuments === application.id}
                      className="flex items-center"
                    >
                      {updatingDocuments === application.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Update Documents
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
