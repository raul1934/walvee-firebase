import React, { useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CityFilters({ 
  topCities, 
  topPlaces, 
  selectedCities, 
  selectedPlaces,
  onCityToggle,
  onPlaceToggle 
}) {
  const citiesScrollRef = useRef(null);
  const placesScrollRef = useRef(null);

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (topCities.length === 0 && topPlaces.length === 0) return null;

  return (
    <div className="container mx-auto px-6 mb-12 space-y-8">
      {/* Cities Filter */}
      {topCities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">
              Top Cities in Trips
            </h3>
            {selectedCities.length > 0 && (
              <button
                onClick={() => selectedCities.forEach(city => onCityToggle(city))}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Clear all ({selectedCities.length})
              </button>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={() => scrollContainer(citiesScrollRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1A1B23]/95 backdrop-blur-sm hover:bg-[#2A2B35] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-[#2A2B35]"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div 
              ref={citiesScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {topCities.map((city, idx) => {
                const isSelected = selectedCities.includes(city);
                return (
                  <motion.button
                    key={city}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onCityToggle(city)}
                    className={`shrink-0 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-[#1A1B23] text-gray-300 hover:bg-[#2A2B35] hover:text-white border border-[#2A2B35] hover:border-blue-500/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {city}
                      {isSelected && <X className="w-3.5 h-3.5" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => scrollContainer(citiesScrollRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1A1B23]/95 backdrop-blur-sm hover:bg-[#2A2B35] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-[#2A2B35]"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Places Filter */}
      {topPlaces.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">
              Top Places
            </h3>
            {selectedPlaces.length > 0 && (
              <button
                onClick={() => selectedPlaces.forEach(place => onPlaceToggle(place))}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Clear all ({selectedPlaces.length})
              </button>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={() => scrollContainer(placesScrollRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1A1B23]/95 backdrop-blur-sm hover:bg-[#2A2B35] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-[#2A2B35]"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div 
              ref={placesScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {topPlaces.map((place, idx) => {
                const isSelected = selectedPlaces.includes(place);
                return (
                  <motion.button
                    key={place}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onPlaceToggle(place)}
                    className={`shrink-0 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-[#1A1B23] text-gray-300 hover:bg-[#2A2B35] hover:text-white border border-[#2A2B35] hover:border-purple-500/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {place}
                      {isSelected && <X className="w-3.5 h-3.5" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => scrollContainer(placesScrollRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1A1B23]/95 backdrop-blur-sm hover:bg-[#2A2B35] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-[#2A2B35]"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}