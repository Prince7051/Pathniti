/**
 * Enhanced form component with comprehensive validation and error handling
 */

"use client";

import React from "react";
import {
  useEnhancedFormValidation,
  ValidationSchema,
} from "@/hooks/useEnhancedFormValidation";
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingButton, OperationStatus } from "@/components/ui/loading-states";
import {
  FormErrorDisplay,
  FieldError,
  ValidationSummary,
} from "@/components/ui/form-error-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "tel"
    | "url"
    | "number"
    | "textarea"
    | "select";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}

export interface EnhancedFormProps {
  fields: FormField[];
  schema: ValidationSchema;
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>;
  initialValues?: Record<string, unknown>;
  title?: string;
  description?: string;
  submitButtonText?: string;
  resetButtonText?: string;
  showReset?: boolean;
  className?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

export function EnhancedForm({
  fields,
  schema,
  onSubmit,
  initialValues = {},
  title,
  description,
  submitButtonText = "Submit",
  resetButtonText = "Reset",
  showReset = true,
  className = "",
  onSuccess,
  onError,
}: EnhancedFormProps) {
  const {
    submissionState,
    isFormValid,
    hasErrors,
    fieldErrors,
    submitForm,
    resetForm,
    getFieldProps,
    getFieldError,
    isFieldTouched,
    isFieldValidating,
  } = useEnhancedFormValidation({
    schema,
    initialValues,
    onSubmitSuccess: onSuccess,
    onSubmitError: onError,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(onSubmit);
  };

  const handleReset = () => {
    resetForm();
  };

  // Get all errors for validation summary
  const allErrors = Object.values(fieldErrors);
  const allWarnings: string[] = []; // You could extend this to include warnings

  return (
    <FormErrorBoundary>
      <Card className={`p-6 ${className}`}>
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            )}
            {description && <p className="text-gray-600">{description}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation Summary */}
          {hasErrors && (
            <ValidationSummary
              errors={allErrors}
              warnings={allWarnings}
              className="mb-6"
            />
          )}

          {/* Submission Status */}
          <OperationStatus
            status={
              submissionState.isSubmitting
                ? "loading"
                : submissionState.submitSuccess
                  ? "success"
                  : submissionState.submitError
                    ? "error"
                    : "idle"
            }
            loadingText="Submitting form..."
            successText="Form submitted successfully!"
            errorText={submissionState.submitError}
            onRetry={() => submitForm(onSubmit)}
            className="mb-6"
          />

          {/* Form Fields */}
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label
                  htmlFor={field.name}
                  className="text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>

                {field.description && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}

                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    className={`${
                      isFieldTouched(field.name) && getFieldError(field.name)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    disabled={submissionState.isSubmitting}
                    {...getFieldProps(field.name)}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isFieldTouched(field.name) && getFieldError(field.name)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    disabled={submissionState.isSubmitting}
                    {...getFieldProps(field.name)}
                  >
                    <option value="">
                      {field.placeholder || `Select ${field.label}`}
                    </option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    className={`${
                      isFieldTouched(field.name) && getFieldError(field.name)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    disabled={submissionState.isSubmitting}
                    {...getFieldProps(field.name)}
                  />
                )}

                {/* Field-specific error display */}
                <FieldError
                  error={getFieldError(field.name)}
                  fieldName={field.name}
                />

                {/* Field validation indicator */}
                {isFieldValidating(field.name) && (
                  <p className="text-xs text-blue-600">Validating...</p>
                )}
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6">
            <LoadingButton
              type="submit"
              isLoading={submissionState.isSubmitting}
              loadingText="Submitting..."
              disabled={!isFormValid || submissionState.isSubmitting}
              className="flex-1"
            >
              {submitButtonText}
            </LoadingButton>

            {showReset && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submissionState.isSubmitting}
                className="px-6"
              >
                {resetButtonText}
              </Button>
            )}
          </div>

          {/* Submission attempts warning */}
          {submissionState.submitAttempts >= 2 && (
            <div className="mt-4">
              <FormErrorDisplay
                error={`You have attempted to submit ${submissionState.submitAttempts} times. If you continue to experience issues, please contact support.`}
                variant="card"
                recoveryActions={[
                  {
                    label: "Contact Support",
                    action: () => {
                      const subject = encodeURIComponent(
                        "Form Submission Issue",
                      );
                      const body = encodeURIComponent(
                        `I'm having trouble submitting a form. Attempts: ${submissionState.submitAttempts}`,
                      );
                      window.open(
                        `mailto:support@pathniti.com?subject=${subject}&body=${body}`,
                      );
                    },
                    type: "secondary",
                  },
                ]}
              />
            </div>
          )}
        </form>
      </Card>
    </FormErrorBoundary>
  );
}

// Example usage component
export function ExampleFormUsage() {
  const fields: FormField[] = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
      required: true,
      description: "Your first and last name",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "Enter your email",
      required: true,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "Enter your phone number",
      required: true,
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      placeholder: "Enter your message",
      description: "Optional message or comments",
    },
  ];

  const schema: ValidationSchema = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      required: true,
      pattern: /^[6-9]\d{9}$/,
    },
    message: {
      maxLength: 500,
    },
  };

  const handleSubmit = async (_data: Record<string, unknown>) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate random success/failure for demo
    if (Math.random() > 0.3) {
      return { success: true, id: "123" };
    } else {
      throw new Error("Submission failed. Please try again.");
    }
  };

  return (
    <EnhancedForm
      fields={fields}
      schema={schema}
      onSubmit={handleSubmit}
      title="Contact Form"
      description="Please fill out this form to get in touch with us."
      submitButtonText="Send Message"
      onSuccess={(result) => {
        console.log("Form submitted successfully:", result);
        alert("Message sent successfully!");
      }}
      onError={(error) => {
        console.error("Form submission failed:", error);
      }}
    />
  );
}
