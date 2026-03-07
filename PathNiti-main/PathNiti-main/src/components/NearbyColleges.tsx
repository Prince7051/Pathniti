"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { LocationService, Location, LocationError } from "@/lib/location";
import CollegeMap from "./CollegeMap";
import {
  MapPin,
  Search,
  Navigation,
  Star,
  Users,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface College {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  user_ratings_total: number;
  place_id: string;
  types: string[];
  business_status?: string;
  price_level?: number;
  photos: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

interface NearbyCollegesProps {
  className?: string;
}

export default function NearbyColleges({
  className = "",
}: NearbyCollegesProps) {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  const fetchNearbyColleges = useCallback(
    async (lat: number, lng: number, pageToken?: string) => {
      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          radius: "10000", // 10km radius
        });

        if (pageToken) {
          params.append("page_token", pageToken);
        }

        const response = await fetch(`/api/colleges/nearby?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch nearby colleges");
        }

        const data = await response.json();

        // Check if this is fallback data
        if (data.fallback) {
          console.log(
            "Using fallback data - Google Maps API key issue detected",
          );
          setIsFallbackData(true);
          setApiWarning(data.warning);
        } else {
          setIsFallbackData(false);
          setApiWarning(null);
        }

        return data;
      } catch (error) {
        console.error("Error fetching nearby colleges:", error);
        throw error;
      }
    },
    [],
  );

  const handleGetCurrentLocation = useCallback(async () => {
    setLoading(true);
    setLocationError(null);
    setColleges([]);

    try {
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);

      const data = await fetchNearbyColleges(
        currentLocation.lat,
        currentLocation.lng,
      );
      setColleges(data.colleges || []);
      setNextPageToken(data.next_page_token || null);
    } catch (error) {
      const locationError = error as LocationError;
      setLocationError(locationError.message);
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  }, [fetchNearbyColleges]);

  const handleManualLocationSearch = useCallback(async () => {
    if (!manualAddress.trim()) return;

    setLoading(true);
    setLocationError(null);
    setColleges([]);

    try {
      const location =
        await LocationService.getLocationFromAddress(manualAddress);
      setLocation(location);

      const data = await fetchNearbyColleges(location.lat, location.lng);
      setColleges(data.colleges || []);
      setNextPageToken(data.next_page_token || null);
      setShowManualInput(false);
    } catch {
      setLocationError("Address not found. Please try a different address.");
    } finally {
      setLoading(false);
    }
  }, [manualAddress, fetchNearbyColleges]);

  const handleLoadMore = useCallback(async () => {
    if (!nextPageToken || !location) return;

    setLoadingMore(true);
    try {
      const data = await fetchNearbyColleges(
        location.lat,
        location.lng,
        nextPageToken,
      );
      setColleges((prev) => [...prev, ...(data.colleges || [])]);
      setNextPageToken(data.next_page_token || null);
    } catch (error) {
      console.error("Error loading more colleges:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageToken, location, fetchNearbyColleges]);

  const getGoogleMapsUrl = (placeId: string) => {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  };

  const getPhotoUrl = (photoReference: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_API_KEY;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Find Nearby Colleges
        </h2>
        <p className="text-gray-600">
          Discover universities and colleges near your location
        </p>
      </div>

      {/* Location Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {!showManualInput ? (
              <div className="text-center space-y-4">
                <Button
                  onClick={handleGetCurrentLocation}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Getting Location..." : "Use Current Location"}
                </Button>

                <div className="text-sm text-gray-500">or</div>

                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  className="w-full sm:w-auto"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Enter Address Manually
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter city, address, or landmark..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleManualLocationSearch()
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={handleManualLocationSearch}
                    disabled={loading || !manualAddress.trim()}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowManualInput(false);
                    setManualAddress("");
                    setLocationError(null);
                  }}
                  className="w-full"
                >
                  Back to Current Location
                </Button>
              </div>
            )}

            {locationError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{locationError}</span>
              </div>
            )}

            {location && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    Location:{" "}
                    {location.address ||
                      `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                  </span>
                </div>
                {isFallbackData && apiWarning && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <div className="text-sm">
                      <p className="font-medium">API Configuration Issue</p>
                      <p className="text-xs mt-1">{apiWarning}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {colleges.length > 0 && (
        <>
          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Map View
              </CardTitle>
              <CardDescription>
                {colleges.length} colleges found near your location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollegeMap
                colleges={colleges}
                center={
                  location
                    ? { lat: location.lat, lng: location.lng }
                    : undefined
                }
                height="400px"
              />
            </CardContent>
          </Card>

          {/* College List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Nearby Colleges ({colleges.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {colleges.map((college) => (
                  <div
                    key={college.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {college.name}
                        </h3>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{college.address}</span>
                        </div>

                        {college.rating > 0 && (
                          <div className="flex items-center text-sm mb-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium">
                              {college.rating.toFixed(1)}
                            </span>
                            {college.user_ratings_total > 0 && (
                              <span className="text-gray-500 ml-1">
                                ({college.user_ratings_total} reviews)
                              </span>
                            )}
                          </div>
                        )}

                        {college.photos.length > 0 && (
                          <div className="mt-2">
                            <Image
                              src={getPhotoUrl(
                                college.photos[0].photo_reference,
                              )}
                              alt={college.name}
                              width={300}
                              height={128}
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={getGoogleMapsUrl(college.place_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {nextPageToken && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      variant="outline"
                    >
                      {loadingMore ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {loadingMore ? "Loading..." : "Load More Colleges"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {colleges.length === 0 && !loading && location && (
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No colleges found
            </h3>
            <p className="text-gray-600">
              No universities or colleges were found near your location. Try
              expanding your search area or using a different location.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
