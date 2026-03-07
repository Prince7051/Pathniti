"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import {
  validateFile,
  generateUniqueFilename,
} from "@/lib/utils/file-validation";

interface StudentApplicationFormProps {
  collegeId: string;
  collegeName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface DocumentUpload {
  file: File | null;
  url: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  class_stream: string;
}

export default function StudentApplicationForm({
  collegeId,
  collegeName,
  onSuccess,
  onCancel,
}: StudentApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    class_stream: "",
  });

  const [documents, setDocuments] = useState({
    marksheet_10th: {
      file: null,
      url: null,
      uploading: false,
      progress: 0,
      error: null,
    } as DocumentUpload,
    marksheet_12th: {
      file: null,
      url: null,
      uploading: false,
      progress: 0,
      error: null,
    } as DocumentUpload,
    other_documents: [] as DocumentUpload[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRefs = {
    marksheet_10th: useRef<HTMLInputElement>(null),
    marksheet_12th: useRef<HTMLInputElement>(null),
    other_documents: useRef<HTMLInputElement>(null),
  };

  // Using the singleton supabase client from the import

  const uploadFile = async (
    file: File,
    path: string,
  ): Promise<{ url: string | null; error: string | null }> => {
    try {
      const fileName = generateUniqueFilename(file.name);
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("student-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return { url: null, error: error.message };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("student-documents").getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error("Upload error:", error);
      return { url: null, error: "Failed to upload file" };
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: "marksheet_10th" | "marksheet_12th" | "other_documents",
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationResult = await validateFile(file);

    if (!validationResult.isValid) {
      setErrors((prev) => ({
        ...prev,
        [documentType]: validationResult.error || "Invalid file",
      }));
      return;
    }

    // Clear any previous errors
    setErrors((prev) => ({ ...prev, [documentType]: "" }));

    if (documentType === "other_documents") {
      // Handle multiple other documents
      const newDocument: DocumentUpload = {
        file,
        url: null,
        uploading: true,
        progress: 0,
        error: null,
      };

      setDocuments((prev) => ({
        ...prev,
        other_documents: [...prev.other_documents, newDocument],
      }));

      // Upload the file
      const documentIndex = documents.other_documents.length;
      const { url, error } = await uploadFile(
        file,
        `other-documents/${collegeId}`,
      );

      setDocuments((prev) => ({
        ...prev,
        other_documents: prev.other_documents.map((doc, index) =>
          index === documentIndex
            ? { ...doc, url, uploading: false, progress: 100, error }
            : doc,
        ),
      }));
    } else {
      // Handle single documents (marksheets)
      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          file,
          url: null,
          uploading: true,
          progress: 0,
          error: null,
        },
      }));

      const { url, error } = await uploadFile(file, `marksheets/${collegeId}`);

      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          url,
          uploading: false,
          progress: 100,
          error,
        },
      }));
    }
  };

  const removeDocument = (
    documentType: "marksheet_10th" | "marksheet_12th" | "other_documents",
    index?: number,
  ) => {
    if (documentType === "other_documents" && typeof index === "number") {
      setDocuments((prev) => ({
        ...prev,
        other_documents: prev.other_documents.filter((_, i) => i !== index),
      }));
    } else {
      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          file: null,
          url: null,
          uploading: false,
          progress: 0,
          error: null,
        },
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.class_stream.trim()) {
      newErrors.class_stream = "Class/Stream is required";
    }

    if (!documents.marksheet_10th.url) {
      newErrors.marksheet_10th = "10th marksheet is required";
    }

    if (!documents.marksheet_12th.url) {
      newErrors.marksheet_12th = "12th marksheet is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSubmitError("You must be logged in to submit an application");
        return;
      }

      // Prepare documents object
      const documentsData = {
        marksheet_10th: documents.marksheet_10th.url,
        marksheet_12th: documents.marksheet_12th.url,
        other_documents: documents.other_documents
          .filter((doc) => doc.url)
          .map((doc) => doc.url),
      };

      // Submit application
      const response = await fetch(`/api/colleges/${collegeId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          documents: documentsData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit application");
      }

      // Success
      onSuccess?.();
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit application",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderFileUpload = (
    documentType: "marksheet_10th" | "marksheet_12th" | "other_documents",
    label: string,
    required: boolean = false,
  ) => {
    const document = documents[documentType as keyof typeof documents];
    const isMultiple = documentType === "other_documents";

    return (
      <div className="space-y-2">
        <Label htmlFor={documentType} className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary/50 transition-colors">
          <input
            ref={fileInputRefs[documentType]}
            type="file"
            id={documentType}
            accept=".pdf,.jpg,.jpeg,.png"
            multiple={isMultiple}
            onChange={(e) => handleFileSelect(e, documentType)}
            className="hidden"
          />

          <div className="text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRefs[documentType].current?.click()}
              disabled={submitting}
            >
              Choose File
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              PDF, JPEG, PNG up to 5MB
            </p>
          </div>
        </div>

        {/* Show uploaded files */}
        {!isMultiple && (document as DocumentUpload).file && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {(document as DocumentUpload).file?.name}
              </span>
              {(document as DocumentUpload).uploading && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {(document as DocumentUpload).url && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeDocument(documentType)}
              disabled={submitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Show multiple uploaded files for other documents */}
        {isMultiple &&
          (documents.other_documents as DocumentUpload[]).map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{doc.file?.name}</span>
                {doc.uploading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {doc.url && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDocument("other_documents", index)}
                disabled={submitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

        {/* Show upload progress */}
        {!isMultiple && (document as DocumentUpload).uploading && (
          <Progress
            value={(document as DocumentUpload).progress}
            className="w-full"
          />
        )}

        {/* Show errors */}
        {errors[documentType] && (
          <p className="text-sm text-red-500">{errors[documentType]}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Apply to {collegeName}
        </CardTitle>
        <p className="text-gray-600">
          Fill out the form below to submit your application
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>

            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                placeholder="Enter your full name"
                disabled={submitting}
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter your email address"
                disabled={submitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Enter your phone number"
                disabled={submitting}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class_stream">
                Class/Stream <span className="text-red-500">*</span>
              </Label>
              <Input
                id="class_stream"
                type="text"
                value={formData.class_stream}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    class_stream: e.target.value,
                  }))
                }
                placeholder="e.g., 12th Science, B.Tech CSE, etc."
                disabled={submitting}
              />
              {errors.class_stream && (
                <p className="text-sm text-red-500">{errors.class_stream}</p>
              )}
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Document Upload</h3>

            {renderFileUpload("marksheet_10th", "10th Marksheet", true)}
            {renderFileUpload("marksheet_12th", "12th Marksheet", true)}
            {renderFileUpload("other_documents", "Other Documents (Optional)")}
          </div>

          {/* Submit Error */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
