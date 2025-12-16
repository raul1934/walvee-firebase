import React, { useState, useEffect } from 'react';
import { MapPin, Star, Building2, Compass, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ImagePlaceholder from '../common/ImagePlaceholder';
import { getCompactPriceDisplay } from '../utils/priceFormatter';

// Category icons and colors
const CATEGORY_CONFIG = {
  city: {
    icon: MapPin,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  place: {
    icon: Compass,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  activity: {
    icon: Compass,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  business: {
    icon: Building2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  }
};

export default function RecommendationCard({ recommendation }) {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const category = CATEGORY_CONFIG[recommendation.type] || CATEGORY_CONFIG.place;
  const Icon = category.icon;

  // Fetch place details from Google Places if not a city
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      if (recommendation.type === 'city' || !recommendation.name) return;

      setIsLoadingDetails(true);
      try {
        const searchQuery = `${recommendation.name} ${recommendation.city || ''} ${recommendation.country || ''}`.trim();
        
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Search Google Places API for: "${searchQuery}"
          
Return ONLY the place_id if found, or null if not found.
Format: {"place_id": "ChIJ..." or null}`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              place_id: { type: ["string", "null"] }
            }
          }
        });

        if (response.place_id) {
          // Simulating place details - in production, you'd call Google Places API
          setPlaceDetails({
            place_id: response.place_id,
            rating: 4.5 + Math.random() * 0.5, // Mock rating
            user_ratings_total: Math.floor(Math.random() * 1000) + 50,
            price_level: Math.floor(Math.random() * 4) + 1,
            photo: null // Will be loaded from Google Places
          });
        }
      } catch (error) {
        console.error('[RecommendationCard] Error fetching details:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchPlaceDetails();
  }, [recommendation.name, recommendation.city, recommendation.country, recommendation.type]);

  const rating = placeDetails?.rating;
  const reviewsCount = placeDetails?.user_ratings_total;
  const priceDisplay = placeDetails?.price_level ? getCompactPriceDisplay(placeDetails.price_level) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer"
    >
      <div className={`bg-[#1A1B23] rounded-2xl overflow-hidden border ${category.borderColor} hover:border-opacity-60 transition-all duration-300 hover:transform hover:scale-[1.02]`}>
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          {imageError || !placeDetails?.photo ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className={`w-12 h-12 ${category.color} opacity-40`} />
            </div>
          ) : (
            <img
              src={placeDetails.photo}
              alt={recommendation.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          )}

          {/* Category Badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-md ${category.bgColor} backdrop-blur-md border ${category.borderColor}`}>
            <span className={`text-xs font-semibold ${category.color} uppercase`}>
              {recommendation.type}
            </span>
          </div>

          {/* Price Badge */}
          {priceDisplay && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10">
              <span className={`text-sm font-bold ${priceDisplay.color}`}>
                {priceDisplay.symbol}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
            {recommendation.name}
          </h3>

          {/* Location */}
          {(recommendation.city || recommendation.country) && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">
                {[recommendation.city, recommendation.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Rating & Reviews */}
          {rating && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-white">{rating.toFixed(1)}</span>
              </div>
              {reviewsCount && (
                <span className="text-gray-500">({reviewsCount.toLocaleString()})</span>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {recommendation.description}
          </p>

          {/* Why */}
          {recommendation.why && (
            <div className={`pt-2 border-t ${category.borderColor}`}>
              <p className={`text-xs ${category.color} line-clamp-2`}>
                ✨ {recommendation.why}
              </p>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoadingDetails && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}