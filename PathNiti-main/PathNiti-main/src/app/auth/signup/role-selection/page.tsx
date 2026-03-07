"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { GraduationCap, Building, Shield, ArrowRight } from "lucide-react";
import { PathNitiLogo } from "@/components/PathNitiLogo";

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<
    "student" | "college" | "admin" | null
  >(null);

  const roles = [
    {
      id: "student" as const,
      title: "Student",
      description:
        "I am a student looking for career guidance and college information",
      icon: GraduationCap,
      features: [
        "Personalized career recommendations",
        "College and program search",
        "Scholarship opportunities",
        "Aptitude and interest assessments",
      ],
      signupUrl: "/auth/signup/student",
    },
    {
      id: "college" as const,
      title: "College Representative",
      description:
        "I represent a college and want to manage our institution's information",
      icon: Building,
      features: [
        "Manage college profile and programs",
        "Update admission information",
        "View student applications",
        "Access analytics and insights",
      ],
      signupUrl: "/auth/signup/college",
    },
    {
      id: "admin" as const,
      title: "Administrator",
      description:
        "I am a platform administrator with full access to manage the system",
      icon: Shield,
      features: [
        "Full platform management",
        "User and college verification",
        "Content moderation",
        "System analytics and reports",
      ],
      signupUrl: "/auth/signup/admin",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <PathNitiLogo size="lg" showText={true} variant="horizontal" />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Account Type
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the type of account that best describes your role to get
            started with PathNiti
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {role.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          {selectedRole ? (
            <Button asChild size="lg" className="px-8">
              <Link
                href={
                  roles.find((r) => r.id === selectedRole)?.signupUrl || "#"
                }
              >
                Continue as {roles.find((r) => r.id === selectedRole)?.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" disabled className="px-8">
              Select an account type to continue
            </Button>
          )}
        </div>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
