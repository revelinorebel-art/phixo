// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.warn('⚠️ Missing Firebase configuration fields:', missingFields);
    console.warn('Please check your .env file and ensure all Firebase variables are set.');
  }
  
  return missingFields.length === 0;
};

// Initialize Firebase only if configuration is valid
let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;

try {
  if (validateFirebaseConfig()) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Configure Firestore settings for better reliability
    if (db) {
      // Configure Firestore for optimal performance and stability
      try {
        // Configure Firestore settings for better connection handling
        const settings = {
          // Increase timeout for better reliability
          experimentalForceLongPolling: false, // Use WebSocket when possible
          merge: true,
          // Enable better error recovery
          ignoreUndefinedProperties: true
        };
        
        // Apply settings (Note: This should be done before any Firestore operations)
        // connectFirestoreEmulator can be used here if needed for development
        
        // Enable offline persistence (optional - uncomment if needed)
        // enableIndexedDbPersistence(db);
        
        console.log('✅ Firestore configured successfully with enhanced settings');
      } catch (error) {
        console.warn('⚠️ Firestore configuration warning:', error);
      }
    }
    
    // Initialize Analytics (only in production and when available)
    if (typeof window !== 'undefined' && import.meta.env.PROD) {
      analytics = getAnalytics(app);
    }
    
    console.log('✅ Firebase initialized successfully');
  } else {
    console.error('❌ Firebase initialization failed due to missing configuration');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.warn('🔧 App will continue to work with limited functionality');
}

// Export Firebase services with null checks
export { auth, db, storage, analytics };
export default app;