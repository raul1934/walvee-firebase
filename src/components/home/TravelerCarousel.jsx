import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserAvatar from "../common/UserAvatar";

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function TravelerCarousel() {
  const scrollRef = React.useRef(null);
  const [randomSeed] = React.useState(() => Math.random());

  const { data: travelers = [], isLoading } = useQuery({
    queryKey: ['homeTravelers', randomSeed],
    queryFn: async () => {
      try {
        // Create cache key with domain to avoid cross-domain cache issues
        const domain = window.location.hostname;
        const cacheKey = `walvee_travelers_cache_${domain}`;
        
        // First try to get users from cache
        const cachedUsers = sessionStorage.getItem(cacheKey);
        if (cachedUsers) {
          const cache = JSON.parse(cachedUsers);
          if (Date.now() - cache.timestamp < 10 * 60 * 1000) {
            console.log('[TravelerCarousel] Using cached travelers');
            return shuffleArray(cache.data);
          }
        }

        console.log('[TravelerCarousel] Fetching travelers...');
        
        let travelers = [];
        
        // Try to get users from User entity first (if authenticated)
        try {
          const isAuthenticated = await base44.auth.isAuthenticated();
          if (isAuthenticated) {
            console.log('[TravelerCarousel] User authenticated, trying User.list()');
            const allUsers = await base44.entities.User.list();
            
            travelers = allUsers
              .filter(user => {
                if (!user.email) return false;
                
                const email = user.email.toLowerCase();
                const isFakeEmail = 
                  email.includes('test@') || 
                  email.includes('fake@') || 
                  email.includes('@example.') ||
                  email.startsWith('test') ||
                  email.startsWith('fake');
                
                if (isFakeEmail) return false;
                
                const hasName = !!(user.preferred_name || user.full_name);
                if (!hasName) return false;
                
                return true;
              })
              .map(user => ({
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                preferred_name: user.preferred_name,
                photo_url: user.photo_url,
                picture: user.picture,
                metrics_my_trips: user.metrics_my_trips || 0,
                metrics_followers: user.metrics_followers || 0,
                metrics_following: user.metrics_following || 0,
                created_date: user.created_date,
                score: (user.metrics_my_trips || 0) * 10 + 
                       (user.metrics_followers || 0) * 5 + 
                       (user.metrics_following || 0) * 2 +
                       (user.photo_url || user.picture ? 5 : 0)
              }))
              .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
              })
              .slice(0, 15);
            
            console.log('[TravelerCarousel] Got', travelers.length, 'travelers from User entity');
          }
        } catch (error) {
          console.warn('[TravelerCarousel] Could not fetch from User entity:', error.message);
        }
        
        // If we couldn't get users from User entity, build from trips
        if (travelers.length === 0) {
          console.log('[TravelerCarousel] Building travelers from trips (public data)');
          
          const allTrips = await base44.entities.Trip.list();
          const userMap = new Map();
          
          allTrips.forEach(trip => {
            const email = trip.created_by;
            if (!email) return;
            
            // Skip fake/test emails
            const emailLower = email.toLowerCase();
            if (emailLower.includes('test@') || 
                emailLower.includes('fake@') || 
                emailLower.includes('@example.') ||
                emailLower.startsWith('test') ||
                emailLower.startsWith('fake')) {
              return;
            }
            
            const name = trip.author_name;
            const photo = trip.author_photo;
            
            if (!name) return;
            
            if (!userMap.has(email)) {
              userMap.set(email, {
                id: email,
                email: email,
                full_name: name,
                preferred_name: name.split(' ')[0],
                photo_url: photo,
                picture: photo,
                metrics_my_trips: 1,
                metrics_followers: 0,
                metrics_following: 0,
                created_date: trip.created_date,
                score: 10
              });
            } else {
              const user = userMap.get(email);
              user.metrics_my_trips += 1;
              user.score += 10;
            }
          });
          
          travelers = Array.from(userMap.values())
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
            })
            .slice(0, 15);
          
          console.log('[TravelerCarousel] Built', travelers.length, 'travelers from trips');
        }
        
        // Cache the results with domain-specific key
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: travelers,
          timestamp: Date.now()
        }));
        
        // Randomize order on each load
        return shuffleArray(travelers);
      } catch (error) {
        console.error('[TravelerCarousel] Error loading travelers:', error);
        
        // Try to return cached data even if expired
        const domain = window.location.hostname;
        const cacheKey = `walvee_travelers_cache_${domain}`;
        const cachedUsers = sessionStorage.getItem(cacheKey);
        if (cachedUsers) {
          const cache = JSON.parse(cachedUsers);
          console.log('[TravelerCarousel] Using stale cache due to error');
          return shuffleArray(cache.data);
        }
        
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    retry: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (travelers.length === 0) {
    console.warn('[TravelerCarousel] No travelers to display');
    return null;
  }

  return (
    <div className="relative px-2 py-3">
      <div className="flex items-center justify-center">
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth max-w-xl"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {travelers.map((traveler) => (
            <Link
              key={traveler.id}
              to={`${createPageUrl("Profile")}?email=${encodeURIComponent(traveler.email || '')}`}
              className="flex-shrink-0 group cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-purple-500 transition-all duration-300 group-hover:scale-110 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <UserAvatar
                    src={traveler.photo_url || traveler.picture}
                    name={traveler.preferred_name || traveler.full_name}
                    size="xl"
                    email={traveler.email}
                  />
                </div>
                {traveler.score > 20 && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0A0B0F]">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-1.5 text-gray-300 group-hover:text-white transition-colors w-16 truncate">
                {traveler.preferred_name || traveler.full_name?.split(' ')[0]}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}