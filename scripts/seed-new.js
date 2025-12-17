/**
 * Firebase Seeder Script
 *
 * Creates a Walvee account and 10 comprehensive trips with CORRECT data structure
 *
 * Usage:
 * node scripts/seed-new.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Walvee user data
const WALVEE_USER = {
  email: 'walvee@walvee.com',
  password: 'Walvee123!',
  full_name: 'Walvee',
  preferred_name: 'Walvee',
  photo_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/dda6b4bec_LogoWalvee.png',
  bio: 'Your AI-powered travel companion. Discover the world with personalized trip recommendations.',
  onboarding_completed: true,
  metrics_followers: 0,
  metrics_following: 0,
  metrics_trips: 10,
  metrics_likes_received: 0
};

// Helper function to create place objects
function createPlace(name, data = {}) {
  return {
    name,
    place_id: data.place_id || `ChIJ_generated_${Date.now()}_${Math.random()}`,
    address: data.address || '',
    formatted_address: data.formatted_address || data.address || '',
    rating: data.rating || 0,
    price_level: data.price_level || 0,
    types: data.types || ['point_of_interest'],
    photos: data.photos || [],
    photo: data.photo || data.photos?.[0] || null,
    order: data.order || 0,
    description: data.description || '',
    user_ratings_total: data.user_ratings_total || 0,
    ...( data.website && { website: data.website }),
    ...( data.formatted_phone_number && { formatted_phone_number: data.formatted_phone_number }),
    ...( data.opening_hours && { opening_hours: data.opening_hours }),
    ...( data.geometry && { geometry: data.geometry }),
  };
}

// Comprehensive trip data with CORRECT STRUCTURE
const TRIPS = [
  {
    title: 'Tokyo Food & Culture Immersion',
    destination: 'Tokyo, Japan',
    description: 'Experience the perfect blend of ancient traditions and futuristic innovation in Japan\'s vibrant capital. From serene temples to bustling fish markets, this 7-day journey will immerse you in authentic Japanese culture.',
    duration_days: 7,
    images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
    locations: ['Tokyo', 'Shibuya', 'Asakusa', 'Akihabara', 'Tsukiji'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Shibuya Crossing', {
            place_id: 'ChIJ_fake_shibuya_crossing',
            address: 'Shibuya, Tokyo, Japan',
            rating: 4.6,
            price_level: 0,
            types: ['tourist_attraction', 'point_of_interest'],
            photos: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800'],
            order: 0,
            description: 'Experience the world\'s busiest pedestrian crossing',
            user_ratings_total: 15234
          }),
          createPlace('Ichiran Ramen Shibuya', {
            place_id: 'ChIJ_fake_ichiran_shibuya',
            address: '1-22-7 Jinnan, Shibuya City, Tokyo',
            rating: 4.4,
            price_level: 2,
            types: ['restaurant', 'food'],
            photos: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800'],
            order: 1,
            description: 'Try authentic tonkotsu ramen',
            user_ratings_total: 8923
          }),
          createPlace('Shibuya Sky Observatory', {
            place_id: 'ChIJ_fake_shibuya_sky',
            address: 'Shibuya, Tokyo',
            rating: 4.7,
            price_level: 3,
            types: ['tourist_attraction', 'point_of_interest'],
            photos: ['https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],
            order: 2,
            description: 'Enjoy panoramic night views of Tokyo',
            user_ratings_total: 12456
          })
        ]
      },
      {
        day: 2,
        places: [
          createPlace('Tsukiji Outer Market', {
            place_id: 'ChIJ_fake_tsukiji_market',
            address: 'Tsukiji, Chuo City, Tokyo',
            rating: 4.4,
            price_level: 2,
            types: ['food', 'market', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800'],
            order: 0,
            description: 'Fresh sushi breakfast and explore the market stalls',
            user_ratings_total: 25678
          }),
          createPlace('Senso-ji Temple', {
            place_id: 'ChIJ_fake_sensoji_temple',
            address: '2-3-1 Asakusa, Taito City, Tokyo',
            rating: 4.5,
            price_level: 0,
            types: ['place_of_worship', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800'],
            order: 1,
            description: 'Visit Tokyo\'s oldest and most significant temple',
            user_ratings_total: 95234
          }),
          createPlace('Nakamise Shopping Street', {
            place_id: 'ChIJ_fake_nakamise_street',
            address: 'Asakusa, Taito City, Tokyo',
            rating: 4.3,
            price_level: 1,
            types: ['shopping_mall', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800'],
            order: 2,
            description: 'Browse traditional crafts and snacks',
            user_ratings_total: 18945
          })
        ]
      },
      {
        day: 3,
        places: [
          createPlace('TeamLab Borderless', {
            place_id: 'ChIJ_fake_teamlab',
            address: 'Odaiba, Tokyo',
            rating: 4.8,
            price_level: 3,
            types: ['museum', 'art_gallery', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800'],
            order: 0,
            description: 'Immersive digital art museum experience',
            user_ratings_total: 34567
          }),
          createPlace('Akihabara Electric Town', {
            place_id: 'ChIJ_fake_akihabara',
            address: 'Akihabara, Chiyoda City, Tokyo',
            rating: 4.5,
            price_level: 2,
            types: ['shopping_mall', 'electronics_store', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
            order: 1,
            description: 'Explore anime, manga, and electronics paradise',
            user_ratings_total: 28934
          })
        ]
      }
    ]
  },

  {
    title: 'Romantic Paris Getaway',
    destination: 'Paris, France',
    description: 'Experience the city of love with this perfect 5-day romantic itinerary. Stroll along the Seine, savor croissants at charming cafes, and witness the Eiffel Tower sparkle at night.',
    duration_days: 5,
    images: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    locations: ['Paris', 'Champ de Mars', 'Louvre', 'Montmartre'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Eiffel Tower', {
            place_id: 'ChIJ_fake_eiffel_tower',
            address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
            rating: 4.7,
            price_level: 3,
            types: ['tourist_attraction', 'landmark'],
            photos: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800'],
            order: 0,
            description: 'Ascend the Iron Lady for breathtaking views',
            user_ratings_total: 256789
          }),
          createPlace('Le Jules Verne Restaurant', {
            place_id: 'ChIJ_fake_jules_verne',
            address: 'Eiffel Tower, 75007 Paris',
            rating: 4.6,
            price_level: 4,
            types: ['restaurant', 'food'],
            photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
            order: 1,
            description: 'Michelin-starred dining with a view',
            user_ratings_total: 4523
          }),
          createPlace('Seine River Cruise', {
            place_id: 'ChIJ_fake_seine_cruise',
            address: 'Port de la Bourdonnais, 75007 Paris',
            rating: 4.5,
            price_level: 2,
            types: ['tourist_attraction', 'travel_agency'],
            photos: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
            order: 2,
            description: 'Romantic boat ride past Paris landmarks',
            user_ratings_total: 18234
          })
        ]
      },
      {
        day: 2,
        places: [
          createPlace('Louvre Museum', {
            place_id: 'ChIJ_fake_louvre',
            address: 'Rue de Rivoli, 75001 Paris',
            rating: 4.7,
            price_level: 2,
            types: ['museum', 'art_gallery', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
            order: 0,
            description: 'Explore the world\'s largest art museum',
            user_ratings_total: 389234
          }),
          createPlace('Tuileries Garden', {
            place_id: 'ChIJ_fake_tuileries',
            address: 'Place de la Concorde, 75001 Paris',
            rating: 4.6,
            price_level: 0,
            types: ['park', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'],
            order: 1,
            description: 'Leisurely stroll through beautiful gardens',
            user_ratings_total: 45678
          }),
          createPlace('Musée d\'Orsay', {
            place_id: 'ChIJ_fake_orsay',
            address: 'Rue de la Légion d\'Honneur, 75007 Paris',
            rating: 4.7,
            price_level: 2,
            types: ['museum', 'art_gallery'],
            photos: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
            order: 2,
            description: 'Admire Impressionist masterpieces',
            user_ratings_total: 123456
          })
        ]
      }
    ]
  },

  {
    title: 'Bali Spiritual Wellness Retreat',
    destination: 'Ubud, Bali, Indonesia',
    description: 'Find inner peace and rejuvenation in Bali\'s spiritual heart. This 10-day retreat combines yoga, meditation, healthy cuisine, and cultural exploration in the lush rice terraces of Ubud.',
    duration_days: 10,
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    locations: ['Ubud', 'Tegalalang', 'Tampaksiring'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Wellness Resort Check-in', {
            place_id: 'ChIJ_fake_ubud_resort',
            address: 'Ubud, Bali',
            rating: 4.8,
            price_level: 3,
            types: ['lodging', 'spa'],
            photos: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800'],
            order: 0,
            description: 'Welcome ceremony and room tour',
            user_ratings_total: 2345
          }),
          createPlace('Balinese Massage', {
            place_id: 'ChIJ_fake_massage',
            address: 'Resort Spa, Ubud',
            rating: 4.9,
            price_level: 2,
            types: ['spa', 'health'],
            photos: ['https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800'],
            order: 1,
            description: 'Traditional healing massage to ease travel tension',
            user_ratings_total: 1234
          }),
          createPlace('Sunset Meditation at Campuhan Ridge', {
            place_id: 'ChIJ_fake_campuhan',
            address: 'Campuhan Ridge Walk, Ubud',
            rating: 4.7,
            price_level: 0,
            types: ['park', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
            order: 2,
            description: 'Guided meditation overlooking rice paddies',
            user_ratings_total: 8976
          })
        ]
      },
      {
        day: 2,
        places: [
          createPlace('Sunrise Yoga Session', {
            place_id: 'ChIJ_fake_yoga',
            address: 'Resort Yoga Shala, Ubud',
            rating: 5.0,
            price_level: 0,
            types: ['gym', 'health'],
            photos: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'],
            order: 0,
            description: 'Vinyasa flow with rice field views',
            user_ratings_total: 567
          }),
          createPlace('Tegalalang Rice Terraces', {
            place_id: 'ChIJ_fake_tegalalang',
            address: 'Jalan Raya Tegalalang, Ubud',
            rating: 4.4,
            price_level: 1,
            types: ['tourist_attraction', 'nature'],
            photos: ['https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800'],
            order: 1,
            description: 'Walk through iconic rice paddies',
            user_ratings_total: 23456
          }),
          createPlace('Balinese Cooking Class', {
            place_id: 'ChIJ_fake_cooking',
            address: 'Local Home, Ubud',
            rating: 4.9,
            price_level: 2,
            types: ['school', 'food'],
            photos: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'],
            order: 2,
            description: 'Learn traditional recipes',
            user_ratings_total: 1876
          })
        ]
      }
    ]
  },

  {
    title: 'New York City First Timer',
    destination: 'New York City, USA',
    description: 'The ultimate introduction to the Big Apple! Experience iconic landmarks, world-class museums, diverse neighborhoods, and the unmatched energy that makes NYC one of the greatest cities on Earth.',
    duration_days: 6,
    images: ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
    locations: ['New York', 'Manhattan', 'Brooklyn', 'Times Square'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Times Square', {
            place_id: 'ChIJ_fake_times_square',
            address: 'Manhattan, NY 10036',
            rating: 4.6,
            price_level: 0,
            types: ['tourist_attraction', 'point_of_interest'],
            photos: ['https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800'],
            order: 0,
            description: 'Experience the heart of NYC\'s energy'
          }),
          createPlace('Empire State Building', {
            place_id: 'ChIJ_fake_empire_state',
            address: '350 5th Ave, New York, NY 10118',
            rating: 4.7,
            price_level: 3,
            types: ['tourist_attraction', 'landmark'],
            photos: ['https://images.unsplash.com/photo-1546436836-07a91091f160?w=800'],
            order: 1,
            description: 'Iconic Art Deco skyscraper views'
          }),
          createPlace('Katz\'s Deli', {
            place_id: 'ChIJ_fake_katzs',
            address: 'Lower East Side, NY',
            rating: 4.5,
            price_level: 2,
            types: ['restaurant', 'food'],
            photos: ['https://images.unsplash.com/photo-1513442542250-854d436a73f2?w=800'],
            order: 2,
            description: 'Legendary pastrami sandwiches'
          })
        ]
      }
    ]
  },

  {
    title: 'Iceland Ring Road Adventure',
    destination: 'Iceland',
    description: 'Drive the complete Ring Road and discover Iceland\'s raw natural beauty. From glaciers and waterfalls to hot springs and black sand beaches, this 14-day road trip is an adventure of a lifetime.',
    duration_days: 14,
    images: ['https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200',
    locations: ['Reykjavik', 'Thingvellir', 'Gullfoss', 'Jökulsárlón'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Thingvellir National Park', {
            place_id: 'ChIJ_fake_thingvellir',
            address: 'Golden Circle, Iceland',
            rating: 4.8,
            price_level: 0,
            types: ['park', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800'],
            order: 0,
            description: 'Walk between tectonic plates'
          }),
          createPlace('Geysir Geothermal Area', {
            place_id: 'ChIJ_fake_geysir',
            address: 'Golden Circle, Iceland',
            rating: 4.7,
            price_level: 0,
            types: ['tourist_attraction', 'nature'],
            photos: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'],
            order: 1,
            description: 'Watch Strokkur erupt every 5-10 minutes'
          }),
          createPlace('Gullfoss Waterfall', {
            place_id: 'ChIJ_fake_gullfoss',
            address: 'Golden Circle, Iceland',
            rating: 4.9,
            price_level: 0,
            types: ['tourist_attraction', 'nature'],
            photos: ['https://images.unsplash.com/photo-1578586983573-c3cb942bb519?w=800'],
            order: 2,
            description: 'Massive two-tiered waterfall'
          })
        ]
      }
    ]
  },

  {
    title: 'Barcelona Architecture & Tapas',
    destination: 'Barcelona, Spain',
    description: 'Discover Gaudí\'s masterpieces, feast on endless tapas, and soak up the Mediterranean sun. This 5-day itinerary perfectly balances culture, food, and beach time in Catalonia\'s vibrant capital.',
    duration_days: 5,
    images: ['https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=1200',
    locations: ['Barcelona', 'Eixample', 'Gothic Quarter', 'Gràcia'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Sagrada Familia', {
            place_id: 'ChIJ_fake_sagrada',
            address: 'Carrer de Mallorca, 401, 08013 Barcelona',
            rating: 4.7,
            price_level: 3,
            types: ['church', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800'],
            order: 0,
            description: 'Gaudí\'s iconic unfinished basilica'
          }),
          createPlace('Casa Batlló', {
            place_id: 'ChIJ_fake_casa_batllo',
            address: 'Passeig de Gràcia, Barcelona',
            rating: 4.7,
            price_level: 3,
            types: ['museum', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1565009369370-0b6e2ae1aeb4?w=800'],
            order: 1,
            description: 'Stunning modernist apartment building'
          }),
          createPlace('Park Güell', {
            place_id: 'ChIJ_fake_park_guell',
            address: 'Gràcia, Barcelona',
            rating: 4.6,
            price_level: 2,
            types: ['park', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800'],
            order: 2,
            description: 'Colorful mosaic park with city views'
          })
        ]
      }
    ]
  },

  {
    title: 'Patagonia Trekking Expedition',
    destination: 'El Chaltén & Torres del Paine',
    description: 'Trek through some of the world\'s most dramatic landscapes in Argentine and Chilean Patagonia. This 12-day expedition takes you to towering granite peaks, turquoise lakes, and massive glaciers.',
    duration_days: 12,
    images: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200',
    locations: ['El Chaltén', 'Torres del Paine', 'Patagonia'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Laguna de los Tres', {
            place_id: 'ChIJ_fake_laguna_tres',
            address: 'El Chaltén, Santa Cruz, Argentina',
            rating: 4.9,
            price_level: 0,
            types: ['hiking', 'nature'],
            photos: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800'],
            order: 0,
            description: 'Stunning glacial lake with Mt. Fitz Roy views'
          }),
          createPlace('Laguna Torre', {
            place_id: 'ChIJ_fake_laguna_torre',
            address: 'El Chaltén, Argentina',
            rating: 4.8,
            price_level: 0,
            types: ['hiking', 'nature'],
            photos: ['https://images.unsplash.com/photo-1562751361-ac86e0a245d1?w=800'],
            order: 1,
            description: 'Glacier lake beneath Cerro Torre'
          })
        ]
      }
    ]
  },

  {
    title: 'Vietnam Street Food Journey',
    destination: 'Hanoi to Ho Chi Minh City',
    description: 'Eat your way through Vietnam on this ultimate culinary adventure. From pho in Hanoi to banh mi in Hoi An, experience the incredible diversity of Vietnamese street food culture.',
    duration_days: 15,
    images: ['https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200',
    locations: ['Hanoi', 'Hoi An', 'Ho Chi Minh City', 'Old Quarter'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Old Quarter Hanoi', {
            place_id: 'ChIJ_fake_old_quarter',
            address: 'Hoàn Kiếm, Hanoi, Vietnam',
            rating: 4.5,
            price_level: 1,
            types: ['neighborhood', 'food'],
            photos: ['https://images.unsplash.com/photo-1528127269322-539801943592?w=800'],
            order: 0,
            description: 'Historic district famous for street food'
          }),
          createPlace('Pho Breakfast', {
            place_id: 'ChIJ_fake_pho',
            address: 'Old Quarter, Hanoi',
            rating: 4.7,
            price_level: 1,
            types: ['restaurant', 'food'],
            photos: ['https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800'],
            order: 1,
            description: 'Start with authentic beef pho'
          }),
          createPlace('Egg Coffee', {
            place_id: 'ChIJ_fake_egg_coffee',
            address: 'Old Quarter, Hanoi',
            rating: 4.6,
            price_level: 1,
            types: ['cafe', 'food'],
            photos: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800'],
            order: 2,
            description: 'Try egg coffee at a traditional cafe'
          })
        ]
      }
    ]
  },

  {
    title: 'Dubai Luxury & Desert',
    destination: 'Dubai, UAE',
    description: 'Experience the ultimate blend of luxury and adventure in Dubai. From world-record skyscrapers and luxury shopping to desert safaris and traditional souks, this 5-day trip has it all.',
    duration_days: 5,
    images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
    locations: ['Dubai', 'Downtown Dubai', 'Dubai Mall', 'Burj Khalifa'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Burj Khalifa', {
            place_id: 'ChIJ_fake_burj_khalifa',
            address: '1 Sheikh Mohammed bin Rashid Blvd, Dubai',
            rating: 4.7,
            price_level: 4,
            types: ['tourist_attraction', 'landmark'],
            photos: ['https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800'],
            order: 0,
            description: 'World\'s tallest building at 828 meters'
          }),
          createPlace('Dubai Mall', {
            place_id: 'ChIJ_fake_dubai_mall',
            address: 'Downtown Dubai',
            rating: 4.7,
            price_level: 4,
            types: ['shopping_mall', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800'],
            order: 1,
            description: 'Luxury shopping and aquarium visit'
          }),
          createPlace('Dubai Fountain Show', {
            place_id: 'ChIJ_fake_fountain',
            address: 'Dubai Mall, Downtown Dubai',
            rating: 4.8,
            price_level: 0,
            types: ['tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
            order: 2,
            description: 'Choreographed water and light show'
          })
        ]
      }
    ]
  },

  {
    title: 'Greece Island Hopping',
    destination: 'Santorini, Mykonos & Crete',
    description: 'Sail through the stunning Greek islands discovering whitewashed villages, crystal-clear waters, ancient ruins, and legendary sunsets. This 10-day journey covers the best of the Cyclades.',
    duration_days: 10,
    images: ['https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200'],
    image_url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200',
    locations: ['Santorini', 'Mykonos', 'Crete', 'Oia', 'Fira'],
    visibility: 'public',
    likes: 0,
    steals: 0,
    shares: 0,
    itinerary: [
      {
        day: 1,
        places: [
          createPlace('Oia Village', {
            place_id: 'ChIJ_fake_oia',
            address: 'Oia, Santorini 847 02, Greece',
            rating: 4.8,
            price_level: 3,
            types: ['tourist_attraction', 'village'],
            photos: ['https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800'],
            order: 0,
            description: 'Famous for stunning sunsets and white-washed buildings'
          }),
          createPlace('Fira Town', {
            place_id: 'ChIJ_fake_fira',
            address: 'Fira, Santorini, Greece',
            rating: 4.7,
            price_level: 2,
            types: ['town', 'tourist_attraction'],
            photos: ['https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800'],
            order: 1,
            description: 'Walk the caldera edge paths'
          }),
          createPlace('Greek Taverna Dinner', {
            place_id: 'ChIJ_fake_taverna',
            address: 'Oia, Santorini',
            rating: 4.6,
            price_level: 3,
            types: ['restaurant', 'food'],
            photos: ['https://images.unsplash.com/photo-1544125024-2f06c65f96f0?w=800'],
            order: 2,
            description: 'Fresh seafood with caldera views'
          })
        ]
      }
    ]
  }
];

/**
 * Create the Walvee user account
 */
async function createWalveeUser() {
  console.log('🚀 Creating Walvee user account...');

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      WALVEE_USER.email,
      WALVEE_USER.password
    );

    const userId = userCredential.user.uid;
    console.log(`✅ Created Firebase Auth user with ID: ${userId}`);

    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      email: WALVEE_USER.email,
      full_name: WALVEE_USER.full_name,
      preferred_name: WALVEE_USER.preferred_name,
      photo_url: WALVEE_USER.photo_url,
      bio: WALVEE_USER.bio,
      onboarding_completed: WALVEE_USER.onboarding_completed,
      metrics_followers: WALVEE_USER.metrics_followers,
      metrics_following: WALVEE_USER.metrics_following,
      metrics_trips: WALVEE_USER.metrics_trips,
      metrics_likes_received: WALVEE_USER.metrics_likes_received,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    console.log('✅ Created Firestore user document');
    return userId;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Walvee user already exists, continuing...');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        WALVEE_USER.email,
        WALVEE_USER.password
      );
      return userCredential.user.uid;
    }
    throw error;
  }
}

/**
 * Check if a trip already exists
 */
async function tripExists(userId, tripTitle) {
  const q = query(
    collection(db, 'trips'),
    where('created_by', '==', userId),
    where('title', '==', tripTitle)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Create trips for the Walvee user
 */
async function createTrips(userId) {
  console.log('\n🗺️  Creating trips...');

  const tripIds = [];
  let skippedCount = 0;

  for (let i = 0; i < TRIPS.length; i++) {
    const trip = TRIPS[i];
    console.log(`\n📍 Checking trip ${i + 1}/${TRIPS.length}: ${trip.title}`);

    try {
      const exists = await tripExists(userId, trip.title);

      if (exists) {
        console.log(`   ⏭️  Skipped: Trip already exists`);
        skippedCount++;
        continue;
      }

      const tripData = {
        ...trip,
        author_name: WALVEE_USER.full_name,
        author_photo: WALVEE_USER.photo_url,
        author_email: WALVEE_USER.email,
        created_by: userId,
        created_at: serverTimestamp(),
        created_date: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const tripRef = await addDoc(collection(db, 'trips'), tripData);
      tripIds.push(tripRef.id);

      console.log(`   ✅ Created: ${tripRef.id}`);
      console.log(`   📌 Destination: ${trip.destination}`);
      console.log(`   ⏱️  Duration: ${trip.duration_days} days`);
      console.log(`   📍 Locations: ${trip.locations.join(', ')}`);
      console.log(`   📅 Days: ${trip.itinerary.length}`);
      console.log(`   🏛️  Places: ${trip.itinerary.reduce((sum, day) => sum + day.places.length, 0)}`);
    } catch (error) {
      console.error(`   ❌ Error creating trip "${trip.title}":`, error.message);
    }
  }

  if (skippedCount > 0) {
    console.log(`\n⏭️  Skipped ${skippedCount} existing trip(s)`);
  }

  return tripIds;
}

/**
 * Main seeder function
 */
async function seed() {
  console.log('🌱 Starting Walvee Database Seeder (NEW FORMAT)\n');
  console.log('=' .repeat(60));

  try {
    const userId = await createWalveeUser();
    const tripIds = await createTrips(userId);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • User ID: ${userId}`);
    console.log(`   • Email: ${WALVEE_USER.email}`);
    console.log(`   • Password: ${WALVEE_USER.password}`);
    console.log(`   • New trips created: ${tripIds.length}`);
    console.log(`   • Total trips attempted: ${TRIPS.length}`);
    if (tripIds.length < TRIPS.length) {
      console.log(`   • Existing trips skipped: ${TRIPS.length - tripIds.length}`);
    }
    console.log('\n💡 You can now login with these credentials');
    console.log('\n🎉 Happy exploring!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
