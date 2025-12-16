import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useGlobalSearch } from '../search/useGlobalSearch';
import SearchResultItem from '../search/SearchResultItem';

export default function CitySearch({ cityName, inline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  // Pass cityName as context to filter results
  const { query, setQuery, results, isLoading, clearSearch } = useGlobalSearch(cityName);

  const handleClose = () => {
    setIsOpen(false);
    clearSearch();
  };

  // Get counts
  const citiesCount = 0; // Don't show other cities in city-specific search
  const tripsCount = results.trips?.length || 0;
  const placesCount = results.places?.length || 0;
  const travelersCount = results.travelers?.length || 0;
  const totalResults = tripsCount + placesCount + travelersCount;

  if (inline) {
    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search trips, places, locals in ${cityName}...`}
          className="w-full bg-[#1A1B23] border border-[#2A2B35] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {query.length >= 2 && totalResults > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
            <div className="p-2">
              {results.trips && results.trips.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 px-2 mb-1">Trips in {cityName}</p>
                  {results.trips.map((trip) => (
                    <SearchResultItem
                      key={`trip-${trip.id}`}
                      result={{ ...trip, type: 'trip' }}
                      onClose={handleClose}
                    />
                  ))}
                </div>
              )}
              
              {results.places && results.places.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 px-2 mb-1">Places in {cityName}</p>
                  {results.places.map((place, idx) => (
                    <SearchResultItem
                      key={`place-${idx}`}
                      result={{ ...place, type: 'place' }}
                      onClose={handleClose}
                    />
                  ))}
                </div>
              )}
              
              {results.travelers && results.travelers.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 px-2 mb-1">Locals in {cityName}</p>
                  {results.travelers.map((traveler) => (
                    <SearchResultItem
                      key={`traveler-${traveler.id}`}
                      result={{ ...traveler, type: 'traveler' }}
                      onClose={handleClose}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1A1B23] hover:bg-[#2A2B35] border border-[#2A2B35] rounded-lg transition-colors"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Search in {cityName}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl bg-[#0D0D0D] rounded-2xl border border-[#1F1F1F] shadow-2xl">
            <div className="p-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search trips, places, locals in ${cityName}...`}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-[#1A1B23] hover:bg-[#2A2B35] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              </div>
            )}

            {!isLoading && query.length >= 2 && totalResults > 0 && (
              <div className="max-h-96 overflow-y-auto p-4">
                {results.trips && results.trips.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 font-semibold mb-2">Trips in {cityName}</p>
                    <div className="space-y-1">
                      {results.trips.map((trip) => (
                        <SearchResultItem
                          key={`trip-${trip.id}`}
                          result={{ ...trip, type: 'trip' }}
                          onClose={handleClose}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {results.places && results.places.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 font-semibold mb-2">Places in {cityName}</p>
                    <div className="space-y-1">
                      {results.places.map((place, idx) => (
                        <SearchResultItem
                          key={`place-${idx}`}
                          result={{ ...place, type: 'place' }}
                          onClose={handleClose}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {results.travelers && results.travelers.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 font-semibold mb-2">Locals in {cityName}</p>
                    <div className="space-y-1">
                      {results.travelers.map((traveler) => (
                        <SearchResultItem
                          key={`traveler-${traveler.id}`}
                          result={{ ...traveler, type: 'traveler' }}
                          onClose={handleClose}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLoading && query.length >= 2 && totalResults === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-400">No results found in {cityName}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}