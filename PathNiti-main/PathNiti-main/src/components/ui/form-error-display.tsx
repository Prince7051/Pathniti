/**
 * Enhanced error display component for form validation
 * Provides comprehensive error messaging and recovery options
 */

import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "./button";
import { Alert, AlertDescription } from "./alert";

interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: "primary" | "secondary" | "danger";
  description?: string;
}

interface FormErrorDisplayProps {
  error?: string;
  warnings?: string[];
  recoveryActions?: RecoveryAction[];
  className?: string;
  showIcon?: boolean;
  variant?: "inline" | "card" | "toast";
}

export function FormErrorDisplay({
  error,
  warnings = [],
  recoveryActions = [],
  className = "",
  showIcon = true,
  variant = "inline",
}: FormErrorDisplayProps) {
  if (!error && warnings.length === 0) {
    return null;
  }

  const baseClasses = {
    inline: "text-sm",
    card: "p-4 rounded-lg border",
    toast: "p-3 rounded-md shadow-lg",
  };

  const errorClasses = {
    inline: "text-red-600 bg-red-50 border-red-200 p-3 rounded-md",
    card: "text-red-800 bg-red-50 border-red-200",
    toast: "text-red-800 bg-red-100 border-red-300",
  };

  const warningClasses = {
    inline: "text-amber-600 bg-amber-50 border-amber-200 p-3 rounded-md",
    card: "text-amber-800 bg-amber-50 border-amber-200",
    toast: "text-amber-800 bg-amber-100 border-amber-300",
  };

  if (error) {
    return (
      <div
        className={`${baseClasses[variant]} ${errorClasses[variant]} ${className}`}
      >
        <div className="flex items-start space-x-3">
          {showIcon && (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium mb-1">Error</p>
            <p className="text-sm mb-3">{error}</p>

            {recoveryActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-red-700 mb-2">
                  What you can do:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recoveryActions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={
                        action.type === "primary"
                          ? "default"
                          : action.type === "danger"
                            ? "destructive"
                            : "outline"
                      }
                      onClick={action.action}
                      className="text-xs"
                    >
                      {action.label}
                      {action.type === "secondary" &&
                        action.label.toLowerCase().includes("contact") && (
                          <ExternalLink className="h-3 w-3 ml-1" />
                        )}
                      {action.label.toLowerCase().includes("retry") && (
                        <RefreshCw className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>

                {recoveryActions.some((action) => action.description) && (
                  <div className="mt-3 space-y-1">
                    {recoveryActions
                      .filter((action) => action.description)
                      .map((action, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-xs text-red-600">
                            <span className="font-medium">{action.label}:</span>{" "}
                            {action.description}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (warnings.length > 0) {
    return (
      <div
        className={`${baseClasses[variant]} ${warningClasses[variant]} ${className}`}
      >
        <div className="flex items-start space-x-3">
          {showIcon && (
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium mb-1">
              {warnings.length === 1 ? "Notice" : "Notices"}
            </p>
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <p key={index} className="text-sm">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface FieldErrorProps {
  error?: string;
  warnings?: string[];
  fieldName: string;
  className?: string;
}

export function FieldError({
  error,
  warnings = [],
  fieldName,
  className = "",
}: FieldErrorProps) {
  if (!error && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`mt-1 ${className}`}>
      {error && (
        <p
          id={`${fieldName}-error`}
          className="text-sm text-red-600 flex items-center space-x-1"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, index) => (
            <p
              key={index}
              className="text-sm text-amber-600 flex items-center space-x-1"
            >
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

interface SessionRecoveryBannerProps {
  onRestore: () => void;
  onDismiss: () => void;
  sessionAge: number;
  className?: string;
}

export function SessionRecoveryBanner({
  onRestore,
  onDismiss,
  sessionAge,
  className = "",
}: SessionRecoveryBannerProps) {
  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium mb-1">Previous session found</p>
            <p className="text-sm">
              We found form data from {sessionAge} minutes ago. Would you like
              to continue where you left off?
            </p>
          </div>
          <div className="flex space-x-2 ml-4">
            <Button
              size="sm"
              onClick={onRestore}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Restore
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Start Fresh
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface ValidationSummaryProps {
  errors: string[];
  warnings: string[];
  className?: string;
}

export function ValidationSummary({
  errors,
  warnings,
  className = "",
}: ValidationSummaryProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p className="font-medium mb-2">
              Please fix the following{" "}
              {errors.length === 1 ? "error" : "errors"}:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <p className="font-medium mb-2">
              {warnings.length === 1 ? "Notice" : "Notices"}:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
