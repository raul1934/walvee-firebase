
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, X, MapPin, Star, Sparkles, Filter, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FiltersModal from '../components/inspire/FiltersModal';
import CitiesModal from '../components/inspire/CitiesModal';
import MiniCardGrid from '../components/inspire/MiniCardGrid';
import RecommendationModal from '../components/inspire/RecommendationModal';
import UserAvatar from '../components/common/UserAvatar';
import PlaceDetails from '../components/trip/PlaceDetails';

const EXAMPLE_PROMPTS = [
  "Scuba trip through Southeast Asia on a budget.",
  "A quiet week in Tuscany with vineyards and sunsets.",
  "Chasing northern lights in Norway this winter.",
  "Exploring Tokyo's food markets for 5 days.",
  "A long weekend in Lisbon with local culture.",
];

/**
 * ⚠️ CRITICAL - Normalize city name to avoid duplicates
 * 
 * Handles various formats:
 * - "Miami, Estados Unidos" 
 * - "Miami, Estados Unidos, United States"
 * - "Miami, United States"
 * - "Miami"
 * 
 * Always returns: "city, country" (normalized, lowercase) or "city" if no country specified.
 * 
 * EXAMPLES:
 * ✓ "Miami, Estados Unidos" → "miami, estados unidos"
 * ✓ "Miami, Estados Unidos, United States" → "miami, estados unidos"
 * ✓ "Miami, United States" → "miami, united states"
 * ✓ "Miami" → "miami"
 */
const normalizeCityName = (cityName) => {
  if (!cityName) return '';
  
  // Normalize: lowercase and trim
  const normalized = cityName.toLowerCase().trim();
  
  // Split by comma
  const parts = normalized
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  if (parts.length === 0) return '';
  
  // If only city name (no country)
  if (parts.length === 1) {
    return parts[0];
  }
  
  // If has city + country (or more)
  // Always use first part (city) + last part (country)
  const cityPart = parts[0];
  const countryPart = parts[parts.length - 1];
  
  const result = `${cityPart}, ${countryPart}`;
  return result;
};

/**
 * ⚠️ CRITICAL - Check if city already exists in tabs
 * 
 * Uses smart comparison to detect duplicates even with different formats:
 * - "Miami, Estados Unidos" vs "Miami, Estados Unidos, United States" → DUPLICATE
 * - "Miami, Estados Unidos" vs "Miami, United States" → DUPLICATE (if country names are considered similar)
 * 
 * LOGIC:
 * 1. Normalize both city names to get 'city' and 'country' parts.
 * 2. Compare the CITY part (first segment) - must match.
 * 3. If cities match, compare COUNTRY parts.
 * 4. If countries are an exact match OR one country name contains significant parts of the other (to handle translations like "Estados Unidos" vs "United States"), then it's a DUPLICATE.
 * 5. Also considers "City" vs "City, Country" as a duplicate if cities match.
 */
const isCityInTabs = (cityName, existingTabs) => {
  if (!cityName || !existingTabs || existingTabs.length === 0) {
    return false;
  }
  
  const normalizedInput = normalizeCityName(cityName);
  const inputParts = normalizedInput.split(',').map(p => p.trim());
  const inputCity = inputParts[0];
  const inputCountry = inputParts.length > 1 ? inputParts[inputParts.length - 1] : '';
  
  for (const tab of existingTabs) {
    const normalizedTab = normalizeCityName(tab.name);
    const tabParts = normalizedTab.split(',').map(p => p.trim());
    const tabCity = tabParts[0];
    const tabCountry = tabParts.length > 1 ? tabParts[tabParts.length - 1] : '';
    
    // Cities must match exactly
    if (inputCity !== tabCity) {
      continue;
    }
    
    // If cities match, check countries
    // Case 1: Both are city-only, or both are city,country and countries match
    if (inputParts.length === 1 && tabParts.length === 1) {
      // Both are city only, and cities match
      return true;
    } else if (inputParts.length > 1 && tabParts.length > 1 && inputCountry === tabCountry) {
      // Both have country, and countries match exactly
      return true;
    } else if ((inputParts.length === 1 && tabParts.length > 1) || (inputParts.length > 1 && tabParts.length === 1)) {
        // One is "City" and the other is "City, Country". If cities match, consider it a duplicate.
        // This handles cases like input "Miami" and existing tab "Miami, United States", or vice-versa.
        return true;
    }
    
    // Case 2: Countries don't match exactly, but might be translations/synonyms
    if (inputCountry && tabCountry) { // Only attempt this if both have country parts
        const countryWords1 = inputCountry.split(' ').filter(word => word.length > 2);
        const countryWords2 = tabCountry.split(' ').filter(word => word.length > 2);
        
        // Check if they share significant words
        const sharedWords = countryWords1.filter(word1 => 
            countryWords2.some(word2 => word1.includes(word2) || word2.includes(word1))
        );
        
        if (sharedWords.length > 0) {
            return true;
        }
    }
  }
  
  return false;
};

/**
 * ⚠️ CRITICAL FUNCTION - DO NOT MODIFY WITHOUT UNDERSTANDING ⚠️
 *
 * Determines if a recommendation is a CITY or a PLACE/LOCAL
 * This is used to decide which modal to open:
 * - City → RecommendationModal (with CityModalContent)
 * - Place → PlaceDetails modal
 *
 * TESTED AND WORKING LOGIC:
 * 1. PRIORITY 1: Trust AI's explicit type
 *    - type === 'city' OR 'cidade' → TRUE (it's a city)
 *    - type === 'place'/'activity'/'business'/'lugar'/'atividade'/'negócio' → FALSE (it's a place)
 *
 * 2. PRIORITY 2: Check for place_id
 *    - Has place_id → FALSE (cities don't have place_ids, only specific places do)
 *
 * 3. PRIORITY 3: Check name for place keywords
 *    - Contains: park, museum, beach, restaurant, avenue, etc. → FALSE
 *
 * 4. DEFAULT: If no clear indicators → FALSE (safer to assume place)
 *
 * EXAMPLES:
 * ✓ "Paris, France" (type: city) → TRUE → Opens City Modal
 * ✓ "Silicon Valley" (type: cidade) → TRUE → Opens City Modal
 * ✓ "Ibirapuera Park" (type: place) → FALSE → Opens Place Modal
 * ✓ "Avenida Paulista" (type: place) → FALSE → Opens Place Modal
 */
const isCityRecommendation = (rec) => {
  console.log('[isCityRecommendation] 🔍 Checking:', {
    name: rec.name,
    type: rec.type,
    hasPlaceId: !!rec.place_id,
    hasCountry: !!rec.country
  });

  // ==========================================
  // PRIORITY 1: Trust the type from AI
  // Accept both English and Portuguese types
  // ==========================================
  const typeNormalized = rec.type?.toLowerCase().trim();
  
  // City types (English and Portuguese)
  if (typeNormalized === 'city' || typeNormalized === 'cidade') {
    console.log('[isCityRecommendation] ✅ Type is "city/cidade" → CITY MODAL');
    return true;
  }

  // Place types (English and Portuguese)
  const placeTypes = ['place', 'activity', 'business', 'lugar', 'atividade', 'negócio'];
  if (placeTypes.includes(typeNormalized)) {
    console.log('[isCityRecommendation] ✅ Type is place/activity/business/lugar/atividade/negócio → PLACE MODAL');
    return false;
  }

  // ==========================================
  // PRIORITY 2: Check for place_id
  // Cities usually don't have place_id. Specific places do.
  // ==========================================
  const hasPlaceId = rec.place_id && rec.place_id.length > 0;
  if (hasPlaceId) {
    console.log('[isCityRecommendation] ✅ Has place_id → PLACE MODAL');
    return false;
  }

  // ==========================================
  // PRIORITY 3: Check name for common place keywords
  // ==========================================
  const placeKeywords = [
    'park', 'parque',
    'museum', 'museu',
    'beach', 'praia',
    'restaurant', 'restaurante',
    'bar', 'cafe', 'café',
    'hotel',
    'mall', 'shopping',
    'market', 'mercado',
    'avenue', 'avenida',
    'street', 'rua',
    'square', 'praça',
    'garden', 'jardim',
    'tower', 'torre',
    'palace', 'palácio',
    'cathedral', 'catedral',
    'church', 'igreja',
    'temple', 'templo'
  ];
  const nameLower = rec.name.toLowerCase();

  if (placeKeywords.some(keyword => nameLower.includes(keyword))) {
    console.log('[isCityRecommendation] ✅ Name contains place keyword → PLACE MODAL');
    return false;
  }

  // ==========================================
  // DEFAULT: When in doubt, treat as a place
  // ==========================================
  console.log('[isCityRecommendation] ⚠️ No clear indicators → PLACE MODAL (default)');
  return false;
};

export default function InspirePrompt({ user }) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Conversation & Recommendations
  const [messages, setMessages] = useState([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  // City tabs management
  const [cityTabs, setCityTabs] = useState([]);
  const [activeCity, setActiveCity] = useState(null);

  // Filters & Cities modal
  const [showFilters, setShowFilters] = useState(false);
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    interests: [],
    budget: null,
    pace: null,
    companions: null,
    season: null
  });

  // Recommendation Modal State
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show more recommendations
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // Loading phrases
  const [loadingPhrase, setLoadingPhrase] = useState(0);

  // Example prompts rotation
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const exampleIntervalRef = useRef(null);

  // Welcome content - Apple Intelligence style
  const welcomeContent = {
    en: {
      hero: "Travel planning with us is different.",
      features: [
        {
          number: "1",
          title: "Start from the essence.",
          description: "Everything in Walvee begins with cities — living places where every journey takes shape. Describe your trip in your own words, and Walvee's AI will translate your ideas into destinations that match your spirit of adventure.",
          color: "violet"
        },
        {
          number: "2",
          title: "Explore in depth.",
          description: "Each city becomes a living space — a tab where you can talk, explore, and design your journey. Find hidden spots, experiences, and people — and choose what truly belongs in your story.",
          color: "blue"
        },
        {
          number: "3",
          title: "Let it unfold naturally.",
          description: "Forget about schedules for now. When you're ready, Walvee organizes it all — days, paths, stays, and connections — turning your vision into a real itinerary.",
          color: "cyan"
        }
      ]
    },
    pt: {
      hero: "Criar viagem com a gente é diferente.",
      features: [
        {
          number: "1",
          title: "Comece pela essência.",
          description: "Tudo na Walvee começa com cidades — lugares vivos onde cada jornada toma forma. Descreva sua viagem com suas próprias palavras e a IA da Walvee vai traduzir suas ideias em destinos que combinam com seu espírito de aventura.",
          color: "violet"
        },
        {
          number: "2",
          title: "Explore em profundidade.",
          description: "Cada cidade se torna um espaço vivo — uma aba onde você pode conversar, explorar e desenhar sua jornada. Encontre lugares escondidos, experiências e pessoas — e escolha o que realmente pertence à sua história.",
          color: "blue"
        },
        {
          number: "3",
          title: "Deixe acontecer naturalmente.",
          description: "Esqueça os horários por enquanto. Quando estiver pronta, a Walvee organiza tudo — dias, caminhos, hospedagens e conexões — transformando sua visão em um roteiro real.",
          color: "cyan"
        }
      ]
    }
  };

  // Detect user language
  const userLanguage = messages.some(m =>
    /[àáâãéêíóôõúç]/i.test(m.content)
  ) ? 'pt' : 'en';

  const content = welcomeContent[userLanguage];

  // Auto scroll to bottom when new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initial focus on input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Example rotation (for input placeholder)
  useEffect(() => {
    if (isFocused || inputValue.trim() || messages.length > 0) {
      if (exampleIntervalRef.current) {
        clearInterval(exampleIntervalRef.current);
        exampleIntervalRef.current = null;
      }
      return;
    }

    exampleIntervalRef.current = setInterval(() => {
      setCurrentExampleIndex(prev => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 4000);

    return () => {
      if (exampleIntervalRef.current) clearInterval(exampleIntervalRef.current);
    };
  }, [isFocused, inputValue, messages.length]);

  // Loading phrases rotation
  useEffect(() => {
    if (!isLoadingResponse) {
      setLoadingPhrase(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingPhrase(prev => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoadingResponse]);

  // Helper for price level display
  const getPriceRangeInfo = (priceLevel) => {
    switch (priceLevel) {
      case 0: return { symbol: 'Free', level: 0 };
      case 1: return { symbol: '$', level: 1 };
      case 2: return { symbol: '$$', level: 2 };
      case 3: return { symbol: '$$$', level: 3 };
      case 4: return { symbol: '$$$$', level: 4 };
      default: return null;
    }
  };

  /**
   * ⚠️ CRITICAL HANDLER - ADD CITY TO TABS ⚠️
   * 
   * Prevents duplicate cities from being added
   * Uses isCityInTabs() for smart duplicate detection
   */
  const handleAddCityToTrip = (cityName) => {
    console.log('[handleAddCityToTrip] ===== ADDING CITY TO TABS =====');
    console.log('[handleAddCityToTrip] City name:', cityName);
    console.log('[handleAddCityToTrip] Current tabs:', cityTabs.map(t => t.name));
    
    // Always close modal and clear selection when adding/activating a city tab
    setIsModalOpen(false);
    setSelectedRecommendation(null);

    // Check for duplicates BEFORE adding
    if (isCityInTabs(cityName, cityTabs)) {
      console.log('[handleAddCityToTrip] ⚠️ City already exists in tabs, activating it instead.');
      
      let foundExistingTab = null;
      const normalizedInput = normalizeCityName(cityName);
      const inputParts = normalizedInput.split(',').map(p => p.trim());
      const inputCity = inputParts[0];
      const inputCountry = inputParts.length > 1 ? inputParts[inputParts.length - 1] : '';

      for (const tab of cityTabs) {
        const normalizedTab = normalizeCityName(tab.name);
        const tabParts = normalizedTab.split(',').map(p => p.trim());
        const tabCity = tabParts[0];
        const tabCountry = tabParts.length > 1 ? tabParts[tabParts.length - 1] : '';

        if (inputCity !== tabCity) {
          continue;
        }

        if (inputParts.length === 1 && tabParts.length === 1) {
            foundExistingTab = tab;
            break;
        } else if (inputParts.length > 1 && tabParts.length > 1 && inputCountry === tabCountry) {
            foundExistingTab = tab;
            break;
        } else if ((inputParts.length === 1 && tabParts.length > 1) || (inputParts.length > 1 && tabParts.length === 1)) {
            foundExistingTab = tab;
            break;
        }
        
        if (inputCountry && tabCountry) {
            const countryWords1 = inputCountry.split(' ').filter(word => word.length > 2);
            const countryWords2 = tabCountry.split(' ').filter(word => word.length > 2);
            const sharedWords = countryWords1.filter(word1 => 
                countryWords2.some(word2 => word1.includes(word2) || word2.includes(word1))
            );
            if (sharedWords.length > 0) {
                foundExistingTab = tab;
                break;
            }
        }
      }
      
      if (foundExistingTab) {
        console.log('[handleAddCityToTrip] Switching to existing tab:', foundExistingTab.name);
        setActiveCity(foundExistingTab.name);
        setInputValue('');
        inputRef.current?.focus();
      } else {
        console.warn('[handleAddCityToTrip] isCityInTabs returned true, but no specific matching existingTab found to activate. This scenario should be rare.');
      }
      return;
    }
    
    console.log('[handleAddCityToTrip] ✅ Adding new city tab');
    
    // Determine user's language for AI's response for the new city message
    const userLanguageForAI = messages.some(m =>
      /[àáâãéêíóôõúç]/i.test(m.content)
    ) ? 'pt' : 'en';

    const newTab = {
      name: cityName,
      places: [],
      createdAt: Date.now()
    };
    
    setCityTabs(prev => [...prev, newTab]);
    setActiveCity(cityName);
    
    // Re-add the city focus message for the new tab
    const cityFocusMessage = {
      role: 'assistant',
      content: userLanguageForAI === 'pt'
        ? `Ótimo! Agora que você escolheu ${cityName}, vamos focar nossa conversa nesta cidade. 🌟\n\nVocê pode me contar sobre seus interesses, o que você gosta de fazer, que tipo de lugares procura, e eu vou sugerir locais, atividades e experiências específicas em ${cityName}.\n\nO que você gostaria de explorar nesta cidade?`
        : `Great! Now that you've chosen ${cityName}, let's focus our conversation on this city. 🌟\n\nYou can tell me about your interests, what you like to do, what kind of places you're looking for, and I'll suggest specific places, activities and experiences in ${cityName}.\n\nWhat would you like to explore in this city?`,
      cityContext: cityName, // This ties the message to the new city tab
      timestamp: Date.now()
    };

    console.log('[handleAddCityToTrip] Adding city focus message for new tab');
    setMessages(prev => [...prev, cityFocusMessage]);

    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Handle adding place to trip
  const handleAddPlaceToTrip = (place) => {
    console.log('[InspirePrompt] Adding place to trip:', place);

    let cityName;
    if (place.city && place.country) {
      cityName = `${place.city}, ${place.country}`;
    } else if (place.city) {
      cityName = place.city;
    } else if (place.address) {
      // Attempt to extract city from address if no explicit city/country
      const addressParts = place.address.split(',').map(p => p.trim());
      if (addressParts.length >= 2) {
        // Assume last part is country, second to last is city if available
        cityName = `${addressParts[addressParts.length - 2]}, ${addressParts[addressParts.length - 1]}`;
      } else {
        cityName = addressParts[0]; // Just the first part
      }
    } else {
      cityName = 'Unknown City';
    }

    console.log('[InspirePrompt] Place city (derived):', cityName);

    const normalizedNewCityName = normalizeCityName(cityName);

    setCityTabs(prevTabs => {
      // Find existing tab using the robust isCityInTabs logic.
      let existingTab = null;
      const inputParts = normalizedNewCityName.split(',').map(p => p.trim());
      const inputCity = inputParts[0];
      const inputCountry = inputParts.length > 1 ? inputParts[inputParts.length - 1] : '';

      for (const tab of prevTabs) {
        const normalizedTab = normalizeCityName(tab.name);
        const tabParts = normalizedTab.split(',').map(p => p.trim());
        const tabCity = tabParts[0];
        const tabCountry = tabParts.length > 1 ? tabParts[tabParts.length - 1] : '';

        if (inputCity !== tabCity) {
          continue;
        }

        if (inputParts.length === 1 && tabParts.length === 1) {
            existingTab = tab;
            break;
        } else if (inputParts.length > 1 && tabParts.length > 1 && inputCountry === tabCountry) {
            existingTab = tab;
            break;
        } else if ((inputParts.length === 1 && tabParts.length > 1) || (inputParts.length > 1 && tabParts.length === 1)) {
            existingTab = tab;
            break;
        }

        if (inputCountry && tabCountry) {
            const countryWords1 = inputCountry.split(' ').filter(word => word.length > 2);
            const countryWords2 = tabCountry.split(' ').filter(word => word.length > 2);
            const sharedWords = countryWords1.filter(word1 => 
                countryWords2.some(word2 => word1.includes(word2) || word2.includes(word1))
            );
            if (sharedWords.length > 0) {
                existingTab = tab;
                break;
            }
        }
      }

      if (existingTab) {
        console.log('[InspirePrompt] Adding place to existing city tab:', existingTab.name);
        const placeExistsInTab = existingTab.places.some(p =>
          (p.place_id && p.place_id === place.place_id) ||
          (p.name === place.name && p.address === place.address)
        );

        if (placeExistsInTab) {
          console.log('[InspirePrompt] Place already exists in city tab, not adding again.');
          setActiveCity(existingTab.name);
          return prevTabs;
        }

        const updatedTabs = prevTabs.map(tab => {
          if (tab.name === existingTab.name) { // Match by original tab name to update
            return {
              ...tab,
              places: [...tab.places, {
                name: place.name,
                address: place.address,
                rating: place.rating,
                price_level: place.price_level,
                place_id: place.place_id,
                photos: place.photos || [],
                types: place.types || [],
                addedAt: Date.now()
              }]
            };
          }
          return tab;
        });
        setActiveCity(existingTab.name);
        return updatedTabs;

      } else {
        console.log('[InspirePrompt] Creating new city tab with place:', cityName);

        const userLanguageForAI = messages.some(m =>
          /[àáâãéêíóôõúç]/i.test(m.content)
        ) ? 'pt' : 'en';

        const newTab = {
          name: cityName,
          places: [{
            name: place.name,
            address: place.address,
            rating: place.rating,
            price_level: place.price_level,
            place_id: place.place_id,
            photos: place.photos || [],
            types: place.types || [],
            addedAt: Date.now()
          }],
          createdAt: Date.now()
        };

        const updatedTabs = [...prevTabs, newTab];
        setActiveCity(cityName);

        const cityFocusMessage = {
          role: 'assistant',
          content: userLanguageForAI === 'pt'
            ? `Ótimo! Adicionei ${place.name} ao seu roteiro em ${cityName}. 🎉\n\nVocê pode me contar mais sobre o que gostaria de fazer nesta cidade e eu vou sugerir outros locais e atividades.\n\nO que mais você gostaria de explorar?`
            : `Great! I've added ${place.name} to your itinerary in ${cityName}. 🎉\n\nYou can tell me more about what you'd like to do in this city and I'll suggest other places and activities.\n\nWhat else would you like to explore?`,
          cityContext: cityName,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, cityFocusMessage]);

        return updatedTabs;
      }
    });

    setIsModalOpen(false);
    setSelectedRecommendation(null);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Handle removing place from trip
  const handleRemovePlace = (cityName, placeName) => {
    setCityTabs(prevTabs => prevTabs.map(tab => {
      if (tab.name === cityName) {
        return {
          ...tab,
          places: (tab.places || []).filter(p => p.name !== placeName)
        };
      }
      return tab;
    }));
  };

  // Handle removing city tab
  const handleRemoveCityTab = (cityName, e) => {
    e.stopPropagation();
    console.log('[InspirePrompt] Removing city tab:', cityName);

    setCityTabs(prev => prev.filter(tab => tab.name !== cityName));

    if (activeCity === cityName) {
      setActiveCity(null);
    }
  };

  /**
   * ⚠️ CRITICAL HANDLER - MODAL ROUTING LOGIC ⚠️
   *
   * Handles click on recommendation cards
   * Uses isCityRecommendation() to determine which modal to open
   *
   * DO NOT MODIFY without testing both:
   * - City recommendations (should open RecommendationModal)
   * - Place recommendations (should open PlaceDetails modal)
   */
  const handleRecommendationClick = (rec) => {
    console.log('[InspirePrompt] ===== RECOMMENDATION CLICKED =====');
    console.log('[InspirePrompt] Name:', rec.name);
    console.log('[InspirePrompt] Type:', rec.type);
    console.log('[InspirePrompt] Has place_id:', !!rec.place_id);
    console.log('[InspirePrompt] Full rec:', rec);

    setSelectedRecommendation(rec);
    setIsModalOpen(true);
  };

  // Handle adding place from the PlaceDetails modal to the trip
  const handleAddPlaceFromModal = () => {
    if (!selectedRecommendation) return;

    console.log('[InspirePrompt] Adding place from modal:', selectedRecommendation);

    handleAddPlaceToTrip(selectedRecommendation);

    setIsModalOpen(false);
    setSelectedRecommendation(null);
  };

  // Get filtered messages based on active city
  const filteredMessages = activeCity === null
    ? messages.filter(m => !m.cityContext)
    : messages.filter(m => m.cityContext === activeCity);

  // Handle input submission
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!inputValue.trim() || isLoadingResponse) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      cityContext: activeCity,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = inputValue;
    setInputValue('');
    setIsLoadingResponse(true);

    try {
      console.log('[InspirePrompt] Calling Gemini...');

      // Build context from filters
      let filterContext = '';
      if (selectedFilters.interests.length > 0) {
        filterContext += `\nInterests: ${selectedFilters.interests.join(', ')}`;
      }
      if (selectedFilters.budget) {
        filterContext += `\nBudget: ${selectedFilters.budget}`;
      }
      if (selectedFilters.pace) {
        filterContext += `\nTravel pace: ${selectedFilters.pace}`;
      }
      if (selectedFilters.companions) {
        filterContext += `\nTraveling with: ${selectedFilters.companions}`;
      }
      if (selectedFilters.season) {
        filterContext += `\nPreferred season: ${selectedFilters.season}`;
      }

      // Build conversation history
      const conversationHistory = filteredMessages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      // Determine user's language for AI's response
      const detectLanguage = (text) => {
        const portuguesePatterns = /\b(roteiro|viagem|praia|mergulho|hotel|cidade|país|dia|semana|mês|ano|quero|gostaria|preciso|ajuda|brasil|portugal)\b/i;
        return portuguesePatterns.test(text) ? 'pt' : 'en';
      };

      const userLanguageForAI = detectLanguage(currentInput);

      let systemPrompt = `You are a travel planning assistant for Walvee, helping users create personalized trip itineraries.

IMPORTANT: Always check grammar and spelling in your responses. Ensure all text is grammatically correct in ${userLanguageForAI === 'pt' ? 'Portuguese' : 'English'}.`;

      // Add city context if active
      if (activeCity) {
        systemPrompt += `\n\nCURRENT CITY CONTEXT: The user is currently planning their trip to ${activeCity}. Focus recommendations ONLY on places, activities, and experiences IN ${activeCity}. Do NOT suggest other cities.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

USER FILTERS:${filterContext || ' None specified yet'}

CURRENT USER MESSAGE: "${currentInput}"

INSTRUCTIONS:
1. **Check grammar and spelling** in all your responses
2. **Always provide recommendations** - ${activeCity ? 'places, beaches, activities, or businesses IN ' + activeCity : 'cities, places, activities, or businesses'}
3. **Return structured data** with a conversational message AND recommendations
4. ${activeCity ? '**IMPORTANT: Only recommend places WITHIN ' + activeCity + '**' : '**City Detection**: Identify if user mentioned a specific city'}
5. ${!activeCity ? '**If NO city mentioned AND no active city**: Suggest 3-4 destination cities' : ''}

**Response Format:**
{
  "message": "Warm, friendly response (2-3 sentences, use 1-2 emojis). ENSURE PERFECT GRAMMAR.",
  "recommendations": [
    {
      "name": "${activeCity ? 'Place/Activity/Business Name' : 'Place/City Name'}",
      "type": "${activeCity ? '\"place\" | \"activity\" | \"business\"' : '\"city\" | \"place\" | \"activity\" | \"business\" | \"cidade\" | \"lugar\" | \"atividade\" | \"negócio\"'}",
      "description": "Brief description",
      "city": "${activeCity || 'City name (if applicable)'}",
      "country": "Country",
      "why": "Why it matches"
    }
  ]
}

Provide 9-15 recommendations. Respond in ${userLanguageForAI === 'pt' ? 'Portuguese' : 'English'}.`,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  city: { type: "string" },
                  country: { type: "string" },
                  why: { type: "string" }
                }
              }
            }
          }
        }
      });

      console.log('[InspirePrompt] Gemini response:', response);

      // Add AI message with recommendations
      const aiMessage = {
        role: 'assistant',
        content: response.message || response,
        recommendations: response.recommendations || [],
        cityContext: activeCity,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);

      setShowAllRecommendations(false);

    } catch (error) {
      console.error('[InspirePrompt] Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try rephrasing your request?',
        recommendations: [],
        cityContext: activeCity,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingResponse(false);
      inputRef.current?.focus();
    }
  };

  // Handle manual city selection
  const handleCitySelect = (cityName) => {
    setInputValue(`Tell me about ${cityName}`);
    setShowCitiesModal(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Handle filters apply
  const handleApplyFilters = (filters) => {
    setSelectedFilters(filters);
    setShowFilters(false);
  };

  const loadingPhrases = [
    "Navigating digital seas and searching for information about your trip...",
    "School of cities and places spotted, we're close...",
    "Arriving at a place just for you in this infomare!"
  ];

  const activeCityPlaces = cityTabs.find(tab => tab.name === activeCity)?.places || [];

  console.log('[InspirePrompt] Active city:', activeCity);
  console.log('[InspirePrompt] Active city places:', activeCityPlaces);

  // Placeholder function for opening login modal
  const openLoginModal = () => {
    console.log("Login modal requested.");
  };

  return (
    <div className="inspire-container">
      <style>{`
        .inspire-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #121518;
          position: relative;
          overflow: hidden;
        }

        .inspire-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* City tabs container */
        .city-tabs-container {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          z-index: 30;
          background: #0A0B0F;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 16px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          flex-shrink: 0;
        }

        .city-tabs-container::-webkit-scrollbar {
          display: none;
        }

        /* Main chat tab */
        .city-tab.main-chat {
          background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
          border-color: rgba(59, 130, 246, 0.4);
          min-width: 120px;
        }

        .city-tab.main-chat:hover {
          background: linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%);
          border-color: rgba(96, 165, 250, 0.6);
        }

        .city-tab.main-chat.active {
          background: linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%);
          border-color: #60A5FA;
          box-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
        }

        /* Regular city tabs */
        .city-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(26, 27, 35, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .city-tab:hover {
          background: rgba(31, 34, 45, 0.9);
          border-color: rgba(59, 130, 246, 0.3);
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .city-tab.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.5);
          color: #FFFFFF;
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.2);
        }

        .city-tab-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          transition: all 0.2s ease;
          margin-left: 4px;
        }

        .city-tab-remove:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
          transform: scale(1.1);
        }

        /* Main layout */
        .inspire-main-layout {
          display: flex;
          height: calc(100vh - 64px - 56px - 96px);
          margin-top: calc(64px + 56px);
          position: relative;
          width: 100%;
        }

        /* Places sidebar */
        .places-sidebar {
          width: 300px;
          flex-shrink: 0;
          background: rgba(13, 14, 17, 0.95);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .places-sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .places-sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .places-sidebar-content::-webkit-scrollbar {
          width: 6px;
        }

        .places-sidebar-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .places-sidebar-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        /* Content scroll area */
        .content-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 20px 24px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }

        .content-scroll-area::-webkit-scrollbar {
          width: 6px;
        }

        .content-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .content-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        /* Stage Area */
        .stage-area {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        /* Conversation State */
        .conversation-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 20px 0;
          padding-bottom: 120px;
        }

        .message {
          display: flex;
          gap: 16px;
          animation: messageIn 0.4s ease;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .message-avatar.ai {
          background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
          padding: 10px;
        }

        .message-avatar.ai img {
          width: 55%;
          height: 55%;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }

        .message-avatar.user {
          background: rgba(255, 255, 255, 0.08);
          border: 2px solid rgba(255, 255, 255, 0.15);
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .message-user-name {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
        }

        .message-content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .message-content {
          max-width: 85%;
          padding: 20px 24px;
          border-radius: 20px;
          font-size: 15px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .message.assistant .message-content {
          background: rgba(37, 99, 235, 0.08);
          color: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(37, 99, 235, 0.15);
        }

        .message.user .message-content {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Loading phrase */
        .loading-phrase {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        /* Apple-style welcome section - UPDATED */
        .inspire-welcome {
          text-align: center;
          padding: 60px 20px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-hero {
          margin-bottom: 56px;
          position: relative;
        }

        .welcome-hero::after {
          content: '';
          position: absolute;
          bottom: -32px;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, rgba(139, 92, 246, 0.3), transparent);
        }

        .welcome-hero-title {
          font-size: clamp(40px, 5vw, 64px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Feature cards - HORIZONTAL GRID */
        .welcome-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          width: 100%;
          max-width: 1200px;
          margin-bottom: 56px;
        }

        .welcome-feature-card {
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px 32px;
          text-align: left;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          min-height: 320px;
          display: flex;
          flex-direction: column;
        }

        /* Card color variants */
        .welcome-feature-card.color-violet {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(109, 40, 217, 0.08) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .welcome-feature-card.color-blue {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(29, 78, 216, 0.08) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .welcome-feature-card.color-cyan {
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%);
          border: 1px solid rgba(34, 211, 238, 0.2);
        }

        /* Glow effect on hover */
        .welcome-feature-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 24px;
          padding: 2px;
          background: linear-gradient(135deg, transparent 0%, transparent 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .welcome-feature-card.color-violet::before {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(236, 72, 153, 0.4));
        }

        .welcome-feature-card.color-blue::before {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.4));
        }

        .welcome-feature-card.color-cyan::before {
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.6), rgba(59, 130, 246, 0.4));
        }

        .welcome-feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.25);
        }

        .welcome-feature-card:hover::before {
          opacity: 1;
        }

        /* Numbered badge with pulse */
        .feature-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin-bottom: 24px;
          position: relative;
          animation: gentlePulse 3s ease-in-out infinite;
        }

        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .color-violet .feature-number {
          background: linear-gradient(135deg, #8B5CF6, #A855F7);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }

        .color-blue .feature-number {
          background: linear-gradient(135deg, #3B82F6, #60A5FA);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        }

        .color-cyan .feature-number {
          background: linear-gradient(135deg, #22D3EE, #06B6D4);
          box-shadow: 0 8px 24px rgba(34, 211, 238, 0.3);
        }

        .feature-title {
          font-size: 26px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .feature-description {
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.75);
          flex: 1;
        }

        /* Action buttons */
        .welcome-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .welcome-button {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          cursor: pointer;
        }

        .welcome-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.25);
        }

        /* Mobile - horizontal scroll with snap */
        @media (max-width: 1024px) {
          .welcome-features {
            grid-template-columns: 1fr; /* Reset grid for smaller screens */
            gap: 20px;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 0 20px;
            display: flex; /* Override grid display for horizontal scroll */
          }

          .welcome-features::-webkit-scrollbar {
            display: none;
          }

          .welcome-feature-card {
            min-width: 320px;
            max-width: 400px;
            flex-shrink: 0;
            scroll-snap-align: center;
            min-height: 280px;
            padding: 32px 24px;
          }

          .feature-title {
            font-size: 22px;
          }

          .feature-description {
            font-size: 15px;
          }
        }

        @media (max-width: 768px) {
          .inspire-welcome {
            padding: 40px 16px 32px;
          }

          .welcome-hero {
            margin-bottom: 48px;
          }

          .welcome-hero-title {
            font-size: 36px;
          }

          .welcome-features {
            margin-bottom: 40px;
            padding: 0 16px;
          }

          .welcome-feature-card {
            min-width: 280px;
            max-width: 320px;
          }

          .feature-number {
            width: 40px;
            height: 40px;
            font-size: 18px;
            margin-bottom: 20px;
          }

          .feature-title {
            font-size: 20px;
            margin-bottom: 12px;
          }

          .feature-description {
            font-size: 14px;
            line-height: 1.6;
          }
        }

        /* Place sidebar item */
        .place-sidebar-item {
          position: relative;
          background: rgba(26, 27, 35, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .place-sidebar-item:hover {
          background: rgba(31, 34, 45, 0.8);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateX(2px);
        }

        .place-sidebar-item-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .place-sidebar-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.15);
          border-radius: 10px;
          flex-shrink: 0;
        }

        .place-sidebar-item-content {
          flex: 1;
          min-width: 0;
          padding-right: 24px;
        }

        .place-sidebar-item-name {
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .place-sidebar-item-address {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .place-sidebar-item-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 52px;
        }

        .place-sidebar-item-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #FCD34D;
        }

        .place-sidebar-item-price {
          font-size: 13px;
          font-weight: 700;
          color: #34D399;
        }

        .place-sidebar-item-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0;
        }

        .place-sidebar-item:hover .place-sidebar-item-remove {
          opacity: 1;
        }

        .place-sidebar-item-remove:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          transform: scale(1.1);
        }

        /* Show more button */
        .show-more-container {
          display: flex;
          justify-content: center;
          padding: 24px 0;
          margin-top: 16px;
        }

        /* Prompt Block */
        .prompt-block-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          background: linear-gradient(to top, #121518 0%, #121518 80%, transparent 100%);
          padding: 32px 24px 24px;
          flex-shrink: 0;
        }

        .prompt-block-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .prompt-microcopy {
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 16px;
          font-weight: 500;
        }

        .prompt-wrapper {
          position: relative;
          background: rgba(26, 27, 35, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .prompt-input-container {
          position: relative;
        }

        .prompt-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 15px;
          line-height: 1.6;
          resize: none;
          min-height: 60px;
          max-height: 200px;
          font-family: inherit;
        }

        .prompt-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .prompt-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .prompt-action-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .prompt-action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .prompt-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filter-active-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 8px;
          height: 8px;
          background: #3B82F6;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        }

        .prompt-submit-btn {
          position: absolute;
          right: 16px;
          bottom: 16px;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          border: none;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .prompt-submit-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
        }

        .prompt-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Place modal */
        .place-modal-container {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .place-modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }

        .place-modal-content {
          position: relative;
          width: 100%;
          max-width: 520px;
          height: 100vh;
          background: #0D0D0D;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
          animation: slideInFromRight 0.3s ease-out;
          display: flex;
          flex-direction: column;
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 1024px) {
          .places-sidebar {
            width: 300px;
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 40;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .places-sidebar.open {
            transform: translateX(0);
          }

          .inspire-main-layout {
            padding-left: 0;
          }
        }

        @media (max-width: 768px) {
          .city-tabs-container {
            padding: 8px 16px;
          }

          .inspire-main-layout {
            margin-top: calc(64px + 40px);
            height: calc(100vh - 64px - 40px - 96px);
          }

          .content-scroll-area {
            padding: 16px 16px;
          }

          .place-modal-content {
            max-width: 100%;
          }
        }
      `}</style>

      {/* City Tabs - with Main Chat */}
      {(cityTabs.length > 0 || messages.length > 0) && (
        <div className="city-tabs-container">
          {/* Main Chat Tab - Always first */}
          <button
            className={`city-tab main-chat ${activeCity === null ? 'active' : ''}`}
            onClick={() => setActiveCity(null)}
          >
            <Sparkles className="w-4 h-4" />
            <span>Main Chat</span>
          </button>

          {/* City Tabs */}
          {cityTabs.map((tab) => (
            <button
              key={tab.name}
              className={`city-tab ${activeCity === tab.name ? 'active' : ''}`}
              onClick={() => setActiveCity(tab.name)}
            >
              <MapPin className="w-4 h-4" />
              <span>{tab.name}</span>
              <button
                className="city-tab-remove"
                onClick={(e) => handleRemoveCityTab(tab.name, e)}
                aria-label={`Remove ${tab.name}`}
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="inspire-main-layout">
        {/* Places Sidebar - Only show when city is active */}
        {activeCity && (
          <aside className="places-sidebar open">
            <div className="places-sidebar-header">
              <h3 className="text-base font-bold text-white mb-1">Your Places</h3>
              <p className="text-sm text-gray-400">
                {activeCityPlaces.length} {activeCityPlaces.length === 1 ? 'place' : 'places'} added
              </p>
            </div>

            <div className="places-sidebar-content">
              {activeCityPlaces.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400 mb-2">No places added yet</p>
                  <p className="text-xs text-gray-500">Start exploring and add places to build your itinerary</p>
                </div>
              ) : (
                <div>
                  {activeCityPlaces.map((place, idx) => {
                    const priceInfo = place.price_level ? getPriceRangeInfo(place.price_level) : null;

                    return (
                      <div key={`${place.name}-${idx}`} className="place-sidebar-item">
                        <div className="place-sidebar-item-header">
                          <div className="place-sidebar-item-icon">
                            <MapPin className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="place-sidebar-item-content">
                            <div className="place-sidebar-item-name" title={place.name}>
                              {place.name}
                            </div>
                            <div className="place-sidebar-item-address" title={place.address}>
                              {place.address}
                            </div>
                          </div>
                        </div>

                        {(place.rating || priceInfo) && (
                          <div className="place-sidebar-item-meta">
                            {place.rating && (
                              <div className="place-sidebar-item-rating">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>{place.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {priceInfo && (
                              <div className="place-sidebar-item-price">
                                {priceInfo.symbol}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          className="place-sidebar-item-remove"
                          onClick={() => handleRemovePlace(activeCity, place.name)}
                          title="Remove from trip"
                          aria-label="Remove place"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Scrollable Content Area - Chat */}
        <div className="content-scroll-area">
          <div className="stage-area">
            <AnimatePresence mode="wait">
              {/* Welcome Section - Apple Intelligence Style */}
              {messages.length === 0 && (
                <motion.div
                  key="welcome-section"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inspire-welcome"
                >
                  {/* Hero */}
                  <motion.div
                    className="welcome-hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <h1 className="welcome-hero-title">
                      {content.hero}
                    </h1>
                  </motion.div>

                  {/* Feature cards - Horizontal Grid */}
                  <div className="welcome-features">
                    {content.features.map((feature, index) => (
                      <motion.div
                        key={feature.number}
                        className={`welcome-feature-card color-${feature.color}`}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.3 + index * 0.15,
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                        <div className="feature-number">{feature.number}</div>
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Quick action buttons */}
                  <motion.div
                    className="welcome-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                  >
                    <button
                      onClick={() => setShowFilters(true)}
                      className="welcome-button"
                    >
                      <Filter className="w-5 h-5" />
                      Set Preferences
                    </button>
                    <button
                      onClick={() => setShowCitiesModal(true)}
                      className="welcome-button"
                    >
                      <Globe className="w-5 h-5" />
                      Explore Cities
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* State: Conversation */}
              {messages.length > 0 && (
                <motion.div
                  key="conversation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="conversation-container"
                >
                  {filteredMessages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                      <div className={`message-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                        {msg.role === 'assistant' ? (
                          <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/dda6b4bec_LogoWalvee.png"
                            alt="Walvee"
                          />
                        ) : (
                          <UserAvatar
                            src={user?.photo_url || user?.picture}
                            name={user?.preferred_name || user?.full_name || 'You'}
                            size="md"
                          />
                        )}
                      </div>

                      <div className="message-content-wrapper">
                        {msg.role === 'user' && (
                          <div className="message-header">
                            <span className="message-user-name">
                              {user?.preferred_name || user?.full_name || 'You'}
                            </span>
                          </div>
                        )}

                        <div className="message-content">{msg.content}</div>

                        {msg.role === 'assistant' && msg.recommendations && (
                          <>
                            <MiniCardGrid
                              recommendations={msg.recommendations.slice(0, showAllRecommendations ? msg.recommendations.length : 6)}
                              onCardClick={handleRecommendationClick}
                            />

                            {msg.recommendations.length > 6 && !showAllRecommendations && (
                              <div className="show-more-container">
                                <Button
                                  onClick={() => setShowAllRecommendations(true)}
                                  variant="outline"
                                  className="bg-gray-800/50 hover:bg-gray-700 border-gray-700 text-white"
                                >
                                  Show {msg.recommendations.length - 6} more recommendations
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoadingResponse && (
                    <div className="message assistant">
                      <div className="message-avatar ai">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                      <div className="message-content">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={loadingPhrase}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="loading-phrase"
                          >
                            {loadingPhrases[loadingPhrase]}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Fixed Prompt Block */}
      <div className="prompt-block-container">
        <div className="prompt-block-inner">
          <p className="prompt-microcopy">
            Every great trip begins with a few words. Start yours below.
          </p>

          <form onSubmit={handleSubmit} className="prompt-wrapper">
            <div className="prompt-input-container">
              <textarea
                ref={inputRef}
                className="prompt-textarea"
                placeholder={
                  messages.length > 0
                    ? "Continue your conversation..."
                    : EXAMPLE_PROMPTS[currentExampleIndex]
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoadingResponse}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div className="prompt-actions">
              <button
                type="button"
                className="prompt-action-btn"
                onClick={() => setShowFilters(true)}
                disabled={isLoadingResponse}
                style={{ position: 'relative' }}
              >
                Filters
                {(selectedFilters.interests.length > 0 || selectedFilters.budget ||
                  selectedFilters.pace || selectedFilters.companions || selectedFilters.season) && (
                    <span className="filter-active-dot" />
                  )}
              </button>

              <button
                type="button"
                className="prompt-action-btn"
                onClick={() => setShowCitiesModal(true)}
                disabled={isLoadingResponse}
              >
                Cities
              </button>
            </div>

            {inputValue.trim() && (
              <button
                type="submit"
                className="prompt-submit-btn"
                disabled={isLoadingResponse}
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Filters Modal */}
      <FiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedFilters={selectedFilters}
        onApply={handleApplyFilters}
      />

      {/* Cities Modal */}
      <CitiesModal
        isOpen={showCitiesModal}
        onClose={() => setShowCitiesModal(false)}
        onSelectCity={handleCitySelect}
      />

      {/* Modals - Conditional rendering based on recommendation type */}
      {isModalOpen && selectedRecommendation && (
        <>
          {isCityRecommendation(selectedRecommendation) ? (
            <RecommendationModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedRecommendation(null);
              }}
              recommendation={selectedRecommendation}
              user={user}
              openLoginModal={openLoginModal}
              onAddToTrip={() => handleAddCityToTrip(
                selectedRecommendation.country
                  ? `${selectedRecommendation.name}, ${selectedRecommendation.country}`
                  : selectedRecommendation.name
              )}
            />
          ) : (
            <div className="place-modal-container">
              <div
                className="place-modal-backdrop"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedRecommendation(null);
                }}
              />
              <div className="place-modal-content">
                <PlaceDetails
                  place={selectedRecommendation}
                  trip={{ destination: selectedRecommendation.city || selectedRecommendation.address }}
                  onClose={() => {
                    setIsModalOpen(false);
                    setSelectedRecommendation(null);
                  }}
                  user={user}
                  openLoginModal={openLoginModal}
                  onAddToTrip={handleAddPlaceFromModal}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
