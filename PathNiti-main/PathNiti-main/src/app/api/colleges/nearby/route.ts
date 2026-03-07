import { NextRequest, NextResponse } from "next/server";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

// Fallback data for when Google Maps API is not working
function getFallbackColleges(lat: number, lng: number) {
  // Determine region based on coordinates
  const isPunjab = lat >= 29.5 && lat <= 32.0 && lng >= 73.0 && lng <= 77.0;
  const isDelhi = lat >= 28.0 && lat <= 29.0 && lng >= 76.0 && lng <= 77.5;
  const isMumbai = lat >= 18.0 && lat <= 20.0 && lng >= 72.0 && lng <= 73.5;
  const isKolkata = lat >= 22.0 && lat <= 23.0 && lng >= 88.0 && lng <= 89.0;
  const isChennai = lat >= 12.5 && lat <= 13.5 && lng >= 80.0 && lng <= 80.5;
  const isBangalore = lat >= 12.5 && lat <= 13.5 && lng >= 77.0 && lng <= 78.0;

  if (isPunjab) {
    return [
      {
        id: "fallback_punjab_1",
        name: "Punjab University",
        address: "Punjab University, Chandigarh",
        lat: lat + 0.01,
        lng: lng + 0.01,
        rating: 4.3,
        user_ratings_total: 1500,
        place_id: "fallback_punjab_1",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_punjab_2",
        name: "Guru Nanak Dev University",
        address: "GNDU, Amritsar, Punjab",
        lat: lat - 0.015,
        lng: lng + 0.02,
        rating: 4.1,
        user_ratings_total: 1200,
        place_id: "fallback_punjab_2",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_punjab_3",
        name: "Punjab Agricultural University",
        address: "PAU, Ludhiana, Punjab",
        lat: lat + 0.02,
        lng: lng - 0.01,
        rating: 4.4,
        user_ratings_total: 980,
        place_id: "fallback_punjab_3",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_punjab_4",
        name: "Thapar Institute of Engineering",
        address: "TIET, Patiala, Punjab",
        lat: lat - 0.01,
        lng: lng - 0.02,
        rating: 4.6,
        user_ratings_total: 2100,
        place_id: "fallback_punjab_4",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
    ];
  } else if (isDelhi) {
    return [
      {
        id: "fallback_delhi_1",
        name: "Delhi University",
        address: "University of Delhi, Delhi",
        lat: lat + 0.01,
        lng: lng + 0.01,
        rating: 4.2,
        user_ratings_total: 1200,
        place_id: "fallback_delhi_1",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_delhi_2",
        name: "Jawaharlal Nehru University",
        address: "JNU, New Delhi",
        lat: lat - 0.015,
        lng: lng + 0.02,
        rating: 4.5,
        user_ratings_total: 890,
        place_id: "fallback_delhi_2",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_delhi_3",
        name: "Indian Institute of Technology Delhi",
        address: "IIT Delhi, Hauz Khas",
        lat: lat + 0.02,
        lng: lng - 0.01,
        rating: 4.8,
        user_ratings_total: 2100,
        place_id: "fallback_delhi_3",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
    ];
  } else if (isMumbai) {
    return [
      {
        id: "fallback_mumbai_1",
        name: "University of Mumbai",
        address: "University of Mumbai, Mumbai",
        lat: lat + 0.01,
        lng: lng + 0.01,
        rating: 4.1,
        user_ratings_total: 1800,
        place_id: "fallback_mumbai_1",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_mumbai_2",
        name: "Indian Institute of Technology Bombay",
        address: "IIT Bombay, Powai",
        lat: lat - 0.015,
        lng: lng + 0.02,
        rating: 4.7,
        user_ratings_total: 2500,
        place_id: "fallback_mumbai_2",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
    ];
  } else if (isKolkata) {
    return [
      {
        id: "fallback_kolkata_1",
        name: "University of Calcutta",
        address: "University of Calcutta, Kolkata",
        lat: lat + 0.01,
        lng: lng + 0.01,
        rating: 4.0,
        user_ratings_total: 1600,
        place_id: "fallback_kolkata_1",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_kolkata_2",
        name: "Indian Institute of Technology Kharagpur",
        address: "IIT Kharagpur, West Bengal",
        lat: lat - 0.015,
        lng: lng + 0.02,
        rating: 4.6,
        user_ratings_total: 2200,
        place_id: "fallback_kolkata_2",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
    ];
  } else if (isChennai) {
    return [
      {
        id: "fallback_chennai_1",
        name: "Anna University",
        address: "Anna University, Chennai",
        lat: lat + 0.01,
        lng: lng + 0.01,
        rating: 4.2,
        user_ratings_total: 1400,
        place_id: "fallback_chennai_1",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_chennai_2",
        name: "Indian Institute of Technology Madras",
        address: "IIT Madras, Chennai",
        lat: lat - 0.015,
        lng: lng + 0.02,
        rating: 4.8,
        user_ratings_total: 2300,
        place_id: "fallback_chennai_2",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
    ];
  } else if (isBangalore) {
    return [
      {
        id: "fallback_bangalore_1",
        name: "Bangalore University",
        address: "Bangalore University, Bangalore",
        lat: lat + 0.01,
        lng: lng + 0.01,
        rating: 4.1,
        user_ratings_total: 1300,
        place_id: "fallback_bangalore_1",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_bangalore_2",
        name: "Indian Institute of Science",
        address: "IISc Bangalore, Bangalore",
        lat: lat - 0.015,
        lng: lng + 0.02,
        rating: 4.9,
        user_ratings_total: 2800,
        place_id: "fallback_bangalore_2",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
    ];
  } else {
    // Default fallback for other locations
    return [
      {
        id: "fallback_generic_1",
        name: "Local University",
        address: "University in your area",
        lat: lat + 0.01,
        lng: lng + 0.01,
        rating: 4.0,
        user_ratings_total: 500,
        place_id: "fallback_generic_1",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
      {
        id: "fallback_generic_2",
        name: "Regional College",
        address: "College in your region",
        lat: lat - 0.015,
        lng: lng + 0.02,
        rating: 3.8,
        user_ratings_total: 300,
        place_id: "fallback_generic_2",
        types: ["university", "establishment"],
        business_status: "OPERATIONAL",
        price_level: 1,
        photos: [],
      },
    ];
  }
}

interface GoogleMapsPlace {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  business_status?: string;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

interface GoogleMapsResponse {
  results: GoogleMapsPlace[];
  status: string;
  next_page_token?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") || "5000";
    const pageToken = searchParams.get("page_token");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_BACKEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps backend API key not configured" },
        { status: 500 },
      );
    }

    // Build the Google Maps API URL
    let apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=university&key=${apiKey}`;

    if (pageToken) {
      apiUrl += `&pagetoken=${pageToken}`;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`Google Maps API HTTP error: ${response.status}`);
      throw new Error(`Google Maps API HTTP error: ${response.status}`);
    }

    const data: GoogleMapsResponse = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`Google Maps API error: ${data.status}`);

      // Provide more specific error messages
      let errorMessage = `Google Maps API error: ${data.status}`;
      if (data.status === "REQUEST_DENIED") {
        errorMessage =
          "Google Maps API key is invalid or APIs are not enabled. Please check your API key and ensure Places API, Maps JavaScript API, and Geocoding API are enabled.";
      } else if (data.status === "OVER_QUERY_LIMIT") {
        errorMessage =
          "Google Maps API quota exceeded. Please check your billing and usage limits.";
      } else if (data.status === "INVALID_REQUEST") {
        errorMessage =
          "Invalid request to Google Maps API. Please check the request parameters.";
      }

      // For REQUEST_DENIED, return fallback data with a warning
      if (data.status === "REQUEST_DENIED") {
        console.log(
          "Google Maps API key issue detected, returning fallback data",
        );
        return NextResponse.json({
          colleges: getFallbackColleges(parseFloat(lat), parseFloat(lng)),
          next_page_token: null,
          status: "OK",
          fallback: true,
          warning: errorMessage,
        });
      }

      return NextResponse.json(
        { error: errorMessage, status: data.status },
        { status: 400 },
      );
    }

    // Transform the data to match our expected format
    const colleges = data.results.map((place: GoogleMapsPlace) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
      place_id: place.place_id,
      types: place.types,
      business_status: place.business_status,
      price_level: place.price_level,
      photos: place.photos || [],
    }));

    return NextResponse.json({
      colleges,
      next_page_token: data.next_page_token,
      status: data.status,
    });
  } catch (error) {
    console.error("Error fetching nearby colleges:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby colleges" },
      { status: 500 },
    );
  }
}
