/**
 * Single Source of Truth for Trip Data Selection
 * Ensures consistent ordering and structure across Home and Trip Detail views
 */

/**
 * Normalize and order places for a specific day
 * @param {Array} places - Raw places array from API
 * @param {number} dayIndex - 0-based day index
 * @param {string} tripId - Trip ID for generating place instance IDs
 * @returns {Array} Normalized and ordered places
 */
export function normalizeDayPlaces(places, dayIndex, tripId) {
  if (!places || !Array.isArray(places)) {
    console.warn('[TripDataSelector] Invalid places array:', { dayIndex, tripId });
    return [];
  }

  return places
    .map((place, placeIndex) => {
      if (!place.name) {
        console.error('[TripDataSelector] Place missing name:', { tripId, dayIndex, placeIndex });
        return null;
      }

      const placeInstanceId = place.placeInstanceId || 
        generatePlaceInstanceId(tripId, dayIndex, placeIndex, place.place_id);

      return {
        ...place,
        placeInstanceId,
        order: place.order !== undefined ? place.order : placeIndex,
        dayIndex,
        tripId
      };
    })
    .filter(place => place !== null)
    .sort(comparePlaces);
}

function comparePlaces(a, b) {
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  return a.placeInstanceId.localeCompare(b.placeInstanceId);
}

function generatePlaceInstanceId(tripId, dayIndex, placeIndex, googlePlaceId = null) {
  const base = `${tripId}-d${dayIndex}-p${placeIndex}`;
  if (googlePlaceId) {
    const hash = simpleHash(googlePlaceId);
    return `${base}-g${hash}`;
  }
  return base;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

export function selectTripDayPlaces({ trip, dayIndex }) {
  if (!trip?.itinerary || !trip.itinerary[dayIndex]) {
    console.warn('[TripDataSelector] Invalid trip or day:', { tripId: trip?.id, dayIndex });
    return [];
  }

  const day = trip.itinerary[dayIndex];
  return normalizeDayPlaces(day.places, dayIndex, trip.id);
}

export function normalizeTripItinerary(trip) {
  if (!trip?.itinerary) {
    console.warn('[TripDataSelector] Trip has no itinerary:', { tripId: trip?.id });
    return trip;
  }

  return {
    ...trip,
    itinerary: trip.itinerary.map((day, dayIndex) => ({
      ...day,
      places: normalizeDayPlaces(day.places, dayIndex, trip.id)
    }))
  };
}

export function auditPlaceConsistency(homePlaces, detailPlaces, context = {}) {
  const homeIds = homePlaces.map(p => p.placeInstanceId);
  const detailIds = detailPlaces.map(p => p.placeInstanceId);
  
  const mismatch = JSON.stringify(homeIds) !== JSON.stringify(detailIds);
  
  const missingInHome = detailIds.filter(id => !homeIds.includes(id));
  const missingInDetail = homeIds.filter(id => !detailIds.includes(id));
  const extraInHome = homeIds.filter(id => !detailIds.includes(id));
  const extraInDetail = detailIds.filter(id => !homeIds.includes(id));
  
  const result = {
    ...context,
    homeOrder: homeIds,
    detailOrder: detailIds,
    mismatch,
    missingInHome,
    missingInDetail,
    extraInHome,
    extraInDetail,
    consistent: !mismatch
  };
  
  if (mismatch) {
    console.error('[TripDataAudit] Consistency check failed:', result);
  } else {
    console.log('[TripDataAudit] Consistency check passed:', context);
  }
  
  return result;
}