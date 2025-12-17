/**
 * Fresh Seed Script - Combined Cleanup + Seed
 *
 * This script performs a complete refresh of trip data:
 * 1. Deletes all existing trips, tripLikes, and tripDerivations
 * 2. Seeds fresh trip data with correct structure
 *
 * Usage:
 * node scripts/seed-fresh.js           # Interactive mode with confirmation
 * node scripts/seed-fresh.js --force   # Skip confirmation
 * node scripts/seed-fresh.js --dry-run # Preview cleanup without executing
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

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
 * Run cleanup phase
 */
async function runCleanup() {
  console.log('\n🧹 PHASE 1: CLEANUP\n');
  console.log('='.repeat(60));

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
      console.log('\n✨ All collections are already empty. Skipping cleanup.');
      return 0;
    }

    // Ask for confirmation unless --force or --dry-run
    if (!force && !dryRun) {
      console.log('\n⚠️  WARNING: This will permanently delete all data from these collections!');
      console.log('⚠️  This action CANNOT be undone!\n');

      const confirmed = await askConfirmation('Continue with cleanup? (y/N): ');

      if (!confirmed) {
        console.log('\n❌ Fresh seed cancelled by user');
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

    console.log('\n' + '='.repeat(60));

    if (dryRun) {
      console.log('\n🔍 DRY RUN - Would delete ' + totalDeleted + ' documents');
      return totalDeleted;
    } else {
      console.log('\n✅ Cleanup completed - Deleted ' + totalDeleted + ' documents');
      return totalDeleted;
    }
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  }
}

/**
 * Run seeding phase
 */
async function runSeed() {
  console.log('\n\n🌱 PHASE 2: SEEDING\n');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n🔍 [DRY RUN] Skipping seed phase in dry-run mode\n');
    return;
  }

  return new Promise((resolve, reject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const seedScript = join(__dirname, 'seed-new.js');

    console.log('\n🚀 Running seed-new.js...\n');

    const seedProcess = spawn('node', [seedScript], {
      stdio: 'inherit',
      shell: true
    });

    seedProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Seed script exited with code ${code}`));
      }
    });

    seedProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Walvee Fresh Seed Script\n');
  console.log('This will DELETE all existing trips and create fresh seed data');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No data will be modified\n');
  }

  try {
    // Phase 1: Cleanup
    const deletedCount = await runCleanup();

    // Phase 2: Seed (skip if dry-run)
    if (!dryRun) {
      await runSeed();
    }

    // Final summary
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ FRESH SEED COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('\n📊 Dry Run Summary:');
      console.log(`   • Would delete ${deletedCount} document(s)`);
      console.log(`   • Would create 10 new trips`);
      console.log(`   • Run without --dry-run to execute`);
    } else {
      console.log('\n📊 Summary:');
      console.log(`   • Deleted ${deletedCount} old document(s)`);
      console.log(`   • Created 10 new trips with correct structure`);
      console.log(`   • Database is now ready to use`);
    }

    console.log('\n💡 Next steps:');
    console.log('   • Start your dev server: npm run dev');
    console.log('   • Check home page to see trips');
    console.log('   • Verify trip details page loads correctly');

    process.exit(0);
  } catch (error) {
    console.error('\n\n❌ Fresh seed failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Walvee Fresh Seed Script - Complete Database Refresh

This script combines cleanup + seeding in one command.

Usage:
  node scripts/seed-fresh.js [options]

Options:
  --dry-run    Preview what would happen without making changes
  --force      Skip confirmation prompt
  --help, -h   Show this help message

Examples:
  # Interactive mode (with confirmation)
  node scripts/seed-fresh.js

  # Preview without executing
  node scripts/seed-fresh.js --dry-run

  # Execute without confirmation
  node scripts/seed-fresh.js --force

What it does:
  1. Deletes all existing trips, tripLikes, and tripDerivations
  2. Creates Walvee account (walvee@walvee.com)
  3. Seeds 10 complete trips with correct structure
  4. Verifies data was created successfully

⚠️  WARNING: This will permanently delete all trip data!
  `);
  process.exit(0);
}

// Run main function
main();
