"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestAssessmentPage() {
  const showConstraints = true;

  if (showConstraints) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Test Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a test component to verify JSX syntax works.</p>
            <Button>Test Button</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1>Default Test</h1>
    </div>
  );
}
