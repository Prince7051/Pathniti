/**
 * Enhanced form validation hook with comprehensive error handling and loading states
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useErrorHandler } from "@/components/ErrorBoundary";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
  asyncValidator?: (value: unknown) => Promise<string | null>;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface FieldState {
  value: unknown;
  error?: string;
  warning?: string;
  touched: boolean;
  validating: boolean;
  valid: boolean;
}

export interface FormState {
  [key: string]: FieldState;
}

export interface SubmissionState {
  isSubmitting: boolean;
  submitError?: string;
  submitSuccess: boolean;
  submitAttempts: number;
}

export interface UseEnhancedFormValidationOptions {
  schema: ValidationSchema;
  initialValues?: Record<string, unknown>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  maxSubmitAttempts?: number;
  onSubmitSuccess?: (data: unknown) => void;
  onSubmitError?: (error: Error) => void;
}

export function useEnhancedFormValidation({
  schema,
  initialValues = {},
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  maxSubmitAttempts = 3,
  onSubmitSuccess,
  onSubmitError,
}: UseEnhancedFormValidationOptions) {
  const { handleError } = useErrorHandler();

  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    const initialState: FormState = {};

    Object.keys(schema).forEach((field) => {
      initialState[field] = {
        value: initialValues[field] || "",
        touched: false,
        validating: false,
        valid: !schema[field].required || !!initialValues[field],
      };
    });

    return initialState;
  });

  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    submitSuccess: false,
    submitAttempts: 0,
  });

  const [validationTimeouts, setValidationTimeouts] = useState<
    Record<string, NodeJS.Timeout>
  >({});

  // Validate individual field
  const validateField = useCallback(
    async (fieldName: string, value: unknown): Promise<string | null> => {
      const rule = schema[fieldName];
      if (!rule) return null;

      // Required validation
      if (
        rule.required &&
        (!value || (typeof value === "string" && !value.trim()))
      ) {
        return `${fieldName} is required`;
      }

      // Skip other validations if field is empty and not required
      if (
        !rule.required &&
        (!value || (typeof value === "string" && !value.trim()))
      ) {
        return null;
      }

      // Length validation for strings
      if (typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          return `${fieldName} must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return `${fieldName} must be no more than ${rule.maxLength} characters`;
        }
      }

      // Pattern validation
      if (
        rule.pattern &&
        typeof value === "string" &&
        !rule.pattern.test(value)
      ) {
        return `${fieldName} format is invalid`;
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) return customError;
      }

      // Async validation
      if (rule.asyncValidator) {
        try {
          const asyncError = await rule.asyncValidator(value);
          if (asyncError) return asyncError;
        } catch (error) {
          handleError(error as Error, `async validation for ${fieldName}`);
          return "Validation failed";
        }
      }

      return null;
    },
    [schema, handleError],
  );

  // Update field value with validation
  const updateField = useCallback(
    (fieldName: string, value: unknown) => {
      setFormState((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value,
          touched: true,
          validating: validateOnChange,
        },
      }));

      // Clear submission error when user starts typing
      if (submissionState.submitError) {
        setSubmissionState((prev) => ({ ...prev, submitError: undefined }));
      }

      // Debounced validation
      if (validateOnChange) {
        // Clear existing timeout
        if (validationTimeouts[fieldName]) {
          clearTimeout(validationTimeouts[fieldName]);
        }

        const timeout = setTimeout(async () => {
          const error = await validateField(fieldName, value);

          setFormState((prev) => ({
            ...prev,
            [fieldName]: {
              ...prev[fieldName],
              error: error || undefined,
              valid: !error,
              validating: false,
            },
          }));
        }, debounceMs);

        setValidationTimeouts((prev) => ({
          ...prev,
          [fieldName]: timeout,
        }));
      }
    },
    [
      validateOnChange,
      validateField,
      debounceMs,
      submissionState.submitError,
      validationTimeouts,
    ],
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    async (fieldName: string) => {
      if (!validateOnBlur) return;

      const currentValue = formState[fieldName]?.value;
      const error = await validateField(fieldName, currentValue);

      setFormState((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          touched: true,
          error: error || undefined,
          valid: !error,
          validating: false,
        },
      }));
    },
    [validateOnBlur, validateField, formState],
  );

  // Validate all fields
  const validateAllFields = useCallback(async (): Promise<boolean> => {
    const validationPromises = Object.keys(schema).map(async (fieldName) => {
      const value = formState[fieldName]?.value;
      const error = await validateField(fieldName, value);

      return { fieldName, error };
    });

    const results = await Promise.all(validationPromises);

    // Update all field states
    setFormState((prev) => {
      const newState = { ...prev };

      results.forEach(({ fieldName, error }) => {
        newState[fieldName] = {
          ...newState[fieldName],
          touched: true,
          error: error || undefined,
          valid: !error,
          validating: false,
        };
      });

      return newState;
    });

    return results.every(({ error }) => !error);
  }, [schema, formState, validateField]);

  // Get form data
  const getFormData = useCallback(() => {
    const data: Record<string, unknown> = {};
    Object.keys(formState).forEach((field) => {
      data[field] = formState[field].value;
    });
    return data;
  }, [formState]);

  // Submit form
  const submitForm = useCallback(
    async (submitFunction: (data: Record<string, unknown>) => Promise<unknown>) => {
      if (submissionState.isSubmitting) return;
      if (submissionState.submitAttempts >= maxSubmitAttempts) {
        setSubmissionState((prev) => ({
          ...prev,
          submitError:
            "Maximum submission attempts reached. Please refresh the page.",
        }));
        return;
      }

      setSubmissionState((prev) => ({
        ...prev,
        isSubmitting: true,
        submitError: undefined,
        submitSuccess: false,
      }));

      try {
        // Validate all fields first
        const isValid = await validateAllFields();

        if (!isValid) {
          throw new Error("Please fix all validation errors before submitting");
        }

        const formData = getFormData();
        const result = await submitFunction(formData);

        setSubmissionState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitSuccess: true,
          submitAttempts: prev.submitAttempts + 1,
        }));

        if (onSubmitSuccess) {
          onSubmitSuccess(result);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Submission failed";

        setSubmissionState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitError: errorMessage,
          submitAttempts: prev.submitAttempts + 1,
        }));

        if (onSubmitError) {
          onSubmitError(error as Error);
        }

        handleError(error as Error, "form submission");
        throw error;
      }
    },
    [
      submissionState.isSubmitting,
      submissionState.submitAttempts,
      maxSubmitAttempts,
      validateAllFields,
      getFormData,
      onSubmitSuccess,
      onSubmitError,
      handleError,
    ],
  );

  // Reset form
  const resetForm = useCallback(() => {
    setFormState((prev) => {
      const resetState: FormState = {};
      Object.keys(prev).forEach((field) => {
        resetState[field] = {
          value: initialValues[field] || "",
          touched: false,
          validating: false,
          valid: !schema[field].required || !!initialValues[field],
        };
      });
      return resetState;
    });

    setSubmissionState({
      isSubmitting: false,
      submitSuccess: false,
      submitAttempts: 0,
    });

    // Clear all timeouts
    Object.values(validationTimeouts).forEach((timeout) =>
      clearTimeout(timeout),
    );
    setValidationTimeouts({});
  }, [initialValues, schema, validationTimeouts]);

  // Get field props for easy integration
  const getFieldProps = useCallback(
    (fieldName: string) => {
      const field = formState[fieldName];

      return {
        value: (field?.value as string) || "",
        onChange: (
          e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >,
        ) => {
          updateField(fieldName, e.target.value);
        },
        onBlur: () => handleFieldBlur(fieldName),
        "aria-invalid": field?.touched && !field?.valid,
        "aria-describedby": field?.error ? `${fieldName}-error` : undefined,
      };
    },
    [formState, updateField, handleFieldBlur],
  );

  // Computed values
  const isFormValid = useMemo(() => {
    return Object.values(formState).every((field) => field.valid);
  }, [formState]);

  const hasErrors = useMemo(() => {
    return Object.values(formState).some(
      (field) => field.touched && field.error,
    );
  }, [formState]);

  const isValidating = useMemo(() => {
    return Object.values(formState).some((field) => field.validating);
  }, [formState]);

  const touchedFields = useMemo(() => {
    return Object.keys(formState).filter((field) => formState[field].touched);
  }, [formState]);

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    Object.entries(formState).forEach(([field, state]) => {
      if (state.touched && state.error) {
        errors[field] = state.error;
      }
    });
    return errors;
  }, [formState]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts).forEach((timeout) =>
        clearTimeout(timeout),
      );
    };
  }, [validationTimeouts]);

  return {
    // Form state
    formState,
    submissionState,

    // Computed values
    isFormValid,
    hasErrors,
    isValidating,
    touchedFields,
    fieldErrors,

    // Actions
    updateField,
    handleFieldBlur,
    validateAllFields,
    submitForm,
    resetForm,
    getFormData,
    getFieldProps,

    // Individual field helpers
    getFieldValue: (fieldName: string) => formState[fieldName]?.value,
    getFieldError: (fieldName: string) => formState[fieldName]?.error,
    isFieldValid: (fieldName: string) => formState[fieldName]?.valid || false,
    isFieldTouched: (fieldName: string) =>
      formState[fieldName]?.touched || false,
    isFieldValidating: (fieldName: string) =>
      formState[fieldName]?.validating || false,
  };
}

// Common validation rules
export const ValidationRules = {
  required: { required: true },

  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
      return null;
    },
  },

  phone: {
    required: true,
    pattern: /^[6-9]\d{9}$/,
    custom: (value: string) => {
      if (!value) return null;
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length !== 10 || !/^[6-9]/.test(cleaned)) {
        return "Please enter a valid 10-digit mobile number";
      }
      return null;
    },
  },

  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!value) return null;
      if (value.length < 8) return "Password must be at least 8 characters";
      if (!/(?=.*[a-z])/.test(value))
        return "Password must contain at least one lowercase letter";
      if (!/(?=.*[A-Z])/.test(value))
        return "Password must contain at least one uppercase letter";
      if (!/(?=.*\d)/.test(value))
        return "Password must contain at least one number";
      if (!/(?=.*[@$!%*?&])/.test(value))
        return "Password must contain at least one special character";
      return null;
    },
  },

  confirmPassword: (passwordField: string) => ({
    required: true,
    custom: (value: string, formData?: Record<string, unknown>) => {
      if (!value) return null;
      if (formData && value !== formData[passwordField]) {
        return "Passwords do not match";
      }
      return null;
    },
  }),

  url: {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      if (!value) return null;
      if (!/^https?:\/\/.+/.test(value)) {
        return "Please enter a valid URL starting with http:// or https://";
      }
      return null;
    },
  },

  year: {
    custom: (value: string | number) => {
      if (!value) return null;
      const year = typeof value === "string" ? parseInt(value) : value;
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        return `Please enter a valid year between 1800 and ${currentYear}`;
      }
      return null;
    },
  },
};
