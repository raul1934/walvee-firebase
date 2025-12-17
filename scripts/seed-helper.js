/**
 * Helper functions to convert old trip format to new format
 */

/**
 * Extract duration number from string like "7 days"
 */
export function parseDurationDays(durationString) {
  const match = durationString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Extract location names from itinerary
 */
export function extractLocations(itinerary) {
  const locations = new Set();

  itinerary.forEach(day => {
    if (day.places) {
      day.places.forEach(place => {
        if (place.location) {
          locations.add(place.location);
        }
        if (place.address) {
          // Extract city name from address
          const parts = place.address.split(',');
          if (parts.length > 0) {
            locations.add(parts[0].trim());
          }
        }
      });
    }
  });

  return Array.from(locations);
}

/**
 * Convert activity to place object
 */
export function activityToPlace(activity, order = 0) {
  return {
    name: activity.name || 'Unnamed Place',
    place_id: `ChIJ_generated_${Date.now()}_${order}`,
    address: activity.location || activity.address || '',
    rating: activity.rating || 0,
    price_level: activity.price_level || 0,
    types: activity.types || ['point_of_interest'],
    photos: activity.photos || [],
    photo: activity.photo || activity.photos?.[0] || null,
    order: order,
    description: activity.description || ''
  };
}

/**
 * Convert old trip format to new format
 */
export function convertTripToNewFormat(oldTrip, userId, userEmail = 'walvee@walvee.com', userName = 'Walvee', userPhoto = '') {
  // Parse duration
  const duration_days = typeof oldTrip.duration === 'string'
    ? parseDurationDays(oldTrip.duration)
    : oldTrip.duration_days || oldTrip.duration || 1;

  // Convert images
  const images = oldTrip.images || (oldTrip.cover_image ? [oldTrip.cover_image] : []);
  const image_url = oldTrip.image_url || oldTrip.cover_image || images[0] || null;

  // Convert itinerary - rename activities to places
  const itinerary = (oldTrip.itinerary || []).map(day => ({
    day: day.day,
    places: (day.activities || day.places || []).map((item, index) =>
      activityToPlace(item, index)
    )
  }));

  // Extract locations
  const locations = oldTrip.locations || extractLocations(itinerary);

  // Build new trip object
  return {
    // Basic info
    title: oldTrip.title,
    destination: oldTrip.destination,
    description: oldTrip.description || '',

    // Author info
    author_name: userName,
    author_photo: userPhoto,
    author_email: userEmail,
    created_by: userId,

    // Trip details
    duration_days: duration_days,
    start_date: oldTrip.start_date || null,
    visibility: oldTrip.visibility || oldTrip.is_public === false ? 'private' : 'public',

    // Media
    images: images,
    image_url: image_url,
    locations: locations,

    // Metrics
    likes: oldTrip.likes || oldTrip.likes_count || 0,
    steals: oldTrip.steals || 0,
    shares: oldTrip.shares || 0,

    // Itinerary
    itinerary: itinerary,

    // Additional fields
    ...( oldTrip.destination_lat && { destination_lat: oldTrip.destination_lat }),
    ...( oldTrip.destination_lng && { destination_lng: oldTrip.destination_lng }),
  };
}
