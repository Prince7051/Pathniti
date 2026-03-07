"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from "@/components/ui";
import DocumentPreview from "./DocumentPreview";
import {
  documentStorageService,
  type DocumentMetadata,
  type DocumentType,
} from "@/lib/services/document-storage-service";
import { formatFileSize } from "@/lib/utils/file-validation";

interface DocumentManagerProps {
  userId?: string;
  applicationId?: string;
  collegeId?: string;
  documentType?: DocumentType;
  allowUpload?: boolean;
  allowDelete?: boolean;
  compact?: boolean;
  title?: string;
  emptyMessage?: string;
  onDocumentChange?: (documents: DocumentMetadata[]) => void;
}

interface FilterOptions {
  documentType?: DocumentType | "all";
  isActive?: boolean;
  sortBy: "name" | "date" | "size" | "type";
  sortOrder: "asc" | "desc";
}

export default function DocumentManager({
  userId,
  applicationId,
  collegeId,
  documentType,
  allowUpload: _allowUpload = true,
  allowDelete = true,
  compact = false,
  title = "Documents",
  emptyMessage = "No documents found",
  onDocumentChange,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<
    DocumentMetadata[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    documentType: documentType || "all",
    isActive: true,
    sortBy: "date",
    sortOrder: "desc",
  });

  // Load documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } =
        await documentStorageService.getUserDocuments(userId, {
          documentType: documentType,
          applicationId,
          collegeId,
          isActive: filters.isActive,
        });

      if (fetchError) {
        setError(fetchError);
      } else {
        setDocuments(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [userId, applicationId, collegeId, documentType, filters.isActive]);

  // Filter and sort documents
  useEffect(() => {
    let filtered = [...documents];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.document_type &&
            doc.document_type
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      );
    }

    // Apply document type filter
    if (filters.documentType && filters.documentType !== "all") {
      filtered = filtered.filter(
        (doc) => doc.document_type === filters.documentType,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          comparison = a.file_name.localeCompare(b.file_name);
          break;
        case "date":
          comparison =
            new Date(a.uploaded_at).getTime() -
            new Date(b.uploaded_at).getTime();
          break;
        case "size":
          comparison = a.file_size - b.file_size;
          break;
        case "type":
          comparison = (a.document_type || "").localeCompare(
            b.document_type || "",
          );
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, filters]);

  // Notify parent of document changes
  useEffect(() => {
    onDocumentChange?.(documents);
  }, [documents, onDocumentChange]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDocumentDelete = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const handleRefresh = () => {
    loadDocuments();
  };

  const getTotalSize = () => {
    return documents.reduce((total, doc) => total + doc.file_size, 0);
  };

  const getDocumentTypeOptions = () => {
    const types = new Set(
      documents.map((doc) => doc.document_type).filter(Boolean),
    );
    return Array.from(types).map((type) => ({
      value: type!,
      label: type!.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
              {documents.length > 0 &&
                ` • ${formatFileSize(getTotalSize())} total`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        {documents.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select
                value={filters.documentType || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    documentType:
                      value === "all" ? undefined : (value as DocumentType),
                  }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getDocumentTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split("-") as [
                    FilterOptions["sortBy"],
                    FilterOptions["sortOrder"],
                  ];
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="size-desc">Largest First</SelectItem>
                  <SelectItem value="size-asc">Smallest First</SelectItem>
                  <SelectItem value="type-asc">Type A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery || filters.documentType !== "all"
                ? "No documents match your filters"
                : emptyMessage}
            </p>
            {(searchQuery || filters.documentType !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilters((prev) => ({ ...prev, documentType: "all" }));
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <DocumentPreview
                key={document.id}
                document={document}
                onDelete={allowDelete ? handleDocumentDelete : undefined}
                showActions={true}
                compact={compact}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
