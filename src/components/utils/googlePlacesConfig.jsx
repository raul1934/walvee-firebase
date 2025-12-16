/**
 * ⚠️ GOOGLE PLACES API - DISABLED ⚠️
 * 
 * Configuration for Google Places API usage across the app.
 * Currently: DISABLED - Using mock data only
 */

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";

/**
 * Feature flag - Google Places API
 * ⚠️ SET TO FALSE TO DISABLE API AND AVOID CHARGES
 */
const ENABLE_GOOGLE_PLACES = false;

/**
 * Configuration object - MUST BE EXPORTED
 */
export const GOOGLE_PLACES_CONFIG = {
  ENABLED: ENABLE_GOOGLE_PLACES,
  API_KEY: GOOGLE_MAPS_API_KEY,
  CACHE_ENABLED: true,
  CACHE_TTL: {
    PLACE_DETAILS: 3600000,      // 1 hour
    PLACE_SEARCH: 1800000,       // 30 minutes
    PLACE_PHOTOS: 7200000,       // 2 hours
    CITY_PLACES: 3600000,        // 1 hour
    TRIP_ENRICHMENT: 7200000,    // 2 hours
  },
  PRICING: {
    TEXT_SEARCH: 0.032,          // $32 per 1000 requests
    PLACE_DETAILS: 0.017,        // $17 per 1000 requests
    PLACE_PHOTOS: 0.007,         // $7 per 1000 requests
  }
};

/**
 * Stats tracking storage key
 */
const STATS_STORAGE_KEY = 'walvee_google_places_stats';

/**
 * Initialize or get stats from sessionStorage
 */
function getStatsObject() {
  try {
    const stored = sessionStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[Google Places Stats] Error reading from storage:', error);
  }
  
  return {
    callCount: 0,
    textSearchCount: 0,
    detailsCount: 0,
    photosCount: 0,
    estimatedCost: 0,
    lastReset: new Date().toISOString()
  };
}

/**
 * Save stats to sessionStorage
 */
function saveStatsObject(stats) {
  try {
    sessionStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('[Google Places Stats] Error saving to storage:', error);
  }
}

/**
 * Log a Google Places API call
 */
export function logGooglePlacesCall(type) {
  const stats = getStatsObject();
  
  stats.callCount++;
  
  switch(type) {
    case 'textSearch':
      stats.textSearchCount++;
      stats.estimatedCost += GOOGLE_PLACES_CONFIG.PRICING.TEXT_SEARCH;
      break;
    case 'details':
      stats.detailsCount++;
      stats.estimatedCost += GOOGLE_PLACES_CONFIG.PRICING.PLACE_DETAILS;
      break;
    case 'photo':
      stats.photosCount++;
      stats.estimatedCost += GOOGLE_PLACES_CONFIG.PRICING.PLACE_PHOTOS;
      break;
  }
  
  saveStatsObject(stats);
  
  console.log('[Google Places Stats] Call logged:', {
    type,
    totalCalls: stats.callCount,
    estimatedCost: stats.estimatedCost.toFixed(4)
  });
}

/**
 * Get current Google Places stats
 */
export function getGooglePlacesStats() {
  return getStatsObject();
}

/**
 * Reset Google Places stats
 */
export function resetGooglePlacesStats() {
  const freshStats = {
    callCount: 0,
    textSearchCount: 0,
    detailsCount: 0,
    photosCount: 0,
    estimatedCost: 0,
    lastReset: new Date().toISOString()
  };
  
  saveStatsObject(freshStats);
  console.log('[Google Places Stats] Stats reset');
  
  return freshStats;
}

/**
 * Check if Google Places API should be used
 */
export function shouldUseGooglePlaces() {
  console.log('[Google Places] API DISABLED - using mock data');
  return false;
}

/**
 * Get Google Places Service instance
 */
export function getGooglePlacesService() {
  console.log('[Google Places] API DISABLED - returning null');
  return null;
}

/**
 * Cache manager for Google Places API responses
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log('[Cache] HIT:', key);
    return cached.data;
  }

  set(key, data, ttl = 3600000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clear() {
    this.cache.clear();
    console.log('[Cache] Cleared');
  }

  size() {
    return this.cache.size;
  }
}

export const cache = new CacheManager();

/**
 * Cache configuration - DEPRECATED, use GOOGLE_PLACES_CONFIG.CACHE_TTL instead
 */
export const CACHE_CONFIG = GOOGLE_PLACES_CONFIG.CACHE_TTL;

/**
 * Fetch place details with caching and stats tracking
 * DISABLED - Returns mock data
 */
export async function fetchPlaceDetails(placeId, fields = []) {
  console.log('[Google Places] API DISABLED - returning null for place details');
  return null;
}

/**
 * Search places by text query with caching and stats tracking
 * DISABLED - Returns empty array
 */
export async function searchPlaces(query, options = {}) {
  console.log('[Google Places] API DISABLED - returning empty results');
  return [];
}

/**
 * Mock places data for development
 */
export function getMockPlaces(cityName) {
  console.log('[Google Places] Using MOCK data for:', cityName);
  
  return [
    {
      name: `Centro de ${cityName}`,
      address: `Centro, ${cityName}`,
      place_id: 'mock_1',
      rating: 4.5,
      user_ratings_total: 1250,
      price_level: 2,
      types: ['point_of_interest'],
      photos: [],
      photo: null,
      mentions: 0,
      source: 'mock'
    },
    {
      name: `Museu de ${cityName}`,
      address: `Av. Principal, ${cityName}`,
      place_id: 'mock_2',
      rating: 4.7,
      user_ratings_total: 890,
      price_level: 1,
      types: ['museum'],
      photos: [],
      photo: null,
      mentions: 0,
      source: 'mock'
    },
    {
      name: `Parque Central`,
      address: `Centro, ${cityName}`,
      place_id: 'mock_3',
      rating: 4.8,
      user_ratings_total: 2100,
      price_level: 0,
      types: ['park'],
      photos: [],
      photo: null,
      mentions: 0,
      source: 'mock'
    },
    {
      name: `Restaurante Típico`,
      address: `Rua Principal, ${cityName}`,
      place_id: 'mock_4',
      rating: 4.6,
      user_ratings_total: 567,
      price_level: 2,
      types: ['restaurant'],
      photos: [],
      photo: null,
      mentions: 0,
      source: 'mock'
    },
    {
      name: `Shopping Center`,
      address: `Av. Comercial, ${cityName}`,
      place_id: 'mock_5',
      rating: 4.3,
      user_ratings_total: 1890,
      price_level: 3,
      types: ['shopping_mall'],
      photos: [],
      photo: null,
      mentions: 0,
      source: 'mock'
    },
    {
      name: `Praia Principal`,
      address: `Orla, ${cityName}`,
      place_id: 'mock_6',
      rating: 4.9,
      user_ratings_total: 3200,
      price_level: 0,
      types: ['beach', 'natural_feature'],
      photos: [],
      photo: null,
      mentions: 0,
      source: 'mock'
    }
  ];
}