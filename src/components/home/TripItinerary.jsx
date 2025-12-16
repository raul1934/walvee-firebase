import React, { useState, useRef } from "react";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const getPriceRangeText = (priceLevel) => {
  if (priceLevel === undefined || priceLevel === null || priceLevel === 0) {
    return null;
  }
  
  const priceRanges = {
    1: { label: "Inexpensive", symbol: "$" },
    2: { label: "Moderate", symbol: "$$" },
    3: { label: "Expensive", symbol: "$$$" },
    4: { label: "Very Expensive", symbol: "$$$$" }
  };
  
  return priceRanges[priceLevel] || null;
};

export default function TripItinerary({ trip, onPlaceClick }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const daysScrollRef = useRef(null);
  const navigate = useNavigate();

  if (!trip.itinerary || trip.itinerary.length === 0) {
    return (
      <div className="bg-[#1A1B23] rounded-3xl overflow-hidden border border-[#2A2B35] h-full flex items-center justify-center">
        <div className="p-6 text-center text-gray-400">
          <p>Nenhum roteiro disponível</p>
        </div>
      </div>
    );
  }

  const currentDay = trip.itinerary[selectedDay];
  const totalDays = trip.itinerary.length;

  const handlePlaceClick = (e, placeIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const place = currentDay.places[placeIndex];
    const placeInstanceId = `${selectedDay}-${placeIndex}`;
    
    if (onPlaceClick) {
      onPlaceClick({
        tripId: trip.id,
        dayIndex: selectedDay,
        placeIndex: placeIndex,
        place: place,
        placeInstanceId: placeInstanceId
      });
    }
  };

  const scrollDays = (direction) => {
    if (daysScrollRef.current) {
      const scrollAmount = 120;
      daysScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleDayClick = (dayIndex) => {
    setSelectedDay(dayIndex);
  };

  return (
    <div className="bg-[#1A1B23] rounded-3xl overflow-hidden border border-[#2A2B35] h-full flex flex-col">
      {/* Day Selector - Horizontal Carousel */}
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-[#2A2B35]">
        {totalDays > 3 && (
          <button
            onClick={(e) => { e.preventDefault(); scrollDays('left'); }}
            className="shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div 
          ref={daysScrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {trip.itinerary.map((day, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); handleDayClick(idx); }}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${
                selectedDay === idx
                  ? "bg-blue-600 text-white"
                  : "bg-[#2A2B35] text-gray-400 hover:text-white hover:bg-[#3A3B45]"
              }`}
            >
              <div className="font-semibold">Day {day.day || idx + 1}</div>
              <div className="text-xs opacity-80">{day.places_count || day.places?.length || 0} places</div>
            </button>
          ))}
        </div>

        {totalDays > 3 && (
          <button
            onClick={(e) => { e.preventDefault(); scrollDays('right'); }}
            className="shrink-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Places List - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3">
        <div className="space-y-3">
          {currentDay.places?.map((place, idx) => {
            const priceRange = getPriceRangeText(place.price_level);
            
            return (
              <button
                key={idx}
                onClick={(e) => handlePlaceClick(e, idx)}
                className="w-full bg-[#0D0D0D] rounded-xl p-3 hover:bg-[#1A1B23] transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white mb-1 truncate">{place.name}</h4>
                    <p className="text-xs text-gray-400 mb-1.5 truncate">{place.address}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {place.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-yellow-500">{place.rating?.toFixed(1)}</span>
                          {place.reviews_count > 0 && (
                            <span className="text-xs text-gray-500">({place.reviews_count?.toLocaleString()})</span>
                          )}
                        </div>
                      )}
                      {priceRange && (
                        <>
                          <span className="text-xs text-gray-600">•</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-green-400">{priceRange.symbol}</span>
                            <span className="text-xs text-gray-400">{priceRange.label}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}