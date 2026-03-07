import { Metadata } from "next";
import { SarthiChat } from "@/components/SarthiChat";
import { DynamicHeader } from "@/components/DynamicHeader";
import { Bot } from "lucide-react";
import Link from "next/link";
import { PathNitiLogo } from "@/components/PathNitiLogo";

export const metadata: Metadata = {
  title: "Chat with AI Sarthi | PathNiti",
  description:
    "Get personalized education guidance from AI Sarthi - your intelligent education counselor.",
};

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DynamicHeader />

      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Chat with Sarthi</h1>
                <p className="text-purple-100 text-sm">
                  Your intelligent education counselor is here to help you make
                  informed decisions about your academic future.
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-purple-100">Available 24/7</div>
                <div className="text-xs text-purple-200">Powered by AI</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <SarthiChat className="h-full shadow-lg rounded-lg" />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <PathNitiLogo size="md" showText={true} variant="horizontal" />
              <p className="mt-4 text-gray-600 text-sm max-w-md">
                PathNiti is your comprehensive education platform providing
                AI-powered guidance, college recommendations, and career
                counseling to help students make informed decisions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Quick Links
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/comprehensive-assessment"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    AI Assessment
                  </Link>
                </li>
                <li>
                  <Link
                    href="/colleges"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    Find Colleges
                  </Link>
                </li>
                <li>
                  <Link
                    href="/scholarships"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    Scholarships
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career-pathways"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    Career Paths
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Support
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-600 hover:text-primary text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                © 2024 PathNiti. All rights reserved.
              </p>
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <span className="text-gray-500 text-sm">Powered by AI</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-500 text-sm">Sarthi Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
