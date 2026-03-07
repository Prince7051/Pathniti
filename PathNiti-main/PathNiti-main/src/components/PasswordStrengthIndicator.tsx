import React from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className = "",
}: PasswordStrengthIndicatorProps) {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    Object.values(checks).forEach((check) => {
      if (check) score++;
    });

    return { score, checks };
  };

  const { score, checks } = getPasswordStrength(password);

  const getStrengthText = (score: number) => {
    if (score === 0) return { text: "", color: "" };
    if (score <= 2) return { text: "Weak", color: "text-red-600" };
    if (score <= 3) return { text: "Fair", color: "text-yellow-600" };
    if (score <= 4) return { text: "Good", color: "text-blue-600" };
    return { text: "Strong", color: "text-green-600" };
  };

  const getStrengthBarColor = (score: number) => {
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  if (!password) return null;

  const { text, color } = getStrengthText(score);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full ${
              level <= score ? getStrengthBarColor(score) : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Strength Text */}
      {text && (
        <p className={`text-sm font-medium ${color}`}>
          Password strength: {text}
        </p>
      )}

      {/* Requirements Checklist */}
      <div className="space-y-1">
        <div
          className={`text-xs flex items-center ${checks.length ? "text-green-600" : "text-gray-500"}`}
        >
          <span className="mr-2">{checks.length ? "✓" : "○"}</span>
          At least 8 characters
        </div>
        <div
          className={`text-xs flex items-center ${checks.lowercase ? "text-green-600" : "text-gray-500"}`}
        >
          <span className="mr-2">{checks.lowercase ? "✓" : "○"}</span>
          One lowercase letter
        </div>
        <div
          className={`text-xs flex items-center ${checks.uppercase ? "text-green-600" : "text-gray-500"}`}
        >
          <span className="mr-2">{checks.uppercase ? "✓" : "○"}</span>
          One uppercase letter
        </div>
        <div
          className={`text-xs flex items-center ${checks.number ? "text-green-600" : "text-gray-500"}`}
        >
          <span className="mr-2">{checks.number ? "✓" : "○"}</span>
          One number
        </div>
        <div
          className={`text-xs flex items-center ${checks.special ? "text-green-600" : "text-gray-500"}`}
        >
          <span className="mr-2">{checks.special ? "✓" : "○"}</span>
          One special character (@$!%*?&)
        </div>
      </div>
    </div>
  );
}
