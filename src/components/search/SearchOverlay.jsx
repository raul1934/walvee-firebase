import React, { useState, useEffect, useRef } from "react";
import { X, Search, MapPin, Map, Compass, Users, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchResultItem from "./SearchResultItem";
import PlaceModal from "../city/PlaceModal";

export default function SearchOverlay({ 
  isOpen, 
  onClose, 
  query, 
  setQuery, 
  results, 
  isLoading, 
  error, 
  retrySearch,
  onPlaceClick,
  cityContext = null
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const inputRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isPlaceModalOpen) {
          handleClosePlaceModal();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isPlaceModalOpen]);

  const handlePlaceClick = (place) => {
    console.log('[SearchOverlay] Place clicked:', place.name);
    setSelectedPlace(place);
    setIsPlaceModalOpen(true);
  };

  const handleClosePlaceModal = () => {
    console.log('[SearchOverlay] Closing PlaceModal');
    setIsPlaceModalOpen(false);
    setTimeout(() => setSelectedPlace(null), 300);
  };

  if (!isOpen) return null;

  // Get counts - usando travelers
  const citiesCount = results.cities?.length || 0;
  const tripsCount = results.trips?.length || 0;
  const placesCount = results.places?.length || 0;
  const travelersCount = results.travelers?.length || 0;
  const totalResults = citiesCount + tripsCount + placesCount + travelersCount;

  const hasResults = totalResults > 0;

  // Filter results based on active filter
  const shouldShowCities = activeFilter === "all" || activeFilter === "cities";
  const shouldShowTrips = activeFilter === "all" || activeFilter === "trips";
  const shouldShowPlaces = activeFilter === "all" || activeFilter === "places";
  const shouldShowTravelers = activeFilter === "all" || activeFilter === "travelers";

  const filters = [
    { id: "all", label: "All", count: totalResults, icon: Search },
    { id: "cities", label: "Cities", count: citiesCount, icon: MapPin },
    { id: "trips", label: "Trips", count: tripsCount, icon: Map },
    { id: "places", label: "Places", count: placesCount, icon: Compass },
    { id: "travelers", label: "Travelers", count: travelersCount, icon: Users },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
        onClick={(e) => {
          if (isPlaceModalOpen) {
            handleClosePlaceModal();
          } else {
            onClose();
          }
        }}
      >
        <div className="flex justify-center items-start gap-4 pt-20 px-4 h-full">
          {/* Search Results Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative bg-[#0D0D0D] rounded-2xl border border-[#1F1F1F] shadow-2xl overflow-hidden transition-all ${
              isPlaceModalOpen ? 'w-full max-w-2xl' : 'w-full max-w-3xl'
            }`}
          >
            {/* Search Header */}
            <div className="p-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search cities, trips, places, travelers..."
                    className="w-full bg-[#1A1B23] border border-[#2A2B35] rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-[#1A1B23] hover:bg-[#2A2B35] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#1A1B23] text-gray-400 hover:bg-[#2A2B35] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{filter.label}</span>
                      {filter.count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                          isActive ? 'bg-blue-700' : 'bg-[#2A2B35]'
                        }`}>
                          {filter.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Content */}
            <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
                  <p className="text-gray-400">Searching...</p>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Search Error</h3>
                  <p className="text-gray-400 text-center mb-4">{error}</p>
                  <button
                    onClick={retrySearch}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!isLoading && !error && !hasResults && query.length >= 2 && (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                  <p className="text-gray-400 text-center">
                    Try searching for something else
                  </p>
                </div>
              )}

              {!isLoading && !error && hasResults && (
                <div className="p-4 space-y-6">
                  {/* Cities Section */}
                  {shouldShowCities && citiesCount > 0 && (
                    <div>
                      {activeFilter === "all" && (
                        <div className="flex items-center gap-2 mb-3 px-2">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                            Cities ({citiesCount})
                          </h3>
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.cities.map((city, idx) => (
                          <SearchResultItem 
                            key={`city-${city.id || idx}`}
                            result={{ ...city, type: 'city' }}
                            onClose={onClose}
                            onPlaceClick={handlePlaceClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trips Section */}
                  {shouldShowTrips && tripsCount > 0 && (
                    <div>
                      {activeFilter === "all" && (
                        <div className="flex items-center gap-2 mb-3 px-2">
                          <Map className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                            Trips ({tripsCount})
                          </h3>
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.trips.map((trip) => (
                          <SearchResultItem 
                            key={`trip-${trip.id}`}
                            result={{ ...trip, type: 'trip' }}
                            onClose={onClose}
                            onPlaceClick={handlePlaceClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Places Section */}
                  {shouldShowPlaces && placesCount > 0 && (
                    <div>
                      {activeFilter === "all" && (
                        <div className="flex items-center gap-2 mb-3 px-2">
                          <Compass className="w-4 h-4 text-green-400" />
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                            Places ({placesCount})
                          </h3>
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.places.map((place, idx) => (
                          <SearchResultItem 
                            key={`place-${place.place_id || idx}`}
                            result={{ ...place, type: 'place' }}
                            onClose={onClose}
                            onPlaceClick={handlePlaceClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Travelers Section */}
                  {shouldShowTravelers && travelersCount > 0 && (
                    <div>
                      {activeFilter === "all" && (
                        <div className="flex items-center gap-2 mb-3 px-2">
                          <Users className="w-4 h-4 text-yellow-400" />
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                            Travelers ({travelersCount})
                          </h3>
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.travelers.map((traveler) => (
                          <SearchResultItem 
                            key={`traveler-${traveler.id}`}
                            result={{ ...traveler, type: 'traveler' }}
                            onClose={onClose}
                            onPlaceClick={handlePlaceClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Place Modal */}
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <PlaceModal
                place={selectedPlace}
                trip={null}
                isOpen={isPlaceModalOpen}
                onClose={handleClosePlaceModal}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}