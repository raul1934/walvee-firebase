/**
 * Extract city name without country from location string
 * Examples:
 * "São Paulo, Brazil" -> "São Paulo"
 * "New York, United States" -> "New York"
 */
export function getCityNameOnly(location) {
  if (!location) return '';
  
  // Split by comma and take first part (city name)
  const parts = location.split(',');
  return parts[0]?.trim() || location;
}

/**
 * Get formatted cities display from trip data
 * Returns array of city names without country
 */
export function getTripCities(trip) {
  if (!trip) return [];
  
  // If locations array exists and has items, use it
  if (trip.locations && Array.isArray(trip.locations) && trip.locations.length > 0) {
    return trip.locations.map(loc => getCityNameOnly(loc));
  }
  
  // Fallback to destination
  if (trip.destination) {
    return [getCityNameOnly(trip.destination)];
  }
  
  return ['Unknown destination'];
}