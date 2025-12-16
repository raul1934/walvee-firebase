// Firebase Firestore entities (replacing Base44 entities)
export {
  Trip,
  Favorite,
  Review,
  TripDerivation,
  TripLike,
  TripSteal,
  Follow
} from './firestoreService';

// Firebase Auth service (replacing Base44 auth)
export { firebaseAuthService as User } from './firebaseAuth';