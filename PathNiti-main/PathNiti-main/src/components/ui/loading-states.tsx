/**
 * Comprehensive loading states and user feedback components
 */

import React from "react";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Button } from "./button";
import { Progress } from "./progress";
import { Alert, AlertDescription } from "./alert";
import { Card } from "./card";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  text,
  children,
  className = "",
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" />
            {text && (
              <p className="text-sm text-gray-600 text-center">{text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProgressLoaderProps {
  progress: number;
  text?: string;
  subText?: string;
  className?: string;
}

export function ProgressLoader({
  progress,
  text,
  subText,
  className = "",
}: ProgressLoaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {text && <p className="text-sm font-medium text-gray-900">{text}</p>}
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{subText || "Loading..."}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

interface FileUploadProgressProps {
  files: Array<{
    name: string;
    progress: number;
    status: "uploading" | "completed" | "error";
    error?: string;
  }>;
  className?: string;
}

export function FileUploadProgress({
  files,
  className = "",
}: FileUploadProgressProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file, index) => (
        <div key={index} className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {file.status === "uploading" && (
                <Upload className="h-4 w-4 text-blue-500" />
              )}
              {file.status === "completed" && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {file.status === "error" && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium truncate">{file.name}</span>
            </div>
            <span className="text-xs text-gray-500">
              {file.status === "completed" && "Complete"}
              {file.status === "uploading" && `${Math.round(file.progress)}%`}
              {file.status === "error" && "Failed"}
            </span>
          </div>

          {file.status === "uploading" && (
            <Progress value={file.progress} className="w-full h-2" />
          )}

          {file.status === "error" && file.error && (
            <p className="text-xs text-red-600 mt-1">{file.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200";

  const variantClasses = {
    text: "rounded h-4",
    rectangular: "rounded",
    circular: "rounded-full",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className = "" }: CardSkeletonProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-5/6" />
          <Skeleton variant="text" className="w-4/6" />
        </div>
        <div className="flex space-x-2">
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={100} height={32} />
        </div>
      </div>
    </Card>
  );
}

interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({
  fields = 5,
  className = "",
}: FormSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" className="w-1/4 h-4" />
          <Skeleton variant="rectangular" className="w-full h-10" />
        </div>
      ))}
      <div className="flex space-x-3">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={80} height={40} />
      </div>
    </div>
  );
}

interface OperationStatusProps {
  status: "idle" | "loading" | "success" | "error";
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onRetry?: () => void;
  className?: string;
}

export function OperationStatus({
  status,
  loadingText = "Processing...",
  successText = "Operation completed successfully",
  errorText = "Operation failed",
  onRetry,
  className = "",
}: OperationStatusProps) {
  if (status === "idle") return null;

  return (
    <Alert
      className={`${className} ${
        status === "success"
          ? "border-green-200 bg-green-50"
          : status === "error"
            ? "border-red-200 bg-red-50"
            : "border-blue-200 bg-blue-50"
      }`}
    >
      {status === "loading" && (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      )}
      {status === "success" && (
        <CheckCircle className="h-4 w-4 text-green-600" />
      )}
      {status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}

      <AlertDescription
        className={
          status === "success"
            ? "text-green-800"
            : status === "error"
              ? "text-red-800"
              : "text-blue-800"
        }
      >
        <div className="flex items-center justify-between">
          <span>
            {status === "loading" && loadingText}
            {status === "success" && successText}
            {status === "error" && errorText}
          </span>

          {status === "error" && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="ml-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg";
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  disabled,
  className,
  variant = "default",
  size = "default",
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? loadingText || "Loading..." : children}
    </Button>
  );
}

interface DataLoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  className?: string;
}

export function DataLoadingState({
  isLoading,
  error,
  isEmpty = false,
  emptyMessage = "No data available",
  errorMessage,
  onRetry,
  children,
  skeleton,
  className = "",
}: DataLoadingStateProps) {
  if (isLoading) {
    return <div className={className}>{skeleton || <CardSkeleton />}</div>;
  }

  if (error) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>{errorMessage || error}</span>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="ml-3"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
