"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { Course } from "@/lib/types/college-profile";

interface CollegeCourseManagerProps {
  collegeId: string;
  collegeName: string;
}

interface CourseFormData {
  name: string;
  description: string;
  duration: string;
  eligibility: string;
  fees: {
    tuition: number | "";
    other: number | "";
    total: number | "";
  };
  seats: number | "";
}

const initialFormData: CourseFormData = {
  name: "",
  description: "",
  duration: "",
  eligibility: "",
  fees: {
    tuition: "",
    other: "",
    total: "",
  },
  seats: "",
};

export default function CollegeCourseManager({
  collegeName,
}: CollegeCourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/colleges/admin/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to load courses");
      }

      setCourses(data.courses || []);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CourseFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeesChange = (
    field: keyof CourseFormData["fees"],
    value: string,
  ) => {
    const numValue = value === "" ? "" : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      fees: {
        ...prev.fees,
        [field]: numValue,
      },
    }));
  };

  const openCreateDialog = () => {
    setEditingCourse(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || "",
      duration: course.duration || "",
      eligibility: course.eligibility || "",
      fees: {
        tuition: course.fees?.tuition || "",
        other: course.fees?.other || "",
        total: course.fees?.total || "",
      },
      seats: course.seats || "",
    });
    setIsDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Course name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const requestData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        duration: formData.duration.trim() || null,
        eligibility: formData.eligibility.trim() || null,
        fees: {
          tuition:
            formData.fees.tuition === "" ? null : Number(formData.fees.tuition),
          other:
            formData.fees.other === "" ? null : Number(formData.fees.other),
          total:
            formData.fees.total === "" ? null : Number(formData.fees.total),
        },
        seats: formData.seats === "" ? null : Number(formData.seats),
      };

      let response;
      if (editingCourse) {
        // Update existing course
        response = await fetch(
          `/api/colleges/admin/courses/${editingCourse.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
          },
        );
      } else {
        // Create new course
        response = await fetch("/api/colleges/admin/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to save course");
      }

      setSuccess(
        editingCourse
          ? "Course updated successfully!"
          : "Course created successfully!",
      );
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingCourse(null);

      // Reload courses
      await loadCourses();
    } catch (err) {
      console.error("Error saving course:", err);
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (
      !confirm(
        `Are you sure you want to delete the course "${course.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/colleges/admin/courses/${course.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Failed to delete course",
        );
      }

      setSuccess("Course deleted successfully!");

      // Reload courses
      await loadCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
      setError(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Management
              </CardTitle>
              <CardDescription>
                Manage courses offered by {collegeName}
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Courses List */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first course offering.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Course
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card
              key={course.id}
              className={!course.is_active ? "opacity-60" : ""}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{course.name}</h3>
                      <Badge
                        variant={course.is_active ? "default" : "secondary"}
                      >
                        {course.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {course.description && (
                      <p className="text-gray-600 mb-3">{course.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {course.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>Duration: {course.duration}</span>
                        </div>
                      )}

                      {course.seats && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>Seats: {course.seats}</span>
                        </div>
                      )}

                      {course.fees?.total && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>
                            Fee: ₹{course.fees.total.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {course.eligibility && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Eligibility:</strong> {course.eligibility}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(course)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Edit Course" : "Add New Course"}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Update the course information below."
                : "Fill in the details for the new course."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Bachelor of Computer Applications"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Brief description of the course..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  placeholder="e.g., 3 Years"
                />
              </div>
              <div>
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  value={formData.seats}
                  onChange={(e) => handleInputChange("seats", e.target.value)}
                  placeholder="e.g., 60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="eligibility">Eligibility Criteria</Label>
              <Textarea
                id="eligibility"
                value={formData.eligibility}
                onChange={(e) =>
                  handleInputChange("eligibility", e.target.value)
                }
                placeholder="e.g., 12th pass with minimum 50% marks"
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Fee Structure (₹)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tuition" className="text-sm">
                    Tuition Fee
                  </Label>
                  <Input
                    id="tuition"
                    type="number"
                    min="0"
                    value={formData.fees.tuition}
                    onChange={(e) =>
                      handleFeesChange("tuition", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="other" className="text-sm">
                    Other Fees
                  </Label>
                  <Input
                    id="other"
                    type="number"
                    min="0"
                    value={formData.fees.other}
                    onChange={(e) => handleFeesChange("other", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="total" className="text-sm">
                    Total Fee
                  </Label>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    value={formData.fees.total}
                    onChange={(e) => handleFeesChange("total", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? editingCourse
                    ? "Updating..."
                    : "Creating..."
                  : editingCourse
                    ? "Update Course"
                    : "Create Course"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
