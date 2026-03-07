export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

export class LocationService {
  /**
   * Get user's current location using browser Geolocation API
   */
  static async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        reject({
          code: 0,
          message: "Geolocation is not supported by this browser.",
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          const errorMessage = this.getGeolocationErrorMessage(error.code);
          reject({
            code: error.code,
            message: errorMessage,
          });
        },
        options,
      );
    });
  }

  /**
   * Get location from address using Google Geocoding API
   */
  static async getLocationFromAddress(address: string): Promise<Location> {
    const apiKey = process.env.GOOGLE_MAPS_BACKEND_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps backend API key not configured");
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK" || !data.results.length) {
        throw new Error("Address not found");
      }

      const result = data.results[0];
      const location = result.geometry.location;

      return {
        lat: location.lat,
        lng: location.lng,
        address: result.formatted_address,
      };
    } catch {
      throw new Error("Failed to geocode address");
    }
  }

  /**
   * Get human-readable address from coordinates using reverse geocoding
   */
  static async getAddressFromLocation(
    lat: number,
    lng: number,
  ): Promise<string> {
    const apiKey = process.env.GOOGLE_MAPS_BACKEND_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps backend API key not configured");
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK" || !data.results.length) {
        throw new Error("Location not found");
      }

      return data.results[0].formatted_address;
    } catch {
      throw new Error("Failed to reverse geocode location");
    }
  }

  /**
   * Calculate distance between two points in kilometers
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get user-friendly error message for geolocation errors
   */
  private static getGeolocationErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return "Permission denied. Please allow location access to find nearby colleges.";
      case 2:
        return "Location unavailable. Please check your internet connection and try again.";
      case 3:
        return "Location request timed out. Please try again.";
      default:
        return "An unknown error occurred while getting your location.";
    }
  }

  /**
   * Check if geolocation is supported
   */
  static isGeolocationSupported(): boolean {
    return typeof window !== "undefined" && "geolocation" in navigator;
  }

  /**
   * Get location from browser's stored location or prompt user
   */
  static async getLocationWithFallback(): Promise<Location> {
    try {
      // Try to get current location first
      return await this.getCurrentLocation();
    } catch (error) {
      // If geolocation fails, we'll need to prompt user for manual input
      throw error;
    }
  }
}
