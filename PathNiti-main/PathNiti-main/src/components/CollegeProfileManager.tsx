"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CollegeProfileData,
  CollegeType,
  LocationData,
} from "@/lib/types/college-profile";

interface CollegeProfileManagerProps {
  initialData?: CollegeProfileData | null;
  onUpdate?: (college: CollegeProfileData) => void;
}

export default function CollegeProfileManager({
  initialData,
  onUpdate,
}: CollegeProfileManagerProps) {
  const [college, setCollege] = useState<CollegeProfileData | null>(
    initialData || null,
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [accreditationInput, setAccreditationInput] = useState("");

  // Load college data if not provided
  useEffect(() => {
    if (!initialData) {
      loadCollegeData();
    }
  }, [initialData]);

  const loadCollegeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/colleges/manage");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Failed to load college data",
        );
      }

      setCollege(data.college);
    } catch (err) {
      console.error("Error loading college data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load college data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (!college) return;

    setCollege((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : null,
    );
    setError(null);
    setSuccess(null);
  };

  const handleLocationChange = (field: keyof LocationData, value: string) => {
    if (!college) return;

    setCollege((prev) =>
      prev
        ? {
            ...prev,
            location: {
              ...prev.location,
              [field]: value,
            },
          }
        : null,
    );
    setError(null);
    setSuccess(null);
  };

  const addAccreditation = () => {
    if (!college || !accreditationInput.trim()) return;

    const currentAccreditations = college.accreditation || [];
    if (!currentAccreditations.includes(accreditationInput.trim())) {
      setCollege((prev) =>
        prev
          ? {
              ...prev,
              accreditation: [
                ...currentAccreditations,
                accreditationInput.trim(),
              ],
            }
          : null,
      );
      setAccreditationInput("");
    }
  };

  const removeAccreditation = (index: number) => {
    if (!college) return;

    const currentAccreditations = college.accreditation || [];
    setCollege((prev) =>
      prev
        ? {
            ...prev,
            accreditation: currentAccreditations.filter((_, i) => i !== index),
          }
        : null,
    );
  };

  const handleUpdate = async () => {
    if (!college) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/colleges/manage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: college.name,
          type: college.type,
          location: college.location,
          address: college.address,
          website: college.website,
          phone: college.phone,
          email: college.email,
          established_year: college.established_year,
          accreditation: college.accreditation,
          about: college.about,
          admission_criteria: college.admission_criteria,
          scholarships: college.scholarships,
          entrance_tests: college.entrance_tests,
          fee_structure: college.fee_structure,
          gallery: college.gallery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Failed to update college profile",
        );
      }

      setCollege(data.college);
      setSuccess("College profile updated successfully!");

      if (onUpdate) {
        onUpdate(data.college);
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update college profile",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading college profile...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!college) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error ||
                "No college profile found. Please register your college first."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Manage College Profile</CardTitle>
        <CardDescription>
          Update your college information and settings
        </CardDescription>
        {college.slug && (
          <div className="text-sm text-blue-600">
            Profile URL:{" "}
            <a
              href={`/colleges/${college.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              /colleges/{college.slug}
            </a>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 mb-6">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="name">College Name</Label>
              <Input
                id="name"
                value={college.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter college name"
              />
            </div>

            <div>
              <Label htmlFor="type">College Type</Label>
              <Select
                value={college.type}
                onValueChange={(value) =>
                  handleInputChange("type", value as CollegeType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select college type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="government_aided">
                    Government Aided
                  </SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="deemed">Deemed University</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={college.location.city}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={college.location.state}
                  onChange={(e) =>
                    handleLocationChange("state", e.target.value)
                  }
                  placeholder="Enter state"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={college.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter complete address"
              />
            </div>

            <div>
              <Label htmlFor="about">About College</Label>
              <Textarea
                id="about"
                value={college.about || ""}
                onChange={(e) => handleInputChange("about", e.target.value)}
                placeholder="Describe your college..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={college.website || ""}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={college.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={college.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="established_year">Established Year</Label>
                <Input
                  id="established_year"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={college.established_year || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "established_year",
                      e.target.value ? parseInt(e.target.value) : 0,
                    )
                  }
                  placeholder="Enter year"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div>
              <Label>Accreditations</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={accreditationInput}
                  onChange={(e) => setAccreditationInput(e.target.value)}
                  placeholder="Enter accreditation (e.g., NAAC A+)"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addAccreditation())
                  }
                />
                <Button
                  type="button"
                  onClick={addAccreditation}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(college.accreditation || []).map((acc, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeAccreditation(index)}
                  >
                    {acc} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Courses</Label>
                <div className="text-2xl font-bold text-blue-600">
                  {college.courses?.length || 0}
                </div>
              </div>
              <div>
                <Label>Total Notices</Label>
                <div className="text-2xl font-bold text-green-600">
                  {college.notices?.length || 0}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Advanced features like admission criteria, scholarships,
                entrance tests, and fee structure management will be available
                in future updates.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Verification Status</Label>
                <Badge variant={college.is_verified ? "default" : "secondary"}>
                  {college.is_verified ? "Verified" : "Pending Verification"}
                </Badge>
              </div>
              <div>
                <Label>Profile Status</Label>
                <Badge variant={college.is_active ? "default" : "destructive"}>
                  {college.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Profile Created</Label>
              <div className="text-sm text-gray-600">
                {new Date(college.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div>
              <Label>Last Updated</Label>
              <div className="text-sm text-gray-600">
                {new Date(college.updated_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Profile URL</h4>
              <p className="text-sm text-blue-700">
                Your college profile is accessible at: <br />
                <code className="bg-white px-2 py-1 rounded">
                  /colleges/{college.slug}
                </code>
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
