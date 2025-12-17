# Database Seeder

This directory contains scripts to seed your Firebase database with initial data.

## What's Included

The seeder creates:

1. **Walvee User Account**
   - Email: `walvee@walvee.com`
   - Password: `Walvee123!`
   - Full profile with bio and photo

2. **10 Comprehensive Trips**
   - Tokyo Food & Culture Immersion (7 days)
   - Romantic Paris Getaway (5 days)
   - Bali Spiritual Wellness Retreat (10 days)
   - New York City First Timer (6 days)
   - Iceland Ring Road Adventure (14 days)
   - Barcelona Architecture & Tapas (5 days)
   - Patagonia Trekking Expedition (12 days)
   - Vietnam Street Food Journey (15 days)
   - Dubai Luxury & Desert (5 days)
   - Greece Island Hopping (10 days)

Each trip includes:
- ✅ Title, destination, and description
- ✅ Duration and budget level
- ✅ Tags (food, culture, adventure, etc.)
- ✅ Transportation and accommodation details
- ✅ Best time to visit
- ✅ Difficulty level
- ✅ Complete daily itineraries with activities and timings
- ✅ Place recommendations with ratings
- ✅ Cover images

## Prerequisites

1. Make sure you have Node.js installed
2. Your `.env` file must have Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

## Installation

If this is your first time running the seeder, install the dotenv package:

```bash
npm install dotenv
```

## Usage

Run the seeder from the root directory:

```bash
npm run seed
```

Or directly:

```bash
node scripts/seed.js
```

## What Happens

The script will:

1. ✅ Create a Firebase Auth user with email `walvee@walvee.com`
2. ✅ Create a corresponding Firestore user document
3. ✅ Create 10 trips with comprehensive data
4. ✅ Display progress and summary

## Expected Output

```
🌱 Starting Walvee Database Seeder

============================================================
🚀 Creating Walvee user account...
✅ Created Firebase Auth user with ID: abc123...
✅ Created Firestore user document

🗺️  Creating trips...

📍 Creating trip 1/10: Tokyo Food & Culture Immersion
   ✅ Created: xyz789...
   📌 Destination: Tokyo, Japan
   ⏱️  Duration: 7 days
   💰 Budget: $$$$
   🏷️  Tags: Food, Culture, Urban, Shopping, Nightlife
   📅 Itinerary: 3 days
   📍 Places: 3 locations

[... continues for all 10 trips ...]

============================================================

✅ Seeding completed successfully!

📊 Summary:
   • User ID: abc123...
   • Email: walvee@walvee.com
   • Password: Walvee123!
   • Trips created: 10

💡 You can now login with these credentials

🎉 Happy exploring!
```

## Login Credentials

After seeding, you can login with:

- **Email:** `walvee@walvee.com`
- **Password:** `Walvee123!`

## Troubleshooting

### "Email already in use" Error

If you see this error, the Walvee account already exists. The script will automatically detect this and continue with creating trips for the existing user.

### Firebase Configuration Error

Make sure your `.env` file exists and has all the required Firebase configuration variables.

### Permission Errors

Ensure your Firebase project has the following enabled:
- Email/Password authentication
- Firestore Database
- Proper security rules for user creation

## Customization

To customize the seed data:

1. Open `scripts/seed.js`
2. Modify the `WALVEE_USER` object to change user details
3. Modify the `TRIPS` array to add/edit trip data
4. Run `npm run seed` again

## Firebase Collections Structure

The seeder creates documents in:

- **users/** - User profiles
- **trips/** - Trip documents

Each trip document includes:
```javascript
{
  title: string,
  destination: string,
  description: string,
  duration: string,
  budget: string,
  tags: string[],
  transportation: string,
  accommodation: string,
  best_time_to_visit: string,
  difficulty_level: string,
  trip_type: string,
  is_public: boolean,
  is_featured: boolean,
  cover_image: string,
  itinerary: array,
  places: array,
  likes_count: number,
  views_count: number,
  created_by: string,
  created_at: timestamp,
  created_date: timestamp,
  updated_at: timestamp
}
```

## Support

If you encounter any issues, please check:
1. Firebase console for error messages
2. Your Firebase security rules
3. Your `.env` file configuration
