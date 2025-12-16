import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import HeroSection from "../components/home/HeroSection";
import DestinationCarousel from "../components/home/DestinationCarousel";
import TravelerCarousel from "../components/home/TravelerCarousel";
import TripCard from "../components/home/TripCard";
import { useDragScroll } from "../components/hooks/useDragScroll";

export default function Home({ user, userLoading, openLoginModal }) {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isHoveringCards, setIsHoveringCards] = useState(false);
  const scrollRef = React.useRef(null);
  const dragScrollRef = useDragScroll();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Reset all trip cards to default state when component mounts
  useEffect(() => {
    // Clear all trip view preferences from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('tripView_')) {
        sessionStorage.removeItem(key);
      }
    });
  }, []);

  useEffect(() => {
    if (!userLoading && user && !user.onboarding_completed) {
      navigate(createPageUrl("Onboarding"));
    }
  }, [user, userLoading, navigate]);

  // Fetch trips and randomize order
  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const allTrips = await base44.entities.Trip.list("-created_date");
      
      // Fisher-Yates shuffle algorithm to randomize order
      const shuffled = [...allTrips];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return shuffled;
    },
    initialData: []
  });

  // Fetch ALL user's likes in a SINGLE query to avoid rate limit
  const { data: userLikes = [], isLoading: isLoadingUserLikes } = useQuery({
    queryKey: ['userLikes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        // Single query to get all likes by this user
        return await base44.entities.TripLike.filter({ liker_id: user.id });
      } catch (error) {
        console.error('[Likes] Error fetching user likes:', error);
        return [];
      }
    },
    enabled: !!user && !userLoading,
    initialData: [],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Create a Set of liked trip IDs for fast lookup
  const userLikedTripIds = React.useMemo(() => {
    return new Set(userLikes.map(like => like.trip_id));
  }, [userLikes]);

  // Function to invalidate the user likes query, triggering a refetch
  const invalidateUserLikes = () => {
    if (user?.id) {
      queryClient.invalidateQueries(['userLikes', user.id]);
    }
  };

  useEffect(() => {
    const checkScroll = () => {
      const element = dragScrollRef.current || scrollRef.current;
      if (element) {
        const { scrollTop, scrollHeight, clientHeight } = element;
        const hasMoreContent = scrollHeight > clientHeight;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
        setShowScrollIndicator(hasMoreContent && !isAtBottom);
      }
    };

    checkScroll();
    const scrollElement = dragScrollRef.current || scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [trips, dragScrollRef]);

  useEffect(() => {
    const scrollElement = dragScrollRef.current || scrollRef.current;
    if (!scrollElement || trips.length === 0) return;

    const autoScroll = setInterval(() => {
      if (scrollElement && !isHoveringCards) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

        if (isAtBottom) {
          // Restart from top when reaching bottom
          scrollElement.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          scrollElement.scrollBy({ top: 2, behavior: 'auto' });
        }
      }
    }, 30);

    return () => clearInterval(autoScroll);
  }, [trips, isHoveringCards, dragScrollRef]);

  const scrollToNextCard = () => {
    const element = dragScrollRef.current || scrollRef.current;
    if (element) {
      element.scrollBy({
        top: 600,
        behavior: 'smooth'
      });
    }
  };

  const handleRestrictedAction = () => {
    if (openLoginModal) {
      openLoginModal();
    }
  };

  return (
    <div className="h-screen overflow-hidden pt-16">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        body {
          overflow: hidden;
        }
      `}</style>
      
      <div className="h-full overflow-hidden">
        <div className="container mx-auto px-4 h-full">
          <div className="h-full flex flex-col lg:flex-row gap-8 py-8 overflow-hidden">
            <div
              className="relative lg:w-[420px] flex-shrink-0 h-full overflow-hidden"
              onMouseEnter={() => setIsHoveringCards(true)}
              onMouseLeave={() => setIsHoveringCards(false)}>

              <div
                ref={(el) => {
                  scrollRef.current = el;
                  if (dragScrollRef && typeof dragScrollRef === 'object' && 'current' in dragScrollRef) {
                    dragScrollRef.current = el;
                  }
                }}
                className="h-full overflow-y-auto scrollbar-hide pr-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                <div className="space-y-6 pb-20">
                  {isLoading || isLoadingUserLikes ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                    </div>
                  ) : trips.length > 0 ? (
                    trips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        isLoggedIn={!!user}
                        isFavorited={userLikedTripIds.has(trip.id)}
                        onRestrictedAction={handleRestrictedAction}
                        onFavoriteToggle={invalidateUserLikes}
                        currentUserId={user?.id}
                        userLikedTripIds={userLikedTripIds}
                        isLoadingLikes={isLoadingUserLikes}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <p>Nenhuma viagem criada ainda.</p>
                      <p className="text-sm mt-2">Seja o primeiro a compartilhar sua aventura!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-start justify-center overflow-hidden pt-12">
              <div className="w-full max-w-3xl space-y-4">
                <HeroSection user={user} openLoginModal={openLoginModal} />

                <div className="pt-[103px]">
                  <h2 className="text-base md:text-lg text-center mb-3 text-gray-300">Or get inspired by other travelers around the world:</h2>

                  <DestinationCarousel />
                  <TravelerCarousel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}