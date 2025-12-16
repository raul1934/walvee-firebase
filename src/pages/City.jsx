
import React, { useState, useEffect, useRef } from "react";
import { Trip } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin } from "lucide-react";
import CityHeader from "../components/city/CityHeader";
import CityNavigation from "../components/city/CityNavigation";
import CityTripGrid from "../components/city/CityTripGrid";
import CityTopPlaces from "../components/city/CityTopPlaces";
import CityExplore from "../components/city/CityExplore";
import CityLocals from "../components/city/CityLocals";
import CityFavorites from "../components/city/CityFavorites";
import PlaceModal from "../components/city/PlaceModal";
import {
  shouldUseGooglePlaces,
  getGooglePlacesService,
  cache,
  getMockPlaces,
  CACHE_CONFIG
} from "../components/utils/googlePlacesConfig";

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";

console.log('[City Page] ===== MODULE LOADED =====');

export default function City({ user, openLoginModal, cityNameOverride, isModal = false }) {
  console.log('[City Page] ===== FUNCTION CALLED =====');
  console.log('[City Page] Received props:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.preferred_name || user?.full_name,
    hasOpenLoginModal: !!openLoginModal,
    openLoginModalType: typeof openLoginModal,
    cityNameOverride: cityNameOverride,
    isModal: isModal
  });

  const urlParams = new URLSearchParams(window.location.search);
  const cityName = cityNameOverride || urlParams.get("name") || urlParams.get("city");

  const [activeTab, setActiveTab] = useState("all");
  const [placeCategory, setPlaceCategory] = useState("all");
  const [offset, setOffset] = useState(0);
  const [allTrips, setAllTrips] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  const [placesOffset, setPlacesOffset] = useState(0);
  const [allPlaces, setAllPlaces] = useState([]);
  const [hasMorePlaces, setHasMorePlaces] = useState(true);

  const [enrichedTripPlaces, setEnrichedTripPlaces] = useState([]);
  const [isEnrichingTripPlaces, setIsEnrichingTripPlaces] = useState(false);

  const [imageErrors, setImageErrors] = useState(new Set());
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  const navigate = useNavigate();
  const observerRef = useRef();
  const loadingRef = useRef(false);
  const placesObserverRef = useRef();
  const placesLoadingRef = useRef(false);
  const contentRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  const LIMIT = 6;
  const PLACES_LIMIT = 6;

  const [isNavSticky, setIsNavSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsNavSticky(window.scrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const navHeight = 64;
      const offset = 20;
      const elementPosition = contentRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  // Load Google Maps API
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const checkAndLoad = () => {
      if (window.google?.maps?.places?.PlacesService) {
        console.log('[City] Google Maps API already loaded');
        setGoogleMapsLoaded(true);
        scriptLoadedRef.current = true;
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('[City] Google Maps script exists, waiting for load...');
        existingScript.addEventListener('load', () => {
          console.log('[City] Google Maps loaded via existing script');
          setGoogleMapsLoaded(true);
          scriptLoadedRef.current = true;
        });
        return;
      }

      console.log('[City] Loading Google Maps API...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('[City] Google Maps API loaded successfully');
        setGoogleMapsLoaded(true);
        scriptLoadedRef.current = true;
      };

      script.onerror = (error) => {
        console.error('[City] Error loading Google Maps API:', error);
      };

      document.head.appendChild(script);
    };

    checkAndLoad();
  }, []);

  const { data: trips = [], isLoading, refetch } = useQuery({
    queryKey: ['cityTrips', cityName, offset],
    queryFn: async () => {
      if (!cityName) return [];

      const allTrips = await Trip.list('-likes');

      const normalizedCityName = cityName.toLowerCase().trim();
      const cityNameOnly = normalizedCityName.split(',')[0].trim();

      let filtered = allTrips.filter(trip => {
        const destination = trip.destination?.toLowerCase().trim() || '';
        const destinationCity = destination.split(',')[0].trim();

        if (destinationCity === cityNameOnly || destination === normalizedCityName) {
          return true;
        }

        const locations = trip.locations?.map(loc => loc.toLowerCase().trim()) || [];

        return locations.some(loc => {
          const locCity = loc.split(',')[0].trim();
          return locCity === cityNameOnly || loc === normalizedCityName;
        });
      });

      return filtered;
    },
    enabled: !!cityName,
    staleTime: 12 * 60 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (trips.length === 0) {
      setAllTrips([]);
      setHasMore(false);
      return;
    }

    const newTrips = trips.slice(0, offset + LIMIT);
    setAllTrips(newTrips);
    setHasMore(newTrips.length < trips.length);
  }, [trips, offset]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current && !isLoading) {
          loadingRef.current = true;
          setTimeout(() => {
            setOffset(prev => prev + LIMIT);
            loadingRef.current = false;
          }, 300);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  useEffect(() => {
    setOffset(0);
    setAllTrips([]);
    setHasMore(true);
    setActiveTab("all");
    setPlacesOffset(0);
    setAllPlaces([]);
    setHasMorePlaces(true);
    setPlaceCategory("all");
  }, [cityName]);

  const topPlaces = React.useMemo(() => {
    if (!trips.length) return [];

    const placeCount = {};
    const placeDetails = {};

    trips.forEach(trip => {
      trip.itinerary?.forEach(day => {
        day.places?.forEach(place => {
          if (!place.name) return;

          const key = place.place_id || place.name;
          placeCount[key] = (placeCount[key] || 0) + 1;

          if (!placeDetails[key]) {
            placeDetails[key] = {
              name: place.name,
              address: place.address,
              place_id: place.place_id,
              rating: place.rating,
              price_level: place.price_level,
              types: place.types || [],
              mentions: 0,
              photo: place.photos?.[0] || null,
              photos: place.photos || [],
            };
          }
        });
      });
    });

    const placesFromTrips = Object.entries(placeCount)
      .map(([key, count]) => ({
        ...placeDetails[key],
        mentions: count
      }))
      .sort((a, b) => b.mentions - a.mentions);

    return placesFromTrips;
  }, [trips]);

  useEffect(() => {
    if (!topPlaces.length || !window.google?.maps?.places) {
      setEnrichedTripPlaces(topPlaces);
      return;
    }

    setIsEnrichingTripPlaces(true);
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));

    Promise.all(topPlaces.map(place =>
      new Promise((resolve) => {
        if (place.photo && place.rating) {
          resolve(place);
          return;
        }

        if (place.place_id) {
          service.getDetails(
            {
              placeId: place.place_id,
              fields: ['name', 'place_id', 'rating', 'user_ratings_total', 'price_level', 'photos', 'formatted_address']
            },
            (result, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                resolve({
                  ...place,
                  rating: result.rating || place.rating,
                  user_ratings_total: result.user_ratings_total || place.user_ratings_total,
                  price_level: result.price_level !== undefined ? result.price_level : place.price_level,
                  photo: result.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }) || place.photo,
                  photos: result.photos?.map(p => p.getUrl({ maxWidth: 800, maxHeight: 800 })) || place.photos,
                  address: result.formatted_address || place.address
                });
              } else {
                resolve(place);
              }
            }
          );
        } else {
          const request = {
            query: `${place.name}, ${place.address || cityName}`,
            fields: ['name', 'place_id', 'rating', 'user_ratings_total', 'price_level', 'photos', 'formatted_address']
          };

          service.textSearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
              const result = results[0];

              const resultAddress = result.formatted_address?.toLowerCase() || '';
              const cityNameOnly = cityName.split(',')[0].trim().toLowerCase();

              if (resultAddress.includes(cityNameOnly)) {
                resolve({
                  ...place,
                  place_id: result.place_id || place.place_id,
                  rating: result.rating || place.rating,
                  user_ratings_total: result.user_ratings_total || place.user_ratings_total,
                  price_level: result.price_level !== undefined ? result.price_level : place.price_level,
                  photo: result.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }) || place.photo,
                  photos: result.photos?.map(p => p.getUrl({ maxWidth: 800, maxHeight: 800 })) || place.photos,
                  address: result.formatted_address || place.address
                });
              } else {
                resolve(place);
              }
            } else {
              resolve(place);
            }
          });
        }
      })
    )).then((enriched) => {
      setEnrichedTripPlaces(enriched);
      setIsEnrichingTripPlaces(false);
    }).catch((error) => {
      console.error('Error enriching trip places:', error);
      setEnrichedTripPlaces(topPlaces);
      setIsEnrichingTripPlaces(false);
    });
  }, [topPlaces, cityName]);

  // Updated Google Places query with feature flag
  const { data: googlePlaces = [], isLoading: isLoadingGooglePlaces } = useQuery({
    queryKey: ['googlePlaces', cityName, placeCategory, activeTab, googleMapsLoaded],
    queryFn: async () => {
      // Check if Google Places is enabled via feature flag
      if (!shouldUseGooglePlaces()) {
        console.log('[City] Google Places API desabilitada - usando dados mock');
        return getMockPlaces(cityName);
      }

      if (!cityName || !googleMapsLoaded) {
        console.log('[City] Skipping Google Places search:', { cityName, googleMapsLoaded });
        return [];
      }

      try {
        // Check cache first
        const cacheKey = `city_${cityName}_${placeCategory}`;
        const cached = cache.get(cacheKey);

        if (cached) {
          console.log('[City] Usando cache do Google Places');
          return cached;
        }

        console.log('[City] Fetching Google Places...');
        const service = getGooglePlacesService();

        if (!service) {
          console.warn('[City] Service não disponível');
          return [];
        }

        let query;
        if (placeCategory === "all") {
          query = `top places in ${cityName}`;
        } else {
          query = `${placeCategory.replace(/_/g, ' ')} in ${cityName}`;
        }

        console.log('[City] Google Places query:', query);

        return new Promise((resolve) => {
          service.textSearch(
            { query: query },
            async (results, status) => {
              console.log('[City] Google Places response:', { status, count: results?.length });

              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const cityParts = cityName.split(',').map(p => p.trim().toLowerCase());
                const cityOnly = cityParts[0];

                const filteredResults = results.filter(place => {
                  const placeAddress = place.formatted_address?.toLowerCase() || '';
                  return placeAddress.includes(cityOnly);
                });

                console.log('[City] Filtered Google Places:', filteredResults.length);

                const detailedPlaces = await Promise.all(
                  filteredResults.map(place =>
                    new Promise((resolveDetail) => {
                      setTimeout(() => {
                        service.getDetails(
                          {
                            placeId: place.place_id,
                            fields: ['name', 'formatted_address', 'place_id', 'rating', 'user_ratings_total', 'price_level', 'types', 'photos', 'opening_hours']
                          },
                          (detailResult, detailStatus) => {
                            if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && detailResult) {
                              resolveDetail({
                                name: detailResult.name,
                                address: detailResult.formatted_address,
                                place_id: detailResult.place_id,
                                rating: detailResult.rating,
                                user_ratings_total: detailResult.user_ratings_total,
                                price_level: detailResult.price_level,
                                types: detailResult.types,
                                photos: detailResult.photos?.map(p => p.getUrl({ maxWidth: 800, maxHeight: 800 })) || [],
                                photo: detailResult.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }) || null,
                                opening_hours: detailResult.opening_hours,
                                mentions: 0,
                                source: 'google'
                              });
                            } else {
                              console.warn(`[City] Failed to fetch details for place ID ${place.place_id}. Status: ${detailStatus}`);
                              resolveDetail({
                                name: place.name,
                                address: place.formatted_address,
                                place_id: place.place_id,
                                rating: place.rating,
                                user_ratings_total: place.user_ratings_total,
                                price_level: place.price_level,
                                types: place.types,
                                photos: [],
                                photo: null,
                                mentions: 0,
                                source: 'google'
                              });
                            }
                          }
                        );
                      }, 50);
                    })
                  )
                );

                console.log('[City] Detailed Google Places:', detailedPlaces.length);

                // Cache results
                cache.set(cacheKey, detailedPlaces, CACHE_CONFIG.CITY_PLACES);

                resolve(detailedPlaces);
              } else {
                console.warn(`[City] Text search failed for query "${query}". Status: ${status}`);
                resolve([]);
              }
            }
          );
        });
      } catch (error) {
        console.error('[City] Error fetching Google Places:', error);
        return [];
      }
    },
    enabled: !!cityName && activeTab === "places" && googleMapsLoaded,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const combinedPlacesAll = React.useMemo(() => {
    const tripsPlaces = enrichedTripPlaces.filter(p => p.mentions > 0);
    const googleOnly = googlePlaces
      .filter(gp => !tripsPlaces.some(tp => tp.place_id === gp.place_id || tp.name === gp.name));

    let combined = [...tripsPlaces, ...googleOnly];

    const cityNameOnly = cityName?.split(',')[0].trim().toLowerCase() || '';

    combined = combined.filter(place => {
      const placeAddress = place.address?.toLowerCase() || '';
      return placeAddress.includes(cityNameOnly);
    });

    if (placeCategory !== "all") {
      combined = combined.filter(place =>
        place.types?.some(type =>
          type.toLowerCase().includes(placeCategory.toLowerCase()) ||
          placeCategory.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    return combined.sort((a, b) => {
      if (a.mentions && !b.mentions) return -1;
      if (!a.mentions && b.mentions) return 1;
      if (a.mentions && b.mentions) return b.mentions - a.mentions;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [enrichedTripPlaces, googlePlaces, placeCategory, cityName]);

  useEffect(() => {
    if (activeTab !== "places") return;

    if (combinedPlacesAll.length === 0) {
      setAllPlaces([]);
      setHasMorePlaces(false);
      return;
    }

    const newPlaces = combinedPlacesAll.slice(0, placesOffset + PLACES_LIMIT);
    setAllPlaces(newPlaces);
    setHasMorePlaces(newPlaces.length < combinedPlacesAll.length);
  }, [combinedPlacesAll, placesOffset, activeTab]);

  useEffect(() => {
    if (activeTab === "places") {
      setPlacesOffset(0);
      setAllPlaces([]);
      setHasMorePlaces(true);
    }
  }, [placeCategory, activeTab]);

  useEffect(() => {
    if (activeTab !== "places") return;

    const currentPlacesObserverRef = placesObserverRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePlaces && !placesLoadingRef.current && !isLoadingGooglePlaces && !isEnrichingTripPlaces) {
          placesLoadingRef.current = true;
          setTimeout(() => {
            setPlacesOffset(prev => prev + PLACES_LIMIT);
            placesLoadingRef.current = false;
          }, 300);
        }
      },
      { threshold: 0.5 }
    );

    if (currentPlacesObserverRef) {
      observer.observe(currentPlacesObserverRef);
    }

    return () => {
      if (currentPlacesObserverRef) {
        observer.disconnect();
      }
    };
  }, [hasMorePlaces, isLoadingGooglePlaces, isEnrichingTripPlaces, activeTab]);

  const relatedCities = React.useMemo(() => {
    if (!trips.length) return [];

    const cityCount = {};
    trips.forEach(trip => {
      const allCities = [trip.destination, ...(trip.locations || [])];
      allCities.forEach(city => {
        if (!city || city.toLowerCase().includes(cityName?.toLowerCase())) return;
        cityCount[city] = (cityCount[city] || 0) + 1;
      });
    });

    return Object.entries(cityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([city, count]) => ({ name: city, tripsCount: count }));
  }, [trips, cityName]);

  const featuredLocals = React.useMemo(() => {
    if (!trips.length) return [];

    const authorCount = {};
    trips.forEach(trip => {
      const authorId = trip.created_by;
      if (!authorCount[authorId]) {
        authorCount[authorId] = {
          id: authorId,
          name: trip.author_name,
          avatar: trip.author_photo,
          tripsCount: 0,
          followers: 0
        };
      }
      authorCount[authorId].tripsCount++;
    });

    return Object.values(authorCount)
      .sort((a, b) => b.tripsCount - a.tripsCount)
      .slice(0, 6);
  }, [trips]);

  const favoriteTrips = React.useMemo(() => {
    return [...trips]
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 12);
  }, [trips]);

  const handleCreateTrip = () => {
    if (!user && openLoginModal) {
      openLoginModal();
    } else {
      alert(`Create trip feature coming soon for ${cityName}!`);
    }
  };

  const handlePlaceClick = (place) => {
    console.log('[City Page] ===== handlePlaceClick =====');
    console.log('[City Page] Place clicked:', {
      placeName: place.name,
      hasUser: !!user,
      userId: user?.id,
      userName: user?.preferred_name || user?.full_name,
      hasOpenLoginModal: !!openLoginModal
    });

    console.log('[City Page] Setting selectedPlace and opening modal');
    setSelectedPlace(place);
    setIsPlaceModalOpen(true);
  };

  const handleClosePlaceModal = () => {
    console.log('[City Page] Closing PlaceModal');
    setIsPlaceModalOpen(false);
    setTimeout(() => setSelectedPlace(null), 300);
  };

  if (!cityName) {
    return (
      <div className="min-h-screen bg-[#0C0E11] text-white flex items-center justify-center pt-16">
        <p className="text-gray-400">No city specified</p>
      </div>
    );
  }

  console.log('[City Page] ===== ABOUT TO RENDER =====');
  console.log('[City Page] PlaceModal state:', {
    hasPlace: !!selectedPlace,
    placeName: selectedPlace?.name,
    isOpen: isPlaceModalOpen,
    hasUser: !!user,
    userId: user?.id,
    hasOpenLoginModal: !!openLoginModal
  });

  return (
    <div className={`min-h-screen bg-[#0C0E11] text-white ${isModal ? '' : 'pt-16'}`}>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <CityHeader
        cityName={cityName}
        onCreateTrip={handleCreateTrip}
      />

      <CityNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cityName={cityName}
        onCreateTrip={handleCreateTrip}
        placeCategory={placeCategory}
        onCategoryChange={setPlaceCategory}
      />

      <div ref={contentRef} className="pb-12">
        {activeTab === "all" && (
          <>
            <CityTripGrid
              trips={allTrips}
              isLoading={isLoading && offset === 0}
              currentUserId={user?.id}
            />

            {hasMore && !isLoading && (
              <div ref={observerRef} className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
              </div>
            )}

            {!hasMore && allTrips.length > 0 && (
              <p className="text-center text-gray-500 py-12">
                You've seen all trips in {cityName}
              </p>
            )}

            {!isLoading && allTrips.length === 0 && (
              <div className="container mx-auto px-6 text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="2xl font-bold text-white mb-4">
                    No trips found in {cityName}
                  </h3>
                  <p className="text-gray-400 mb-8">
                    Be the first to create an amazing journey here!
                  </p>
                  <button
                    onClick={handleCreateTrip}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl font-bold text-white transition-all hover:scale-105"
                  >
                    Create the first trip
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "places" && (
          <>
            <CityTopPlaces
              places={allPlaces}
              cityName={cityName}
              isLoading={(isLoadingGooglePlaces || isEnrichingTripPlaces) && placesOffset === 0}
              onPlaceClick={handlePlaceClick}
            />

            {hasMorePlaces && !isLoadingGooglePlaces && !isEnrichingTripPlaces && (
              <div ref={placesObserverRef} className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent" />
              </div>
            )}

            {!hasMorePlaces && allPlaces.length > 0 && (
              <p className="text-center text-gray-500 py-12">
                You've seen all places in {cityName}
              </p>
            )}

            {!isLoadingGooglePlaces && !isEnrichingTripPlaces && allPlaces.length === 0 && !hasMorePlaces && combinedPlacesAll.length === 0 && (
              <div className="container mx-auto px-6 text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="2xl font-bold text-white mb-4">
                    No places found
                  </h3>
                  <p className="text-gray-400 mb-4">
                    No {placeCategory === "all" ? "places" : placeCategory.replace(/_/g, ' ')} found in {cityName}.
                  </p>
                  <button
                    onClick={() => setPlaceCategory("all")}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Show all places
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "locals" && (
          <div className="container mx-auto px-6">
            <CityLocals
              cityName={cityName}
            />
          </div>
        )}

        {activeTab === "favorites" && (
          <CityFavorites
            cityName={cityName}
            user={user}
            onPlaceClick={handlePlaceClick}
          />
        )}

        <CityExplore
          relatedCities={relatedCities}
          featuredLocals={featuredLocals}
          currentCity={cityName}
        />
      </div>

      <PlaceModal
        place={selectedPlace}
        trip={null}
        isOpen={isPlaceModalOpen}
        onClose={handleClosePlaceModal}
        user={user}
        openLoginModal={openLoginModal}
      />
    </div>
  );
}
