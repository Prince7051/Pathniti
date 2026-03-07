"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/lib/types/college-profile";
import { Trash2, Edit, Plus, Calendar, AlertCircle } from "lucide-react";

interface CollegeNoticeManagerProps {
  collegeId: string;
}

interface NoticeFormData {
  title: string;
  content: string;
  type: "general" | "admission" | "event" | "urgent";
  expires_at: string;
}

const initialFormData: NoticeFormData = {
  title: "",
  content: "",
  type: "general",
  expires_at: "",
};

export default function CollegeNoticeManager({
  collegeId,
}: CollegeNoticeManagerProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<NoticeFormData>(initialFormData);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/colleges/admin/notices?college_id=${collegeId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notices");
      }

      const data = await response.json();
      setNotices(data.notices || []);
    } catch (error) {
      console.error("Error fetching notices:", error);
      setError("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingNotice
        ? `/api/colleges/admin/notices/${editingNotice.id}`
        : "/api/colleges/admin/notices";

      const method = editingNotice ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save notice");
      }

      await fetchNotices();
      setFormData(initialFormData);
      setEditingNotice(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving notice:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save notice",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      expires_at: notice.expires_at ? notice.expires_at.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) {
      return;
    }

    try {
      const response = await fetch(`/api/colleges/admin/notices/${noticeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete notice");
      }

      await fetchNotices();
    } catch (error) {
      console.error("Error deleting notice:", error);
      setError("Failed to delete notice");
    }
  };

  const toggleNoticeStatus = async (notice: Notice) => {
    try {
      const response = await fetch(`/api/colleges/admin/notices/${notice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !notice.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notice status");
      }

      await fetchNotices();
    } catch (error) {
      console.error("Error updating notice status:", error);
      setError("Failed to update notice status");
    }
  };

  const getNoticeTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "admission":
        return "bg-blue-100 text-blue-800";
      case "event":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNoticeTypeIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="w-4 h-4" />;
      case "event":
        return <Calendar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
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
          <CardTitle>College Notices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading notices...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>College Notices</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingNotice(null);
                setFormData(initialFormData);
                setError(null);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNotice ? "Edit Notice" : "Add New Notice"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter notice title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter notice content"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, type: value as "general" | "admission" | "event" | "urgent" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="admission">Admission</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expires_at">Expires On (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingNotice
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {notices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notices found. Create your first notice to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`border rounded-lg p-4 ${
                  !notice.is_active ? "opacity-60 bg-gray-50" : ""
                } ${isExpired(notice.expires_at || null) ? "border-red-200 bg-red-50" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{notice.title}</h3>
                      <Badge
                        className={`${getNoticeTypeColor(notice.type)} flex items-center gap-1`}
                      >
                        {getNoticeTypeIcon(notice.type)}
                        {notice.type.charAt(0).toUpperCase() +
                          notice.type.slice(1)}
                      </Badge>
                      {!notice.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {isExpired(notice.expires_at || null) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{notice.content}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>Published: {formatDate(notice.published_at)}</div>
                      {notice.expires_at && (
                        <div>Expires: {formatDate(notice.expires_at)}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleNoticeStatus(notice)}
                    >
                      {notice.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(notice)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notice.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
