/**
 * Firebase Seeder Script
 *
 * Creates a Walvee account and 10 comprehensive trips with rich data
 *
 * Usage:
 * node scripts/seed.js
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
  password: 'Walvee123!', // You can change this
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

// Comprehensive trip data
const TRIPS = [
  {
    title: 'Tokyo Food & Culture Immersion',
    destination: 'Tokyo, Japan',
    description: 'Experience the perfect blend of ancient traditions and futuristic innovation in Japan\'s vibrant capital. From serene temples to bustling fish markets, this 7-day journey will immerse you in authentic Japanese culture.',
    duration: '7 days',
    budget: '$$$$',
    tags: ['Food', 'Culture', 'Urban', 'Shopping', 'Nightlife'],
    transportation: 'Public Transit & Walking',
    accommodation: 'Boutique Hotel in Shibuya',
    best_time_to_visit: 'March-May (Cherry Blossom) or October-November (Fall Colors)',
    difficulty_level: 'Easy',
    trip_type: 'Cultural',
    is_public: true,
    is_featured: true,
    cover_image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Shibuya Exploration',
        activities: [
          { time: '14:00', name: 'Check-in at hotel', location: 'Shibuya', description: 'Settle into your boutique hotel in the heart of Shibuya' },
          { time: '16:00', name: 'Shibuya Crossing', location: 'Shibuya Crossing', description: 'Experience the world\'s busiest pedestrian crossing' },
          { time: '18:00', name: 'Dinner at Ichiran Ramen', location: 'Shibuya', description: 'Try authentic tonkotsu ramen at this famous chain' },
          { time: '20:00', name: 'Shibuya Sky Observatory', location: 'Shibuya', description: 'Enjoy panoramic night views of Tokyo' }
        ]
      },
      {
        day: 2,
        title: 'Traditional Tokyo',
        activities: [
          { time: '08:00', name: 'Tsukiji Outer Market', location: 'Tsukiji', description: 'Fresh sushi breakfast and explore the market stalls' },
          { time: '11:00', name: 'Senso-ji Temple', location: 'Asakusa', description: 'Visit Tokyo\'s oldest and most significant temple' },
          { time: '13:00', name: 'Nakamise Shopping Street', location: 'Asakusa', description: 'Browse traditional crafts and snacks' },
          { time: '16:00', name: 'Tokyo Skytree', location: 'Sumida', description: 'Ascend Japan\'s tallest structure' }
        ]
      },
      {
        day: 3,
        title: 'Modern Tokyo & Anime Culture',
        activities: [
          { time: '10:00', name: 'TeamLab Borderless', location: 'Odaiba', description: 'Immersive digital art museum experience' },
          { time: '14:00', name: 'Akihabara Electric Town', location: 'Akihabara', description: 'Explore anime, manga, and electronics paradise' },
          { time: '17:00', name: 'Maid Cafe Experience', location: 'Akihabara', description: 'Unique Japanese pop culture experience' },
          { time: '19:00', name: 'Yakitori Dinner', location: 'Yurakucho', description: 'Grilled chicken skewers under the railway tracks' }
        ]
      }
    ],
    places: [
      {
        name: 'Senso-ji Temple',
        address: '2-3-1 Asakusa, Taito City, Tokyo',
        rating: 4.5,
        price_level: 0,
        types: ['temple', 'tourist_attraction'],
        description: 'Tokyo\'s oldest temple, featuring stunning architecture and traditional atmosphere'
      },
      {
        name: 'Shibuya Crossing',
        address: 'Shibuya, Tokyo',
        rating: 4.6,
        price_level: 0,
        types: ['tourist_attraction', 'point_of_interest'],
        description: 'World-famous scramble crossing with incredible energy'
      },
      {
        name: 'Tsukiji Outer Market',
        address: 'Tsukiji, Chuo City, Tokyo',
        rating: 4.4,
        price_level: 2,
        types: ['food', 'market'],
        description: 'Fresh seafood and traditional Japanese breakfast spot'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Romantic Paris Getaway',
    destination: 'Paris, France',
    description: 'Experience the city of love with this perfect 5-day romantic itinerary. Stroll along the Seine, savor croissants at charming cafes, and witness the Eiffel Tower sparkle at night.',
    duration: '5 days',
    budget: '$$$',
    tags: ['Romantic', 'Culture', 'Food', 'Art', 'Architecture'],
    transportation: 'Metro & Walking',
    accommodation: 'Boutique Hotel in Le Marais',
    best_time_to_visit: 'April-June or September-October',
    difficulty_level: 'Easy',
    trip_type: 'Romantic',
    is_public: true,
    is_featured: true,
    cover_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Iconic Paris',
        activities: [
          { time: '10:00', name: 'Eiffel Tower', location: 'Champ de Mars', description: 'Ascend the Iron Lady for breathtaking views' },
          { time: '13:00', name: 'Lunch at Le Jules Verne', location: 'Eiffel Tower', description: 'Michelin-starred dining with a view' },
          { time: '15:30', name: 'Seine River Cruise', location: 'Port de la Bourdonnais', description: 'Romantic boat ride past Paris landmarks' },
          { time: '19:00', name: 'Trocadéro Gardens', location: 'Trocadéro', description: 'Watch the Eiffel Tower light show' }
        ]
      },
      {
        day: 2,
        title: 'Art & Culture',
        activities: [
          { time: '09:00', name: 'Louvre Museum', location: 'Rue de Rivoli', description: 'Explore the world\'s largest art museum' },
          { time: '14:00', name: 'Tuileries Garden', location: 'Place de la Concorde', description: 'Leisurely stroll through beautiful gardens' },
          { time: '16:00', name: 'Musée d\'Orsay', location: 'Rue de la Légion d\'Honneur', description: 'Admire Impressionist masterpieces' },
          { time: '20:00', name: 'Dinner at Le Comptoir', location: 'Saint-Germain', description: 'Contemporary French cuisine' }
        ]
      }
    ],
    places: [
      {
        name: 'Eiffel Tower',
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
        rating: 4.7,
        price_level: 3,
        types: ['tourist_attraction', 'landmark'],
        description: 'Iconic iron lattice tower and symbol of Paris'
      },
      {
        name: 'Louvre Museum',
        address: 'Rue de Rivoli, 75001 Paris',
        rating: 4.7,
        price_level: 2,
        types: ['museum', 'art_gallery'],
        description: 'World\'s largest art museum housing the Mona Lisa'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Bali Spiritual Wellness Retreat',
    destination: 'Ubud, Bali, Indonesia',
    description: 'Find inner peace and rejuvenation in Bali\'s spiritual heart. This 10-day retreat combines yoga, meditation, healthy cuisine, and cultural exploration in the lush rice terraces of Ubud.',
    duration: '10 days',
    budget: '$$',
    tags: ['Wellness', 'Yoga', 'Nature', 'Spiritual', 'Culture'],
    transportation: 'Private Driver & Walking',
    accommodation: 'Eco Wellness Resort',
    best_time_to_visit: 'April-October (Dry Season)',
    difficulty_level: 'Easy',
    trip_type: 'Wellness',
    is_public: true,
    is_featured: true,
    cover_image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Orientation',
        activities: [
          { time: '14:00', name: 'Check-in at Wellness Resort', location: 'Ubud', description: 'Welcome ceremony and room tour' },
          { time: '16:00', name: 'Balinese Massage', location: 'Resort Spa', description: 'Traditional healing massage to ease travel tension' },
          { time: '18:00', name: 'Sunset Meditation', location: 'Campuhan Ridge', description: 'Guided meditation overlooking rice paddies' },
          { time: '19:00', name: 'Organic Dinner', location: 'Resort Restaurant', description: 'Farm-to-table Balinese cuisine' }
        ]
      },
      {
        day: 2,
        title: 'Yoga & Culture',
        activities: [
          { time: '06:00', name: 'Sunrise Yoga', location: 'Resort Yoga Shala', description: 'Vinyasa flow with rice field views' },
          { time: '08:00', name: 'Healthy Breakfast', location: 'Resort', description: 'Smoothie bowls and tropical fruits' },
          { time: '10:00', name: 'Tegalalang Rice Terraces', location: 'Tegalalang', description: 'Walk through iconic rice paddies' },
          { time: '14:00', name: 'Balinese Cooking Class', location: 'Local Home', description: 'Learn traditional recipes' }
        ]
      }
    ],
    places: [
      {
        name: 'Tegalalang Rice Terraces',
        address: 'Jalan Raya Tegalalang, Ubud, Bali',
        rating: 4.4,
        price_level: 1,
        types: ['tourist_attraction', 'nature'],
        description: 'Stunning terraced rice fields with jungle swings'
      },
      {
        name: 'Tirta Empul Temple',
        address: 'Jl. Tirta, Manukaya, Tampaksiring, Gianyar',
        rating: 4.6,
        price_level: 1,
        types: ['temple', 'spiritual'],
        description: 'Sacred water temple with ritual purification pools'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'New York City First Timer',
    destination: 'New York City, USA',
    description: 'The ultimate introduction to the Big Apple! Experience iconic landmarks, world-class museums, diverse neighborhoods, and the unmatched energy that makes NYC one of the greatest cities on Earth.',
    duration: '6 days',
    budget: '$$$$',
    tags: ['Urban', 'Culture', 'Food', 'Shopping', 'Entertainment'],
    transportation: 'Subway & Walking',
    accommodation: 'Hotel in Midtown Manhattan',
    best_time_to_visit: 'April-June or September-November',
    difficulty_level: 'Moderate',
    trip_type: 'City Break',
    is_public: true,
    is_featured: true,
    cover_image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Manhattan Classics',
        activities: [
          { time: '09:00', name: 'Times Square', location: 'Times Square', description: 'Experience the heart of NYC\'s energy' },
          { time: '10:30', name: 'Empire State Building', location: '350 5th Ave', description: 'Iconic Art Deco skyscraper views' },
          { time: '13:00', name: 'Lunch at Katz\'s Deli', location: 'Lower East Side', description: 'Legendary pastrami sandwiches' },
          { time: '15:00', name: 'Brooklyn Bridge Walk', location: 'Brooklyn Bridge', description: 'Walk across this historic bridge' }
        ]
      }
    ],
    places: [
      {
        name: 'Central Park',
        address: 'New York, NY 10024',
        rating: 4.8,
        price_level: 0,
        types: ['park', 'tourist_attraction'],
        description: 'Iconic 843-acre urban park in the heart of Manhattan'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Iceland Ring Road Adventure',
    destination: 'Iceland',
    description: 'Drive the complete Ring Road and discover Iceland\'s raw natural beauty. From glaciers and waterfalls to hot springs and black sand beaches, this 14-day road trip is an adventure of a lifetime.',
    duration: '14 days',
    budget: '$$$',
    tags: ['Adventure', 'Nature', 'Road Trip', 'Photography', 'Hiking'],
    transportation: 'Rental Car (4WD)',
    accommodation: 'Mix of Hotels & Guesthouses',
    best_time_to_visit: 'June-August (Midnight Sun) or September-March (Northern Lights)',
    difficulty_level: 'Moderate',
    trip_type: 'Adventure',
    is_public: true,
    is_featured: true,
    cover_image: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Reykjavik & Golden Circle',
        activities: [
          { time: '09:00', name: 'Pick up rental car', location: 'Reykjavik', description: 'Get your 4WD vehicle' },
          { time: '10:30', name: 'Thingvellir National Park', location: 'Golden Circle', description: 'Walk between tectonic plates' },
          { time: '13:00', name: 'Geysir Geothermal Area', location: 'Golden Circle', description: 'Watch Strokkur erupt every 5-10 minutes' },
          { time: '15:00', name: 'Gullfoss Waterfall', location: 'Golden Circle', description: 'Massive two-tiered waterfall' }
        ]
      }
    ],
    places: [
      {
        name: 'Blue Lagoon',
        address: 'Norðurljósavegur 9, 240 Grindavík',
        rating: 4.3,
        price_level: 4,
        types: ['spa', 'tourist_attraction'],
        description: 'Geothermal spa with mineral-rich waters'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Barcelona Architecture & Tapas',
    destination: 'Barcelona, Spain',
    description: 'Discover Gaudí\'s masterpieces, feast on endless tapas, and soak up the Mediterranean sun. This 5-day itinerary perfectly balances culture, food, and beach time in Catalonia\'s vibrant capital.',
    duration: '5 days',
    budget: '$$',
    tags: ['Culture', 'Food', 'Architecture', 'Beach', 'Nightlife'],
    transportation: 'Metro & Walking',
    accommodation: 'Apartment in Gothic Quarter',
    best_time_to_visit: 'May-June or September-October',
    difficulty_level: 'Easy',
    trip_type: 'City Break',
    is_public: true,
    is_featured: false,
    cover_image: 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Gaudí\'s Barcelona',
        activities: [
          { time: '09:00', name: 'Sagrada Familia', location: 'Eixample', description: 'Gaudí\'s unfinished masterpiece basilica' },
          { time: '12:00', name: 'Casa Batlló', location: 'Passeig de Gràcia', description: 'Stunning modernist apartment building' },
          { time: '15:00', name: 'Park Güell', location: 'Gràcia', description: 'Colorful mosaic park with city views' },
          { time: '19:00', name: 'Tapas Crawl', location: 'Gothic Quarter', description: 'Sample pintxos and vermouth' }
        ]
      }
    ],
    places: [
      {
        name: 'La Sagrada Familia',
        address: 'Carrer de Mallorca, 401, 08013 Barcelona',
        rating: 4.7,
        price_level: 3,
        types: ['church', 'tourist_attraction'],
        description: 'Gaudí\'s iconic unfinished basilica'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Patagonia Trekking Expedition',
    destination: 'El Chaltén & Torres del Paine',
    description: 'Trek through some of the world\'s most dramatic landscapes in Argentine and Chilean Patagonia. This 12-day expedition takes you to towering granite peaks, turquoise lakes, and massive glaciers.',
    duration: '12 days',
    budget: '$$$',
    tags: ['Adventure', 'Hiking', 'Nature', 'Photography', 'Camping'],
    transportation: 'Buses & Hiking',
    accommodation: 'Mix of Hostels & Camping',
    best_time_to_visit: 'December-February (Summer)',
    difficulty_level: 'Challenging',
    trip_type: 'Adventure',
    is_public: true,
    is_featured: false,
    cover_image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'El Chaltén Arrival',
        activities: [
          { time: '14:00', name: 'Arrive in El Chaltén', location: 'El Chaltén', description: 'Check into hostel and get hiking permits' },
          { time: '16:00', name: 'Gear Check', location: 'El Chaltén', description: 'Organize hiking equipment and supplies' },
          { time: '18:00', name: 'Trek Briefing', location: 'Hostel', description: 'Meet guide and review trail maps' }
        ]
      }
    ],
    places: [
      {
        name: 'Laguna de los Tres',
        address: 'El Chaltén, Santa Cruz, Argentina',
        rating: 4.9,
        price_level: 0,
        types: ['hiking', 'nature'],
        description: 'Stunning glacial lake with Mt. Fitz Roy views'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Vietnam Street Food Journey',
    destination: 'Hanoi to Ho Chi Minh City',
    description: 'Eat your way through Vietnam on this ultimate culinary adventure. From pho in Hanoi to banh mi in Hoi An, experience the incredible diversity of Vietnamese street food culture.',
    duration: '15 days',
    budget: '$',
    tags: ['Food', 'Culture', 'Urban', 'Street Food', 'Budget'],
    transportation: 'Trains, Buses & Walking',
    accommodation: 'Budget Hotels & Hostels',
    best_time_to_visit: 'February-April',
    difficulty_level: 'Easy',
    trip_type: 'Culinary',
    is_public: true,
    is_featured: false,
    cover_image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Hanoi Food Tour',
        activities: [
          { time: '08:00', name: 'Breakfast Pho', location: 'Old Quarter', description: 'Start with authentic beef pho' },
          { time: '10:00', name: 'Coffee Culture', location: 'Old Quarter', description: 'Try egg coffee at a traditional cafe' },
          { time: '12:00', name: 'Bun Cha Lunch', location: 'Hang Quat Street', description: 'Grilled pork with vermicelli noodles' },
          { time: '17:00', name: 'Street Food Tour', location: 'Old Quarter', description: 'Sample 10+ local specialties' }
        ]
      }
    ],
    places: [
      {
        name: 'Old Quarter',
        address: 'Hoàn Kiếm, Hanoi, Vietnam',
        rating: 4.5,
        price_level: 1,
        types: ['neighborhood', 'food'],
        description: 'Historic district famous for street food'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Dubai Luxury & Desert',
    destination: 'Dubai, UAE',
    description: 'Experience the ultimate blend of luxury and adventure in Dubai. From world-record skyscrapers and luxury shopping to desert safaris and traditional souks, this 5-day trip has it all.',
    duration: '5 days',
    budget: '$$$$',
    tags: ['Luxury', 'Urban', 'Desert', 'Shopping', 'Adventure'],
    transportation: 'Private Car & Metro',
    accommodation: 'Luxury Hotel',
    best_time_to_visit: 'November-March',
    difficulty_level: 'Easy',
    trip_type: 'Luxury',
    is_public: true,
    is_featured: false,
    cover_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Modern Dubai',
        activities: [
          { time: '10:00', name: 'Burj Khalifa', location: 'Downtown Dubai', description: 'World\'s tallest building observation deck' },
          { time: '13:00', name: 'Dubai Mall', location: 'Downtown Dubai', description: 'Luxury shopping and aquarium visit' },
          { time: '16:00', name: 'Afternoon Tea', location: 'Burj Al Arab', description: 'Tea at the iconic sail-shaped hotel' },
          { time: '20:00', name: 'Fountain Show', location: 'Dubai Mall', description: 'Choreographed water and light show' }
        ]
      }
    ],
    places: [
      {
        name: 'Burj Khalifa',
        address: '1 Sheikh Mohammed bin Rashid Blvd, Dubai',
        rating: 4.7,
        price_level: 4,
        types: ['tourist_attraction', 'landmark'],
        description: 'World\'s tallest building at 828 meters'
      }
    ],
    likes_count: 0,
    views_count: 0
  },
  {
    title: 'Greece Island Hopping',
    destination: 'Santorini, Mykonos & Crete',
    description: 'Sail through the stunning Greek islands discovering whitewashed villages, crystal-clear waters, ancient ruins, and legendary sunsets. This 10-day journey covers the best of the Cyclades.',
    duration: '10 days',
    budget: '$$$',
    tags: ['Beach', 'Culture', 'Island', 'Romantic', 'Food'],
    transportation: 'Ferries & Walking',
    accommodation: 'Traditional Cave Houses & Hotels',
    best_time_to_visit: 'May-June or September-October',
    difficulty_level: 'Easy',
    trip_type: 'Beach & Culture',
    is_public: true,
    is_featured: false,
    cover_image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200',
    itinerary: [
      {
        day: 1,
        title: 'Santorini Arrival',
        activities: [
          { time: '14:00', name: 'Arrive in Santorini', location: 'Fira', description: 'Ferry from Athens and check-in' },
          { time: '16:00', name: 'Explore Fira', location: 'Fira', description: 'Walk the caldera edge paths' },
          { time: '19:00', name: 'Sunset in Oia', location: 'Oia', description: 'Watch the famous Santorini sunset' },
          { time: '21:00', name: 'Greek Dinner', location: 'Oia', description: 'Fresh seafood with caldera views' }
        ]
      }
    ],
    places: [
      {
        name: 'Oia Village',
        address: 'Oia, Santorini 847 02, Greece',
        rating: 4.8,
        price_level: 3,
        types: ['tourist_attraction', 'village'],
        description: 'Famous for stunning sunsets and white-washed buildings'
      }
    ],
    likes_count: 0,
    views_count: 0
  }
];

/**
 * Create the Walvee user account
 */
async function createWalveeUser() {
  console.log('🚀 Creating Walvee user account...');

  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      WALVEE_USER.email,
      WALVEE_USER.password
    );

    const userId = userCredential.user.uid;
    console.log(`✅ Created Firebase Auth user with ID: ${userId}`);

    // Create Firestore user document
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
      // Sign in to get the user ID
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
 * Check if a trip already exists for this user with the same title
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
    console.log(`\n📍 Checking trip ${i + 1}/10: ${trip.title}`);

    try {
      // Check if trip already exists
      const exists = await tripExists(userId, trip.title);

      if (exists) {
        console.log(`   ⏭️  Skipped: Trip already exists`);
        skippedCount++;
        continue;
      }

      const tripData = {
        ...trip,
        created_by: userId,
        created_at: serverTimestamp(),
        created_date: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const tripRef = await addDoc(collection(db, 'trips'), tripData);
      tripIds.push(tripRef.id);

      console.log(`   ✅ Created: ${tripRef.id}`);
      console.log(`   📌 Destination: ${trip.destination}`);
      console.log(`   ⏱️  Duration: ${trip.duration}`);
      console.log(`   💰 Budget: ${trip.budget}`);
      console.log(`   🏷️  Tags: ${trip.tags.join(', ')}`);

      if (trip.itinerary && trip.itinerary.length > 0) {
        console.log(`   📅 Itinerary: ${trip.itinerary.length} days`);
      }

      if (trip.places && trip.places.length > 0) {
        console.log(`   📍 Places: ${trip.places.length} locations`);
      }
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
  console.log('🌱 Starting Walvee Database Seeder\n');
  console.log('=' .repeat(60));

  try {
    // Create Walvee user
    const userId = await createWalveeUser();

    // Create trips
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

// Run the seeder
seed();
