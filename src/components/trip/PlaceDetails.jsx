
import React, { useState, useEffect, useRef } from "react";
import { invokeLLM } from "@/api/llmService";
import { Review } from "@/api/entities";
import { X, Clock, MapPin, Star, Phone, Globe, Heart, Navigation, Camera, Info, Image as ImageIcon, Car, Bus, Bike, Footprints, Trash2, DollarSign, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "../common/UserAvatar";
import ImagePlaceholder from "../common/ImagePlaceholder";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPriceRangeInfo } from "../utils/priceFormatter";
import { useFavorites } from "../hooks/useFavorites";
import { shouldUseGooglePlaces } from "../utils/googlePlacesConfig"; // Only shouldUseGooglePlaces is relevant now

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H2ZYfGU5fZa2Fr6XfA9ZkBJHTb4";

const getPriceRangeText = (priceLevel) => {
  if (priceLevel === undefined || priceLevel === null || priceLevel === 0) {
    return null;
  }
  
  const priceRanges = {
    1: { label: "Inexpensive", symbol: "$", estimate: "$10-20 per person" },
    2: { label: "Moderate", symbol: "$$", estimate: "$20-40 per person" },
    3: { label: "Expensive", symbol: "$$$", estimate: "$40-80 per person" },
    4: { label: "Very Expensive", symbol: "$$$$", estimate: "$80+ per person" }
  };
  
  return priceRanges[priceLevel] || null;
};

const getPriceOpinionLabel = (opinion) => {
  const labels = {
    cheap: { label: "Cheap", symbol: "$" },
    fair: { label: "Fair", symbol: "$$" },
    expensive: { label: "Expensive", symbol: "$$$" },
    very_expensive: { label: "Very Expensive", symbol: "$$$$" }
  };
  return labels[opinion] || { label: opinion, symbol: "$" };
};

const formatAiReviewText = (text) => {
  if (!text) return { paragraphs: [], badges: [], sources: [] };

  const sourcesMatch = text.match(/Sources?:\s*([\s\S]*?)$/i);
  const sources = [];
  let mainText = text;

  if (sourcesMatch) {
    mainText = text.substring(0, sourcesMatch.index).trim();
    const sourcesText = sourcesMatch[1];
    
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(sourcesText)) !== null) {
      sources.push({ name: match[1], url: match[2] });
    }
  }

  mainText = mainText.replace(/https?:\/\/[^\s)]+/g, '');
  mainText = mainText.replace(/\(\s*\)/g, '');

  const badges = [];
  const badgePatterns = [
    { 
      regex: /(?:cost|price|charge)[^.!?]*?\$\d+[-–]\$?\d+(?: per person)?[^.!?]*[.!?]/gi, 
      icon: DollarSign, 
      type: 'price',
      extract: (match) => match.match(/\$\d+[-–]\$?\d+(?: per person)?/)?.[0] || match
    },
    { 
      regex: /(?:open|hour|time)[^.!?]*?\d{1,2}:\d{2}\s*(?:AM|PM)\s*(?:to|-|–)\s*\d{1,2}:\d{2}\s*(?:AM|PM)[^.!?]*[.!?]/gi, 
      icon: Clock, 
      type: 'hours',
      extract: (match) => match.match(/\d{1,2}:\d{2}\s*(?:AM|PM)\s*(?:to|-|–)\s*\d{1,2}:\d{2}\s*(?:AM|PM)/)?.[0] || match
    },
    { 
      regex: /(?:reserv|book)[^.!?]*(?:recommend|advis|requir)[^.!?]*[.!?]/gi, 
      icon: AlertTriangle, 
      type: 'reservation',
      extract: (match) => match
    },
    { 
      regex: /(?:wait|crowd|busy|peak)[^.!?]*(?:time|hour|avoid)[^.!?]*[.!?]/gi, 
      icon: AlertTriangle, 
      type: 'timing',
      extract: (match) => match
    },
    { 
      regex: /(?:tip|suggest|recommend|best)[^.!?]*(?:visit|time|bring|wear)[^.!?]*[.!?]/gi, 
      icon: Lightbulb, 
      type: 'tip',
      extract: (match) => match
    }
  ];

  badgePatterns.forEach(pattern => {
    const matches = mainText.match(pattern.regex);
    if (matches) {
      matches.forEach(match => {
        const extracted = pattern.extract ? pattern.extract(match) : match.trim();
        if (extracted && !badges.some(b => b.text === extracted)) {
          badges.push({
            text: extracted,
            icon: pattern.icon,
            type: pattern.type
          });
        }
      });
    }
  });

  const paragraphs = mainText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      p = p.replace(/\b([A-Z][a-zA-Z\s]{2,}(?:Street|Avenue|Drive|Boulevard|Park|Beach|Museum|Restaurant|Cafe|Bar|Hotel|Gallery|Square|Garden))\b/g, '**$1**');
      return p;
    });

  return { paragraphs, badges: badges.slice(0, 3), sources };
};

export default function PlaceDetails({ place, trip, onClose, onPhotoClick, user, openLoginModal, onAddToTrip }) {
  console.log('[PlaceDetails] ===== RENDER =====');
  console.log('[PlaceDetails] Props:', {
    placeName: place?.name,
    hasUser: !!user,
    userId: user?.id,
    hasOpenLoginModal: !!openLoginModal
  });

  const [enrichedPlace, setEnrichedPlace] = useState(place);
  const [isEnriching, setIsEnriching] = useState(false);
  
  const [activeTab, setActiveTab] = useState("general");
  const [imageErrors, setImageErrors] = useState(new Set());
  const [isScrolling, setIsScrolling] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  
  const [transportMode, setTransportMode] = useState("driving");
  
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewPriceOpinion, setReviewPriceOpinion] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const [aiReviews, setAiReviews] = useState({});
  const [isLoadingAiReview, setIsLoadingAiReview] = useState(false);
  
  const [googleRatingsTotal, setGoogleRatingsTotal] = useState(place.user_ratings_total || place.reviews_count || 0);
  
  const fetchedPlaceId = useRef(null);
  
  const [expandedSections, setExpandedSections] = useState({
    google: false,
    walvee: false,
    ai: false
  });
  
  const queryClient = useQueryClient();
  
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const scrollRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  const priceLevel = enrichedPlace.price_level || 0;
  const priceInfo = getPriceRangeInfo(enrichedPlace.price_level);

  const { isFavorited, toggleFavorite, isToggling } = useFavorites(user);
  
  const isFavorite = isFavorited(enrichedPlace.name);

  console.log('[PlaceDetails] Favorites state:', {
    placeName: enrichedPlace.name,
    isFavorite,
    isToggling,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email
  });

  const { data: userReviews = [] } = useQuery({
    queryKey: ['reviews', enrichedPlace.name],
    queryFn: async () => {
      const allReviews = await Review.list('-created_date');
      return allReviews.filter(review => review.place_name === enrichedPlace.name);
    },
    enabled: !!enrichedPlace.name,
  });

  const handleFavoriteToggle = async () => {
    if (!user) {
      if (openLoginModal && typeof openLoginModal === 'function') {
        openLoginModal();
        return;
      }
      window.location.href = '/api/auth/login?next=' + encodeURIComponent(window.location.href);
      return;
    }

    try {
      const placeDataForToggle = {
        ...enrichedPlace,
        city: enrichedPlace.city || trip?.destination?.split(',')[0],
        country: enrichedPlace.country || trip?.destination?.split(',')[1]?.trim()
      };

      await toggleFavorite(placeDataForToggle, trip?.destination);
    } catch (error) {
      console.error('[PlaceDetails] Error toggling favorite:', error);
      alert('Error saving favorite. Please try again.');
    }
  };

  const addReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const city = trip?.destination?.split(',')[0] || enrichedPlace.address?.split(',')[1]?.trim() || 'Unknown';
      const country = trip?.destination?.split(',')[1]?.trim() || enrichedPlace.address?.split(',')[2]?.trim() || 'Unknown';
      
      return Review.create({
        place_name: enrichedPlace.name,
        place_address: enrichedPlace.address,
        place_id: enrichedPlace.place_id || null,
        city: city,
        country: country,
        rating: reviewData.rating,
        price_opinion: reviewData.price_opinion || null,
        comment: reviewData.comment,
        user_name: user?.preferred_name || user?.full_name || user?.email,
        user_photo: user?.photo_url || user?.picture || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', enrichedPlace.name] });
      setReviewRating(0);
      setReviewPriceOpinion("");
      setReviewComment("");
    }
  });

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      alert("Please write a comment");
      return;
    }
    
    if (reviewRating === 0) {
      alert("Please select a star rating");
      return;
    }
    
    if (priceLevel > 0 && !reviewPriceOpinion) {
      alert("Please select your opinion about the price");
      return;
    }
    
    await addReviewMutation.mutateAsync({
      rating: reviewRating,
      price_opinion: reviewPriceOpinion,
      comment: reviewComment
    });
  };

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      return Review.delete(reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', enrichedPlace.name] });
    }
  });

  const handleDeleteReview = async (review) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }
    
    const reviewIdToDelete = review.source === 'walvee' ? review.originalId : review.id;
    await deleteReviewMutation.mutateAsync(reviewIdToDelete);
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;

    const handleScroll = () => {
      if (scrollEl) {
        setIsScrolling(scrollEl.scrollTop > 2);
      }
    };
    
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const checkAndLoad = () => {
      if (window.google?.maps?.Map) {
        console.log('[GoogleMaps] Already loaded');
        setGoogleMapsLoaded(true);
        scriptLoadedRef.current = true;
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('[GoogleMaps] Script tag exists, waiting for load...');
        existingScript.addEventListener('load', () => {
          setGoogleMapsLoaded(true);
          scriptLoadedRef.current = true;
        });
        existingScript.addEventListener('error', (error) => {
          console.error('[GoogleMaps] Error loading existing script:', error);
        });
        return;
      }

      console.log('[GoogleMaps] Loading script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('[GoogleMaps] Script loaded successfully');
        setGoogleMapsLoaded(true);
        scriptLoadedRef.current = true;
      };
      
      script.onerror = (error) => {
        console.error('[GoogleMaps] Error loading script:', error);
      };
      
      document.head.appendChild(script);
    };

    checkAndLoad();
  }, []);

  useEffect(() => {
    const enrichPlaceData = async () => {
      if (!shouldUseGooglePlaces() || !googleMapsLoaded || !window.google?.maps?.places || !place || fetchedPlaceId.current === place.place_id) {
        return;
      }

      setIsEnriching(true);
      fetchedPlaceId.current = place.place_id;

      try {
        const service = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );

        const fields = [
          'name',
          'formatted_address',
          'place_id',
          'rating',
          'user_ratings_total',
          'price_level',
          'types',
          'photos',
          'opening_hours',
          'geometry',
          'website',
          'formatted_phone_number',
          'reviews'
        ];

        const processResult = (result) => {
          if (result) {
            const photoUrls = result.photos?.map(p => p.getUrl({ maxWidth: 1200, maxHeight: 1200 })) || [];
            
            setEnrichedPlace(prev => ({
              ...prev,
              ...result,
              photos: photoUrls,
              photo: photoUrls[0] || prev.photo || null, 
              reviews: result.reviews || []
            }));
            setGoogleRatingsTotal(result.user_ratings_total !== undefined ? result.user_ratings_total : (result.reviews?.length || 0));
          }
        };

        const performTextSearch = () => {
          const query = `${place.name}, ${place.address || trip?.destination || ''}`;
          console.log('[PlaceDetails] Performing text search:', query);

          service.textSearch(
            { query },
            (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                console.log('[PlaceDetails] ✅ Text search successful, fetching details for top result.');
                const topResultPlaceId = results[0].place_id;
                service.getDetails(
                  { placeId: topResultPlaceId, fields },
                  (detailResult, detailStatus) => {
                    if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && detailResult) {
                      console.log('[PlaceDetails] ✅ Detailed info fetched from text search.');
                      processResult(detailResult);
                    } else {
                      console.warn('[PlaceDetails] Failed to get details after text search:', detailStatus);
                    }
                    setIsEnriching(false);
                  }
                );
              } else {
                console.warn('[PlaceDetails] Text search failed or no results:', status);
                setIsEnriching(false);
              }
            }
          );
        };

        if (place.place_id) {
          console.log('[PlaceDetails] Fetching details by place_id:', place.place_id);
          service.getDetails(
            { placeId: place.place_id, fields },
            (result, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                console.log('[PlaceDetails] ✅ Place details fetched successfully by place_id.');
                processResult(result);
                setIsEnriching(false);
              } else {
                console.warn(`[PlaceDetails] Failed to fetch by place_id (${place.place_id}), status: ${status}. Trying text search.`);
                performTextSearch();
              }
            }
          );
        } else {
          performTextSearch();
        }

      } catch (error) {
        console.error('[PlaceDetails] Error enriching place:', error);
        setIsEnriching(false);
      }
    };

    enrichPlaceData();
  }, [place.place_id, place.name, place.address, trip?.destination, googleMapsLoaded, shouldUseGooglePlaces]);

  useEffect(() => {
    setEnrichedPlace(place);
    fetchedPlaceId.current = null;
  }, [place]);

  const googleReviewsList = enrichedPlace.reviews ? enrichedPlace.reviews.map((review, idx) => ({
    id: review.time + '-' + idx,
    author_name: review.author_name,
    author_photo: review.profile_photo_url,
    rating: review.rating,
    text: review.text,
    time: review.time,
    relative_time_description: review.relative_time_description,
    source: 'google'
  })) : [];
  
  useEffect(() => {
      if (enrichedPlace.user_ratings_total !== undefined) {
          setGoogleRatingsTotal(enrichedPlace.user_ratings_total);
      } else if (enrichedPlace.reviews) {
          setGoogleRatingsTotal(enrichedPlace.reviews.length);
      } else {
          setGoogleRatingsTotal(0);
      }
  }, [enrichedPlace.user_ratings_total, enrichedPlace.reviews]);


  useEffect(() => {
    const generateAiReview = async () => {
      if (activeTab !== "reviews" || !enrichedPlace.name) return;
      
      const placeKey = enrichedPlace.place_id || enrichedPlace.name;
      const existingReview = aiReviews[placeKey];
      
      if (existingReview || isLoadingAiReview) return;

      if (isEnriching) return;

      setIsLoadingAiReview(true);
      
      try {
        const hasGoogleReviews = googleReviewsList.length > 0;
        const hasUserReviews = userReviews.length > 0;
        
        const prompt = `Create a helpful, editorial-style summary and practical guide for this destination:

**Place:** ${enrichedPlace.name}
**Location:** ${enrichedPlace.formatted_address || trip.destination}
**Type:** ${enrichedPlace.types?.[0] || 'attraction'}
**Rating:** ${enrichedPlace.rating ? `${enrichedPlace.rating}/5` : 'N/A'}
${hasGoogleReviews || hasUserReviews ? `**Note:** This place has ${googleReviewsList.length + userReviews.length} traveler reviews` : ''}

**Your role:** Provide a curated overview and practical insights that complement other reviews.

**Requirements:**

1. **Structure:** Write 3-4 short, scannable paragraphs (max 4 lines each)

2. **Content sections:**
   - **Overview:** What makes this place special and who it's perfect for
   - **Atmosphere & Experience:** Vibe, ambiance, what to expect
   - **Practical Tips:** Best times to visit, how to get there, what to bring
   - **Insider Info:** Local tips, things first-timers should know

4. **Sources:**
   - If using external info, cite at the end:
   
Sources:
- [Source Name](full_url)
- [Another Source](full_url)

5. **Rating:** Provide a realistic 4-5 star rating based on the place's actual reputation

**Tone:** Helpful travel curator sharing expert insights — informative, warm, trustworthy.`;

        const response = await invokeLLM({
          prompt: prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              rating: { type: "number" },
              text: { type: "string" }
            },
            required: ["rating", "text"]
          }
        });

        if (response && response.rating && response.text) {
          setAiReviews(prev => ({
            ...prev,
            [placeKey]: {
              rating: response.rating,
              text: response.text
            }
          }));
        }
      } catch (error) {
        console.error("Error generating AI review:", error);
      } finally {
        setIsLoadingAiReview(false);
      }
    };

    generateAiReview();
  }, [activeTab, enrichedPlace.name, enrichedPlace.place_id, googleReviewsList.length, userReviews.length, isEnriching, aiReviews, isLoadingAiReview, enrichedPlace.formatted_address, enrichedPlace.types, enrichedPlace.rating, trip?.destination]);

  const formatReviewDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';

    let reviewDate;
    if (typeof timestamp === 'string') {
      if (!isNaN(new Date(timestamp).getTime())) { 
        reviewDate = new Date(timestamp);
      } else {
        return timestamp;
      }
    } else {
      reviewDate = new Date(timestamp * 1000);
    }

    if (isNaN(reviewDate.getTime())) return 'Unknown date';

    const now = new Date();
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return reviewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const placeKey = enrichedPlace.place_id || enrichedPlace.name;
  const currentPlaceAiReview = aiReviews[placeKey];

  const formattedUserReviews = userReviews.map(review => ({
    id: `walvee-${review.id}`,
    author_name: review.user_name,
    author_photo: review.user_photo,
    time: review.created_date,
    rating: review.rating,
    text: review.comment,
    price_opinion: review.price_opinion,
    source: 'walvee',
    isOwn: user && (
      review.created_by === user.email
    ),
    originalId: review.id
  }));

  const aiCuratedSummary = currentPlaceAiReview ? [{
    id: 'ai-walvee',
    author_name: 'Walvee',
    author_photo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/0ec4e7e41_LogoWalvee.png',
    time: 'Recently',
    rating: currentPlaceAiReview.rating,
    text: currentPlaceAiReview.text,
    source: 'ai'
  }] : [];

  const allReviewsForAvg = [...googleReviewsList, ...formattedUserReviews, ...aiCuratedSummary];
  const totalReviews = allReviewsForAvg.length;
  const averageRating = totalReviews > 0 
    ? (allReviewsForAvg.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "N/A";

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderReviewCard = (review) => {
    const priceOpinionData = review.price_opinion ? getPriceOpinionLabel(review.price_opinion) : null;
    const formattedAiReview = review.source === 'ai' ? formatAiReviewText(review.text) : null;

    return (
      <div
        key={review.id}
        className="bg-[#0D0D0D] rounded-xl p-4 border border-[#1F1F1F] relative transition-all hover:border-[#2A2B38]"
      >
        {review.isOwn && (
          <button
            onClick={() => handleDeleteReview(review)}
            disabled={deleteReviewMutation.isPending}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600/30 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Delete review"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        )}

        <div className="flex items-start gap-3 mb-3">
          <UserAvatar
            src={review.author_photo}
            name={review.author_name}
            size="md"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1 pr-8">
              <div>
                <h4 className="font-semibold text-white text-sm">
                  {review.author_name}
                </h4>
                {priceOpinionData && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-green-400">{priceOpinionData.symbol}</span>
                    <span className="text-xs text-gray-400">{priceOpinionData.label}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {review.relative_time_description || formatReviewDate(review.time)}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < review.rating
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {formattedAiReview ? (
          <div className="space-y-3">
            {formattedAiReview.paragraphs.map((para, idx) => {
              const parts = para.split(/\*\*([^*]+)\*\*/g);
              return (
                <p key={idx} className="text-gray-300 text-sm leading-relaxed">
                  {parts.map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
                  )}
                </p>
              );
            })}

            {formattedAiReview.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formattedAiReview.badges.map((badge, idx) => {
                  const Icon = badge.icon;
                  const colorClass = badge.type === 'price' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                                     badge.type === 'hours' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' :
                                     badge.type === 'reservation' || badge.type === 'timing' ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' :
                                     'bg-purple-600/20 text-purple-400 border-purple-600/30';
                  
                  return (
                    <div key={idx} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs ${colorClass}`}>
                      <Icon className="w-3 h-3" />
                      <span className="font-medium">{badge.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {formattedAiReview.sources.length > 0 && (
              <div className="pt-3 border-t border-[#2A2B38] mt-3">
                <p className="text-xs text-gray-500 mb-1.5">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {formattedAiReview.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      [{source.name}]
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed">{review.text}</p>
        )}
      </div>
    );
  };

  const tabs = [
    { id: "general", label: "General", Icon: Info },
    { id: "reviews", label: "Reviews", Icon: Star },
    { id: "photos", label: "Photos", Icon: Camera },
    { id: "directions", label: "Directions", Icon: Navigation },
    { id: "favorites", label: "Favorites", Icon: Heart },
  ];

  const formatOpeningHours = () => {
    if (!enrichedPlace.opening_hours || !enrichedPlace.opening_hours.weekday_text) {
      return (
        <p className="text-gray-400">Opening hours not available.</p>
      );
    }

    return enrichedPlace.opening_hours.weekday_text.map((dayText, idx) => {
      const parts = dayText.split(': ');
      const day = parts[0];
      const hours = parts[1] || 'Closed';
      const isClosed = hours.toLowerCase() === 'closed';

      return (
        <div key={idx} className="flex justify-between">
          <span className="text-gray-400">{day}</span>
          <span className={`font-medium ${isClosed ? 'text-red-400' : 'text-white'}`}>
            {hours}
          </span>
        </div>
      );
    });
  };

  const handleImageError = (index) => {
    setImageErrors(prev => new Set([...prev, index]));
  };

  const openPhotoModal = (index) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoModal = () => {
    setSelectedPhotoIndex(null);
  };

  const nextPhoto = () => {
    if (enrichedPlace.photos && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % enrichedPlace.photos.length);
    }
  };

  const prevPhoto = () => {
    if (enrichedPlace.photos && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + enrichedPlace.photos.length) % enrichedPlace.photos.length);
    }
  };

  const handlePhotoModalKeyDown = (e) => {
    if (e.key === 'Escape') closePhotoModal();
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
  };

  return (
    <aside className="place-panel">
      <style>{`
        :root {
          --sat: env(safe-area-inset-top, 0px);
        }

        .place-panel {
          position: relative;
          height: 100%;
          background: #0D0D0D;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .place-header {
          flex-shrink: 0;
          background: #0D0D0D;
          border-bottom: 1px solid #1F1F1F;
          padding: 16px;
          z-index: 10;
        }

        .place-tabs-fixed {
          flex-shrink: 0;
          background: #0D0D0D;
          padding: 8px 16px;
          border-bottom: 1px solid #1F1F1F;
          z-index: 9;
        }

        .place-tabs-fixed.scrolling {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .place-content-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding: 16px;
        }

        .place-content-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .place-content-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .place-content-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .place-content-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .place-tabs {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        @media (max-width: 720px) {
          .place-tabs {
            grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
          }
        }

        .place-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 64px;
          padding: 10px 8px;
          background: #1B1F2A;
          border-radius: 10px;
          color: #9CA3AF;
          font-weight: 600;
          font-size: 13px;
          line-height: 1.1;
          user-select: none;
          border: none;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .place-tab .icon {
          width: 22px;
          height: 22px;
          display: inline-block;
        }

        .place-tab[aria-selected="true"] {
          background: #2563EB;
          color: #FFFFFF;
        }

        .place-tab:hover:not([aria-selected="true"]) {
          background: #252A38;
          color: #D1D5DB;
        }

        .place-tab:focus-visible {
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.45);
        }

        .place-tab span.label {
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }

        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

      <header ref={headerRef} id="placeHeaderFix" className="place-header">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white leading-tight truncate">{enrichedPlace.name}</h2>
                <p className="text-sm text-gray-400 mt-0.5 truncate">{enrichedPlace.formatted_address || enrichedPlace.address}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {onAddToTrip && (
              <Button
                onClick={() => {
                  console.log('[PlaceDetails] Add to Trip clicked:', enrichedPlace);
                  onAddToTrip();
                }}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 h-10 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 border-0"
              >
                Add to Trip
              </Button>
            )}
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {enrichedPlace.rating && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(enrichedPlace.rating || 0)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-white">
                {enrichedPlace.rating ? enrichedPlace.rating.toFixed(1) : "N/A"}
              </span>
              <span className="text-sm text-gray-500">
                ({googleRatingsTotal.toLocaleString()} reviews)
              </span>
            </div>
          )}

          {priceInfo && (
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${priceInfo.color}`}>
                {priceInfo.symbol}
              </span>
              <span className="text-sm text-gray-300 font-medium">
                {priceInfo.label}
              </span>
              <span className="text-xs text-gray-500">
                ({priceInfo.estimate})
              </span>
            </div>
          )}
        </div>
      </header>

      <nav 
        ref={tabsRef} 
        id="placeTabsFix" 
        className={`place-tabs-fixed ${isScrolling ? 'scrolling' : ''}`}
        role="tablist" 
        aria-label="Place sections"
      >
        <div className="place-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="place-tab"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.Icon className="icon" aria-hidden="true" />
              <span className="label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div ref={scrollRef} id="placeScroll" className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === "general" && (
          <div className="p-6 space-y-6">
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1F1F1F]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Opening Hours</h3>
                {enrichedPlace.opening_hours?.open_now !== undefined && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    enrichedPlace.opening_hours.open_now 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {enrichedPlace.opening_hours.open_now ? 'Open now' : 'Closed'}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-sm">
                {formatOpeningHours()}
              </div>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1F1F1F]">
              <h3 className="font-semibold text-white mb-2">About</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {enrichedPlace.description || "A wonderful place to visit with stunning views and great atmosphere. Perfect for spending quality time with family and friends."}
              </p>
            </div>

            {(enrichedPlace.formatted_phone_number || enrichedPlace.website) && (
              <div className="bg-[#111827] rounded-xl p-4 border border-[#1F1F1F]">
                <h3 className="font-semibold text-white mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {enrichedPlace.formatted_phone_number && (
                    <a 
                      href={`tel:${enrichedPlace.formatted_phone_number}`}
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <Phone className="w-4 h-4" />
                      {enrichedPlace.formatted_phone_number}
                    </a>
                  )}
                  {enrichedPlace.website && (
                    <a 
                      href={enrichedPlace.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {enrichedPlace.photos && enrichedPlace.photos.length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Photos</h3>
                <div className="grid grid-cols-2 gap-2">
                  {enrichedPlace.photos.slice(0, 4).map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab("photos")}
                      className="relative aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      {imageErrors.has(idx) ? (
                        <ImagePlaceholder type="image" />
                      ) : (
                        <img
                          src={photo}
                          alt={`${enrichedPlace.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(idx)}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Reviews ({totalReviews})
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(parseFloat(averageRating))
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-white">{averageRating}</span>
                  <span className="text-sm text-gray-500">average</span>
                </div>
              </div>
            </div>

            {isLoadingAiReview && !currentPlaceAiReview && (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
                <p className="text-sm text-gray-400">Generating AI summary...</p>
              </div>
            )}

            {aiCuratedSummary.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V5h2v4H9zm0 4v-2h2v2H9z"/>
                  </svg>
                  Curated by Walvee AI
                </h4>
                <div className="space-y-3">
                  {aiCuratedSummary.map(renderReviewCard)}
                </div>
              </div>
            )}

            {isEnriching && !googleReviewsList.length && (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                <p className="text-sm text-gray-400">Loading Google reviews...</p>
              </div>
            )}
            {googleReviewsList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    From Google ({googleReviewsList.length})
                  </h4>
                  {googleReviewsList.length > 3 && (
                    <button
                      onClick={() => toggleSection('google')}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      {expandedSections.google ? (
                        <>Show less <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Show more <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(expandedSections.google ? googleReviewsList : googleReviewsList.slice(0, 3)).map(renderReviewCard)}
                </div>
              </div>
            )}

            {formattedUserReviews.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                    </svg>
                    From Walvee Travelers ({formattedUserReviews.length})
                  </h4>
                  {formattedUserReviews.length > 3 && (
                    <button
                      onClick={() => toggleSection('walvee')}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      {expandedSections.walvee ? (
                        <>Show less <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Show more <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(expandedSections.walvee ? formattedUserReviews : formattedUserReviews.slice(0, 3)).map(renderReviewCard)}
                </div>
              </div>
            )}
            
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1F1F1F]">
              <h4 className="font-semibold text-white mb-3">
                Share your experience
              </h4>

              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">
                  Your Rating <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredStar || reviewRating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {priceLevel > 0 && (
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">
                    Price Opinion <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "cheap", label: "Cheap", symbol: "$" },
                      { value: "fair", label: "Fair", symbol: "$$" },
                      { value: "expensive", label: "Expensive", symbol: "$$$" },
                      { value: "very_expensive", label: "Very Expensive", symbol: "$$$$" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setReviewPriceOpinion(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          reviewPriceOpinion === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-[#0D0D0D] text-gray-400 hover:bg-[#1F1F1F]"
                        }`}
                      >
                        <span className="font-bold text-green-400">{option.symbol}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">
                  Your Experience <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full bg-[#0D0D0D] border border-[#2A2B38] rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={addReviewMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
              >
                {addReviewMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  "POST REVIEW"
                )}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "photos" && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {(enrichedPlace.photos || []).map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => openPhotoModal(idx)}
                  className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                >
                  {imageErrors.has(idx) ? (
                    <ImagePlaceholder type="image" />
                  ) : (
                    <img
                      src={photo}
                      alt={`${enrichedPlace.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(idx)}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "directions" && (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center mb-8">
                <Navigation className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Get Directions</h3>
                <p className="text-gray-400 text-sm">
                  Choose your preferred mode of transportation and click the button below to open Google Maps with directions to this location.
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-3 font-medium">Select transportation mode:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTransportMode("walking")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      transportMode === "walking"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-[#111827] border-[#2A2B38] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <Footprints className="w-6 h-6" />
                    <span className="text-sm font-medium">Walking</span>
                  </button>

                  <button
                    onClick={() => setTransportMode("driving")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      transportMode === "driving"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-[#111827] border-[#2A2B38] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <Car className="w-6 h-6" />
                    <span className="text-sm font-medium">Car</span>
                  </button>

                  <button
                    onClick={() => setTransportMode("transit")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      transportMode === "transit"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-[#111827] border-[#2A2B38] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <Bus className="w-6 h-6" />
                    <span className="text-sm font-medium">Public Transit</span>
                  </button>

                  <button
                    onClick={() => setTransportMode("bicycling")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      transportMode === "bicycling"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-[#111827] border-[#2A2B38] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <Bike className="w-6 h-6" />
                    <span className="text-sm font-medium">Bike</span>
                  </button>
                </div>
              </div>

              <Button
                onClick={() => {
                  const destination = encodeURIComponent(enrichedPlace.formatted_address || enrichedPlace.address || enrichedPlace.name);
                  const travelModeMap = {
                    'walking': 'walking',
                    'driving': 'driving',
                    'transit': 'transit',
                    'bicycling': 'bicycling'
                  };
                  const travelMode = travelModeMap[transportMode] || 'driving';
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${travelMode}`;
                  window.open(url, '_blank');
                }}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open in Google Maps
              </Button>
            </div>
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-4 p-6">
            <h3 className="text-lg font-semibold text-white">Save to Favorites</h3>

            <Button
              onClick={handleFavoriteToggle}
              disabled={isToggling}
              className={`w-full ${
                isFavorite
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
              }`}
            >
              {isToggling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isFavorite ? "Removing..." : "Adding..."}
                </>
              ) : (
                <>
                  <Heart className={`w-5 h-5 mr-2 ${isFavorite ? "fill-white" : ""}`} />
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </>
              )}
            </Button>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1F1F1F]">
              <p className="text-gray-300 text-sm leading-relaxed">
                {isFavorite
                  ? "✅ This place is saved to your favorites. We'll remind you about it when you're creating a trip itinerary in this city."
                  : "💡 Save this place to quickly find it later. We'll remind you about your favorite spots when you're planning trips in this city."}
              </p>
            </div>

            {isFavorite && (
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4">
                <h4 className="font-semibold text-white text-sm mb-2">Smart Suggestions</h4>
                <p className="text-blue-200 text-xs leading-relaxed">
                  Your favorites help us provide better recommendations and will appear automatically when you create new trips to {trip?.destination?.split(',')[0] || enrichedPlace.formatted_address?.split(',')[1]?.trim() || 'this city'}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPhotoIndex !== null && enrichedPlace.photos && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closePhotoModal}
          onKeyDown={handlePhotoModalKeyDown}
          tabIndex={0}
        >
          <button
            onClick={closePhotoModal}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white font-medium text-xs border border-white/10">
            {selectedPhotoIndex + 1} / {enrichedPlace.photos.length}
          </div>

          {enrichedPlace.photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-6 top-1/2 -translate-y-2/4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all border border-white/20"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {enrichedPlace.photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-6 top-1/2 -translate-y-2/4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all border border-white/20"
              aria-label="Next photo"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div 
            className="max-w-[90vw] max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {imageErrors.has(selectedPhotoIndex) ? (
              <div className="w-[80vw] h-[80vh] flex items-center justify-center">
                <ImagePlaceholder type="image" />
              </div>
            ) : (
              <img
                src={enrichedPlace.photos[selectedPhotoIndex]}
                alt={`${enrichedPlace.name} ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                onError={() => handleImageError(selectedPhotoIndex)}
              />
            )}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white font-medium text-sm border border-white/10">
            {enrichedPlace.name}
          </div>
        </div>
      )}
    </aside>
  );
}
