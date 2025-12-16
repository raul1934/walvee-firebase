import React, { useState, useRef, useEffect } from "react";
import { MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileTripFilters({ trips, activeFilter, onFilterChange }) {
  const cityScrollRef = useRef(null);
  const yearScrollRef = useRef(null);
  const [filterType, setFilterType] = useState("city");
  const [showCityArrows, setShowCityArrows] = useState(false);
  const [showYearArrows, setShowYearArrows] = useState(false);

  // Extract unique cities from trips
  const cities = React.useMemo(() => {
    const cityMap = new Map();
    
    trips.forEach(trip => {
      if (trip.destination) {
        const parts = trip.destination.split(',');
        const city = parts[0]?.trim();
        
        if (city) {
          if (!cityMap.has(city)) {
            cityMap.set(city, { name: city, count: 1 });
          } else {
            cityMap.get(city).count++;
          }
        }
      }
    });
    
    return Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count);
  }, [trips]);

  // Extract unique years from trips
  const years = React.useMemo(() => {
    const yearMap = new Map();
    
    trips.forEach(trip => {
      if (trip.start_date) {
        const year = new Date(trip.start_date).getFullYear();
        
        if (!yearMap.has(year)) {
          yearMap.set(year, { year, count: 1 });
        } else {
          yearMap.get(year).count++;
        }
      }
    });
    
    return Array.from(yearMap.values())
      .sort((a, b) => b.year - a.year);
  }, [trips]);

  // Check if scroll is needed for cities
  useEffect(() => {
    const checkCityScroll = () => {
      if (cityScrollRef.current) {
        const hasOverflow = cityScrollRef.current.scrollWidth > cityScrollRef.current.clientWidth;
        setShowCityArrows(hasOverflow);
      }
    };

    checkCityScroll();
    window.addEventListener('resize', checkCityScroll);
    
    return () => window.removeEventListener('resize', checkCityScroll);
  }, [cities, filterType]);

  // Check if scroll is needed for years
  useEffect(() => {
    const checkYearScroll = () => {
      if (yearScrollRef.current) {
        const hasOverflow = yearScrollRef.current.scrollWidth > yearScrollRef.current.clientWidth;
        setShowYearArrows(hasOverflow);
      }
    };

    checkYearScroll();
    window.addEventListener('resize', checkYearScroll);
    
    return () => window.removeEventListener('resize', checkYearScroll);
  }, [years, filterType]);

  const scrollCity = (direction) => {
    if (cityScrollRef.current) {
      cityScrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  const scrollYear = (direction) => {
    if (yearScrollRef.current) {
      yearScrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  const handleFilterClick = (value) => {
    if (activeFilter === value) {
      onFilterChange(null);
    } else {
      onFilterChange(value);
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Filter Type Toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setFilterType("city");
            onFilterChange(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            filterType === "city"
              ? "bg-blue-600 text-white"
              : "bg-[#1A1B23] text-gray-400 hover:text-white hover:bg-[#2A2B35]"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          By city
        </button>
        
        <button
          onClick={() => {
            setFilterType("year");
            onFilterChange(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            filterType === "year"
              ? "bg-blue-600 text-white"
              : "bg-[#1A1B23] text-gray-400 hover:text-white hover:bg-[#2A2B35]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          By year
        </button>
      </div>

      {/* City Filter */}
      {filterType === "city" && cities.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-2">
            {showCityArrows && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 bg-[#1A1B23] hover:bg-[#2A2B35] h-8 w-8 rounded-full"
                onClick={() => scrollCity("left")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            <div
              ref={cityScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {cities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleFilterClick(city.name)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
                    activeFilter === city.name
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md"
                      : "bg-[#1A1B23] text-gray-300 hover:bg-[#2A2B35] hover:text-white"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <div className="text-center">
                    <div className="text-xs font-semibold whitespace-nowrap">{city.name}</div>
                    <div className={`text-[10px] ${activeFilter === city.name ? 'text-blue-100' : 'text-gray-500'}`}>
                      {city.count} {city.count === 1 ? 'trip' : 'trips'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {showCityArrows && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 bg-[#1A1B23] hover:bg-[#2A2B35] h-8 w-8 rounded-full"
                onClick={() => scrollCity("right")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Year Filter */}
      {filterType === "year" && years.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-2">
            {showYearArrows && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 bg-[#1A1B23] hover:bg-[#2A2B35] h-8 w-8 rounded-full"
                onClick={() => scrollYear("left")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            <div
              ref={yearScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {years.map((yearData) => (
                <button
                  key={yearData.year}
                  onClick={() => handleFilterClick(yearData.year)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
                    activeFilter === yearData.year
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md"
                      : "bg-[#1A1B23] text-gray-300 hover:bg-[#2A2B35] hover:text-white"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <div className="text-center">
                    <div className="text-xs font-semibold">{yearData.year}</div>
                    <div className={`text-[10px] ${activeFilter === yearData.year ? 'text-blue-100' : 'text-gray-500'}`}>
                      {yearData.count} {yearData.count === 1 ? 'trip' : 'trips'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {showYearArrows && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 bg-[#1A1B23] hover:bg-[#2A2B35] h-8 w-8 rounded-full"
                onClick={() => scrollYear("right")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}