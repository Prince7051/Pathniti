"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useAuth } from "../../providers";
import { supabase } from "@/lib/supabase";
import { GraduationCap, MapPin, User } from "lucide-react";
import { PathNitiLogo } from "@/components/PathNitiLogo";

export default function CompleteProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  // supabase client is imported directly
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    classLevel: "",
    stream: "",
    state: "",
    city: "",
    pincode: "",
    interests: [] as string[],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Check if user already has a profile and redirect if they do
  useEffect(() => {
    if (user && profile) {
      console.log("User already has a profile, redirecting to dashboard");
      console.log("Profile data:", profile);
      router.push("/dashboard");
    }
  }, [user, profile, router]);

  const classLevels = [
    { value: "10", label: "Class 10" },
    { value: "12", label: "Class 12" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "postgraduate", label: "Postgraduate" },
  ];

  const streams = [
    { value: "science", label: "Science" },
    { value: "commerce", label: "Commerce" },
    { value: "arts", label: "Arts" },
    { value: "vocational", label: "Vocational" },
    { value: "engineering", label: "Engineering" },
    { value: "medical", label: "Medical" },
  ];

  const genders = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  const interestOptions = [
    "Mathematics",
    "Science",
    "Literature",
    "History",
    "Geography",
    "Computer Science",
    "Art & Design",
    "Music",
    "Sports",
    "Dance",
    "Photography",
    "Writing",
    "Public Speaking",
    "Leadership",
    "Research",
    "Problem Solving",
    "Creativity",
    "Technology",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleInterestToggle = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.includes(interest)
        ? formData.interests.filter((i) => i !== interest)
        : [...formData.interests, interest],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      console.log("Creating profile for user:", user.id);
      
      const profileData = {
        id: user.id,
        email: user.email!,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        class_level: formData.classLevel,
        stream: formData.stream,
        location: {
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
        },
        interests: formData.interests,
        role: "student", // Default role
        is_verified: true, // Email verification disabled in Supabase
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Profile data:", profileData);

      const { error } = await supabase.from("profiles").upsert(profileData as any);

      if (error) {
        console.error("Profile creation error:", error);
        throw error;
      }

      console.log("Profile created successfully, redirecting to dashboard");
      console.log("Profile data that was created:", profileData);
      
      // Force a small delay to ensure the profile is saved before redirecting
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error: unknown) {
      console.error("Complete profile error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.dateOfBirth &&
          formData.gender
        );
      case 2:
        return formData.classLevel && formData.stream;
      case 3:
        return formData.state && formData.city && formData.pincode;
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to complete your profile.
            </p>
            <Button asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <PathNitiLogo size="lg" showText={true} variant="horizontal" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Help us personalize your career guidance experience
            </CardDescription>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-2 rounded-full ${
                      i + 1 <= currentStep ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstName"
                        className="text-sm font-medium"
                      >
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="dateOfBirth"
                      className="text-sm font-medium"
                    >
                      Date of Birth
                    </label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-medium">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select gender</option>
                      {genders.map((gender) => (
                        <option key={gender.value} value={gender.value}>
                          {gender.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Academic Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Academic Information
                  </h3>

                  <div className="space-y-2">
                    <label htmlFor="classLevel" className="text-sm font-medium">
                      Current Class Level
                    </label>
                    <select
                      id="classLevel"
                      name="classLevel"
                      value={formData.classLevel}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select class level</option>
                      {classLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="stream" className="text-sm font-medium">
                      Stream/Field of Interest
                    </label>
                    <select
                      id="stream"
                      name="stream"
                      value={formData.stream}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select stream</option>
                      {streams.map((stream) => (
                        <option key={stream.value} value={stream.value}>
                          {stream.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Interests (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {interestOptions.map((interest) => (
                        <label
                          key={interest}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleInterestToggle(interest)}
                            className="rounded"
                          />
                          <span className="text-sm">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location Information
                  </h3>

                  <div className="space-y-2">
                    <label htmlFor="state" className="text-sm font-medium">
                      State
                    </label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter your state"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">
                      City
                    </label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="pincode" className="text-sm font-medium">
                      Pincode
                    </label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter your pincode"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading || !isStepValid()}>
                    {loading ? "Completing Profile..." : "Complete Profile"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
