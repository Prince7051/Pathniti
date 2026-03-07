"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ChevronDown, Search, Building, Plus } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

interface Option {
  id: string;
  name: string;
  location?: {
    city: string;
    state: string;
  };
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  onRegisterNew?: () => void;
  registerNewText?: string;
  noResultsText?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  onSearch,
  searchQuery,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  loading = false,
  onRegisterNew,
  registerNewText = "Register New",
  noResultsText = "No results found",
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedOption = options.find((option) => option.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset focused index when options change
    setFocusedIndex(-1);
  }, [options]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => {
          const maxIndex = options.length + (onRegisterNew ? 0 : -1);
          return prev < maxIndex ? prev + 1 : 0;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => {
          const maxIndex = options.length + (onRegisterNew ? 0 : -1);
          return prev > 0 ? prev - 1 : maxIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].id);
          setIsOpen(false);
          setFocusedIndex(-1);
        } else if (focusedIndex === options.length && onRegisterNew) {
          onRegisterNew();
        }
        break;
      case "Tab":
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleOptionClick = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleRegisterNewClick = () => {
    if (onRegisterNew) {
      onRegisterNew();
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      const element = optionRefs.current[focusedIndex];
      if (element && typeof element.scrollIntoView === "function") {
        element.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [focusedIndex]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className="w-full p-2 text-left border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
          {selectedOption
            ? `${selectedOption.name}${selectedOption.location ? ` - ${selectedOption.location.city}, ${selectedOption.location.state}` : ""}`
            : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 text-sm"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto" role="listbox">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Loading...
              </div>
            ) : options.length > 0 ? (
              <>
                {options.map((option, index) => (
                  <div
                    key={option.id}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      focusedIndex === index ? "bg-blue-50 border-blue-200" : ""
                    } ${value === option.id ? "bg-blue-100 text-blue-900" : "text-gray-900"}`}
                    onClick={() => handleOptionClick(option.id)}
                    role="option"
                    aria-selected={value === option.id}
                  >
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {option.name}
                        </div>
                        {option.location && (
                          <div className="text-sm text-gray-500 truncate">
                            {option.location.city}, {option.location.state}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Register New Option */}
                {onRegisterNew && (
                  <div
                    ref={(el) => {
                      optionRefs.current[options.length] = el;
                    }}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-t border-gray-200 ${
                      focusedIndex === options.length
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                    onClick={handleRegisterNewClick}
                    role="option"
                    aria-selected="false"
                  >
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Plus className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{registerNewText}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No Results State */
              <div className="p-4 text-center">
                <Building className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">{noResultsText}</p>
                {onRegisterNew && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegisterNewClick}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {registerNewText}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
