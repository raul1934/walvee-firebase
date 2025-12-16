import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function DestinationCarousel() {
  const scrollRef = React.useRef(null);
  const [showArrows, setShowArrows] = React.useState(false);
  const [randomSeed] = React.useState(() => Math.random()); // Stable random seed

  // Fetch real cities from trips in database - randomize on each mount
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['homeCities', randomSeed],
    queryFn: async () => {
      try {
        // First try to get cities from cache
        const cachedCities = sessionStorage.getItem('walvee_cities_cache');
        if (cachedCities) {
          const cache = JSON.parse(cachedCities);
          // Check if cache is less than 10 minutes old
          if (Date.now() - cache.timestamp < 10 * 60 * 1000) {
            console.log('[DestinationCarousel] Using cached cities');
            return shuffleArray(cache.data);
          }
        }

        console.log('[DestinationCarousel] Fetching cities from API');
        const allTrips = await base44.entities.Trip.list();
        
        // Extract and count cities from trip destinations
        const cityCount = {};
        const cityImages = {};
        
        allTrips.forEach(trip => {
          if (!trip.destination) return;
          
          // Parse city name (format: "City, Country")
          const cityName = trip.destination.trim();
          
          // Count occurrences
          cityCount[cityName] = (cityCount[cityName] || 0) + 1;
          
          // Store first valid image for each city
          if (!cityImages[cityName] && trip.images && trip.images.length > 0) {
            cityImages[cityName] = trip.images[0];
          } else if (!cityImages[cityName] && trip.image_url) {
            cityImages[cityName] = trip.image_url;
          }
        });
        
        // Convert to array and sort by trip count
        const citiesArray = Object.entries(cityCount)
          .map(([name, count]) => ({
            name,
            tripsCount: count,
            image: cityImages[name] || `https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=400&fit=crop`
          }))
          .sort((a, b) => b.tripsCount - a.tripsCount)
          .slice(0, 12);
        
        // Cache the results
        sessionStorage.setItem('walvee_cities_cache', JSON.stringify({
          data: citiesArray,
          timestamp: Date.now()
        }));
        
        // Randomize order on each load
        return shuffleArray(citiesArray);
      } catch (error) {
        console.error('[DestinationCarousel] Error loading cities:', error);
        
        // Try to return cached data even if expired
        const cachedCities = sessionStorage.getItem('walvee_cities_cache');
        if (cachedCities) {
          const cache = JSON.parse(cachedCities);
          console.log('[DestinationCarousel] Using stale cache due to error');
          return shuffleArray(cache.data);
        }
        
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    const checkOverflow = () => {
      const element = scrollRef.current;
      if (element) {
        setShowArrows(element.scrollWidth > element.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [cities]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (cities.length === 0) return null;

  return (
    <div className="relative px-2 py-3">
      <div className="flex items-center justify-center gap-3">
        {showArrows && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 h-8 w-8"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth max-w-xl"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cities.map((city) => (
            <Link
              key={city.name}
              to={`${createPageUrl("City")}?name=${encodeURIComponent(city.name)}`}
              className="flex-shrink-0 group cursor-pointer"
            >
              <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-300 group-hover:scale-110">
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=400&fit=crop';
                  }}
                />
              </div>
              <p className="text-xs text-center mt-1 text-gray-300 group-hover:text-white transition-colors max-w-[64px] truncate">
                {city.name.split(',')[0]}
              </p>
            </Link>
          ))}
        </div>

        {showArrows && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 h-8 w-8"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}