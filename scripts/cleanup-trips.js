/**
 * Firebase Trip Cleanup Script
 *
 * Deletes all trips, trip likes, and trip derivations from Firestore
 *
 * Usage:
 * node scripts/cleanup-trips.js           # Interactive mode with confirmation
 * node scripts/cleanup-trips.js --force   # Skip confirmation
 * node scripts/cleanup-trips.js --dry-run # Preview without deleting
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

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
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Walvee account credentials
const WALVEE_EMAIL = 'walvee@walvee.com';
const WALVEE_PASSWORD = 'Walvee123!';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Delete all documents from a collection
 */
async function deleteCollection(collectionName) {
  console.log(`\n📂 Processing collection: ${collectionName}`);

  const snapshot = await getDocs(collection(db, collectionName));
  const docCount = snapshot.size;

  if (docCount === 0) {
    console.log(`   ℹ️  No documents found in ${collectionName}`);
    return 0;
  }

  console.log(`   Found ${docCount} document(s)`);

  if (dryRun) {
    console.log(`   🔍 [DRY RUN] Would delete ${docCount} document(s)`);
    return docCount;
  }

  let deletedCount = 0;
  const deletePromises = [];

  snapshot.forEach((document) => {
    const deletePromise = deleteDoc(doc(db, collectionName, document.id))
      .then(() => {
        deletedCount++;
        if (deletedCount % 10 === 0 || deletedCount === docCount) {
          process.stdout.write(`\r   ⏳ Deleting... ${deletedCount}/${docCount}`);
        }
      })
      .catch((err) => {
        console.error(`\n   ❌ Error deleting ${document.id}:`, err.message);
      });

    deletePromises.push(deletePromise);
  });

  await Promise.all(deletePromises);
  console.log(`\n   ✅ Deleted ${deletedCount} document(s) from ${collectionName}`);

  return deletedCount;
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('🧹 Walvee Firebase Cleanup Script\n');
  console.log('=' .repeat(60));

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No data will be deleted\n');
  }

  try {
    // Authenticate as Walvee user to have permission to delete trips
    if (!dryRun) {
      console.log('\n🔐 Authenticating as Walvee user...');
      await signInWithEmailAndPassword(auth, WALVEE_EMAIL, WALVEE_PASSWORD);
      console.log('   ✅ Authenticated successfully\n');
    }
    // Preview what will be deleted
    console.log('\n📊 Scanning collections...');

    const tripsSnapshot = await getDocs(collection(db, 'trips'));
    const tripLikesSnapshot = await getDocs(collection(db, 'tripLikes'));
    const tripDerivationsSnapshot = await getDocs(collection(db, 'tripDerivations'));

    const tripCount = tripsSnapshot.size;
    const likesCount = tripLikesSnapshot.size;
    const derivationsCount = tripDerivationsSnapshot.size;

    console.log(`\n📈 Summary:`);
    console.log(`   • Trips: ${tripCount}`);
    console.log(`   • Trip Likes: ${likesCount}`);
    console.log(`   • Trip Derivations: ${derivationsCount}`);
    console.log(`   • Total documents: ${tripCount + likesCount + derivationsCount}`);

    if (tripCount === 0 && likesCount === 0 && derivationsCount === 0) {
      console.log('\n✨ All collections are already empty. Nothing to clean up!');
      process.exit(0);
    }

    // Ask for confirmation unless --force or --dry-run
    if (!force && !dryRun) {
      console.log('\n⚠️  WARNING: This will permanently delete all data from these collections!');
      console.log('⚠️  This action CANNOT be undone!\n');

      const confirmed = await askConfirmation('Are you sure you want to continue? (y/N): ');

      if (!confirmed) {
        console.log('\n❌ Cleanup cancelled by user');
        process.exit(0);
      }
    }

    // Start deletion
    console.log('\n🗑️  Starting cleanup...');

    let totalDeleted = 0;

    // Delete in order: likes first, then derivations, then trips
    totalDeleted += await deleteCollection('tripLikes');
    totalDeleted += await deleteCollection('tripDerivations');
    totalDeleted += await deleteCollection('trips');

    // Final summary
    console.log('\n' + '='.repeat(60));

    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETED\n');
      console.log('📊 Summary:');
      console.log(`   • Would delete ${totalDeleted} total document(s)`);
      console.log(`   • Run without --dry-run to actually delete`);
    } else {
      console.log('\n✅ CLEANUP COMPLETED SUCCESSFULLY\n');
      console.log('📊 Summary:');
      console.log(`   • Deleted ${totalDeleted} total document(s)`);
      console.log(`   • All trip data has been removed`);
      console.log(`   • You can now run the seeder to create new trips`);
    }

    console.log('\n💡 Next steps:');
    console.log('   • Run: npm run seed        (to create new trips)');
    console.log('   • Or:  npm run seed:fresh  (cleanup + seed in one command)');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Walvee Firebase Cleanup Script

Usage:
  node scripts/cleanup-trips.js [options]

Options:
  --dry-run    Preview what would be deleted without actually deleting
  --force      Skip confirmation prompt and delete immediately
  --help, -h   Show this help message

Examples:
  # Interactive mode (with confirmation)
  node scripts/cleanup-trips.js

  # Preview without deleting
  node scripts/cleanup-trips.js --dry-run

  # Delete without confirmation
  node scripts/cleanup-trips.js --force

Collections affected:
  • trips              - All trip documents
  • tripLikes          - All trip like records
  • tripDerivations    - All trip steal/derivation records

⚠️  WARNING: Deleted data cannot be recovered!
  `);
  process.exit(0);
}

// Run cleanup
cleanup();
