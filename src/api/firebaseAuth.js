import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, db } from "@/config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const firebaseAuthService = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  },

  // Get current user (Firebase Auth object only)
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Get current user with Firestore profile data (matches Base44 me() API)
  me: async () => {
    const user = auth.currentUser;
    if (!user) return null;

    // Fetch user document from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return {
        id: user.uid,
        email: user.email,
        ...userDoc.data(),
      };
    }

    // If no document exists, create one with basic info
    const userData = {
      email: user.email,
      full_name: user.displayName || "",
      preferred_name: user.displayName?.split(" ")[0] || "",
      photo_url: user.photoURL || "",
      created_at: serverTimestamp(),
      onboarding_completed: false,
      metrics_followers: 0,
      metrics_following: 0,
      metrics_trips: 0,
      metrics_likes_received: 0,
    };

    await setDoc(userDocRef, userData);

    return {
      id: user.uid,
      email: user.email,
      ...userData,
    };
  },

  // Update current user profile (matches Base44 updateMe() API)
  updateMe: async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const userDocRef = doc(db, "users", user.uid);

    await setDoc(
      userDocRef,
      {
        ...data,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );

    return await firebaseAuthService.me();
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Create or update user document
      const userRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          full_name: result.user.displayName || "",
          preferred_name: result.user.displayName?.split(" ")[0] || "",
          photo_url: result.user.photoURL || "",
          created_at: serverTimestamp(),
          onboarding_completed: false,
          metrics_followers: 0,
          metrics_following: 0,
          metrics_trips: 0,
          metrics_likes_received: 0,
        });
      } else {
        // Update photo if it changed
        const currentData = userDoc.data();
        if (
          result.user.photoURL &&
          result.user.photoURL !== currentData.photo_url
        ) {
          await setDoc(
            userRef,
            {
              photo_url: result.user.photoURL,
              updated_at: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      return result.user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Compatibility method - redirect to login (not needed for popup, but kept for compatibility)
  redirectToLogin: (returnTo) => {
    console.warn("redirectToLogin called but using popup instead");
    return firebaseAuthService.signInWithGoogle();
  },

  // List all users (for CityLocals and other features)
  list: async (orderByField = 'created_at', limitCount = 100) => {
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

    // Handle Base44-style descending order prefix
    const isDescending = orderByField.startsWith('-');
    const fieldName = isDescending ? orderByField.substring(1) : orderByField;
    const direction = isDescending ? 'desc' : 'asc';

    const q = query(
      collection(db, 'users'),
      orderBy(fieldName, direction),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
};
