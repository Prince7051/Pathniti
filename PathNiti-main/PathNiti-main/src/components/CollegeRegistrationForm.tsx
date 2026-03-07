"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { signupSessionManager } from "@/lib/services/signup-session";
import type {
  CollegeType,
  LocationData,
  AdmissionCriteria,
  ScholarshipInfo,
  EntranceTestInfo,
  FeeStructure,
} from "@/lib/types/college-profile";

interface CollegeRegistrationFormProps {
  onSuccess?: (college: { id: string; name: string; slug: string }) => void;
  onCancel?: () => void;
  source?: "direct" | "signup";
  returnTo?: string;
  minimal?: boolean; // For minimal registration mode in signup context
}

interface FormData {
  name: string;
  type: CollegeType | "";
  location: LocationData;
  address: string;
  website: string;
  phone: string;
  email: string;
  established_year: string;
  accreditation: string[];
  about: string;
  admission_criteria: AdmissionCriteria | null;
  scholarships: ScholarshipInfo[];
  entrance_tests: EntranceTestInfo[];
  fee_structure: FeeStructure | null;
}

const initialFormData: FormData = {
  name: "",
  type: "",
  location: {
    city: "",
    state: "",
  },
  address: "",
  website: "",
  phone: "",
  email: "",
  established_year: "",
  accreditation: [],
  about: "",
  admission_criteria: null,
  scholarships: [],
  entrance_tests: [],
  fee_structure: null,
};

export default function CollegeRegistrationForm({
  onSuccess,
  onCancel,
  source = "direct",
  returnTo,
  minimal = false,
}: CollegeRegistrationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [accreditationInput, setAccreditationInput] = useState("");

  // Adjust total steps based on mode
  const totalSteps = minimal ? 2 : 4;
  const isSignupFlow = source === "signup";

  // Extract redirect parameters from URL or props
  const redirectParams = {
    source: searchParams?.get("source") || source,
    returnTo: searchParams?.get("returnTo") || returnTo,
    sessionId: searchParams?.get("sessionId"),
    userId: searchParams?.get("userId"),
  };

  useEffect(() => {
    // If this is from signup flow, update session step
    if (isSignupFlow) {
      signupSessionManager.setStep("college-registration");
    }
  }, [isSignupFlow]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleLocationChange = (field: keyof LocationData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
    setError(null);
  };

  const addAccreditation = () => {
    if (
      accreditationInput.trim() &&
      !formData.accreditation.includes(accreditationInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        accreditation: [...prev.accreditation, accreditationInput.trim()],
      }));
      setAccreditationInput("");
    }
  };

  const removeAccreditation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      accreditation: prev.accreditation.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step: number): boolean => {
    if (minimal) {
      // In minimal mode, only validate essential fields
      switch (step) {
        case 1:
          return !!(
            formData.name &&
            formData.type &&
            formData.location.city &&
            formData.location.state
          );
        case 2:
          return true; // Review step
        default:
          return false;
      }
    } else {
      // Full validation for direct registration
      switch (step) {
        case 1:
          return !!(
            formData.name &&
            formData.type &&
            formData.location.city &&
            formData.location.state &&
            formData.address
          );
        case 2:
          return true; // Optional fields
        case 3:
          return true; // Optional fields
        case 4:
          return true; // Optional fields
        default:
          return false;
      }
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setError(null);
    } else {
      setError("Please fill in all required fields before proceeding");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(1)) {
      setError("Please fill in all required fields");
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare registration data
      const registrationData = {
        ...formData,
        established_year: formData.established_year
          ? parseInt(formData.established_year)
          : null,
        email: formData.email || undefined,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
        about: formData.about || undefined,
        accreditation:
          formData.accreditation.length > 0
            ? formData.accreditation
            : undefined,
        // Add context for signup flow
        source: redirectParams.source,
        minimal: minimal,
      };

      const response = await fetch("/api/colleges/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Failed to register college",
        );
      }

      setSuccess(
        isSignupFlow
          ? "College registered successfully! Returning to signup..."
          : "College registered successfully!",
      );

      // Handle different success scenarios
      if (onSuccess) {
        // Custom success callback
        onSuccess(data.college);
      } else if (isSignupFlow) {
        // Handle signup flow return
        await handleSignupFlowReturn(data.college);
      } else {
        // Direct registration - redirect to college profile
        setTimeout(() => {
          router.push(`/colleges/${data.college.slug || data.college.id}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to register college";
      setError(errorMessage);

      // Handle signup flow errors
      if (isSignupFlow) {
        handleSignupFlowError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupFlowReturn = async (college: {
    id: string;
    name: string;
    slug: string;
  }) => {
    try {
      // Update session with college information
      const sessionData = signupSessionManager.getFormData();
      if (sessionData) {
        signupSessionManager.saveFormData(
          {
            ...sessionData,
            collegeId: college.id,
            collegeName: college.name,
            isNewCollege: true,
            registrationSource: "new",
          },
          "account-creation",
        );
      }

      // Construct return URL with success parameters
      const returnUrl = redirectParams.returnTo || "/auth/signup/college";
      const url = new URL(returnUrl, window.location.origin);
      url.searchParams.set("success", "true");
      url.searchParams.set("collegeId", college.id);
      url.searchParams.set("collegeName", college.name);
      url.searchParams.set("step", "account-creation");

      // Add session context if available
      if (redirectParams.sessionId) {
        url.searchParams.set("sessionId", redirectParams.sessionId);
      }

      setTimeout(() => {
        window.location.href = url.toString();
      }, 2000);
    } catch (err) {
      console.error("Error handling signup flow return:", err);
      // Fallback to basic return
      const fallbackUrl = redirectParams.returnTo || "/auth/signup/college";
      setTimeout(() => {
        window.location.href = fallbackUrl;
      }, 2000);
    }
  };

  const handleSignupFlowError = (errorMessage: string) => {
    // For signup flow errors, we provide options to return or retry
    console.error("Signup flow registration error:", errorMessage);

    // The error display will show a "Return to Signup" button
    // which is already implemented in the error display section
  };

  const renderStep = () => {
    if (minimal) {
      return renderMinimalStep();
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">College Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter college name"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">College Type *</Label>
              <Select
                value={formData.type}
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
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.location.state}
                  onChange={(e) =>
                    handleLocationChange("state", e.target.value)
                  }
                  placeholder="Enter state"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            </div>

            <div>
              <Label htmlFor="address">Full Address {!minimal && "*"}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter complete address"
                required={!minimal}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
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
                  value={formData.email}
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
                  value={formData.established_year}
                  onChange={(e) =>
                    handleInputChange("established_year", e.target.value)
                  }
                  placeholder="Enter year"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="about">About College</Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => handleInputChange("about", e.target.value)}
                placeholder="Describe your college..."
                rows={4}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Accreditations</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={accreditationInput}
                  onChange={(e) => setAccreditationInput(e.target.value)}
                  placeholder="Enter accreditation (e.g., NAAC A+)"
                  onKeyDown={(e) =>
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
                {formData.accreditation.map((acc, index) => (
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

            <div className="text-sm text-gray-600">
              <p>
                Additional details like admission criteria, scholarships,
                entrance tests, and fee structure can be added later from your
                college dashboard.
              </p>
            </div>
          </div>
        );

      case 4:
        return renderReviewStep();

      default:
        return null;
    }
  };

  const renderMinimalStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                Quick registration for signup flow. You can add more details
                later from your dashboard.
              </p>
            </div>

            <div>
              <Label htmlFor="name">College Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter college name"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">College Type *</Label>
              <Select
                value={formData.type}
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
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.location.state}
                  onChange={(e) =>
                    handleLocationChange("state", e.target.value)
                  }
                  placeholder="Enter state"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter address (can be added later)"
                rows={2}
              />
            </div>
          </div>
        );

      case 2:
        return renderReviewStep();

      default:
        return null;
    }
  };

  const renderReviewStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Review Your Information</h3>

        <div className="space-y-3 text-sm">
          <div>
            <strong>College Name:</strong> {formData.name}
          </div>
          <div>
            <strong>Type:</strong> {formData.type}
          </div>
          <div>
            <strong>Location:</strong> {formData.location.city},{" "}
            {formData.location.state}
          </div>
          {formData.address && (
            <div>
              <strong>Address:</strong> {formData.address}
            </div>
          )}
          {formData.website && (
            <div>
              <strong>Website:</strong> {formData.website}
            </div>
          )}
          {formData.phone && (
            <div>
              <strong>Phone:</strong> {formData.phone}
            </div>
          )}
          {formData.email && (
            <div>
              <strong>Email:</strong> {formData.email}
            </div>
          )}
          {formData.established_year && (
            <div>
              <strong>Established:</strong> {formData.established_year}
            </div>
          )}
          {formData.accreditation.length > 0 && (
            <div>
              <strong>Accreditations:</strong>{" "}
              {formData.accreditation.join(", ")}
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            {isSignupFlow
              ? "After registration, you'll be redirected back to complete your account creation."
              : "After registration, you'll be able to manage your college profile, add courses, post notices, and handle student applications from your dashboard."}
          </p>
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Redirecting to your college profile...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {minimal ? "Quick College Registration" : "Register Your College"}
        </CardTitle>
        <CardDescription>
          Step {currentStep} of {totalSteps}:{" "}
          {minimal ? "Quick setup for signup" : "Create your college profile"}
          {isSignupFlow && (
            <span className="block mt-1 text-blue-600">
              You&apos;ll be redirected back to complete your account after
              registration
            </span>
          )}
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" role="form">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
                {isSignupFlow && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-red-700">
                      You can fix the issue above and try again, or return to
                      signup to select an existing college.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const returnUrl =
                            redirectParams.returnTo || "/auth/signup/college";
                          const url = new URL(
                            returnUrl,
                            window.location.origin,
                          );
                          url.searchParams.set("error", "true");
                          url.searchParams.set(
                            "errorMessage",
                            error || "College registration failed",
                          );
                          url.searchParams.set("source", "registration-error");
                          window.location.href = url.toString();
                        }}
                      >
                        Return to Signup
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setError(null);
                          setCurrentStep(1);
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {renderStep()}

          <div className="flex justify-between pt-4">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}

              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register College"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
