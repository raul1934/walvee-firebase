
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Map, Heart, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import PlaceCategoryFilter from "../city/PlaceCategoryFilter";
import CityTripGrid from "../city/CityTripGrid";
import CityTopPlaces from "../city/CityTopPlaces";
import CityLocals from "../city/CityLocals";
import CityFavorites from "../city/CityFavorites";
import PlaceModal from "../city/PlaceModal";

const tabs = [
  { id: "all", label: "All Trips", icon: Map },
  { id: "places", label: "Top Places", icon: Sparkles },
  { id: "locals", label: "Locals", icon: Users },
  { id: "favorites", label: "Favorites", icon: Heart }
];

export default function CityModalContent({ cityName, user, openLoginModal, onAddToTrip }) {
  const [activeTab, setActiveTab] = useState("all");
  const [placeCategory, setPlaceCategory] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  
  const [offset, setOffset] = useState(0);
  const [allTrips, setAllTrips] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef();
  const loadingRef = useRef(false);

  const LIMIT = 6;

  // Fetch trips for this city
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['cityTrips', cityName],
    queryFn: async () => {
      if (!cityName) return [];

      const allTrips = await base44.entities.Trip.list('-likes');

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

  // Calculate top places from trips
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
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 12);

    return placesFromTrips;
  }, [trips]);

  // Filter places by category
  const filteredPlaces = React.useMemo(() => {
    if (placeCategory === "all") return topPlaces;

    return topPlaces.filter(place =>
      place.types?.some(type =>
        type.toLowerCase().includes(placeCategory.toLowerCase()) ||
        placeCategory.toLowerCase().includes(type.toLowerCase())
      )
    );
  }, [topPlaces, placeCategory]);

  const handlePlaceClick = (place) => {
    console.log('[CityModalContent] Place clicked:', place);
    setSelectedPlace(place);
    setIsPlaceModalOpen(true);
  };

  const handleClosePlaceModal = () => {
    console.log('[CityModalContent] Closing PlaceModal');
    setIsPlaceModalOpen(false);
    setTimeout(() => setSelectedPlace(null), 300);
  };

  const [city, country] = cityName?.split(',').map((s) => s.trim()) || [cityName, ''];

  return (
    <div className="min-h-full bg-[#0C0E11] text-white">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* City Header - Adapted for modal */}
      <div className="relative overflow-hidden min-h-[200px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C0E11]/50 to-[#0C0E11]" />
        
        <motion.div 
          className="absolute top-5 left-1/4 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="relative z-10 container mx-auto px-6 py-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <MapPin className="w-6 h-6 text-blue-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {cityName}
                </span>
              </h1>
            </div>

            <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto">
              Trips, tips, and journeys curated by travelers and locals.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="pt-2"
            >
              <Button
                onClick={() => {
                  console.log('[CityModalContent] Add to Trip clicked for:', cityName);
                  onAddToTrip();
                }}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-3 text-sm font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 border-0"
              >
                Add to Trip
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Navigation - Non-sticky for modal */}
      <div className="bg-[#0C0E11]/95 border-b border-[#1F1F1F]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-3 py-3">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-[#1A1B23] text-gray-400 hover:text-white hover:bg-[#2A2B35]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Filter */}
            {activeTab === "places" && (
              <div className="border-t border-[#1F1F1F] pt-2">
                <PlaceCategoryFilter 
                  activeCategory={placeCategory}
                  onCategoryChange={setPlaceCategory}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-8">
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
                  <h3 className="text-2xl font-bold text-white mb-4">
                    No trips found in {cityName}
                  </h3>
                  <p className="text-gray-400 mb-8">
                    Be the first to create an amazing journey here!
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "places" && (
          <>
            <CityTopPlaces
              places={filteredPlaces}
              cityName={cityName}
              isLoading={isLoading}
              onPlaceClick={handlePlaceClick}
            />

            {!isLoading && filteredPlaces.length === 0 && (
              <div className="container mx-auto px-6 text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
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
            <CityLocals cityName={cityName} />
          </div>
        )}

        {activeTab === "favorites" && (
          <CityFavorites
            cityName={cityName}
            user={user}
            onPlaceClick={handlePlaceClick}
          />
        )}
      </div>

      {/* Place Modal */}
      {selectedPlace && (
        <PlaceModal
          place={selectedPlace}
          trip={{ destination: cityName, id: 'inspire-modal' }}
          isOpen={isPlaceModalOpen}
          onClose={handleClosePlaceModal}
          user={user}
          openLoginModal={openLoginModal}
        />
      )}
    </div>
  );
}
