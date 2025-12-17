import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl, createProfileUrl } from "@/utils";
import { MapPin, Star, ThumbsUp, Infinity, Users, TrendingUp } from "lucide-react";
import UserAvatar from "../common/UserAvatar";
import ImagePlaceholder from "../common/ImagePlaceholder";
import { formatNumber } from "../utils/numberFormatter";

export default function SearchResultItem({ result, onClose, onPlaceClick }) {
  const [imageError, setImageError] = React.useState(false);

  const handleClick = (e) => {
    // If it's a place, prevent navigation and open modal instead
    if (result.type === 'place') {
      e.preventDefault();
      if (onPlaceClick) {
        onPlaceClick(result);
      }
      return;
    }
    
    // For other types, close the search overlay
    if (onClose) {
      onClose();
    }
  };

  // City result
  if (result.type === 'city') {
    return (
      <Link
        to={`${createPageUrl("City")}?name=${encodeURIComponent(result.name + ', ' + result.country)}`}
        onClick={handleClick}
        className="flex items-center gap-4 p-4 hover:bg-[#1A1B23] rounded-xl transition-colors group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <MapPin className="w-6 h-6 text-purple-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
            {result.name}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {result.country} • {result.tripsCount} {result.tripsCount === 1 ? 'trip' : 'trips'}
          </p>
        </div>
      </Link>
    );
  }

  // Trip result
  if (result.type === 'trip') {
    return (
      <Link
        to={`${createPageUrl("TripDetails")}?id=${result.id}`}
        onClick={handleClick}
        className="flex items-center gap-4 p-4 hover:bg-[#1A1B23] rounded-xl transition-colors group"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0D0D0D] shrink-0">
          {!result.image || imageError ? (
            <ImagePlaceholder type="image" />
          ) : (
            <img
              src={result.image}
              alt={result.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              onError={() => setImageError(true)}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate mb-1">
            {result.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{result.destination}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {formatNumber(result.likes)}
            </span>
            <span className="flex items-center gap-1">
              <Infinity className="w-3 h-3" />
              {formatNumber(result.steals)}
            </span>
            <span>{result.placesCount} places</span>
          </div>
        </div>
      </Link>
    );
  }

  // Place result
  if (result.type === 'place') {
    return (
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-4 p-4 hover:bg-[#1A1B23] rounded-xl transition-colors group text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600/20 to-blue-600/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <MapPin className="w-6 h-6 text-green-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors truncate">
            {result.name}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {result.address || result.city}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {result.rating && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-yellow-500 font-semibold">{result.rating.toFixed(1)}</span>
              </div>
            )}
            {result.user_ratings_total && (
              <span className="text-xs text-gray-500">
                ({formatNumber(result.user_ratings_total)} reviews)
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  // User/Person result
  if (result.type === 'user') {
    return (
      <Link
        to={createProfileUrl(result.id)}
        onClick={handleClick}
        className="flex items-center gap-4 p-4 hover:bg-[#1A1B23] rounded-xl transition-colors group"
      >
        <UserAvatar
          src={result.avatar || result.photo_url || result.picture}
          name={result.name || result.full_name || result.preferred_name}
          size="lg"
          ring
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors truncate">
            {result.name || result.full_name || result.preferred_name}
          </h3>
          <p className="text-sm text-gray-400 truncate mb-1">
            {result.username || `@${(result.preferred_name || result.full_name || '').toLowerCase().replace(/\s+/g, '')}`}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatNumber(result.followers || result.metrics_followers || 0)} followers
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {formatNumber(result.metrics_my_trips || 0)} trips
            </span>
          </div>
          
          {/* Show additional context if available */}
          {result.livesHere && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-400 rounded-full text-xs font-medium border border-green-600/30">
                <MapPin className="w-3 h-3" />
                Lives here
              </span>
            </div>
          )}
          {!result.livesHere && result.tripCount > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium border border-blue-600/30">
                <MapPin className="w-3 h-3" />
                Visited {result.tripCount}x
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return null;
}