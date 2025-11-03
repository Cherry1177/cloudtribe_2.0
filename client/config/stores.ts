/**
 * Store locations with hardcoded GPS coordinates
 * These coordinates are for the 4 main stores in the system
 */

export interface StoreLocation {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const STORE_LOCATIONS: Record<string, StoreLocation> = {
  "得正飲料店（政大側門）": {
    name: "得正飲料店（政大側門）",
    address: "116, Taipei City, Wenshan District, Section 2, Zhinan Rd, 65號1樓",
    coordinates: {
      lat: 24.9874,  // Approximate coordinates for Zhinan Rd Section 2, No. 65
      lng: 121.5706
    }
  },
  "金鮨": {
    name: "金鮨",
    address: "No. 205號, Section 2, Zhinan Rd, Wenshan District, Taipei City, 116",
    coordinates: {
      lat: 24.9905,  // Approximate coordinates for Zhinan Rd Section 2, No. 205
      lng: 121.5710
    }
  },
  "金鮨日式料理": {
    name: "金鮨日式料理",
    address: "No. 205號, Section 2, Zhinan Rd, Wenshan District, Taipei City, 116",
    coordinates: {
      lat: 24.9905,  // Same as 金鮨
      lng: 121.5710
    }
  },
  "喜記港式燒臘": {
    name: "喜記港式燒臘",
    address: "No. 131號, Section 2, Zhinan Rd, Wenshan District, Taipei City, 116",
    coordinates: {
      lat: 24.9885,  // Approximate coordinates for Zhinan Rd Section 2, No. 131
      lng: 121.5708
    }
  },
  "海南雞飯": {
    name: "海南雞飯",
    address: "No. 139號, Section 2, Zhinan Rd, Wenshan District, Taipei City, 116",
    coordinates: {
      lat: 24.9888,  // Approximate coordinates for Zhinan Rd Section 2, No. 139
      lng: 121.5709
    }
  }
};

/**
 * Get GPS coordinates for a store location name
 * @param storeName - The name of the store (e.g., "得正飲料店（政大側門）")
 * @returns The GPS coordinates or null if store not found
 */
export const getStoreCoordinates = (storeName: string): { lat: number; lng: number } | null => {
  const store = STORE_LOCATIONS[storeName];
  if (store) {
    return store.coordinates;
  }
  return null;
};

/**
 * Check if a location is one of our known stores
 * @param location - The location name to check
 * @returns True if it's a known store, false otherwise
 */
export const isKnownStore = (location: string): boolean => {
  return location in STORE_LOCATIONS;
};
