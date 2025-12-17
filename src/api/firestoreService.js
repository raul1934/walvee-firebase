import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

// Generic CRUD operations factory
// This maintains the same API as Base44 entities
const createEntity = (collectionName) => ({
  async create(data) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    // Convert created_date to created_at if present
    const docData = {
      ...data,
      created_by: currentUser.uid,
      created_at: serverTimestamp()
    };

    // Add created_date for compatibility if not present
    if (!docData.created_date) {
      docData.created_date = serverTimestamp();
    }

    const docRef = await addDoc(collection(db, collectionName), docData);
    const newDoc = await getDoc(docRef);

    return { id: docRef.id, ...newDoc.data() };
  },

  async get(id) {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Document not found: ${id}`);
    }

    // Convert Firestore Timestamps to ISO strings for compatibility
    const data = docSnap.data();
    const processedData = processTimestamps(data);

    return { id: docSnap.id, ...processedData };
  },

  async update(id, data) {
    const docRef = doc(db, collectionName, id);

    const updateData = {
      ...data,
      updated_at: serverTimestamp()
    };

    await updateDoc(docRef, updateData);

    return await this.get(id);
  },

  async delete(id) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { id, deleted: true };
  },

  async list(orderByField = 'created_date', limitCount = 100) {
    console.log(`[${collectionName}] list() called with orderBy: ${orderByField}, limit: ${limitCount}`);

    // Handle Base44-style descending order prefix (e.g., "-created_date")
    const isDescending = orderByField.startsWith('-');
    const fieldName = isDescending ? orderByField.substring(1) : orderByField;
    const direction = isDescending ? 'desc' : 'asc';

    const q = query(
      collection(db, collectionName),
      orderBy(fieldName, direction),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    console.log(`[${collectionName}] list() returned ${snapshot.size} documents`);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const processedData = processTimestamps(data);
      return { id: doc.id, ...processedData };
    });
  },

  async filter(conditions) {
    // Build query constraints from conditions object
    const constraints = Object.entries(conditions).map(([field, value]) =>
      where(field, '==', value)
    );

    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const processedData = processTimestamps(data);
      return { id: doc.id, ...processedData };
    });
  }
});

// Helper function to process Firestore Timestamps to ISO strings
function processTimestamps(data) {
  if (!data) return data;

  const processed = { ...data };

  for (const [key, value] of Object.entries(processed)) {
    if (value instanceof Timestamp) {
      processed[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      processed[key] = processTimestamps(value);
    } else if (Array.isArray(value)) {
      processed[key] = value.map(item =>
        item && typeof item === 'object' ? processTimestamps(item) : item
      );
    }
  }

  return processed;
}

// Export entity services (maintaining Base44 API)
export const Trip = createEntity('trips');
export const TripLike = createEntity('tripLikes');
export const Follow = createEntity('follows');
export const Review = createEntity('reviews');
export const TripDerivation = createEntity('tripDerivations');

// Aliases for compatibility
export const Favorite = TripLike;  // Favorite is an alias for TripLike
export const TripSteal = TripDerivation;  // TripSteal is an alias for TripDerivation
