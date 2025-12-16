import { useState, useCallback, useRef, useEffect } from 'react';
import { Trip, User } from "@/api/entities";
const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";

export function useGlobalSearch(cityContext = null) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    cities: [],
    trips: [],
    places: [],
    travelers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  const normalizeString = (str) => {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const checkAndLoad = () => {
      if (window.google?.maps?.places?.PlacesService) {
        console.log('[Search] Google Maps API already loaded');
        setGoogleMapsLoaded(true);
        scriptLoadedRef.current = true;
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('[Search] Google Maps script exists, waiting for load...');
        existingScript.addEventListener('load', () => {
          console.log('[Search] Google Maps loaded via existing script');
          setGoogleMapsLoaded(true);
          scriptLoadedRef.current = true;
        });
        return;
      }

      console.log('[Search] Loading Google Maps API...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('[Search] Google Maps API loaded successfully');
        setGoogleMapsLoaded(true);
        scriptLoadedRef.current = true;
      };
      
      script.onerror = (error) => {
        console.error('[Search] Error loading Google Maps API:', error);
      };
      
      document.head.appendChild(script);
    };

    checkAndLoad();
  }, []);

  const searchGooglePlaces = async (searchQuery) => {
    if (!googleMapsLoaded || !window.google?.maps?.places?.PlacesService) {
      console.warn('[Search] Google Places API not available');
      return [];
    }

    const finalQuery = cityContext 
      ? `${searchQuery} in ${cityContext}`
      : searchQuery;

    console.log('[Search] Searching Google Places for:', finalQuery);

    return new Promise((resolve) => {
      try {
        const service = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );

        service.textSearch(
          {
            query: finalQuery,
          },
          (results, status) => {
            console.log('[Search] Google Places response:', { status, resultsCount: results?.length });
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              console.log('[Search] Google Places found:', results.length);
              
              let filteredResults = results;
              if (cityContext) {
                const cityNameOnly = cityContext.split(',')[0].trim().toLowerCase();
                filteredResults = results.filter(place => {
                  const address = place.formatted_address?.toLowerCase() || '';
                  return address.includes(cityNameOnly);
                });
                console.log('[Search] Filtered to city:', filteredResults.length);
              }
              
              const places = filteredResults.slice(0, 10).map(place => ({
                name: place.name,
                address: place.formatted_address,
                place_id: place.place_id,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                price_level: place.price_level,
                types: place.types,
                photos: place.photos?.map(p => p.getUrl({ maxWidth: 800, maxHeight: 800 })) || [],
                photo: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }),
                mentions: 0,
                source: 'google'
              }));
              
              console.log('[Search] Formatted Google Places:', places.map(p => p.name));
              resolve(places);
            } else {
              console.warn('[Search] Google Places search failed:', status);
              resolve([]);
            }
          }
        );
      } catch (error) {
        console.error('[Search] Error in searchGooglePlaces:', error);
        resolve([]);
      }
    });
  };

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults({ cities: [], trips: [], places: [], travelers: [] });
      setIsLoading(false);
      setError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const normalizedQuery = normalizeString(searchQuery);
      console.log('[Search] ===== STARTING SEARCH =====');
      console.log('[Search] Query:', searchQuery);
      console.log('[Search] Normalized:', normalizedQuery);
      console.log('[Search] City Context:', cityContext || 'none');

      const isAuthenticated = await User.isAuthenticated();
      console.log('[Search] Authenticated:', isAuthenticated);

      const [allTrips, allUsers, googlePlaces] = await Promise.all([
        Trip.list().catch(err => {
          console.error('[Search] Error fetching trips:', err);
          return [];
        }),
        isAuthenticated 
          ? User.list().catch(err => {
              console.error('[Search] Error fetching users:', err);
              return [];
            })
          : Promise.resolve([]),
        searchGooglePlaces(searchQuery).catch(err => {
          console.error('[Search] Error fetching Google Places:', err);
          return [];
        })
      ]);

      console.log('[Search] Data fetched - Trips:', allTrips.length, 'Users:', allUsers.length, 'Google Places:', googlePlaces.length);

      const normalizedCityContext = cityContext ? normalizeString(cityContext) : null;
      const cityNameOnly = normalizedCityContext ? normalizedCityContext.split(',')[0].trim() : null;

      let travelers = [];
      if (isAuthenticated && allUsers.length > 0) {
        console.log('[Search] ===== SEARCHING USERS =====');
        
        travelers = allUsers
          .map(u => {
            const preferredName = normalizeString(u.preferred_name || '');
            const fullName = normalizeString(u.full_name || '');
            const email = normalizeString(u.email || '');
            const userCity = normalizeString(u.city || '');
            
            const nameMatches = 
              preferredName.includes(normalizedQuery) ||
              fullName.includes(normalizedQuery) ||
              email.includes(normalizedQuery);

            const cityMatches = !cityNameOnly || userCity.includes(cityNameOnly);

            if (nameMatches && cityMatches) {
              console.log('[Search] ✓ User match:', {
                name: u.preferred_name || u.full_name,
                city: u.city,
                matchedName: nameMatches,
                matchedCity: cityMatches
              });
            }

            return (nameMatches && cityMatches) ? {
              id: u.id,
              email: u.email,
              name: u.preferred_name || u.full_name || u.email,
              photo: u.photo_url || u.picture,
              city: u.city,
              country: u.country,
              trips: u.metrics_my_trips || 0,
              followers: u.metrics_followers || 0
            } : null;
          })
          .filter(Boolean)
          .sort((a, b) => {
            if (b.trips !== a.trips) return b.trips - a.trips;
            return (b.followers || 0) - (a.followers || 0);
          })
          .slice(0, 10);

        console.log('[Search] Travelers found:', travelers.length);
      }

      console.log('[Search] ===== SEARCHING TRIPS =====');
      const trips = allTrips
        .filter(trip => {
          const title = normalizeString(trip.title || '');
          const description = normalizeString(trip.description || '');
          const destination = normalizeString(trip.destination || '');
          const authorName = normalizeString(trip.author_name || '');
          
          const locationsMatch = (trip.locations || []).some(loc => 
            normalizeString(loc).includes(normalizedQuery)
          );
          
          const textMatches = 
            title.includes(normalizedQuery) ||
            description.includes(normalizedQuery) ||
            destination.includes(normalizedQuery) ||
            authorName.includes(normalizedQuery) ||
            locationsMatch;

          let cityMatches = true;
          if (cityNameOnly) {
            const tripDestination = normalizeString(trip.destination || '');
            const tripLocations = (trip.locations || []).map(loc => normalizeString(loc));
            
            cityMatches = 
              tripDestination.includes(cityNameOnly) ||
              tripLocations.some(loc => loc.includes(cityNameOnly));
          }

          if (textMatches && cityMatches) {
            console.log('[Search] ✓ Trip match:', {
              title: trip.title,
              matchedText: textMatches,
              matchedCity: cityMatches
            });
          }

          return textMatches && cityMatches;
        })
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 10);

      console.log('[Search] Trips found:', trips.length);

      let cities = [];
      if (!cityContext) {
        console.log('[Search] ===== SEARCHING CITIES =====');
        const cityMap = new Map();
        
        allTrips.forEach(trip => {
          if (trip.destination) {
            const normalizedDest = normalizeString(trip.destination);
            
            if (normalizedDest.includes(normalizedQuery)) {
              if (!cityMap.has(trip.destination)) {
                cityMap.set(trip.destination, {
                  name: trip.destination,
                  tripsCount: 0,
                  image: trip.images?.[0] || trip.image_url
                });
                console.log('[Search] ✓ City match (destination):', trip.destination);
              }
              cityMap.get(trip.destination).tripsCount++;
            }
          }
          
          if (trip.locations && Array.isArray(trip.locations)) {
            trip.locations.forEach(location => {
              const normalizedLoc = normalizeString(location);
              
              if (normalizedLoc.includes(normalizedQuery)) {
                if (!cityMap.has(location)) {
                  cityMap.set(location, {
                    name: location,
                    tripsCount: 0,
                    image: trip.images?.[0] || trip.image_url
                  });
                  console.log('[Search] ✓ City match (location):', location);
                }
                cityMap.get(location).tripsCount++;
              }
            });
          }
        });

        cities = Array.from(cityMap.values())
          .sort((a, b) => b.tripsCount - a.tripsCount)
          .slice(0, 10);

        console.log('[Search] Cities found:', cities.length);
      }

      console.log('[Search] ===== SEARCHING PLACES =====');
      const placeMap = new Map();
      
      allTrips.forEach(trip => {
        if (cityNameOnly) {
          const tripDestination = normalizeString(trip.destination || '');
          const tripLocations = (trip.locations || []).map(loc => normalizeString(loc));
          const tripMatchesCity = 
            tripDestination.includes(cityNameOnly) ||
            tripLocations.some(loc => loc.includes(cityNameOnly));
          
          if (!tripMatchesCity) return;
        }

        if (!trip.itinerary) return;
        
        trip.itinerary.forEach(day => {
          if (!day.places) return;
          
          day.places.forEach(place => {
            if (!place.name) return;
            
            const normalizedPlaceName = normalizeString(place.name);
            const normalizedAddress = normalizeString(place.address || '');
            
            const matches = 
              normalizedPlaceName.includes(normalizedQuery) ||
              normalizedAddress.includes(normalizedQuery);
            
            if (matches) {
              const key = place.place_id || place.name;
              
              if (!placeMap.has(key)) {
                placeMap.set(key, {
                  ...place,
                  mentions: 0,
                  city: trip.destination?.split(',')[0]?.trim(),
                  source: 'trips'
                });
                console.log('[Search] ✓ Place match (from trip):', place.name);
              }
              placeMap.get(key).mentions++;
            }
          });
        });
      });

      console.log('[Search] Adding', googlePlaces.length, 'Google Places to results');
      googlePlaces.forEach(place => {
        const key = place.place_id || place.name;
        if (!placeMap.has(key)) {
          placeMap.set(key, place);
          console.log('[Search] ✓ Place match (from Google):', place.name);
        }
      });

      const places = Array.from(placeMap.values())
        .sort((a, b) => {
          if (a.mentions && !b.mentions) return -1;
          if (!a.mentions && b.mentions) return 1;
          if (a.mentions && b.mentions) return b.mentions - a.mentions;
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, 15);

      console.log('[Search] Places found:', places.length);

      console.log('[Search] ===== SEARCH COMPLETE =====');
      console.log('[Search] Total results:', {
        cities: cities.length,
        trips: trips.length,
        places: places.length,
        travelers: travelers.length
      });

      setResults({
        cities,
        trips,
        places,
        travelers
      });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[Search] Search aborted');
        return;
      }
      
      console.error('[Search] Error:', err);
      setError(err.message || 'Search failed');
      setResults({ cities: [], trips: [], places: [], travelers: [] });
    } finally {
      setIsLoading(false);
    }
  }, [googleMapsLoaded, cityContext]);

  const debouncedSearch = useCallback((searchQuery) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults({ cities: [], trips: [], places: [], travelers: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    searchTimeoutRef.current = setTimeout(() => {
      search(searchQuery);
    }, 300);
  }, [search]);

  useEffect(() => {
    debouncedSearch(query);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, debouncedSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults({ cities: [], trips: [], places: [], travelers: [] });
    setError(null);
    setIsLoading(false);
  }, []);

  const retrySearch = useCallback(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  const totalResults = 
    results.cities.length + 
    results.trips.length + 
    results.places.length + 
    results.travelers.length;

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    totalResults,
    clearSearch,
    retrySearch
  };
}