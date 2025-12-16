
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ThumbsUp, MapPin, Calendar, Share2, Instagram, Linkedin, Image, Map, Info, Infinity, MessageSquare, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserAvatar from "../components/common/UserAvatar";
import { useDragScroll } from "../components/hooks/useDragScroll";
import PlaceDetails from "../components/trip/PlaceDetails";
import ImagePlaceholder from "../components/common/ImagePlaceholder";
import StealModal from "../components/trip/StealModal";
import TravelerTips from "../components/trip/TravelerTips";
import { findPlaceInTrip } from "../components/utils/placeId";
import { normalizeTripItinerary } from "../components/utils/tripDataSelector";
import { updateUserKPIs, updateTripKPIs } from "../components/utils/kpiManager";
import { formatNumber } from "../components/utils/numberFormatter";
import { getPriceRangeInfo } from "../components/utils/priceFormatter";
import CitiesScroller from "../components/common/CitiesScroller";
import { getTripCities, getCityNameOnly } from "../components/utils/cityFormatter";
import { shouldUseGooglePlaces, getGooglePlacesService } from "../components/utils/googlePlacesConfig";

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";

export default function TripDetails({ user, openLoginModal }) {
  console.log('[TripDetails] ===== RENDER =====');
  console.log('[TripDetails] Props:', {
    hasUser: !!user,
    userId: user?.id,
    hasOpenLoginModal: !!openLoginModal
  });

  const [activeTab, setActiveTab] = useState("itinerary");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [placePhotos, setPlacePhotos] = useState([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [showScrollCta, setShowScrollCta] = useState(false);
  const [isScrollDebounced, setIsScrollDebounced] = useState(false);

  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);

  const [enrichedPlaces, setEnrichedPlaces] = useState({});
  const [loadingDayPlaces, setLoadingDayPlaces] = useState(false);
  const [enrichedDays, setEnrichedDays] = useState(() => new Set());

  const [imageErrors, setImageErrors] = useState(() => new Set());

  const [isStealModalOpen, setIsStealModalOpen] = useState(false);
  const [isStealLoading, setIsStealLoading] = useState(false);

  const [isScrolling, setIsScrolling] = useState(false);

  const dayJustChanged = useRef(false);

  const dragScrollRef = useDragScroll();
  const itineraryScrollRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapInitialized = useRef(false);
  const markersRef = useRef([]);
  const scriptLoaded = useRef(false);

  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const scrollRef = useRef(null);

  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const urlDay = urlParams.get("day");
  const urlPlaceId = urlParams.get("placeId");
  const urlGpid = urlParams.get("gpid");

  const { data: tripData, isLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const trip = await base44.entities.Trip.get(tripId);
      return normalizeTripItinerary(trip);
    },
    enabled: !!tripId,
    retry: 1,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        console.warn('[TripDetails] Error fetching current user:', error.message);
        return null;
      }
    },
    retry: false,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: derivations = [] } = useQuery({
    queryKey: ['derivations', tripId],
    queryFn: async () => {
      try {
        const all = await base44.entities.TripDerivation.list();
        return all.filter(d => d.source_trip_id === tripId && d.status === 'created');
      } catch (error) {
        console.warn('[TripDetails] Error fetching derivations:', error.message);
        return [];
      }
    },
    enabled: !!tripId,
    retry: 0,
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', tripData?.created_by, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || !tripData) return null;

      const cached = sessionStorage.getItem(`followStatus_${tripData.created_by}_${currentUser.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          console.log('[Follow] Using cached status');
          return parsed.data;
        }
      }

      try {
        const follows = await base44.entities.Follow.filter({
          followee_id: tripData.created_by,
          follower_id: currentUser.id
        });
        const result = follows.length > 0 ? follows[0] : null;

        sessionStorage.setItem(`followStatus_${tripData.created_by}_${currentUser.id}`, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));

        return result;
      } catch (error) {
        console.warn('[Follow] Error checking status:', error.message);
        return null;
      }
    },
    enabled: !!currentUser && !!tripData && tripData.created_by !== currentUser?.id,
    retry: 0,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: likeStatus } = useQuery({
    queryKey: ['likeStatus', tripId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || !tripId) return null;

      const cached = sessionStorage.getItem(`likeStatus_${tripId}_${currentUser.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          console.log('[Like] Using cached status');
          return parsed.data;
        }
      }

      try {
        const likes = await base44.entities.TripLike.filter({
          trip_id: tripId,
          liker_id: currentUser.id
        });
        const result = likes.length > 0 ? likes[0] : null;

        sessionStorage.setItem(`likeStatus_${tripId}_${currentUser.id}`, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));

        return result;
      } catch (error) {
        console.warn('[Like] Error checking status:', error.message);
        return null;
      }
    },
    enabled: !!currentUser && !!tripId,
    retry: 0,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const isFollowing = !!followStatus;
  const hasLiked = !!likeStatus;
  const isAuthor = currentUser && tripData && currentUser.id === tripData.created_by;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !tripData) throw new Error("Not authenticated");
      if (tripData.created_by === currentUser.id) throw new Error("Cannot follow yourself.");

      console.log('[Follow] Creating follow:', {
        followee_id: tripData.created_by,
        follower_id: currentUser.id
      });

      return await base44.entities.Follow.create({
        followee_id: tripData.created_by,
        follower_id: currentUser.id,
        followee_email: tripData.author_email || tripData.created_by
      });
    },
    onMutate: async () => {
      const startTime = Date.now();

      await queryClient.cancelQueries(['followStatus', tripData?.created_by, currentUser?.id]);
      await queryClient.cancelQueries(['currentUser']);

      const previousFollow = queryClient.getQueryData(['followStatus', tripData?.created_by, currentUser?.id]);
      const previousUser = queryClient.getQueryData(['currentUser']);

      const optimisticFollow = {
        id: 'optimistic-follow',
        followee_id: tripData.created_by,
        follower_id: currentUser.id
      };

      queryClient.setQueryData(['followStatus', tripData?.created_by, currentUser?.id], optimisticFollow);
      sessionStorage.setItem(`followStatus_${tripData.created_by}_${currentUser.id}`, JSON.stringify({
        data: optimisticFollow,
        timestamp: Date.now()
      }));

      // Optimistically update current user's following count
      if (previousUser) {
        const newUser = {
          ...previousUser,
          metrics_following: Math.max(0, (previousUser.metrics_following || 0) + 1)
        };
        queryClient.setQueryData(['currentUser'], newUser);
      }

      console.log('[Follow] Optimistic update applied');

      return { previousFollow, previousUser, startTime };
    },
    onError: (err, variables, context) => {
      console.error('[Follow] Mutation error:', err);

      queryClient.setQueryData(['followStatus', tripData?.created_by, currentUser?.id], context.previousFollow);
      queryClient.setQueryData(['currentUser'], context.previousUser);
      sessionStorage.setItem(`followStatus_${tripData.created_by}_${currentUser.id}`, JSON.stringify({
        data: context.previousFollow,
        timestamp: Date.now()
      }));

      alert("Couldn't follow now. Please try again.");
    },
    onSuccess: async (data, variables, context) => {
      console.log('[Follow] Mutation successful');

      queryClient.setQueryData(['followStatus', tripData?.created_by, currentUser?.id], data);
      sessionStorage.setItem(`followStatus_${tripData.created_by}_${currentUser.id}`, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));

      // Update KPIs in background (non-blocking)
      Promise.all([
        // Update current user's following count
        updateUserKPIs(currentUser.id, { following: 1 }),
        // Update trip author's followers count
        updateUserKPIs(tripData.created_by, { followers: 1 })
      ]).then(() => {
        console.log('[Follow] KPIs updated successfully');
        queryClient.invalidateQueries(['currentUser']);
      }).catch(error => {
        console.error('[Follow] KPI update failed (non-critical):', error);
      });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!followStatus || followStatus.id === 'optimistic-follow') {
        throw new Error("Not following or optimistic state");
      }

      console.log('[Unfollow] Deleting follow:', followStatus.id);

      return await base44.entities.Follow.delete(followStatus.id);
    },
    onMutate: async () => {
      const startTime = Date.now();

      await queryClient.cancelQueries(['followStatus', tripData?.created_by, currentUser?.id]);
      await queryClient.cancelQueries(['currentUser']);

      const previousFollow = queryClient.getQueryData(['followStatus', tripData?.created_by, currentUser?.id]);
      const previousUser = queryClient.getQueryData(['currentUser']);

      queryClient.setQueryData(['followStatus', tripData?.created_by, currentUser?.id], null);
      sessionStorage.setItem(`followStatus_${tripData.created_by}_${currentUser.id}`, JSON.stringify({
        data: null,
        timestamp: Date.now()
      }));

      // Optimistically update current user's following count
      if (previousUser) {
        const newUser = {
          ...previousUser,
          metrics_following: Math.max(0, (previousUser.metrics_following || 0) - 1)
        };
        queryClient.setQueryData(['currentUser'], newUser);
      }

      console.log('[Unfollow] Optimistic update applied');

      return { previousFollow, previousUser, startTime };
    },
    onError: (err, variables, context) => {
      console.error('[Unfollow] Mutation error:', err);

      queryClient.setQueryData(['followStatus', tripData?.created_by, currentUser?.id], context.previousFollow);
      queryClient.setQueryData(['currentUser'], context.previousUser);
      sessionStorage.setItem(`followStatus_${tripData.created_by}_${currentUser.id}`, JSON.stringify({
        data: context.previousFollow,
        timestamp: Date.now()
      }));

      alert("Couldn't unfollow now. Please try again.");
    },
    onSuccess: async (data, variables, context) => {
      console.log('[Unfollow] Mutation successful');

      queryClient.setQueryData(['followStatus', tripData?.created_by, currentUser?.id], null);
      sessionStorage.setItem(`followStatus_${tripData.created_by}_${currentUser.id}`, JSON.stringify({
        data: null,
        timestamp: Date.now()
      }));

      // Update KPIs in background (non-blocking)
      Promise.all([
        // Update current user's following count
        updateUserKPIs(currentUser.id, { following: -1 }),
        // Update trip author's followers count
        updateUserKPIs(tripData.created_by, { followers: -1 })
      ]).then(() => {
        console.log('[Unfollow] KPIs updated successfully');
        queryClient.invalidateQueries(['currentUser']);
      }).catch(error => {
        console.error('[Unfollow] KPI update failed (non-critical):', error);
      });
    }
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !tripId) throw new Error("Not authenticated");
      if (tripData.created_by === currentUser.id) throw new Error("Cannot like your own trip.");

      console.log('[Like] Creating like:', {
        trip_id: tripId,
        liker_id: currentUser.id,
        trip_owner_id: tripData.created_by
      });

      return await base44.entities.TripLike.create({
        trip_id: tripId,
        liker_id: currentUser.id,
        trip_owner_id: tripData.created_by
      });
    },
    onMutate: async () => {
      const startTime = Date.now();

      await queryClient.cancelQueries(['likeStatus', tripId, currentUser?.id]);
      await queryClient.cancelQueries(['trip', tripId]);

      const previousLike = queryClient.getQueryData(['likeStatus', tripId, currentUser?.id]);
      const previousTrip = queryClient.getQueryData(['trip', tripId]);

      const optimisticLike = {
        id: 'optimistic-like',
        trip_id: tripId,
        liker_id: currentUser.id
      };

      queryClient.setQueryData(['likeStatus', tripId, currentUser?.id], optimisticLike);
      sessionStorage.setItem(`likeStatus_${tripId}_${currentUser.id}`, JSON.stringify({
        data: optimisticLike,
        timestamp: Date.now()
      }));

      // Optimistically update trip likes count
      if (previousTrip) {
        const newTrip = {
          ...previousTrip,
          likes: Math.max(0, (previousTrip.likes || 0) + 1)
        };
        queryClient.setQueryData(['trip', tripId], newTrip);
      }

      console.log('[Like] Optimistic update applied');

      return { previousLike, previousTrip, startTime };
    },
    onError: (err, variables, context) => {
      console.error('[Like] Mutation error:', err);

      queryClient.setQueryData(['likeStatus', tripId, currentUser?.id], context.previousLike);
      if (context.previousTrip) {
        queryClient.setQueryData(['trip', tripId], context.previousTrip);
      }
      sessionStorage.setItem(`likeStatus_${tripId}_${currentUser.id}`, JSON.stringify({
        data: context.previousLike,
        timestamp: Date.now()
      }));

      alert("Couldn't like now. Please try again.");
    },
    onSuccess: async (data, variables, context) => {
      console.log('[Like] Mutation successful');

      queryClient.setQueryData(['likeStatus', tripId, currentUser?.id], data);
      sessionStorage.setItem(`likeStatus_${tripId}_${currentUser.id}`, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));

      // Update trip KPIs
      try {
        await updateTripKPIs(tripId, { likes: 1 });
        console.log('[Like] Trip KPIs updated');
        await queryClient.invalidateQueries(['trip', tripId]);
      } catch (error) {
        console.error('[Like] Trip KPI update failed:', error);
      }
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!likeStatus || likeStatus.id === 'optimistic-like') {
        throw new Error("Not liked or optimistic state");
      }

      console.log('[Unlike] Deleting like:', likeStatus.id);

      return await base44.entities.TripLike.delete(likeStatus.id);
    },
    onMutate: async () => {
      const startTime = Date.now();

      await queryClient.cancelQueries(['likeStatus', tripId, currentUser?.id]);
      await queryClient.cancelQueries(['trip', tripId]);

      const previousLike = queryClient.getQueryData(['likeStatus', tripId, currentUser?.id]);
      const previousTrip = queryClient.getQueryData(['trip', tripId]);

      queryClient.setQueryData(['likeStatus', tripId, currentUser?.id], null);
      sessionStorage.setItem(`likeStatus_${tripId}_${currentUser.id}`, JSON.stringify({
        data: null,
        timestamp: Date.now()
      }));

      // Optimistically update trip likes count
      if (previousTrip) {
        const newTrip = {
          ...previousTrip,
          likes: Math.max(0, (previousTrip.likes || 0) - 1)
        };
        queryClient.setQueryData(['trip', tripId], newTrip);
      }

      console.log('[Unlike] Optimistic update applied');

      return { previousLike, previousTrip, startTime };
    },
    onError: (err, variables, context) => {
      console.error('[Unlike] Mutation error:', err);

      queryClient.setQueryData(['likeStatus', tripId, currentUser?.id], context.previousLike);
      if (context.previousTrip) {
        queryClient.setQueryData(['trip', tripId], context.previousTrip);
      }
      sessionStorage.setItem(`likeStatus_${tripId}_${currentUser.id}`, JSON.stringify({
        data: context.previousLike,
        timestamp: Date.now()
      }));

      alert("Couldn't unlike now. Please try again.");
    },
    onSuccess: async (data, variables, context) => {
      console.log('[Unlike] Mutation successful');

      queryClient.setQueryData(['likeStatus', tripId, currentUser?.id], null);
      sessionStorage.setItem(`likeStatus_${tripId}_${currentUser.id}`, JSON.stringify({
        data: null,
        timestamp: Date.now()
      }));

      // Update trip KPIs
      try {
        await updateTripKPIs(tripId, { likes: -1 });
        console.log('[Unlike] Trip KPIs updated');
        await queryClient.invalidateQueries(['trip', tripId]);
      } catch (error) {
        console.error('[Unlike] Trip KPI update failed:', error);
      }
    }
  });

  useEffect(() => {
    if (scriptLoaded.current) return;

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded.current = true;
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!tripData || !tripData.itinerary) return;

    const hasDeepLinkParams = urlDay || urlPlaceId || urlGpid;

    if (hasDeepLinkParams) {
      const result = findPlaceInTrip(tripData, {
        day: urlDay,
        placeId: urlPlaceId,
        gpid: urlGpid
      });

      if (result) {
        setSelectedDay(result.dayIndex);
        setActiveTab("itinerary");

        setTimeout(() => {
          const placeCombinedId = `${result.dayIndex}-${result.placeIndex}`;
          setSelectedPlaceId(placeCombinedId);
          setSelectedPlaceIndex(result.placeIndex);

          const placeElement = document.querySelector(`[data-place-id="${placeCombinedId}"]`);
          if (placeElement) {
            placeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 300);
      }
    } else if (selectedDay === null || selectedDay === undefined) {
      setSelectedDay(0);
      setActiveTab("itinerary");
    }
  }, [tripData, urlDay, urlPlaceId, urlGpid, selectedDay]);

  useEffect(() => {
    if (!tripData || activeTab !== "photos") return;
    if (!shouldUseGooglePlaces()) {
      console.log('[TripDetails] Google Places API desabilitada para fotos');
      setPlacePhotos([]);
      setIsLoadingPhotos(false);
      return;
    }
    if (!window.google?.maps?.places?.PlacesService) return;

    setIsLoadingPhotos(true);
    setImageErrors(new Set());
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const allPhotos = [];

    const allPlaces = tripData.itinerary?.flatMap(day => day.places || []) || [];

    if (allPlaces.length === 0) {
      setPlacePhotos([]);
      setIsLoadingPhotos(false);
      return;
    }

    const placesToFetch = allPlaces.slice(0, 20);

    Promise.all(placesToFetch.map(place => {
      return new Promise(resolve => {
        const request = {
          query: `${place.name}, ${tripData.destination}`,
          type: 'establishment'
        };

        service.textSearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]?.photos) {
            const photos = results[0].photos.slice(0, 3).map(photo => ({
              url: photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
              placeName: place.name
            }));
            allPhotos.push(...photos);
          }
          resolve();
        });
      });
    })).then(() => {
      setPlacePhotos(allPhotos);
      setIsLoadingPhotos(false);
      setCurrentImageIndex(0);
    }).catch(error => {
      console.error("Error fetching place photos:", error);
      setIsLoadingPhotos(false);
    });

  }, [tripData, activeTab]);

  useEffect(() => {
    if (!tripData || !tripData.itinerary) return;
    if (!shouldUseGooglePlaces()) {
      console.log('[TripDetails] Google Places API desabilitada para enriquecimento de lugares');
      setLoadingDayPlaces(false);
      setEnrichedDays(prev => {
        const currentSet = prev instanceof Set ? prev : new Set();
        const dayKey = `day-${selectedDay}`;
        return new Set([...currentSet, dayKey]);
      });
      return;
    }
    if (!window.google?.maps?.places?.PlacesService) return;

    const currentDay = tripData.itinerary[selectedDay];
    if (!currentDay?.places || currentDay.places.length === 0) return;

    const dayKey = `day-${selectedDay}`;
    const enrichedDaysSet = enrichedDays instanceof Set ? enrichedDays : new Set();

    if (enrichedDaysSet.has(dayKey)) return;

    setLoadingDayPlaces(true);
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));

    Promise.all(currentDay.places.map((place, idx) => {
      return new Promise(resolve => {
        const placeKey = `${selectedDay}-${idx}`;

        if (enrichedPlaces[placeKey]) {
          resolve();
          return;
        }

        const request = {
          query: `${place.name}, ${place.address || tripData.destination}`,
          type: 'establishment'
        };

        service.textSearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const result = results[0];
            setEnrichedPlaces(prev => ({
              ...prev,
              [placeKey]: {
                ...place,
                rating: result.rating || place.rating,
                reviews_count: result.user_ratings_total || place.reviews_count,
                user_ratings_total: result.user_ratings_total || place.user_ratings_total,
                photos: result.photos?.slice(0, 5).map(p => p.getUrl({ maxWidth: 800 })) || [],
                geometry: result.geometry,
                price_level: result.price_level !== undefined ? result.price_level : place.price_level,
                place_id: result.place_id || place.place_id
              }
            }));
          }
          resolve();
        });
      });
    })).then(() => {
      setEnrichedDays(prev => {
        const currentSet = prev instanceof Set ? prev : new Set();
        return new Set([...currentSet, dayKey]);
      });
      setLoadingDayPlaces(false);
    }).catch(error => {
      console.error("Error enriching day places:", error);
      setLoadingDayPlaces(false);
    });

  }, [tripData, selectedDay, enrichedPlaces, enrichedDays]);

  useEffect(() => {
    const headerEl = headerRef.current;
    const tabsEl = tabsRef.current;
    const scrollEl = scrollRef.current;

    if (!headerEl || !tabsEl || !scrollEl) return;

    const updateHeights = () => {
      const headerHeight = Math.ceil(headerEl.getBoundingClientRect().height);
      const tabsHeight = Math.ceil(tabsEl.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--hdrH', `${headerHeight}px`);
      document.documentElement.style.setProperty('--tabsH', `${tabsHeight}px`);
    };

    const resizeObserver = new ResizeObserver(updateHeights);

    if (headerEl) resizeObserver.observe(headerEl);
    if (tabsEl) resizeObserver.observe(tabsEl);

    window.addEventListener('resize', updateHeights, { passive: true });
    updateHeights();

    const handleScroll = () => {
      if (scrollEl) {
        setIsScrolling(scrollEl.scrollTop > 2);
      }
    };

    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      resizeObserver.disconnect();
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', updateHeights);
    };
  }, []);

  useEffect(() => {
    const updateCtaVisibility = () => {
      const element = itineraryScrollRef.current;
      if (!element) return;

      const hasOverflow = element.scrollHeight > element.clientHeight + 8;
      const atEnd = element.scrollTop >= (element.scrollHeight - element.clientHeight - 4);
      setShowScrollCta(hasOverflow && !atEnd);
    };

    updateCtaVisibility();

    const element = itineraryScrollRef.current;
    if (element) {
      element.addEventListener('scroll', updateCtaVisibility);
      window.addEventListener('resize', updateCtaVisibility);
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', updateCtaVisibility);
      }
      window.removeEventListener('resize', updateCtaVisibility);
    };
  }, [selectedDay, tripData?.itinerary, activeTab]);

  useEffect(() => {
    if (!shouldUseGooglePlaces()) {
      console.log('[TripDetails] Google Maps API desabilitada');
      return;
    }

    const initMap = () => {
      if (!mapContainerRef.current || !tripData) return false;
      if (mapInitialized.current) return true;
      if (!window.google?.maps?.Map) return false;

      try {
        const firstPlace = tripData.itinerary?.[0]?.places?.[0];
        let center = { lat: -23.5505, lng: -46.6333 };

        if (firstPlace?.geometry?.location) {
          center = {
            lat: firstPlace.geometry.location.lat(),
            lng: firstPlace.geometry.location.lng()
          };
        } else if (tripData.destination_lat && tripData.destination_lng) {
          center = { lat: tripData.destination_lat, lng: tripData.destination_lng };
        }

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: center,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            }
          ]
        });

        mapInstanceRef.current = map;
        mapInitialized.current = true;
        return true;
      } catch (error) {
        console.error('[Map] Error creating map:', error);
        return false;
      }
    };

    if (initMap()) return;

    let intervalId;
    const timerId = setTimeout(() => {
      if (!initMap()) {
        let attempts = 0;
        intervalId = setInterval(() => {
          attempts++;
          if (initMap() || attempts >= 10) {
            clearInterval(intervalId);
          }
        }, 300);
      }
    }, 500);

    return () => {
      clearTimeout(timerId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [tripData]);

  useEffect(() => {
    if (!shouldUseGooglePlaces()) {
      // No need to log here again, parent useEffect already did
      return;
    }
    if (!mapInstanceRef.current || !tripData || !window.google?.maps) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const currentDay = tripData.itinerary?.[selectedDay];
    if (!currentDay?.places) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidLocations = false;

    currentDay.places.forEach((place, idx) => {
      const placeKey = `${selectedDay}-${idx}`;
      const enrichedPlace = enrichedPlaces[placeKey];
      const location = enrichedPlace?.geometry?.location;

      if (location) {
        const position = {
          lat: typeof location.lat === 'function' ? location.lat() : location.lat,
          lng: typeof location.lng === 'function' ? location.lng() : location.lng
        };

        const pinSvg = `
          <svg width="56" height="74" viewBox="0 0 56 74" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
              </linearGradient>
              <filter id="shadow${idx}">
                <feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.4"/>
              </filter>
            </defs>
            <path d="M28 3C18.059 3 10 11.059 10 21c0 15 18 38 18 38s18-23 18-38c0-9.941-8.059-18-18-18z"
                  fill="url(#grad${idx})"
                  filter="url(#shadow${idx})"
                  stroke="#FFFFFF"
                  stroke-width="3"/>
            <text x="28" y="26" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" style="text-shadow: 0 1px 3px rgba(0,0,0,0.4);">${idx + 1}</text>
          </svg>
        `;

        const marker = new window.google.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
          title: place.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg),
            scaledSize: new window.google.maps.Size(56, 74),
            anchor: new window.google.maps.Point(28, 74),
            labelOrigin: new window.google.maps.Point(28, 21)
          },
          animation: window.google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
          handlePlaceClick(idx);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        hasValidLocations = true;
      }
    });

    if (hasValidLocations) {
      mapInstanceRef.current.fitBounds(bounds);

      if (currentDay.places.length === 1) {
        const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
          mapInstanceRef.current.setZoom(15);
          window.google.maps.event.removeListener(listener);
        });
      }
    }

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [tripData, selectedDay, enrichedPlaces]);

  useEffect(() => {
    if (!shouldUseGooglePlaces()) {
      return;
    }
    if (!mapInstanceRef.current || selectedPlaceIndex === null || !tripData || !window.google?.maps) return;

    const currentDay = tripData.itinerary?.[selectedDay];
    if (!currentDay?.places) return;

    const placeKey = `${selectedDay}-${selectedPlaceIndex}`;
    const enrichedPlace = enrichedPlaces[placeKey];
    const location = enrichedPlace?.geometry?.location;

    if (location) {
      const position = {
        lat: typeof location.lat === 'function' ? location.lat() : location.lat,
        lng: typeof location.lng === 'function' ? location.lng() : location.lng
      };

      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setZoom(16);
    }
  }, [selectedPlaceIndex, selectedDay, tripData, enrichedPlaces]);

  useEffect(() => {
    if (!shouldUseGooglePlaces()) {
      return;
    }
    window.openPlaceDetails = (dayIndex, placeIndex) => {
      if (dayIndex === selectedDay) {
        handlePlaceClick(placeIndex);
      } else {
        setSelectedDay(dayIndex);
        setTimeout(() => handlePlaceClick(placeIndex), 100);
      }
    };

    return () => {
      delete window.openPlaceDetails;
    };
  }, [selectedDay, tripData, enrichedPlaces]);

  const handleScrollClick = () => {
    if (isScrollDebounced) return;

    setIsScrollDebounced(true);
    const element = itineraryScrollRef.current;

    if (element) {
      element.scrollBy({
        top: element.clientHeight - 96,
        behavior: 'smooth'
      });

      setTimeout(() => {
        setIsScrollDebounced(false);
      }, 350);
    }
  };

  const handleScrollKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleScrollClick();
    }
  };

  const handlePlaceClick = (placeIndex) => {
    const placeCombinedId = `${selectedDay}-${placeIndex}`;
    setSelectedPlaceId(placeCombinedId);
    setSelectedPlaceIndex(placeIndex);

    const currentDay = tripData.itinerary[selectedDay];
    const place = currentDay.places[placeIndex];
    const placeKey = `${selectedDay}-${placeIndex}`;
    const enrichedPlace = enrichedPlaces[placeKey] || place;

    setSelectedPlaceDetails({
      ...place,
      ...enrichedPlace,
      photos: enrichedPlace?.photos || place.photos || [],
      reviews: []
    });

    const newUrl = `${window.location.pathname}?id=${tripId}&day=${selectedDay + 1}&placeId=${placeCombinedId}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleClosePlaceDetails = () => {
    setSelectedPlaceId(null);
    setSelectedPlaceIndex(null);
    setSelectedPlaceDetails(null);

    const newUrl = `${window.location.pathname}?id=${tripId}&day=${selectedDay + 1}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleImageError = (index) => {
    setImageErrors(prev => {
      const currentSet = prev instanceof Set ? prev : new Set();
      return new Set([...currentSet, index]);
    });
  };

  const handleStealClick = async () => {
    const isAuthenticated = await base44.auth.isAuthenticated();

    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search + '#steal';
      base44.auth.redirectToLogin(currentUrl);
      return;
    }

    setIsStealModalOpen(true);
  };

  const handleStealConfirm = async () => {
    setIsStealLoading(true);

    try {
      await base44.entities.TripDerivation.create({
        source_trip_id: tripId,
        source_owner_id: tripData.created_by,
        status: 'preview',
        return_to_url: window.location.href,
        metadata: {
          locale: navigator.language,
          device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          entry_point: 'steal_tab',
          source_visibility: tripData.visibility || 'public'
        }
      });

      setIsStealModalOpen(false);
      setIsStealLoading(false);

      alert('Feature coming soon! Your interest has been recorded.');
    } catch (error) {
      console.error('Error creating derivation preview:', error);
      setIsStealLoading(false);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleFollowClick = async () => {
    if (!currentUser) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (isAuthor) return;

    if (followMutation.isPending || unfollowMutation.isPending) {
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleLikeClick = async () => {
    if (!currentUser) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (isAuthor) return;

    if (likeMutation.isPending || unlikeMutation.isPending) {
      return;
    }

    if (hasLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const handleEditClick = () => {
    alert("Trip editor coming soon.");
  };

  const cities = tripData ? getTripCities(tripData) : [];
  const firstCity = cities[0] || 'Unknown';

  if (isLoading || !tripData) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const authorFirstName = tripData.author_name?.split(' ')[0] || "Traveler";
  const likesCount = tripData?.likes || 0;

  const imagesForDisplay = activeTab === "photos" && placePhotos.length > 0
    ? placePhotos.map(p => p.url)
    : tripData.images || [
        tripData.image_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop"
      ];

  const tabs = [
    { id: "about", label: "About", Icon: Info },
    { id: "itinerary", label: "Itinerary", Icon: Map },
    { id: "steal", label: "Steal", Icon: Infinity },
    { id: "photos", label: "Photos", Icon: Image },
    { id: "comments", label: "Comments", Icon: MessageSquare },
  ];

  const currentDayPlaces = tripData.itinerary?.[selectedDay]?.places || [];

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white overflow-x-hidden pt-16">
      <style>{`
        :root {
          --hdrH: 0px;
          --tabsH: 0px;
        }
        body {
          overflow: hidden;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .trip-layout {
          display: grid;
          grid-template-columns: minmax(360px, 420px) ${selectedPlaceId ? 'minmax(400px, 520px)' : '0px'} 1fr;
          height: calc(100vh - 4rem);
          transition: grid-template-columns 250ms ease;
        }

        .column-center {
          overflow: hidden;
          background: #0A0B0F;
          transition: opacity 250ms ease;
          position: relative;
          z-index: 10;
          border-right: 1px solid #1F1F1F;
          opacity: 0;
          pointer-events: none;
        }

        .column-center.open {
          opacity: 1;
          pointer-events: all;
        }

        .walvee-scroll-cta {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          border-radius: 999px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          user-select: none;
          transition: opacity 0.25s ease, transform 0.15s ease;
          opacity: 1;
          border: 0;
        }

        .walvee-scroll-cta.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .walvee-scroll-cta.is-pulsing {
          animation: walvee-bounce 1.8s ease-in-out infinite;
        }

        @keyframes walvee-bounce {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -8px); }
        }

        .trip-header-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trip-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .trip-author-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .trip-title-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
          cursor: help;
        }

        .like-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 14px;
          font-weight: 600;
          color: #CFE0FF;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .like-pill:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(6px);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .like-pill:focus-visible {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }

        .like-pill:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .like-pill.liked {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.4);
          color: #60A5FA;
        }

        .like-pill.liked:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .city-link {
          color: #60A5FA;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .city-link:hover {
          color: #93C5FD;
          text-decoration: underline;
        }

        @media (max-width: 1280px) {
          .trip-layout {
            grid-template-columns: minmax(360px, 420px) 1fr;
          }
          .column-center {
            position: fixed;
            top: 4rem;
            left: 0;
            width: 100%;
            height: calc(100vh - 4rem);
            bottom: 0;
            z-index: 50;
            background: #0A0B0F;
            min-width: unset;
            border-right: none;
            transform: translateX(100%);
            opacity: 0;
            transition: transform 250ms ease, opacity 250ms ease;
          }
          .column-center.open {
            transform: translateX(0);
            opacity: 1;
            pointer-events: all;
          }
          .column-center.closed {
            transform: translateX(100%);
            opacity: 0;
            pointer-events: none;
          }
        }

        @media (max-width: 768px) {
          .trip-header-container {
            gap: 10px;
          }

          .trip-header-row {
            gap: 12px;
          }

          .like-pill {
            font-size: 13px;
            padding: 0 12px;
            height: 30px;
          }
        }
      `}</style>

      <div className="trip-layout">
        <aside className="column-left bg-[#0A0B0F] border-r border-[#1F1F1F] flex flex-col overflow-hidden">
          <div ref={headerRef} className="p-4 border-b border-[#1F1F1F]">
            <Link
              to={createPageUrl("Home")}
              className="flex items-center gap-2 text-[#1E66FF] hover:text-blue-400 mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>

            <div className="trip-header-container">
              <div className="trip-header-row">
                <div className="trip-author-info">
                  <UserAvatar
                    src={tripData.author_photo}
                    name={tripData.author_name || "Traveler"}
                    size="md"
                    email={tripData.created_by}
                  />
                  <Link
                    to={`${createPageUrl("Profile")}?email=${encodeURIComponent(tripData.created_by)}`}
                    className="font-semibold text-white text-sm truncate hover:text-blue-400 transition-colors"
                    title={tripData.author_name || "Traveler"}
                  >
                    {tripData.author_name || "Traveler"}
                  </Link>
                </div>

                {isAuthor ? (
                  <Button
                    onClick={handleEditClick}
                    className="bg-[#3B82F6] hover:bg-[#4C8FFF] text-white text-sm px-3 py-1.5 h-7 rounded-md font-semibold shrink-0"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Edit trip
                  </Button>
                ) : (
                  <Button
                    onClick={handleFollowClick}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={`text-sm px-3 py-1.5 h-7 rounded-md font-semibold transition-colors shrink-0 ${
                      isFollowing
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-[#3B82F6] hover:bg-[#4C8FFF] text-white"
                    }`}
                    title={isFollowing ? "Unfollow" : `Follow ${authorFirstName}`}
                  >
                    {(followMutation.isPending || unfollowMutation.isPending) ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {isFollowing ? "Unfollow" : `Follow ${authorFirstName}`}
                      </>
                    )}
                  </Button>
                )}
              </div>

              <h1
                className="trip-title-truncate text-lg font-semibold text-white leading-tight"
                title={tripData.title}
              >
                {tripData.title}
              </h1>

              {/* Updated City Links with Individual Clickable Cities */}
              <div className="flex items-center gap-1 text-xs min-w-0">
                <MapPin className="w-3 h-3 shrink-0 text-blue-400" />
                <div className="min-w-0 flex-1">
                  <CitiesScroller cities={cities} className="text-xs text-gray-400" makeLinks={true} />
                </div>
              </div>

              <div>
                <button
                  onClick={handleLikeClick}
                  disabled={likeMutation.isPending || unlikeMutation.isPending || isAuthor}
                  className={`like-pill ${hasLiked ? 'liked' : ''}`}
                  aria-pressed={hasLiked}
                  aria-label={hasLiked ? "Unlike this trip" : "Like this trip"}
                  title={hasLiked ? "Unlike this trip" : "Like this trip"}
                >
                  <ThumbsUp
                    className={`w-4 h-4 transition-all ${
                      hasLiked ? "fill-current" : ""
                    }`}
                  />
                  <span>{formatNumber(likesCount)}</span>
                </button>
              </div>
            </div>
          </div>

          <div ref={tabsRef} className={`place-tabs-fixed ${isScrolling ? 'scrolling' : ''}`}>
            <div className="flex border-b border-[#1F1F1F] overflow-x-auto scrollbar-hide bg-[#0A0B0F]">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-all group ${
                      isActive
                        ? "text-white bg-blue-600"
                        : "text-gray-500 hover:text-white hover:bg-[#1A1B23]"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <tab.Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                      <span className={`text-xs ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
                        {tab.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
            {activeTab === "photos" && (
              <div
                ref={dragScrollRef}
                className="h-full p-4"
              >
                {isLoadingPhotos ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : imagesForDisplay.length > 0 ? (
                  <>
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                      {imageErrors.has(currentImageIndex) ? (
                        <ImagePlaceholder type="image" />
                      ) : (
                        <img
                          src={imagesForDisplay[currentImageIndex]}
                          alt={tripData.title}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(currentImageIndex)}
                        />
                      )}

                      {!imageErrors.has(currentImageIndex) && (
                        <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1}/{imagesForDisplay.length}
                        </div>
                      )}

                      {imagesForDisplay.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imagesForDisplay.length) % imagesForDisplay.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imagesForDisplay.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                          >
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {imagesForDisplay.map((imageSrc, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => setCurrentImageIndex(idx)}>
                          {imageErrors.has(idx) ? (
                            <ImagePlaceholder type="image" />
                          ) : (
                            <img
                              src={imageSrc}
                              alt={`Trip photo ${idx + 1}`}
                              className={`w-full h-full object-cover transition-all ${currentImageIndex === idx ? 'ring-2 ring-blue-500' : ''}`}
                              onError={() => handleImageError(idx)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No photos found for this trip.
                  </div>
                )}
              </div>
            )}

            {activeTab === "itinerary" && (
              <div className="h-full flex flex-col">
                <div className="relative flex items-center gap-2 p-4 border-b border-[#1F1F1F]">
                  <button
                    onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
                    className="shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-30"
                    disabled={selectedDay === 0}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {tripData.itinerary?.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDay(idx)}
                        className={`shrink-0 px-4 py-3 rounded-lg text-sm transition-all relative ${
                          selectedDay === idx
                            ? "bg-gray-900 text-white"
                            : "bg-transparent text-gray-400 hover:text-white"
                        }`}
                      >
                        <div className="font-semibold mb-0.5">Day {String(day.day || idx + 1).padStart(2, '0')}</div>
                        <div className="text-xs opacity-80">{day.places_count || day.places?.length || "03"} places</div>
                        {selectedDay === idx && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedDay(Math.min((tripData.itinerary?.length || 1) - 1, selectedDay + 1))}
                    className="shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-30"
                    disabled={selectedDay === (tripData.itinerary?.length || 1) - 1}
                  >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  <div
                    ref={itineraryScrollRef}
                    className="h-full overflow-y-auto scrollbar-hide"
                  >
                    <div className="px-4 pt-4 pb-4">
                      <TravelerTips dayData={tripData.itinerary?.[selectedDay]} />
                    </div>

                    <div className="px-4 pb-20">
                      <div className="space-y-3">
                        {loadingDayPlaces && (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                          </div>
                        )}

                        {!loadingDayPlaces && currentDayPlaces.length > 0 ? (
                          currentDayPlaces.map((place, idx) => {
                            const placeCombinedId = `${selectedDay}-${idx}`;
                            const isSelected = selectedPlaceId === placeCombinedId;
                            const placeKey = `${selectedDay}-${idx}`;
                            const displayPlace = enrichedPlaces[placeKey] || place;
                            const priceInfo = getPriceRangeInfo(displayPlace.price_level);

                            return (
                              <button
                                key={idx}
                                onClick={() => handlePlaceClick(idx)}
                                data-place-id={placeCombinedId}
                                className={`w-full bg-gray-800/50 rounded-xl p-3 hover:bg-gray-800 transition-all text-left ${
                                  isSelected ? 'ring-2 ring-blue-500' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative shrink-0">
                                    <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center">
                                      <MapPin className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold mb-1 truncate">{displayPlace.name}</h4>
                                    <p className="text-xs text-gray-400 mb-1.5 truncate">{displayPlace.address}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-semibold text-yellow-500">{displayPlace.rating?.toFixed(1) || "N/A"}</span>
                                        <span className="text-xs text-gray-500">
                                          ({displayPlace.reviews_count?.toLocaleString() || "0"})
                                        </span>
                                      </div>

                                      {priceInfo && (
                                        <>
                                          <span className="text-xs text-gray-600">•</span>
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
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : !loadingDayPlaces ? (
                          <div className="flex items-center justify-center h-24 text-center text-gray-500 py-8">
                            No places planned for this day.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    className={`walvee-scroll-cta is-pulsing ${!showScrollCta ? 'hidden' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={handleScrollClick}
                    onKeyDown={handleScrollKeyDown}
                  >
                    <span className="chev"></span>
                    Scroll to see more
                  </button>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div
                ref={dragScrollRef}
                className="h-full p-4 space-y-4"
              >
                <div className="bg-[#111827] rounded-xl p-4 border border-[#1F1F1F]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-500 font-semibold">{tripData.itinerary?.reduce((sum, day) => sum + (day.places_count || day.places?.length || 0), 0) || "09"} Places</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-400">{cities.length} {cities.length === 1 ? 'City' : 'Cities'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-500 font-semibold">{tripData.duration_days || 4} days</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed">
                  {tripData.description || "Explore beautiful destinations and create unforgettable memories."}
                </p>

                <div className="flex flex-wrap gap-2">
                  {cities.map((city, idx) => (
                    <Link
                      key={idx}
                      to={`${createPageUrl("City")}?name=${encodeURIComponent(city)}`}
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      #{city.toLowerCase().replace(/\s+/g, '')}
                    </Link>
                  )) || (
                    <>
                      <span className="text-sm text-blue-400">#travel</span>
                      <span className="text-sm text-blue-400">#adventure</span>
                    </>
                  )}
                </div>

                <div className="border-t border-[#1F1F1F] pt-4">
                  <h3 className="font-semibold mb-3">Share this trip</h3>

                  <div className="mb-3">
                    <p className="text-sm text-blue-400 mb-2">
                      waivee.com/trip/{tripId}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 px-3 py-1 h-auto"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
                      <Instagram className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
                      <Linkedin className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "steal" && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="max-w-md text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Infinity className="w-10 h-10 text-white" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Make it yours. ✨
                    </h2>
                    <p className="text-gray-300 text-base leading-relaxed mb-4">
                      Steal this trip and make it your own. Customize everything — dates, places, pace, and budget — while giving credit to the original traveler who inspired it.
                    </p>
                  </div>

                  <Button
                    onClick={handleStealClick}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                  >
                    Steal this trip
                  </Button>

                  {derivations.length > 0 && (
                    <div className="bg-[#111827] rounded-xl p-4 border border-[#2A2B35]">
                      <p className="text-sm text-gray-400">
                        <span className="text-blue-400 font-semibold">{derivations.length}</span> {derivations.length === 1 ? 'traveler has' : 'travelers have'} already made this trip their own
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="h-full flex flex-col">
                <div
                  ref={dragScrollRef}
                  className="flex-1 p-4 pb-20"
                >
                  <div className="text-center text-gray-500 py-8">
                    No comments yet. Be the first to comment!
                  </div>
                </div>

                <div className="border-t border-[#1F1F1F] p-4">
                  <textarea
                    placeholder="Add a comment..."
                    className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring-blue-500"
                    rows={3}
                  />
                  <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
                    POST
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section
          className={`column-center ${selectedPlaceId ? 'open' : 'closed'}`}
        >
          {selectedPlaceId && selectedPlaceDetails && (
            <PlaceDetails
              place={selectedPlaceDetails}
              trip={tripData}
              onClose={handleClosePlaceDetails}
              user={user}
              openLoginModal={openLoginModal}
            />
          )}
        </section>

        <section className="column-right relative bg-[#1A1B23]">
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ minHeight: '100%', background: '#1A1B23' }}
          />
        </section>
      </div>

      <StealModal
        isOpen={isStealModalOpen}
        onClose={() => setIsStealModalOpen(false)}
        onConfirm={handleStealConfirm}
        trip={tripData}
        isLoading={isStealLoading}
      />
    </div>
  );
}
