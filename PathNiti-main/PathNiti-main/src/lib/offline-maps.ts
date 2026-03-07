/**
 * Offline Maps Support for PathNiti
 * Provides offline map tiles caching and location-based services
 */

import { offlineStorage } from "./offline-storage";

export interface MapTile {
  x: number;
  y: number;
  z: number;
  data: ArrayBuffer;
  timestamp: number;
  size: number;
  last_accessed?: number;
}

export interface CachedLocation {
  id: string;
  name: string;
  type: "college" | "landmark" | "user_location";
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  metadata?: Record<string, unknown>;
  cached_at: string;
  last_accessed: string;
}

export interface OfflineMapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom_level: number;
}

export interface MapCacheStats {
  total_tiles: number;
  total_size: number;
  cached_locations: number;
  last_updated: string;
}

class OfflineMapsManager {
  private tileCache: Map<string, MapTile> = new Map();
  private locationCache: Map<string, CachedLocation> = new Map();
  private isOnline = typeof window !== "undefined" ? navigator.onLine : true;
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly TILE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly LOCATION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners();
      this.initializeCache();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.refreshMapData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private async initializeCache(): Promise<void> {
    try {
      await offlineStorage.initialize();
      await this.loadCachedTiles();
      await this.loadCachedLocations();
    } catch (error) {
      console.error("Failed to initialize offline maps:", error);
    }
  }

  private async loadCachedTiles(): Promise<void> {
    try {
      const cached = localStorage.getItem("map_tiles_cache");
      if (cached) {
        const tiles = JSON.parse(cached);
        Object.entries(tiles).forEach(([key, tile]) => {
          this.tileCache.set(key, tile as MapTile);
        });
      }
    } catch (error) {
      console.error("Failed to load cached tiles:", error);
    }
  }

  private async loadCachedLocations(): Promise<void> {
    try {
      const cached = localStorage.getItem("map_locations_cache");
      if (cached) {
        const locations = JSON.parse(cached);
        Object.entries(locations).forEach(([key, location]) => {
          this.locationCache.set(key, location as CachedLocation);
        });
      }
    } catch (error) {
      console.error("Failed to load cached locations:", error);
    }
  }

  private async saveCachedTiles(): Promise<void> {
    try {
      const tiles = Object.fromEntries(this.tileCache);
      localStorage.setItem("map_tiles_cache", JSON.stringify(tiles));
    } catch (error) {
      console.error("Failed to save cached tiles:", error);
    }
  }

  private async saveCachedLocations(): Promise<void> {
    try {
      const locations = Object.fromEntries(this.locationCache);
      localStorage.setItem("map_locations_cache", JSON.stringify(locations));
    } catch (error) {
      console.error("Failed to save cached locations:", error);
    }
  }

  public async getMapTile(
    x: number,
    y: number,
    z: number,
  ): Promise<MapTile | null> {
    const key = `${z}/${x}/${y}`;

    // Check cache first
    const cachedTile = this.tileCache.get(key);
    if (cachedTile && this.isTileValid(cachedTile)) {
      cachedTile.last_accessed = Date.now();
      return cachedTile;
    }

    // Try to fetch from network if online
    if (this.isOnline) {
      try {
        const tile = await this.fetchTileFromNetwork(x, y, z);
        if (tile) {
          await this.cacheTile(key, tile);
          return tile;
        }
      } catch (error) {
        console.error("Failed to fetch tile from network:", error);
      }
    }

    // Return cached tile even if expired (better than nothing)
    return cachedTile || null;
  }

  private async fetchTileFromNetwork(
    x: number,
    y: number,
    z: number,
  ): Promise<MapTile | null> {
    try {
      // Use OpenStreetMap tiles for offline caching
      const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.arrayBuffer();

      return {
        x,
        y,
        z,
        data,
        timestamp: Date.now(),
        size: data.byteLength,
      };
    } catch (error) {
      console.error("Failed to fetch tile:", error);
      return null;
    }
  }

  private async cacheTile(key: string, tile: MapTile): Promise<void> {
    // Check cache size and clean up if necessary
    await this.cleanupCache();

    this.tileCache.set(key, tile);
    await this.saveCachedTiles();
  }

  private isTileValid(tile: MapTile): boolean {
    return Date.now() - tile.timestamp < this.TILE_EXPIRY;
  }

  private async cleanupCache(): Promise<void> {
    const currentSize = this.getCacheSize();

    if (currentSize > this.MAX_CACHE_SIZE) {
      // Remove oldest tiles first
      const sortedTiles = Array.from(this.tileCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      );

      // Remove 25% of oldest tiles
      const tilesToRemove = Math.floor(sortedTiles.length * 0.25);

      for (let i = 0; i < tilesToRemove; i++) {
        const [key] = sortedTiles[i];
        this.tileCache.delete(key);
      }

      await this.saveCachedTiles();
    }
  }

  private getCacheSize(): number {
    return Array.from(this.tileCache.values()).reduce(
      (total, tile) => total + tile.size,
      0,
    );
  }

  public async cacheLocation(
    location: Omit<CachedLocation, "id" | "cached_at" | "last_accessed">,
  ): Promise<string> {
    const id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const cachedLocation: CachedLocation = {
      ...location,
      id,
      cached_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
    };

    this.locationCache.set(id, cachedLocation);
    await this.saveCachedLocations();

    return id;
  }

  public async getCachedLocations(
    bounds?: OfflineMapBounds,
    type?: string,
  ): Promise<CachedLocation[]> {
    let locations = Array.from(this.locationCache.values());

    // Filter by type
    if (type) {
      locations = locations.filter((loc) => loc.type === type);
    }

    // Filter by bounds
    if (bounds) {
      locations = locations.filter(
        (loc) =>
          loc.coordinates.lat >= bounds.south &&
          loc.coordinates.lat <= bounds.north &&
          loc.coordinates.lng >= bounds.west &&
          loc.coordinates.lng <= bounds.east,
      );
    }

    // Sort by last accessed (most recent first)
    locations.sort(
      (a, b) =>
        new Date(b.last_accessed).getTime() -
        new Date(a.last_accessed).getTime(),
    );

    return locations;
  }

  public async getNearbyColleges(
    userLocation: { lat: number; lng: number },
    radiusKm: number = 50,
  ): Promise<CachedLocation[]> {
    const colleges = await this.getCachedLocations(undefined, "college");

    return colleges
      .filter((college) => {
        const distance = this.calculateDistance(
          userLocation,
          college.coordinates,
        );
        return distance <= radiusKm;
      })
      .sort((a, b) => {
        const distanceA = this.calculateDistance(userLocation, a.coordinates);
        const distanceB = this.calculateDistance(userLocation, b.coordinates);
        return distanceA - distanceB;
      });
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public async preloadMapTiles(
    center: { lat: number; lng: number },
    zoom: number,
    radius: number = 2,
  ): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    const tiles = this.getTilesInBounds(center, zoom, radius);

    // Preload tiles in batches to avoid overwhelming the network
    const batchSize = 5;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);

      await Promise.all(batch.map(({ x, y, z }) => this.getMapTile(x, y, z)));

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private getTilesInBounds(
    center: { lat: number; lng: number },
    zoom: number,
    radius: number,
  ): Array<{ x: number; y: number; z: number }> {
    const tiles: Array<{ x: number; y: number; z: number }> = [];

    // Convert lat/lng to tile coordinates
    const centerTile = this.latLngToTile(center.lat, center.lng, zoom);

    // Get tiles in radius
    for (let x = centerTile.x - radius; x <= centerTile.x + radius; x++) {
      for (let y = centerTile.y - radius; y <= centerTile.y + radius; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
  }

  private latLngToTile(
    lat: number,
    lng: number,
    zoom: number,
  ): { x: number; y: number } {
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom),
    );
    return { x, y };
  }

  public async refreshMapData(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      // Refresh college locations from server
      await this.refreshCollegeLocations();

      // Clean up expired tiles
      await this.cleanupExpiredTiles();

      // Clean up expired locations
      await this.cleanupExpiredLocations();
    } catch (error) {
      console.error("Failed to refresh map data:", error);
    }
  }

  private async refreshCollegeLocations(): Promise<void> {
    try {
      // This would fetch college locations from your API
      // For now, we'll use cached data from offline storage
      const cachedColleges = await offlineStorage.getCachedColleges();

      for (const college of cachedColleges) {
        if (college.location?.coordinates) {
          await this.cacheLocation({
            name: college.name,
            type: "college",
            coordinates: college.location.coordinates,
            address: college.address,
            metadata: {
              college_id: college.id,
              type: college.type,
              programs: college.programs,
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh college locations:", error);
    }
  }

  private async cleanupExpiredTiles(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, tile] of this.tileCache.entries()) {
      if (now - tile.timestamp > this.TILE_EXPIRY) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.tileCache.delete(key));

    if (expiredKeys.length > 0) {
      await this.saveCachedTiles();
    }
  }

  private async cleanupExpiredLocations(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, location] of this.locationCache.entries()) {
      const lastAccessed = new Date(location.last_accessed).getTime();
      if (now - lastAccessed > this.LOCATION_EXPIRY) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.locationCache.delete(key));

    if (expiredKeys.length > 0) {
      await this.saveCachedLocations();
    }
  }

  public getCacheStats(): MapCacheStats {
    const totalSize = this.getCacheSize();
    const totalTiles = this.tileCache.size;
    const cachedLocations = this.locationCache.size;

    const lastUpdated = Array.from(this.tileCache.values()).reduce(
      (latest, tile) => Math.max(latest, tile.timestamp),
      0,
    );

    return {
      total_tiles: totalTiles,
      total_size: totalSize,
      cached_locations: cachedLocations,
      last_updated: new Date(lastUpdated).toISOString(),
    };
  }

  public async clearCache(): Promise<void> {
    this.tileCache.clear();
    this.locationCache.clear();

    await this.saveCachedTiles();
    await this.saveCachedLocations();
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public async exportCache(): Promise<{
    tiles: Record<string, MapTile>;
    locations: Record<string, CachedLocation>;
  }> {
    return {
      tiles: Object.fromEntries(this.tileCache),
      locations: Object.fromEntries(this.locationCache),
    };
  }

  public async importCache(data: {
    tiles: Record<string, MapTile>;
    locations: Record<string, CachedLocation>;
  }): Promise<void> {
    this.tileCache.clear();
    this.locationCache.clear();

    Object.entries(data.tiles).forEach(([key, tile]) => {
      this.tileCache.set(key, tile);
    });

    Object.entries(data.locations).forEach(([key, location]) => {
      this.locationCache.set(key, location);
    });

    await this.saveCachedTiles();
    await this.saveCachedLocations();
  }
}

// Export singleton instance
export const offlineMapsManager = new OfflineMapsManager();
