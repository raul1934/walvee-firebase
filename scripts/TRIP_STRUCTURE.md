# Walvee Trip Data Structure Documentation

This document defines the complete data structure required for trip objects in the Walvee Firebase application.

## Overview

Trips are the core entity in Walvee, representing user-created travel itineraries. Each trip must contain specific fields to ensure proper display and functionality across all components.

---

## Top-Level Trip Object

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **id** | `string` | Firestore document ID (auto-generated) | `"DRFRuiIpzF6SI7Y2Ntwm"` |
| **title** | `string` | Trip name/title | `"Tokyo Food & Culture Immersion"` |
| **destination** | `string` | Primary destination (City, Country format) | `"Tokyo, Japan"` |
| **author_name** | `string` | Creator's display name | `"Walvee"` |
| **author_photo** | `string` | Creator's profile photo URL | `"https://..."` |
| **author_email** | `string` | Creator's email address | `"walvee@walvee.com"` |
| **created_by** | `string` | Firebase Auth UID of creator | `"8VsLKNEMSLgswBeDjybygssOyeK2"` |
| **duration_days** | `number` | Trip duration in days | `7` |
| **itinerary** | `array<DayObject>` | Array of day objects with places | See below |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| **description** | `string` | `""` | Trip description/summary |
| **images** | `array<string>` | `[]` | Array of image URLs |
| **image_url** | `string` | `null` | Fallback/primary image URL |
| **locations** | `array<string>` | `[]` | Array of location names for filtering |
| **visibility** | `string` | `"public"` | Trip visibility: `"public"`, `"private"`, or `"friends"` |
| **likes** | `number` | `0` | Number of likes |
| **steals** | `number` | `0` | Number of times trip was "stolen" (copied) |
| **shares** | `number` | `0` | Number of shares |
| **start_date** | `date/string` | `null` | Trip start date (ISO format or Firebase Timestamp) |
| **destination_lat** | `number` | `null` | Destination latitude |
| **destination_lng** | `number` | `null` | Destination longitude |
| **created_at** | `timestamp` | `serverTimestamp()` | Firebase server timestamp |
| **created_date** | `timestamp` | `serverTimestamp()` | Alternative creation timestamp field |
| **updated_at** | `timestamp` | `serverTimestamp()` | Last update timestamp |

---

## Nested Structures

### DayObject (itinerary element)

Each day in the itinerary:

```typescript
{
  day: number,          // Day number (1, 2, 3, ...)
  places: PlaceObject[] // Array of places visited this day
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **day** | `number` | Optional | Day number (can be inferred from array index) |
| **places** | `array<PlaceObject>` | **REQUIRED** | Places visited on this day |

### PlaceObject (place within a day)

Each place visited:

```typescript
{
  name: string,
  place_id?: string,
  address?: string,
  rating?: number,
  price_level?: number,
  types?: string[],
  photos?: string[],
  order?: number,
  // ... additional Google Places fields
}
```

#### Required Place Fields

| Field | Type | Description |
|-------|------|-------------|
| **name** | `string` | Place name |

#### Optional Place Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| **place_id** | `string` | `null` | Google Places ID (e.g., `"ChIJ..."`) |
| **address** | `string` | `null` | Full address |
| **formatted_address** | `string` | `null` | Google-formatted address |
| **rating** | `number` | `0` | Average rating (0-5 scale) |
| **price_level** | `number` | `0` | Price level: 0=free, 1=cheap, 2=moderate, 3=expensive, 4=very expensive |
| **types** | `array<string>` | `[]` | Place types (e.g., `["restaurant", "tourist_attraction"]`) |
| **photos** | `array<string>` | `[]` | Array of photo URLs |
| **photo** | `string` | `null` | Primary/first photo URL (fallback) |
| **order** | `number` | `0` | Order within the day |
| **description** | `string` | `null` | Place description/notes |
| **reviews_count** | `number` | `0` | Number of reviews |
| **user_ratings_total** | `number` | `0` | Google Places total ratings |
| **formatted_phone_number** | `string` | `null` | Phone number |
| **website** | `string` | `null` | Website URL |
| **opening_hours** | `object` | `null` | Opening hours data |
| **geometry** | `object` | `null` | Location geometry (lat/lng) |

---

## Complete Example

```javascript
{
  // Basic Info
  id: "DRFRuiIpzF6SI7Y2Ntwm",
  title: "Tokyo Food & Culture Immersion",
  destination: "Tokyo, Japan",
  description: "Experience the perfect blend of ancient traditions and futuristic innovation in Japan's vibrant capital.",

  // Author Info
  author_name: "Walvee",
  author_photo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/dda6b4bec_LogoWalvee.png",
  author_email: "walvee@walvee.com",
  created_by: "8VsLKNEMSLgswBeDjybygssOyeK2",

  // Trip Details
  duration_days: 7,
  start_date: "2024-03-15",
  visibility: "public",

  // Media
  images: [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200"
  ],
  image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200",

  // Locations (for filtering)
  locations: ["Tokyo", "Shibuya", "Asakusa", "Akihabara"],

  // Metrics
  likes: 0,
  steals: 0,
  shares: 0,

  // Itinerary
  itinerary: [
    {
      day: 1,
      places: [
        {
          name: "Shibuya Crossing",
          place_id: "ChIJ_fake_shibuya_001",
          address: "Shibuya, Tokyo, Japan",
          formatted_address: "2-chōme-2 Dōgenzaka, Shibuya City, Tokyo",
          rating: 4.6,
          price_level: 0,
          types: ["tourist_attraction", "point_of_interest"],
          photos: [
            "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800"
          ],
          photo: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800",
          order: 0,
          description: "Experience the world's busiest pedestrian crossing",
          user_ratings_total: 15234,
          geometry: {
            location: {
              lat: 35.6595,
              lng: 139.7004
            }
          }
        },
        {
          name: "Ichiran Ramen Shibuya",
          place_id: "ChIJ_fake_ichiran_001",
          address: "1-22-7 Jinnan, Shibuya City, Tokyo",
          formatted_address: "1-chōme-22-7 Jinnan, Shibuya City, Tokyo 150-0041",
          rating: 4.4,
          price_level: 2,
          types: ["restaurant", "food", "point_of_interest"],
          photos: [
            "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800"
          ],
          photo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
          order: 1,
          description: "Try authentic tonkotsu ramen",
          user_ratings_total: 8923,
          formatted_phone_number: "+81 3-3463-3667",
          website: "https://ichiran.com",
          opening_hours: {
            open_now: true,
            weekday_text: [
              "Monday: Open 24 hours",
              "Tuesday: Open 24 hours",
              "Wednesday: Open 24 hours",
              "Thursday: Open 24 hours",
              "Friday: Open 24 hours",
              "Saturday: Open 24 hours",
              "Sunday: Open 24 hours"
            ]
          },
          geometry: {
            location: {
              lat: 35.6627,
              lng: 139.6987
            }
          }
        }
      ]
    },
    {
      day: 2,
      places: [
        {
          name: "Senso-ji Temple",
          place_id: "ChIJ_fake_sensoji_001",
          address: "2-3-1 Asakusa, Taito City, Tokyo",
          formatted_address: "2-chōme-3-1 Asakusa, Taito City, Tokyo 111-0032",
          rating: 4.5,
          price_level: 0,
          types: ["place_of_worship", "tourist_attraction", "point_of_interest"],
          photos: [
            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800"
          ],
          photo: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
          order: 0,
          description: "Tokyo's oldest and most significant temple",
          user_ratings_total: 95234,
          website: "https://www.senso-ji.jp",
          opening_hours: {
            open_now: true,
            weekday_text: [
              "Monday: 6:00 AM – 5:00 PM",
              "Tuesday: 6:00 AM – 5:00 PM",
              "Wednesday: 6:00 AM – 5:00 PM",
              "Thursday: 6:00 AM – 5:00 PM",
              "Friday: 6:00 AM – 5:00 PM",
              "Saturday: 6:00 AM – 5:00 PM",
              "Sunday: 6:00 AM – 5:00 PM"
            ]
          },
          geometry: {
            location: {
              lat: 35.7148,
              lng: 139.7967
            }
          }
        }
      ]
    }
  ],

  // Timestamps
  created_at: "2024-12-17T10:48:04.130Z",
  created_date: "2024-12-17T10:48:04.130Z",
  updated_at: "2024-12-17T10:48:04.130Z"
}
```

---

## Field Validation Rules

### Required Field Validation
- `title`: Must not be empty
- `destination`: Must follow "City, Country" format
- `author_name`: Must not be empty
- `created_by`: Must be valid Firebase UID
- `duration_days`: Must be positive number > 0
- `itinerary`: Must have at least 1 day
- `itinerary[].places`: Each day must have at least 1 place
- `places[].name`: Each place must have a name

### Optional Field Defaults
- `images`: Empty array `[]` if not provided
- `locations`: Empty array `[]` if not provided
- `likes`: `0` if not provided
- `steals`: `0` if not provided
- `shares`: `0` if not provided
- `visibility`: `"public"` if not provided
- `rating`: `0` if not provided (displays as "N/A")
- `price_level`: `0` if not provided (free/unknown)

### Display Rules
1. **Images Priority**: Display `images[0]` if available, else fall back to `image_url`
2. **Places without names**: Filter out and don't display
3. **Ratings**: Format as `toFixed(1)` (e.g., "4.5"), display "N/A" if 0
4. **Price levels**: 0-4 scale, display $ symbols accordingly
5. **Reviews count**: Use `user_ratings_total` > `reviews_count` > `reviews.length`
6. **Dates**: Parse with `new Date()`, format as needed

---

## Firebase Queries

### Common Query Patterns

```javascript
// Get all trips (newest first)
Trip.list("-created_date")

// Get trips by most liked
Trip.list("-likes")

// Get user's trips
Trip.filter({ created_by: userId })

// Get trips for a city (client-side filter)
trips.filter(trip =>
  trip.destination.toLowerCase().includes("tokyo") ||
  trip.locations.some(loc => loc.toLowerCase().includes("tokyo"))
)
```

### Recommended Firestore Indexes

```
Collection: trips
- (destination, created_date DESC)
- (created_by, created_date DESC)
- (created_date DESC)
- (likes DESC)
```

---

## Migration Notes

### Converting Old Format to New Format

If you have trips in the old format, here's how to convert them:

**Old → New Field Mapping:**

| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `duration` | `duration_days` | Extract number from "X days" string |
| `cover_image` | `images` | Wrap string in array: `[cover_image]` |
| `cover_image` | `image_url` | Copy as fallback |
| `itinerary[].activities` | `itinerary[].places` | Rename and restructure |
| `likes_count` | `likes` | Rename field |
| `views_count` | N/A | Remove (not used) |
| N/A | `author_name` | Add from user profile |
| N/A | `author_photo` | Add from user profile |
| N/A | `author_email` | Add from user email |
| N/A | `locations` | Extract from itinerary places |
| N/A | `steals` | Add with default 0 |
| N/A | `shares` | Add with default 0 |
| N/A | `visibility` | Add with default "public" |

---

## Common Issues & Solutions

### Issue: Trips not showing on home page
**Causes:**
- Missing `author_name` field
- Wrong `duration_days` type (string instead of number)
- Empty `itinerary` array
- Places without `name` field

**Solution:** Ensure all required fields are present with correct types

### Issue: City filtering not working
**Causes:**
- Missing `locations` array
- Wrong `destination` format

**Solution:** Add `locations` array with city names extracted from itinerary

### Issue: Images not displaying
**Causes:**
- Empty `images` array
- No `image_url` fallback
- Invalid image URLs

**Solution:** Provide at least one valid image URL in either `images[]` or `image_url`

### Issue: Trip details page crashes
**Causes:**
- `itinerary` has `activities` instead of `places`
- Places missing required fields

**Solution:** Rename `activities` to `places` and ensure all places have `name` field

---

## Related Documentation

- **API Reference**: `/src/api/firestoreService.js`
- **Component Usage**: `/src/components/home/TripCard.jsx`
- **Seeder Script**: `/scripts/seed.js`
- **Cleanup Script**: `/scripts/cleanup-trips.js`

---

**Last Updated**: 2024-12-17
**Version**: 1.0.0
**Maintainer**: Walvee Development Team
