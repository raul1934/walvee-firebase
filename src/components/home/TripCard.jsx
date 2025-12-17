import React, { useEffect } from "react";
import {
  ThumbsUp,
  Infinity,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trip, TripLike, TripSteal } from "@/api/entities";
import TripItinerary from "./TripItinerary";
import TripCardViewToggle from "./TripCardViewToggle";
import { Link } from "react-router-dom";
import { createPageUrl, createProfileUrl } from "@/utils";
import UserAvatar from "../common/UserAvatar";
import ImagePlaceholder from "../common/ImagePlaceholder";
import StealModal from "../trip/StealModal";
import CitiesScroller from "../common/CitiesScroller";
import { getTripCities } from "../utils/cityFormatter";

export default function TripCard({
  trip,
  isLoggedIn = true,
  onRestrictedAction,
  currentUserId,
  userLikedTripIds,
  onFavoriteToggle,
  isLoadingLikes = false,
}) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [viewMode, setViewMode] = React.useState("photos");
  const [imageErrors, setImageErrors] = React.useState(new Set());

  const [showShareTooltip, setShowShareTooltip] = React.useState(false);
  const [isStealModalOpen, setIsStealModalOpen] = React.useState(false);

  const queryClient = useQueryClient();

  // Determine valid images - filter out broken ones and provide a fallback if none exist
  const validImages = React.useMemo(() => {
    // Prioritize trip.images array, then trip.image_url
    let sourceImages =
      trip.images && trip.images.length > 0
        ? trip.images
        : trip.image_url
        ? [trip.image_url]
        : [];

    // Filter out any null/undefined entries and those marked as erroneous
    return sourceImages.filter((img, idx) => img && !imageErrors.has(idx));
  }, [trip.images, trip.image_url, imageErrors]);

  const hasValidImages = validImages.length > 0;

  // Reset card to default state when trip changes
  useEffect(() => {
    setViewMode("photos");
    setCurrentImageIndex(0);
    setImageErrors(new Set());
  }, [trip.id]);

  // Get like status from prop (already fetched in parent)
  const isLiked = userLikedTripIds?.has(trip.id) || false;
  const likesCount = trip.likes || 0;
  const stealsCount = trip.steals || 0;
  const sharesCount = trip.shares || 0;

  const cities = getTripCities(trip);

  const likeMutation = useMutation({
    mutationFn: async (shouldLike) => {
      console.log("[TripCard] Like mutation started:", {
        tripId: trip.id,
        shouldLike,
        currentUserId,
      });

      if (shouldLike) {
        // Criar like
        await TripLike.create({
          trip_id: trip.id,
          trip_owner_id: trip.created_by,
          liker_id: currentUserId,
        });
        console.log("[TripCard] Like created");

        // Atualizar contador no Trip
        await Trip.update(trip.id, {
          likes: likesCount + 1,
        });
        console.log("[TripCard] Trip likes updated:", likesCount + 1);
      } else {
        // Buscar e deletar like existente
        const likes = await TripLike.filter({
          trip_id: trip.id,
          liker_id: currentUserId,
        });
        if (likes.length > 0) {
          await TripLike.delete(likes[0].id);
          console.log("[TripCard] Like deleted");

          // Atualizar contador no Trip
          await Trip.update(trip.id, {
            likes: Math.max(0, likesCount - 1),
          });
          console.log(
            "[TripCard] Trip likes updated:",
            Math.max(0, likesCount - 1)
          );
        }
      }
    },
    onSuccess: () => {
      console.log("[TripCard] Like mutation successful, invalidating queries");

      // Invalidar queries para refetch
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", currentUserId] });

      // Notificar parent para refetch likes
      if (onFavoriteToggle) {
        onFavoriteToggle();
      }
    },
    onError: (error) => {
      console.error("[TripCard] Like mutation error:", error);
    },
  });

  const stealMutation = useMutation({
    mutationFn: async () => {
      const existingSteals = await TripSteal.filter({
        trip_id: trip.id,
        created_by: currentUserId,
      });

      if (existingSteals.length === 0) {
        await TripSteal.create({
          trip_id: trip.id,
          source_owner_id: trip.created_by,
        });
        await Trip.update(trip.id, {
          steals: stealsCount + 1,
        });
        return true;
      }
      return false;
    },
    onSuccess: (incremented) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setIsStealModalOpen(false);
    },
  });

  const nextImage = () => {
    if (validImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = () => {
    if (validImages.length === 0) return;
    setCurrentImageIndex(
      (prev) => (prev - 1 + validImages.length) % validImages.length
    );
  };

  const handleLike = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRestrictedAction();
      return;
    }

    // Prevent clicks while loading likes or mutation is pending
    if (isLoadingLikes || likeMutation.isPending) {
      return;
    }

    const newLikedState = !isLiked;
    likeMutation.mutate(newLikedState);
  };

  const handleSteal = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRestrictedAction();
      return;
    }
    setIsStealModalOpen(true);
  };

  const handleStealConfirm = () => {
    stealMutation.mutate();
  };

  const handleShare = async (e) => {
    e.preventDefault();

    const shareUrl = `${window.location.origin}${createPageUrl(
      "TripDetails"
    )}?id=${trip.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowShareTooltip(true);

      await Trip.update(trip.id, {
        shares: sharesCount + 1,
      });
      queryClient.invalidateQueries({ queryKey: ["trips"] });

      setTimeout(() => {
        setShowShareTooltip(false);
      }, 1500);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleImageError = (index) => {
    setImageErrors((prev) => new Set([...prev, index]));

    // If current image failed, try to move to next valid image
    if (index === currentImageIndex && validImages.length > 1) {
      const nextIndex = (currentImageIndex + 1) % validImages.length;
      setCurrentImageIndex(nextIndex);
    }
  };

  const handleViewChange = (newView) => {
    setViewMode(newView);
  };

  return (
    <>
      <Link
        to={createPageUrl("TripDetails") + `?id=${trip.id}`}
        className="block"
      >
        <div className="bg-[#1A1B23] rounded-3xl overflow-hidden border border-[#2A2B35] hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
          {/* User Info Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2A2B35]">
            <div className="flex items-center gap-3">
              {/* User Avatar with profile link */}
              <Link
                to={createProfileUrl(trip.created_by)}
                onClick={(e) => e.stopPropagation()}
              >
                <UserAvatar
                  src={trip.author_photo}
                  name={trip.author_name || "Arthur Gonçalves"}
                  userId={trip.created_by}
                  size="md"
                />
              </Link>
              <div>
                {/* User name with profile link */}
                <Link
                  to={createProfileUrl(trip.created_by)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-white text-sm hover:text-blue-400 transition-colors"
                >
                  {trip.author_name || "Arthur Gonçalves"}
                </Link>
                <p className="text-xs text-gray-400">
                  {trip.start_date &&
                    format(new Date(trip.start_date), "dd MMM yyyy", {
                      locale: pt,
                    })}{" "}
                  • {trip.duration_days} days
                </p>
              </div>
            </div>
          </div>

          {/* Content Area with View Toggle */}
          <div className="relative mt-3">
            <TripCardViewToggle
              activeView={viewMode}
              onViewChange={handleViewChange}
            />

            {viewMode === "photos" && (
              <div className="relative aspect-[16/10] overflow-hidden transition-opacity duration-300 bg-[#0D0D0D] group">
                {!hasValidImages || imageErrors.has(currentImageIndex) ? (
                  <ImagePlaceholder type="image" />
                ) : (
                  <>
                    <img
                      src={validImages[currentImageIndex]}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(currentImageIndex)}
                    />

                    <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1}/{validImages.length}
                    </div>

                    {validImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            prevImage();
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
                        >
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            nextImage();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
                        >
                          <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {viewMode === "itinerary" && (
              <div
                onClick={(e) => e.preventDefault()}
                className="h-[400px] transition-opacity duration-300"
              >
                <TripItinerary trip={trip} />
              </div>
            )}
          </div>

          {/* Title, Location and Description */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
              {trip.title}
            </h3>

            {/* Updated Location Display with Clickable City Links */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3 min-w-0">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <CitiesScroller
                  cities={cities}
                  className="text-sm"
                  makeLinks={true}
                />
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {trip.description}
            </p>

            {/* Actions Footer with KPIs */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2A2B35]">
              <div className="flex items-center gap-6">
                {/* Like with ThumbsUp */}
                <button
                  onClick={handleLike}
                  disabled={isLoadingLikes || likeMutation.isPending}
                  className="flex flex-col items-center gap-1 text-sm transition-colors group"
                >
                  {isLoadingLikes ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <ThumbsUp
                      className={`w-6 h-6 transition-all ${
                        isLiked
                          ? "fill-blue-500 text-blue-500"
                          : "text-gray-400 group-hover:text-blue-400 group-hover:scale-110"
                      } ${likeMutation.isPending ? "opacity-50" : ""}`}
                    />
                  )}
                  <span className="text-xs text-gray-400">{likesCount}</span>
                </button>

                {/* Steal */}
                <button
                  onClick={handleSteal}
                  className="flex flex-col items-center gap-1 text-sm transition-colors group"
                >
                  <Infinity className="w-6 h-6 text-gray-400 group-hover:text-purple-400 group-hover:scale-110 transition-all" />
                  <span className="text-xs text-gray-400">{stealsCount}</span>
                </button>

                {/* Share */}
                <div className="relative">
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center gap-1 text-sm transition-colors group"
                  >
                    <LinkIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                    <span className="text-xs text-gray-400">{sharesCount}</span>
                  </button>

                  {showShareTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap animate-in fade-in duration-100">
                      Link copied to clipboard!
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <StealModal
        isOpen={isStealModalOpen}
        onClose={() => setIsStealModalOpen(false)}
        onConfirm={handleStealConfirm}
        trip={trip}
        isLoading={stealMutation.isPending}
      />
    </>
  );
}
