import React from "react";

interface PathNitiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "horizontal" | "vertical";
}

export function PathNitiLogo({
  className = "",
  size = "md",
  showText = true,
  variant = "horizontal",
}: PathNitiLogoProps) {
  const sizeClasses = {
    sm: { text: "text-sm" },
    md: { text: "text-lg" },
    lg: { text: "text-xl" },
    xl: { text: "text-2xl" },
  };

  const currentSize = sizeClasses[size];

  if (variant === "horizontal") {
    return (
      <div className={`flex items-center ${className}`}>
        {/* Text Only Logo */}
        {showText && (
          <div className={`${currentSize.text} leading-none`}>
            <span className="font-bold text-[#1A237E] tracking-tight">
              Path
            </span>
            <span className="font-normal text-[#546E7A]">Niti</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Text Only Logo */}
      {showText && (
        <div className={`${currentSize.text} leading-none`}>
          <span className="font-bold text-[#1A237E] tracking-tight">Path</span>
          <span className="font-normal text-[#546E7A]">Niti</span>
        </div>
      )}
    </div>
  );
}

// Alternative version with more detailed graduation cap
export function PathNitiLogoDetailed({
  className = "",
  size = "md",
  showText = true,
}: PathNitiLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Emblem */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Teal Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#50C8C8"
            strokeWidth="4"
          />

          {/* Graduation Cap and Person Silhouette */}
          <g fill="#1A2B8C">
            {/* Graduation Cap (more detailed) */}
            <path d="M22 32 L38 28 L42 35 L38 42 L22 38 Z" />
            {/* Cap top */}
            <path d="M22 32 L30 30 L38 28 L30 26 Z" />
            {/* Tassel */}
            <line
              x1="30"
              y1="26"
              x2="28"
              y2="20"
              stroke="#1A2B8C"
              strokeWidth="1.5"
            />
            <circle cx="28" cy="20" r="1.5" fill="#1A2B8C" />

            {/* Person's Head */}
            <circle cx="50" cy="45" r="8" />

            {/* Person's Body (Graduation Gown) */}
            <path d="M42 53 L58 53 L56 75 L44 75 Z" />

            {/* Gown Details (vertical pleats) */}
            <line
              x1="45"
              y1="55"
              x2="45"
              y2="73"
              stroke="#1A2B8C"
              strokeWidth="0.8"
            />
            <line
              x1="48"
              y1="55"
              x2="48"
              y2="73"
              stroke="#1A2B8C"
              strokeWidth="0.8"
            />
            <line
              x1="51"
              y1="55"
              x2="51"
              y2="73"
              stroke="#1A2B8C"
              strokeWidth="0.8"
            />
            <line
              x1="54"
              y1="55"
              x2="54"
              y2="73"
              stroke="#1A2B8C"
              strokeWidth="0.8"
            />
            <line
              x1="57"
              y1="55"
              x2="57"
              y2="73"
              stroke="#1A2B8C"
              strokeWidth="0.8"
            />
          </g>

          {/* Stars around the person */}
          <g fill="#50C8C8">
            {/* Small star to the left of head */}
            <g transform="translate(28, 40)">
              <path d="M0,-2.5 L0.8,-0.8 L2.5,-0.8 L1.2,0.8 L1.5,2.5 L0,1.7 L-1.5,2.5 L-1.2,0.8 L-2.5,-0.8 L-0.8,-0.8 Z" />
            </g>

            {/* Small star below chin */}
            <g transform="translate(50, 58)">
              <path d="M0,-2 L0.7,-0.7 L2,-0.7 L1,0.7 L1.3,2 L0,1.3 L-1.3,2 L-1,0.7 L-2,-0.7 L-0.7,-0.7 Z" />
            </g>

            {/* Large star to the right of head */}
            <g transform="translate(72, 35)">
              <path d="M0,-4 L1.5,-1.5 L4,-1.5 L2,1 L2.5,4 L0,2.5 L-2.5,4 L-2,1 L-4,-1.5 L-1.5,-1.5 Z" />
            </g>

            {/* Medium star below large star */}
            <g transform="translate(67, 55)">
              <path d="M0,-3 L1,-1 L3,-1 L1.5,1 L2,3 L0,2 L-2,3 L-1.5,1 L-3,-1 L-1,-1 Z" />
            </g>

            {/* Small star further down */}
            <g transform="translate(62, 70)">
              <path d="M0,-2 L0.7,-0.7 L2,-0.7 L1,0.7 L1.3,2 L0,1.3 L-1.3,2 L-1,0.7 L-2,-0.7 L-0.7,-0.7 Z" />
            </g>
          </g>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div
          className={`${textSizeClasses[size]} font-bold text-[#1A2B8C] mt-2`}
        >
          PathNiti
        </div>
      )}
    </div>
  );
}

export default PathNitiLogo;
