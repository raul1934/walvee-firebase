/**
 * Generate a stable, unique place instance ID
 * Used to identify a specific place occurrence in a trip itinerary
 * Even if the same place appears multiple times in different days
 */
export function generatePlaceInstanceId(tripId, dayIndex, placeIndex, googlePlaceId = null) {
  // Create a stable ID based on trip, day, and position
  const base = `${tripId}-d${dayIndex}-p${placeIndex}`;
  
  // If we have a Google Place ID, include a hash of it for extra uniqueness
  if (googlePlaceId) {
    const hash = simpleHash(googlePlaceId);
    return `${base}-g${hash}`;
  }
  
  return base;
}

/**
 * Parse place instance ID to extract components
 */
export function parsePlaceInstanceId(placeInstanceId) {
  const match = placeInstanceId.match(/^(.+)-d(\d+)-p(\d+)(?:-g(\w+))?$/);
  
  if (!match) return null;
  
  return {
    tripId: match[1],
    dayIndex: parseInt(match[2], 10),
    placeIndex: parseInt(match[3], 10),
    googlePlaceHash: match[4] || null
  };
}

/**
 * Simple hash function for Google Place IDs
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

/**
 * Find place in trip itinerary using multiple strategies
 */
export function findPlaceInTrip(trip, { day, placeId, gpid }) {
  if (!trip?.itinerary) return null;

  let targetDay = null;
  let targetPlaceIndex = null;
  let strategy = 'none';

  // Strategy 1: Use placeInstanceId (most reliable)
  if (placeId) {
    const parsed = parsePlaceInstanceId(placeId);
    if (parsed && parsed.tripId === trip.id) {
      const dayData = trip.itinerary[parsed.dayIndex];
      if (dayData?.places?.[parsed.placeIndex]) {
        targetDay = parsed.dayIndex;
        targetPlaceIndex = parsed.placeIndex;
        strategy = 'placeInstanceId';
      }
    }
  }

  // Strategy 2: Use day + gpid
  if (!targetDay && day && gpid) {
    const dayIndex = parseInt(day, 10) - 1; // Convert 1-based to 0-based
    const dayData = trip.itinerary[dayIndex];
    if (dayData?.places) {
      const placeIndex = dayData.places.findIndex(p => p.place_id === gpid);
      if (placeIndex !== -1) {
        targetDay = dayIndex;
        targetPlaceIndex = placeIndex;
        strategy = 'day+gpid';
      }
    }
  }

  // Strategy 3: Search all days for gpid
  if (!targetDay && gpid) {
    for (let dayIdx = 0; dayIdx < trip.itinerary.length; dayIdx++) {
      const dayData = trip.itinerary[dayIdx];
      if (dayData?.places) {
        const placeIndex = dayData.places.findIndex(p => p.place_id === gpid);
        if (placeIndex !== -1) {
          targetDay = dayIdx;
          targetPlaceIndex = placeIndex;
          strategy = 'gpid';
          break;
        }
      }
    }
  }

  // Strategy 4: Use day + placeIndex from placeId
  if (!targetDay && day && placeId) {
    const parsed = parsePlaceInstanceId(placeId);
    if (parsed) {
      const dayIndex = parseInt(day, 10) - 1;
      const dayData = trip.itinerary[dayIndex];
      if (dayData?.places?.[parsed.placeIndex]) {
        targetDay = dayIndex;
        targetPlaceIndex = parsed.placeIndex;
        strategy = 'day+placeIndex';
      }
    }
  }

  if (targetDay !== null && targetPlaceIndex !== null) {
    console.log('[PlaceNav] Place resolved:', {
      tripId: trip.id,
      day: day || (targetDay + 1),
      placeId,
      gpid,
      resolvedDay: targetDay,
      resolvedPlaceIndex: targetPlaceIndex,
      strategy
    });

    return {
      dayIndex: targetDay,
      placeIndex: targetPlaceIndex,
      place: trip.itinerary[targetDay].places[targetPlaceIndex],
      strategy
    };
  }

  console.warn('[PlaceNav] Place not found:', { tripId: trip.id, day, placeId, gpid });
  return null;
}