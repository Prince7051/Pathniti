import Link from "next/link";
import { Button } from "@/components/ui";
import { Home, Search } from "lucide-react";
import { DynamicHeader } from "@/components/DynamicHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <DynamicHeader showNavigation={false} showUserActions={false} />

      <div className="flex items-center justify-center px-4 pt-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
            <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-purple-600 mb-6">
              404
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              The page you&apos;re looking for seems to have wandered off the
              path. Don&apos;t worry, we&apos;ll help you get back on track!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-purple-600 hover:via-blue-600 hover:to-primary transition-all duration-500 hover:scale-105 shadow-xl hover:shadow-2xl group"
                asChild
              >
                <Link
                  href="/"
                  className="flex items-center gap-3 relative z-10"
                >
                  <Home className="h-5 w-5" />
                  <span className="font-semibold">Go Home</span>
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105"
                asChild
              >
                <Link href="/colleges" className="flex items-center gap-3">
                  <Search className="h-5 w-5" />
                  <span className="font-semibold">Explore Colleges</span>
                </Link>
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Or try these popular pages:
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link
                  href="/quiz"
                  className="text-primary hover:text-blue-700 transition-colors duration-200 hover:underline"
                >
                  Take Assessment
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/career-pathways"
                  className="text-primary hover:text-blue-700 transition-colors duration-200 hover:underline"
                >
                  Career Paths
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/timeline"
                  className="text-primary hover:text-blue-700 transition-colors duration-200 hover:underline"
                >
                  Timeline
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/scholarships"
                  className="text-primary hover:text-blue-700 transition-colors duration-200 hover:underline"
                >
                  Scholarships
                </Link>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
