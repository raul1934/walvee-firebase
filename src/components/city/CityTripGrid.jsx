import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl, createProfileUrl } from "@/utils";
import { MapPin, ThumbsUp, Infinity } from "lucide-react";
import { format } from "date-fns";
import UserAvatar from "../common/UserAvatar";
import ImagePlaceholder from "../common/ImagePlaceholder";
import CitiesScroller from "../common/CitiesScroller";
import { getTripCities } from "../utils/cityFormatter";

export default function CityTripGrid({ trips, isLoading, currentUserId }) {
  const [imageErrors, setImageErrors] = React.useState(new Set());

  const handleImageError = (tripId) => {
    setImageErrors((prev) => new Set([...prev, tripId]));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[#1A1B23] rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-[#0D0D0D]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#0D0D0D] rounded w-3/4" />
                <div className="h-3 bg-[#0D0D0D] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => {
          const mainImage = trip.images?.[0] || trip.image_url;
          const hasImageError = imageErrors.has(trip.id);
          const cities = getTripCities(trip);

          return (
            <Link
              key={trip.id}
              to={`${createPageUrl("TripDetails")}?id=${trip.id}`}
              className="bg-[#1A1B23] rounded-2xl overflow-hidden border border-[#2A2B35] hover:border-blue-500/30 transition-all group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-[#0D0D0D]">
                {!mainImage || hasImageError ? (
                  <ImagePlaceholder type="image" />
                ) : (
                  <img
                    src={mainImage}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => handleImageError(trip.id)}
                  />
                )}

                {/* Author Avatar Overlay */}
                <Link
                  to={createProfileUrl(trip.created_by)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 left-3 hover:scale-110 transition-transform"
                >
                  <UserAvatar
                    src={trip.author_photo}
                    name={trip.author_name}
                    size="md"
                    ring
                    userId={trip.created_by}
                  />
                </Link>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {trip.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 min-w-0">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <CitiesScroller
                      cities={cities}
                      className="text-xs"
                      makeLinks={true}
                    />
                  </div>
                </div>

                {trip.start_date && (
                  <p className="text-xs text-gray-500 mb-3">
                    {format(new Date(trip.start_date), "MMM dd, yyyy")} •{" "}
                    {trip.duration_days} days
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-[#2A2B35]">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{trip.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Infinity className="w-3 h-3" />
                    <span>{trip.steals || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
