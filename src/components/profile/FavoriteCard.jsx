import React from "react";
import { TripLike } from "@/api/entities";
import { MapPin, Star, Heart, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getPriceRangeInfo } from "../utils/priceFormatter";
import ImagePlaceholder from "../common/ImagePlaceholder";

export default function FavoriteCard({ favorite, currentUser, isOwnProfile, onPlaceClick }) {
  const [imageError, setImageError] = React.useState(false);
  const queryClient = useQueryClient();

  const priceInfo = getPriceRangeInfo(favorite.price_level);

  const deleteFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await TripLike.delete(favorite.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites', currentUser?.id]);
    }
  });

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Remove ${favorite.place_name} from favorites?`)) {
      deleteFavoriteMutation.mutate();
    }
  };

  const handleClick = () => {
    if (onPlaceClick) {
      // Convert favorite to place format for the modal
      const placeData = {
        name: favorite.place_name,
        address: favorite.place_address,
        place_id: favorite.place_id,
        rating: favorite.rating,
        price_level: favorite.price_level,
        types: favorite.category ? [favorite.category] : [],
        photos: favorite.photo_url ? [favorite.photo_url] : [],
        city: favorite.city,
        country: favorite.country
      };
      
      onPlaceClick(placeData);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#1A1B23] rounded-xl overflow-hidden border border-[#2A2B35] hover:border-blue-500/30 transition-all group relative w-full text-left"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0D0D0D]">
        {!favorite.photo_url || imageError ? (
          <ImagePlaceholder type="image" />
        ) : (
          <img
            src={favorite.photo_url}
            alt={favorite.place_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Favorite Heart Badge */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center shadow-lg">
          <Heart className="w-4 h-4 text-white fill-current" />
        </div>

        {/* Delete Button (only for own profile) */}
        {isOwnProfile && (
          <button
            onClick={handleDelete}
            disabled={deleteFavoriteMutation.isPending}
            className="absolute top-3 left-3 w-8 h-8 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 z-10"
            title="Remove from favorites"
          >
            {deleteFavoriteMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white mb-1 truncate">
          {favorite.place_name}
        </h3>
        
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{favorite.city}, {favorite.country}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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

          {favorite.category && (
            <>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-400 capitalize">
                {favorite.category.replace(/_/g, ' ')}
              </span>
            </>
          )}
        </div>

        {favorite.notes && (
          <p className="text-xs text-gray-500 mt-3 line-clamp-2 italic">
            "{favorite.notes}"
          </p>
        )}
      </div>
    </button>
  );
}