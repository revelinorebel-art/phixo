import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth Service Class
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        listener => listener !== callback
      );
    };
  }

  // Sign up with email and password
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user document in Firestore
      await this.createUserDocument(user, { displayName });

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      await this.updateUserDocument(userCredential.user.uid, {
        lastLoginAt: serverTimestamp()
      });

      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await this.createUserDocument(user);
      } else {
        // Update last login time
        await this.updateUserDocument(user.uid, {
          lastLoginAt: serverTimestamp()
        });
      }

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(this.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }

      // Update Firestore user document
      await this.updateUserDocument(this.currentUser.uid, updates);

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Delete user account
  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('No user is currently signed in');
      }

      const userId = this.currentUser.uid;
      
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // Delete user from Firebase Auth
      await deleteUser(this.currentUser);

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Create user document in Firestore
  async createUserDocument(user, additionalData = {}) {
    try {
      console.log('🗄️  Creating user document in Firestore...', { uid: user.uid, email: user.email });
      
      const userRef = doc(db, 'users', user.uid);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.displayName || user.email?.split('@')[0] || '',
        photoURL: user.photoURL || '',
        credits: 10, // Starting credits
        totalCreditsUsed: 0,
        totalImagesGenerated: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: serverTimestamp(),
          endDate: null
        },
        preferences: {
          theme: 'light',
          language: 'en',
          emailNotifications: true
        },
        ...additionalData
      };

      console.log('📝 User data to save:', userData);
      
      await setDoc(userRef, userData);
      console.log('✅ User document successfully created in Firestore!');
      
      return userData;
    } catch (error) {
      console.error('❌ Error creating user document:', error);
      throw error;
    }
  }

  // Update user document in Firestore
  async updateUserDocument(userId, updates) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Get current user data from Firestore
  async getCurrentUserData() {
    if (!this.currentUser) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;