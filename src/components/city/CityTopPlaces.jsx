
import React from "react";
import { MapPin, TrendingUp, Star, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import ImagePlaceholder from "../common/ImagePlaceholder";
import { getCompactPriceDisplay } from "../utils/priceFormatter"; // Added import

// Removed getPriceRangeSymbol as it's replaced by getCompactPriceDisplay

export default function CityTopPlaces({ places, cityName, isLoading, onPlaceClick }) {
  const [imageErrors, setImageErrors] = React.useState(new Set());

  const handleImageError = (placeId) => {
    setImageErrors(prev => new Set([...prev, placeId]));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#1A1B23] rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-gray-800" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="container mx-auto px-6 text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            No places found yet
          </h3>
          <p className="text-gray-400">
            Places will appear here as travelers add them to their trips in {cityName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 mb-16">
      <h2 className="text-2xl font-bold text-white mb-6">
        Top Places in {cityName}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((place, idx) => {
          const placeId = place.place_id || place.name;
          const hasError = imageErrors.has(placeId);
          const priceDisplay = getCompactPriceDisplay(place.price_level); // Changed from priceSymbol to priceDisplay

          return (
            <motion.div
              key={placeId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 6) * 0.05, duration: 0.4 }}
            >
              <button
                onClick={() => {
                  console.log('[CityTopPlaces] Place clicked:', place.name);
                  onPlaceClick && onPlaceClick(place);
                }}
                className="group w-full text-left bg-[#1A1B23] rounded-xl overflow-hidden border border-[#2A2B35] hover:border-purple-500/30 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
              >
                {/* Place Image - reduced aspect ratio */}
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                  {hasError || !place.photo ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-purple-400/60" />
                    </div>
                  ) : (
                    <img
                      src={place.photo}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={() => handleImageError(placeId)}
                    />
                  )}
                  
                  {/* Mentions/Rating badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full">
                    {place.mentions ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-bold text-white">Trips {place.mentions}</span>
                      </>
                    ) : place.rating ? (
                      <>
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-white">{place.rating.toFixed(1)}</span>
                      </>
                    ) : null}
                  </div>

                  {/* Price badge */}
                  {priceDisplay && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full">
                      <span className={`text-sm font-bold ${priceDisplay.color}`}> {/* Updated text size and color class */}
                        {priceDisplay.symbol}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content - more compact */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {place.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {place.mentions ? (
                        `Featured in ${place.mentions} ${place.mentions === 1 ? 'trip' : 'trips'}`
                      ) : place.user_ratings_total ? (
                        `${place.user_ratings_total.toLocaleString()} reviews`
                      ) : (
                        place.address || cityName
                      )}
                    </span>
                  </div>

                  {/* Additional info row */}
                  <div className="flex items-center gap-3 text-xs">
                    {place.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-white">{place.rating.toFixed(1)}</span>
                        {place.user_ratings_total && (
                          <span className="text-gray-500">({place.user_ratings_total.toLocaleString()})</span>
                        )}
                      </div>
                    )}
                    
                    {priceDisplay && place.rating && ( // Changed from priceSymbol to priceDisplay
                      <span className="text-gray-600">•</span>
                    )}
                    
                    {priceDisplay && ( // Changed from priceSymbol to priceDisplay
                      <div className="flex items-center gap-1" title={priceDisplay.label}> {/* Added div wrapper and title */}
                        <span className={`font-bold ${priceDisplay.color}`}> {/* Updated color class */}
                          {priceDisplay.symbol}
                        </span>
                        <span className="text-gray-400">{priceDisplay.label}</span> {/* Added label */}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
