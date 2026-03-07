/**
 * Enhanced custom hook for form validation and state management
 * Provides real-time validation, error handling, and loading states
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FormValidator,
  FormValidationState,
} from "../lib/utils/form-validation";
import { ErrorRecoveryManager } from "../lib/utils/error-recovery";
import { signupSessionManager } from "../lib/services/signup-session";
import { CollegeSignupFormData } from "../lib/types/signup-session";

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  enableSessionRecovery?: boolean;
}

interface FormField {
  value: string;
  error?: string;
  warnings?: string[];
  touched: boolean;
  isValid: boolean;
}

interface FormState {
  [key: string]: FormField;
}

export function useFormValidation(
  initialData: Partial<CollegeSignupFormData> = {},
  options: UseFormValidationOptions = {},
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    enableSessionRecovery = true,
  } = options;

  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    const fields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "confirmPassword",
      "phone",
      "collegeId",
      "contactPerson",
      "designation",
    ];

    const initialState: FormState = {};
    fields.forEach((field) => {
      const fieldValue = (initialData as Record<string, unknown>)[field];
      initialState[field] = {
        value: typeof fieldValue === 'string' ? fieldValue : "",
        touched: false,
        isValid: true,
      };
    });

    return initialState;
  });

  const [validationState, setValidationState] =
    useState<FormValidationState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessionRecoveryAvailable, setSessionRecoveryAvailable] =
    useState(false);

  // Debounced validation
  const [validationTimeout, setValidationTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Check for session recovery on mount
  useEffect(() => {
    if (enableSessionRecovery) {
      const recovery = ErrorRecoveryManager.handleSessionRecovery();
      setSessionRecoveryAvailable(recovery.hasRecoverableSession);

      // Auto-restore session data if available
      const sessionData = signupSessionManager.getFormData();
      if (sessionData) {
        const fields = Object.keys(formState);
        const updatedState = { ...formState };

        fields.forEach((field) => {
          const sessionValue = (sessionData as unknown as Record<string, unknown>)[field];
          if (sessionValue && typeof sessionValue === 'string' && sessionValue.trim() !== "") {
            updatedState[field] = {
              ...updatedState[field],
              value: sessionValue,
            };
          }
        });

        setFormState(updatedState);
      }
    }
  }, [enableSessionRecovery, formState]);

  // Validate form with debouncing
  const validateForm = useCallback(
    (immediate = false) => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }

      const performValidation = () => {
        const formData = Object.keys(formState).reduce((acc, key) => {
          acc[key] = formState[key].value;
          return acc;
        }, {} as Record<string, unknown>);

        const validation = FormValidator.validateForm(formData);
        setValidationState(validation);

        // Update individual field validation states
        setFormState((prevState) => {
          const updatedState = { ...prevState };
          Object.keys(updatedState).forEach((field) => {
            const fieldValidation =
              validation[field as keyof FormValidationState];
            if (fieldValidation) {
              updatedState[field] = {
                ...updatedState[field],
                isValid: fieldValidation.isValid,
                error: fieldValidation.error,
                warnings: fieldValidation.warnings,
              };
            }
          });
          return updatedState;
        });
      };

      if (immediate) {
        performValidation();
      } else {
        const timeout = setTimeout(performValidation, debounceMs);
        setValidationTimeout(timeout);
      }
    },
    [formState, debounceMs, validationTimeout],
  );

  // Update field value
  const updateField = useCallback(
    (fieldName: string, value: string) => {
      setFormState((prevState) => ({
        ...prevState,
        [fieldName]: {
          ...prevState[fieldName],
          value,
          touched: true,
        },
      }));

      // Clear submit error when user starts typing
      if (submitError) {
        setSubmitError(null);
      }

      // Auto-save to session (excluding passwords)
      if (
        enableSessionRecovery &&
        fieldName !== "password" &&
        fieldName !== "confirmPassword"
      ) {
        const currentData = Object.keys(formState).reduce((acc, key) => {
          acc[key] = key === fieldName ? value : formState[key].value;
          return acc;
        }, {} as Record<string, unknown>);

        // Only save if there's meaningful data
        if (
          Object.values(currentData).some(
            (val) => val && val.toString().trim() !== "",
          )
        ) {
          signupSessionManager.saveFormData(currentData, "college-selection");
        }
      }

      // Validate on change if enabled
      if (validateOnChange) {
        validateForm();
      }
    },
    [
      validateOnChange,
      validateForm,
      submitError,
      enableSessionRecovery,
      formState,
    ],
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      setFormState((prevState) => ({
        ...prevState,
        [fieldName]: {
          ...prevState[fieldName],
          touched: true,
        },
      }));

      // Validate on blur if enabled
      if (validateOnBlur) {
        validateForm(true);
      }
    },
    [validateOnBlur, validateForm],
  );

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback(
    (fieldName: string) => {
      const field = formState[fieldName];
      return {
        value: field?.value || "",
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        ) => updateField(fieldName, e.target.value),
        onBlur: () => handleFieldBlur(fieldName),
        "aria-invalid": field?.touched && !field?.isValid,
        "aria-describedby": field?.error ? `${fieldName}-error` : undefined,
      };
    },
    [formState, updateField, handleFieldBlur],
  );

  // Get form data
  const getFormData = useCallback((): Partial<CollegeSignupFormData> => {
    return Object.keys(formState).reduce((acc, key) => {
      acc[key] = formState[key].value;
      return acc;
    }, {} as Record<string, unknown>);
  }, [formState]);

  // Validate entire form
  const validateAllFields = useCallback(() => {
    // Mark all fields as touched
    setFormState((prevState) => {
      const updatedState = { ...prevState };
      Object.keys(updatedState).forEach((field) => {
        updatedState[field] = {
          ...updatedState[field],
          touched: true,
        };
      });
      return updatedState;
    });

    // Perform immediate validation
    validateForm(true);

    return validationState?.overall.isValid || false;
  }, [validateForm, validationState]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (
      submitFunction: (data: Partial<CollegeSignupFormData>) => Promise<void>,
    ) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Validate all fields first
        const isValid = validateAllFields();

        if (!isValid) {
          throw new Error("Please fix all validation errors before submitting");
        }

        const formData = getFormData();
        await submitFunction(formData);

        // Clear session on successful submission
        if (enableSessionRecovery) {
          signupSessionManager.clearSession();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setSubmitError(errorMessage);

        // Handle error recovery
        const recovery = ErrorRecoveryManager.handleSubmissionError(
          error as Error,
          getFormData(),
        );

        // You could emit this recovery info to parent component
        console.log("Error recovery options:", recovery);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateAllFields, getFormData, enableSessionRecovery],
  );

  // Reset form
  const resetForm = useCallback(() => {
    const fields = Object.keys(formState);
    const resetState: FormState = {};

    fields.forEach((field) => {
      resetState[field] = {
        value: "",
        touched: false,
        isValid: true,
      };
    });

    setFormState(resetState);
    setValidationState(null);
    setSubmitError(null);

    if (enableSessionRecovery) {
      signupSessionManager.clearSession();
    }
  }, [formState, enableSessionRecovery]);

  // Restore from session
  const restoreFromSession = useCallback(() => {
    const sessionData = signupSessionManager.getFormData();
    if (sessionData) {
      const fields = Object.keys(formState);
      const updatedState = { ...formState };

      fields.forEach((field) => {
        const sessionValue = (sessionData as unknown as Record<string, unknown>)[field];
        if (sessionValue && typeof sessionValue === 'string' && sessionValue.trim() !== "") {
          updatedState[field] = {
            ...updatedState[field],
            value: sessionValue,
            touched: true,
          };
        }
      });

      setFormState(updatedState);
      validateForm(true);
    }
  }, [formState, validateForm]);

  // Computed values
  const isFormValid = useMemo(() => {
    return validationState?.overall.isValid || false;
  }, [validationState]);

  const hasErrors = useMemo(() => {
    return Object.values(formState).some(
      (field) => field.touched && field.error,
    );
  }, [formState]);

  const hasWarnings = useMemo(() => {
    return Object.values(formState).some(
      (field) => field.warnings && field.warnings.length > 0,
    );
  }, [formState]);

  const touchedFields = useMemo(() => {
    return Object.keys(formState).filter((field) => formState[field].touched);
  }, [formState]);

  return {
    // Form state
    formState,
    validationState,
    isSubmitting,
    submitError,
    sessionRecoveryAvailable,

    // Computed values
    isFormValid,
    hasErrors,
    hasWarnings,
    touchedFields,

    // Actions
    updateField,
    handleFieldBlur,
    getFieldProps,
    getFormData,
    validateAllFields,
    handleSubmit,
    resetForm,
    restoreFromSession,

    // Utilities
    validateForm: () => validateForm(true),
  };
}
