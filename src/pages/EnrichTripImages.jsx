import React, { useState } from "react";
import { Trip } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Image, CheckCircle, XCircle, Loader } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";

export default function EnrichTripImages() {
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [processed, setProcessed] = useState(new Set());
  const queryClient = useQueryClient();

  const addLog = (message, type = "info") => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['allTrips'],
    queryFn: async () => {
      return await Trip.list("-created_date");
    },
  });

  const tripsWithoutImages = trips.filter(trip => 
    !trip.images || trip.images.length === 0 || 
    (trip.images.length === 1 && !trip.images[0])
  );

  const enrichTripWithImages = async (trip) => {
    if (!window.google?.maps?.places) {
      addLog(`❌ Google Maps API not loaded`, "error");
      return false;
    }

    addLog(`🔍 Processing: ${trip.title}`, "info");
    
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const images = [];

    // Get all places from itinerary
    const allPlaces = trip.itinerary?.flatMap(day => day.places || []) || [];
    
    if (allPlaces.length === 0) {
      addLog(`⚠️ No places in itinerary for ${trip.title}`, "warning");
      return false;
    }

    addLog(`📍 Found ${allPlaces.length} places in itinerary`, "info");

    // Get photos from top 5 places
    const placesToFetch = allPlaces.slice(0, 5);
    
    for (const place of placesToFetch) {
      try {
        const photos = await new Promise((resolve) => {
          // First try with place_id if available
          if (place.place_id) {
            service.getDetails(
              {
                placeId: place.place_id,
                fields: ['photos']
              },
              (result, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && result?.photos) {
                  const photoUrls = result.photos.slice(0, 2).map(photo => 
                    photo.getUrl({ maxWidth: 1200, maxHeight: 800 })
                  );
                  resolve(photoUrls);
                } else {
                  resolve([]);
                }
              }
            );
          } else {
            // Fallback to text search
            const query = `${place.name}, ${place.address || trip.destination}`;
            service.textSearch(
              { query },
              (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos) {
                  const photoUrls = results[0].photos.slice(0, 2).map(photo => 
                    photo.getUrl({ maxWidth: 1200, maxHeight: 800 })
                  );
                  resolve(photoUrls);
                } else {
                  resolve([]);
                }
              }
            );
          }
        });

        if (photos.length > 0) {
          images.push(...photos);
          addLog(`  ✓ Got ${photos.length} photos from ${place.name}`, "success");
        }

        // Add small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

        // Stop if we have enough images
        if (images.length >= 8) break;

      } catch (error) {
        addLog(`  ✗ Error fetching photos for ${place.name}: ${error.message}`, "error");
      }
    }

    if (images.length === 0) {
      addLog(`❌ No images found for ${trip.title}`, "error");
      return false;
    }

    // Update trip with images
    try {
      await Trip.update(trip.id, {
        images: images,
        image_url: images[0] // Set first image as main
      });
      
      addLog(`✅ Updated ${trip.title} with ${images.length} images`, "success");
      setProcessed(prev => new Set([...prev, trip.id]));
      return true;
    } catch (error) {
      addLog(`❌ Failed to update trip: ${error.message}`, "error");
      return false;
    }
  };

  const handleEnrichAll = async () => {
    setProcessing(true);
    setLogs([]);
    setProcessed(new Set());
    
    addLog(`🚀 Starting enrichment for ${tripsWithoutImages.length} trips...`, "info");
    
    let successCount = 0;
    let errorCount = 0;

    for (const trip of tripsWithoutImages) {
      const success = await enrichTripWithImages(trip);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add delay between trips
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    addLog(`\n📊 Summary: ${successCount} successful, ${errorCount} failed`, "info");
    
    setProcessing(false);
    queryClient.invalidateQueries(['allTrips']);
  };

  const handleEnrichSingle = async (trip) => {
    setProcessing(true);
    addLog(`\n🔄 Enriching single trip: ${trip.title}`, "info");
    
    await enrichTripWithImages(trip);
    
    setProcessing(false);
    queryClient.invalidateQueries(['allTrips']);
  };

  React.useEffect(() => {
    if (!window.google?.maps?.places) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Image className="w-8 h-8 text-blue-500" />
            Enrich Trip Images
          </h1>
          <p className="text-gray-400">
            Fetch images from Google Places API for trips without photos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Trips List */}
          <div className="bg-[#1A1B23] rounded-xl p-6 border border-[#2A2B35]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                Trips Without Images ({tripsWithoutImages.length})
              </h2>
              <Button
                onClick={handleEnrichAll}
                disabled={processing || tripsWithoutImages.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4 mr-2" />
                    Enrich All
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {tripsWithoutImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>All trips have images! 🎉</p>
                </div>
              ) : (
                tripsWithoutImages.map((trip) => (
                  <div
                    key={trip.id}
                    className={`p-4 rounded-lg border transition-all ${
                      processed.has(trip.id)
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-[#0D0D0D] border-[#2A2B35] hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate">{trip.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{trip.destination}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {trip.itinerary?.reduce((sum, day) => sum + (day.places?.length || 0), 0) || 0} places total
                        </p>
                      </div>
                      <div className="shrink-0">
                        {processed.has(trip.id) ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleEnrichSingle(trip)}
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
                          >
                            Enrich
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Logs */}
          <div className="bg-[#1A1B23] rounded-xl p-6 border border-[#2A2B35]">
            <h2 className="text-xl font-bold mb-6">Processing Logs</h2>
            
            <div className="bg-[#0D0D0D] rounded-lg p-4 h-[600px] overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Logs will appear here when processing starts...
                </p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`mb-1 ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}
                  >
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <Image className="w-4 h-4" />
            How it works:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1 ml-6 list-disc">
            <li>Fetches photos from Google Places API for each place in the itinerary</li>
            <li>Gets up to 2 photos per place, max 8 photos total per trip</li>
            <li>Updates the trip with images array and main image_url</li>
            <li>Respects API rate limits with delays between requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
}