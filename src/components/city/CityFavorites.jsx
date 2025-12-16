import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Star, Heart } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";
import { getPriceRangeInfo } from "../utils/priceFormatter";

export default function CityFavorites({ cityName, onPlaceClick, user, openLoginModal }) {
  console.log('[CityFavorites] Render:', { cityName, hasUser: !!user });

  const { favorites, isLoading: isFavoritesLoading } = useFavorites(user);

  // Filter favorites for this city
  const cityFavorites = React.useMemo(() => {
    if (!cityName || !favorites.length) return [];
    
    const normalizedCityName = cityName.toLowerCase().trim();
    const cityNameOnly = normalizedCityName.split(',')[0].trim();
    
    return favorites.filter(fav => {
      const favCity = (fav.city || '').toLowerCase().trim();
      return favCity === cityNameOnly || favCity === normalizedCityName;
    });
  }, [favorites, cityName]);

  console.log('[CityFavorites] Filtered favorites:', cityFavorites.length);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-pink-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Your Favorite Places</h3>
        <p className="text-gray-400 text-center max-w-md mb-6">
          Save your favorite spots in {cityName} to quickly find them later.
        </p>
        <button
          onClick={openLoginModal}
          className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Login to Save Favorites
        </button>
      </div>
    );
  }

  if (isFavoritesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  if (cityFavorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-pink-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
        <p className="text-gray-400 text-center max-w-md">
          Start saving your favorite places in {cityName} to quickly find them later when planning trips!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Your Favorites in {cityName}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cityFavorites.map((favorite) => {
          const priceInfo = getPriceRangeInfo(favorite.price_level);
          
          return (
            <button
              key={favorite.id}
              onClick={() => onPlaceClick({
                name: favorite.place_name,
                address: favorite.place_address,
                place_id: favorite.place_id,
                rating: favorite.rating,
                price_level: favorite.price_level,
                photos: favorite.photo_url ? [favorite.photo_url] : [],
                types: favorite.category ? [favorite.category] : []
              })}
              className="bg-[#1A1B23] rounded-xl p-4 hover:bg-[#2A2B35] transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                    {favorite.photo_url ? (
                      <img
                        src={favorite.photo_url}
                        alt={favorite.place_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <MapPin className="w-8 h-8 text-pink-400" />
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1 truncate group-hover:text-pink-400 transition-colors">
                    {favorite.place_name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2 truncate">
                    {favorite.place_address}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {favorite.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-semibold text-yellow-500">
                          {favorite.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {priceInfo && (
                      <>
                        {favorite.rating && <span className="text-xs text-gray-600">•</span>}
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-bold ${priceInfo.color}`}>
                            {priceInfo.symbol}
                          </span>
                          <span className="text-xs text-gray-400">
                            {priceInfo.label}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {favorite.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {favorite.notes}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}