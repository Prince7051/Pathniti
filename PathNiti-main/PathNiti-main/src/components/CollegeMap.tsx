"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui";
import { MapPin } from "lucide-react";

interface College {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  totalReviews?: number;
  image?: string;
  website?: string;
  phone?: string;
  email?: string;
  description?: string;
  courses?: string[];
  facilities?: string[];
  admissionInfo?: {
    requirements: string[];
    process: string[];
    deadlines: string[];
  };
  fees?: {
    tuition: number;
    accommodation: number;
    other: number;
  };
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  contact?: {
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  images?: Array<{
    url: string;
    alt: string;
    width: number;
    height: number;
  }>;
}

interface CollegeMapProps {
  colleges: College[];
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
  showInfoWindows?: boolean;
}

export default function CollegeMap({
  colleges,
  center,
  zoom = 13,
  height = "500px",
  showInfoWindows = true,
}: CollegeMapProps) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  // Temporarily disabled Google Maps - showing fallback
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-center rounded-lg" style={{ height }}>
          <div className="text-center max-w-md">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Map View</h3>
            <p className="text-gray-600 mb-6">
              Map functionality temporarily disabled for maintenance. 
              Showing college locations below.
            </p>
            
            {colleges.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Nearby Colleges:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {colleges.slice(0, 5).map((college) => (
                    <div 
                      key={college.id} 
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setSelectedCollege(college)}
                    >
                      <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{college.name}</p>
                        <p className="text-sm text-gray-600 truncate">{college.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCollege && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-2">{selectedCollege.name}</h5>
                <p className="text-sm text-blue-700 mb-2">{selectedCollege.address}</p>
                {selectedCollege.rating && (
                  <p className="text-sm text-blue-600">
                    Rating: {selectedCollege.rating}/5 ({selectedCollege.totalReviews || 0} reviews)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}