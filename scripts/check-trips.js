/**
 * Quick diagnostic script to check trips in the database
 *
 * Usage: node scripts/check-trips.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTrips() {
  console.log('🔍 Checking trips in Firebase...\n');
  console.log('='.repeat(60));

  try {
    // Get all trips
    const q = query(
      collection(db, 'trips'),
      orderBy('created_date', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);

    console.log(`\n✅ Found ${snapshot.size} trips\n`);

    if (snapshot.empty) {
      console.log('❌ No trips found in database');
      process.exit(1);
    }

    // Display each trip
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Destination: ${data.destination}`);
      console.log(`   Duration: ${data.duration}`);
      console.log(`   Budget: ${data.budget}`);
      console.log(`   Public: ${data.is_public}`);
      console.log(`   Featured: ${data.is_featured}`);
      console.log(`   Created by: ${data.created_by}`);
      console.log(`   Tags: ${data.tags?.join(', ') || 'N/A'}`);

      // Check for cover image
      if (data.cover_image) {
        console.log(`   Cover image: ✅`);
      } else {
        console.log(`   Cover image: ❌ MISSING`);
      }

      // Check created_date
      if (data.created_date) {
        const date = data.created_date.toDate();
        console.log(`   Created: ${date.toISOString()}`);
      } else {
        console.log(`   Created: ❌ MISSING created_date`);
      }

      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n✅ All checks passed! Trips should appear on home page.\n');
    console.log('If trips are still not showing:');
    console.log('1. Check browser console (F12) for errors');
    console.log('2. Check Network tab to see if API calls are being made');
    console.log('3. Try clearing browser cache and reloading');
    console.log('4. Check if you\'re logged in (some pages require auth)');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('index')) {
      console.log('\n⚠️  Firestore index required!');
      console.log('Check the Firebase console for the index creation link.');
    }

    process.exit(1);
  }
}

checkTrips();
