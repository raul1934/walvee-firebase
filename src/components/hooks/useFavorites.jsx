import { useState, useCallback } from 'react';
import { TripLike } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
/**
 * Global favorites hook - manages favorites across the entire app
 * Provides consistent favorite state and operations
 */
export function useFavorites(user) {
  const queryClient = useQueryClient();

  console.log('[useFavorites] Hook initialized', { 
    hasUser: !!user, 
    userId: user?.id 
  });

  // Fetch user's favorites
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useFavorites] No user, returning empty favorites');
        return [];
      }
      
      console.log('[useFavorites] Fetching favorites for user:', user.id);
      const allFavorites = await TripLike.list('-created_date');
      const userFavorites = allFavorites.filter(fav => fav.created_by === user.email);
      
      console.log('[useFavorites] Loaded favorites:', userFavorites.length);
      return userFavorites;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (placeData) => {
      console.log('[useFavorites] Adding favorite:', placeData.place_name);
      
      return await TripLike.create({
        place_name: placeData.place_name,
        place_address: placeData.place_address || placeData.address,
        place_id: placeData.place_id || null,
        city: placeData.city,
        country: placeData.country,
        rating: placeData.rating || null,
        price_level: placeData.price_level || null,
        category: placeData.types?.[0] || placeData.category || null,
        photo_url: placeData.photos?.[0] || placeData.photo_url || null,
        notes: null
      });
    },
    onSuccess: (data) => {
      console.log('[useFavorites] Favorite added successfully');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
    onError: (error) => {
      console.error('[useFavorites] Error adding favorite:', error);
    }
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId) => {
      console.log('[useFavorites] Removing favorite:', favoriteId);
      return await TripLike.delete(favoriteId);
    },
    onSuccess: () => {
      console.log('[useFavorites] Favorite removed successfully');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
    onError: (error) => {
      console.error('[useFavorites] Error removing favorite:', error);
    }
  });

  // Check if a place is favorited
  const isFavorited = useCallback((placeName) => {
    if (!placeName) return false;
    
    const normalizedName = placeName.toLowerCase().trim();
    const found = favorites.some(fav => 
      fav.place_name?.toLowerCase().trim() === normalizedName
    );
    
    return found;
  }, [favorites]);

  // Get favorite by place name
  const getFavoriteByName = useCallback((placeName) => {
    if (!placeName) return null;
    
    const normalizedName = placeName.toLowerCase().trim();
    return favorites.find(fav => 
      fav.place_name?.toLowerCase().trim() === normalizedName
    );
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (placeData, destination) => {
    if (!user) {
      console.log('[useFavorites] No user, cannot toggle favorite');
      throw new Error('User not authenticated');
    }

    const placeName = placeData.name || placeData.place_name;
    const existingFavorite = getFavoriteByName(placeName);

    if (existingFavorite) {
      console.log('[useFavorites] Removing existing favorite');
      await removeFavoriteMutation.mutateAsync(existingFavorite.id);
    } else {
      console.log('[useFavorites] Adding new favorite');
      
      // Extract city and country from destination or place data
      let city = placeData.city;
      let country = placeData.country;
      
      if (destination && !city) {
        const parts = destination.split(',').map(p => p.trim());
        city = parts[0];
        country = parts[1] || '';
      }
      
      if (!city && placeData.address) {
        const addressParts = placeData.address.split(',').map(p => p.trim());
        city = addressParts[addressParts.length - 2] || addressParts[0];
        country = addressParts[addressParts.length - 1] || '';
      }
      
      await addFavoriteMutation.mutateAsync({
        ...placeData,
        place_name: placeName,
        city: city || 'Unknown',
        country: country || 'Unknown'
      });
    }
  }, [user, getFavoriteByName, addFavoriteMutation, removeFavoriteMutation]);

  return {
    favorites,
    isLoading,
    isFavorited,
    getFavoriteByName,
    toggleFavorite,
    isToggling: addFavoriteMutation.isPending || removeFavoriteMutation.isPending
  };
}