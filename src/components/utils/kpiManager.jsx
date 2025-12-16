import { base44 } from "@/api/base44Client";

/**
 * Update user KPIs (followers, following, trips)
 * Non-blocking - errors are logged but don't throw
 */
export async function updateUserKPIs(userId, changes) {
  if (!userId) {
    console.warn('[KPIs] No userId provided');
    return false;
  }

  try {
    // Fetch current user data
    const user = await base44.entities.User.get(userId);
    
    if (!user) {
      console.warn('[KPIs] User not found:', userId);
      return false;
    }

    const updates = {};
    let hasChanges = false;

    // Update followers count
    if (changes.followers !== undefined) {
      const newCount = Math.max(0, (user.metrics_followers || 0) + changes.followers);
      if (newCount !== user.metrics_followers) {
        updates.metrics_followers = newCount;
        hasChanges = true;
      }
    }

    // Update following count
    if (changes.following !== undefined) {
      const newCount = Math.max(0, (user.metrics_following || 0) + changes.following);
      if (newCount !== user.metrics_following) {
        updates.metrics_following = newCount;
        hasChanges = true;
      }
    }

    // Update trips count
    if (changes.trips !== undefined) {
      const newCount = Math.max(0, (user.metrics_my_trips || 0) + changes.trips);
      if (newCount !== user.metrics_my_trips) {
        updates.metrics_my_trips = newCount;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      console.log('[KPIs] No changes needed for user:', userId);
      return true;
    }

    console.log('[KPIs] Updating user KPIs:', { userId, updates });
    await base44.entities.User.update(userId, updates);
    console.log('[KPIs] User KPIs updated successfully');
    return true;

  } catch (error) {
    // Log error but don't throw - KPIs are non-critical
    console.warn('[KPIs] Failed to update user KPIs (non-critical):', {
      userId,
      changes,
      error: error.message
    });
    return false;
  }
}

/**
 * Update trip KPIs (likes, steals, shares)
 * Non-blocking - errors are logged but don't throw
 */
export async function updateTripKPIs(tripId, changes) {
  if (!tripId) {
    console.warn('[KPIs] No tripId provided');
    return false;
  }

  try {
    // Fetch current trip data
    const trip = await base44.entities.Trip.get(tripId);
    
    if (!trip) {
      console.warn('[KPIs] Trip not found:', tripId);
      return false;
    }

    const updates = {};
    let hasChanges = false;

    // Update likes count
    if (changes.likes !== undefined) {
      const newCount = Math.max(0, (trip.likes || 0) + changes.likes);
      if (newCount !== trip.likes) {
        updates.likes = newCount;
        hasChanges = true;
      }
    }

    // Update steals count
    if (changes.steals !== undefined) {
      const newCount = Math.max(0, (trip.steals || 0) + changes.steals);
      if (newCount !== trip.steals) {
        updates.steals = newCount;
        hasChanges = true;
      }
    }

    // Update shares count
    if (changes.shares !== undefined) {
      const newCount = Math.max(0, (trip.shares || 0) + changes.shares);
      if (newCount !== trip.shares) {
        updates.shares = newCount;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      console.log('[KPIs] No changes needed for trip:', tripId);
      return true;
    }

    console.log('[KPIs] Updating trip KPIs:', { tripId, updates });
    await base44.entities.Trip.update(tripId, updates);
    console.log('[KPIs] Trip KPIs updated successfully');
    return true;

  } catch (error) {
    // Log error but don't throw - KPIs are non-critical
    console.warn('[KPIs] Failed to update trip KPIs (non-critical):', {
      tripId,
      changes,
      error: error.message
    });
    return false;
  }
}

/**
 * Fetch user KPIs safely
 * Returns default values if fetch fails
 */
export async function fetchUserKPIs(userId) {
  if (!userId) {
    return {
      metrics_followers: 0,
      metrics_following: 0,
      metrics_my_trips: 0
    };
  }

  try {
    const user = await base44.entities.User.get(userId);
    
    return {
      metrics_followers: user?.metrics_followers || 0,
      metrics_following: user?.metrics_following || 0,
      metrics_my_trips: user?.metrics_my_trips || 0
    };
  } catch (error) {
    console.warn('[KPIs] Failed to fetch user KPIs (non-critical):', {
      userId,
      error: error.message
    });
    
    // Return defaults on error
    return {
      metrics_followers: 0,
      metrics_following: 0,
      metrics_my_trips: 0
    };
  }
}

/**
 * Fetch trip KPIs safely
 * Returns default values if fetch fails
 */
export async function fetchTripKPIs(tripId) {
  if (!tripId) {
    return {
      likes: 0,
      steals: 0,
      shares: 0
    };
  }

  try {
    const trip = await base44.entities.Trip.get(tripId);
    
    return {
      likes: trip?.likes || 0,
      steals: trip?.steals || 0,
      shares: trip?.shares || 0
    };
  } catch (error) {
    console.warn('[KPIs] Failed to fetch trip KPIs (non-critical):', {
      tripId,
      error: error.message
    });
    
    // Return defaults on error
    return {
      likes: 0,
      steals: 0,
      shares: 0
    };
  }
}