import Link from "next/link";
import { Button } from "@/components/ui";
import { ArrowLeft, Search, AlertTriangle } from "lucide-react";

export default function CollegeNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          College Not Found
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          The college profile you&apos;re looking for doesn&apos;t exist or may
          have been moved. Please check the URL or browse our college directory.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/colleges" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Colleges
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link
              href="/colleges?tab=directory"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search Colleges
            </Link>
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Use our search feature to find colleges by
            name, location, or type.
          </p>
        </div>
      </div>
    </div>
  );
}
