import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  serverTimestamp,
  increment,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { authService } from './authService';

class DatabaseService {
  constructor() {
    this.db = db;
  }

  // Credits Management
  async getUserCredits(userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const userDoc = await getDoc(doc(this.db, 'users', user));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      return {
        credits: userData.credits || 0,
        totalCreditsUsed: userData.totalCreditsUsed || 0,
        totalImagesGenerated: userData.totalImagesGenerated || 0
      };
    } catch (error) {
      throw new Error(`Failed to get user credits: ${error.message}`);
    }
  }

  // Deduct credits (atomic transaction)
  async deductCredits(amount, userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const userRef = doc(this.db, 'users', user);

      return await runTransaction(this.db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;

        if (currentCredits < amount) {
          throw new Error('Insufficient credits');
        }

        // Update user credits
        transaction.update(userRef, {
          credits: increment(-amount),
          totalCreditsUsed: increment(amount),
          updatedAt: serverTimestamp()
        });

        return {
          newBalance: currentCredits - amount,
          deducted: amount
        };
      });
    } catch (error) {
      throw new Error(`Failed to deduct credits: ${error.message}`);
    }
  }

  // Add credits
  async addCredits(amount, reason = 'manual', userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const userRef = doc(this.db, 'users', user);

      return await runTransaction(this.db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;

        // Update user credits
        transaction.update(userRef, {
          credits: increment(amount),
          updatedAt: serverTimestamp()
        });

        // Log credit transaction
        const creditLogRef = doc(collection(this.db, 'creditTransactions'));
        transaction.set(creditLogRef, {
          userId: user,
          type: 'credit',
          amount: amount,
          reason: reason,
          balanceBefore: currentCredits,
          balanceAfter: currentCredits + amount,
          createdAt: serverTimestamp()
        });

        return {
          newBalance: currentCredits + amount,
          added: amount
        };
      });
    } catch (error) {
      throw new Error(`Failed to add credits: ${error.message}`);
    }
  }

  // Image Generation History
  async saveImageGeneration(imageData, userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const generationData = {
        userId: user,
        prompt: imageData.prompt,
        imageUrl: imageData.imageUrl,
        imagePath: imageData.imagePath,
        model: imageData.model || 'flux-schnell',
        settings: imageData.settings || {},
        creditsUsed: imageData.creditsUsed || 1,
        status: 'completed',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, 'imageGenerations'), generationData);

      // Update user stats
      await this.updateUserStats(user, {
        totalImagesGenerated: increment(1)
      });

      return {
        id: docRef.id,
        ...generationData
      };
    } catch (error) {
      throw new Error(`Failed to save image generation: ${error.message}`);
    }
  }

  // Get user's image generation history
  async getImageHistory(userId = null, limitCount = 20) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const q = query(
        collection(this.db, 'imageGenerations'),
        where('userId', '==', user),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const history = [];

      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return history;
    } catch (error) {
      throw new Error(`Failed to get image history: ${error.message}`);
    }
  }

  // Credit Transactions History
  async getCreditHistory(userId = null, limitCount = 50) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const q = query(
        collection(this.db, 'creditTransactions'),
        where('userId', '==', user),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const history = [];

      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return history;
    } catch (error) {
      throw new Error(`Failed to get credit history: ${error.message}`);
    }
  }

  // Update user statistics
  async updateUserStats(userId, updates) {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to update user stats: ${error.message}`);
    }
  }

  // Subscription Management (for future Stripe integration)
  async updateSubscription(subscriptionData, userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const userRef = doc(this.db, 'users', user);
      await updateDoc(userRef, {
        subscription: subscriptionData,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  // Get user subscription
  async getSubscription(userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const userDoc = await getDoc(doc(this.db, 'users', user));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      return userData.subscription || {
        plan: 'free',
        status: 'active',
        startDate: null,
        endDate: null
      };
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  // Real-time user data listener
  subscribeToUserData(userId, callback) {
    const user = userId || authService.getCurrentUser()?.uid;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const userRef = doc(this.db, 'users', user);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to user data:', error);
      callback(null);
    });
  }

  // Save user preferences
  async saveUserPreferences(preferences, userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const userRef = doc(this.db, 'users', user);
      await updateDoc(userRef, {
        preferences: preferences,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to save preferences: ${error.message}`);
    }
  }

  // Get user preferences
  async getUserPreferences(userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const userDoc = await getDoc(doc(this.db, 'users', user));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      return userData.preferences || {
        theme: 'light',
        language: 'en',
        emailNotifications: true
      };
    } catch (error) {
      throw new Error(`Failed to get preferences: ${error.message}`);
    }
  }

  // Analytics and reporting
  async getUserAnalytics(userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const [userDoc, imageHistory, creditHistory] = await Promise.all([
        getDoc(doc(this.db, 'users', user)),
        this.getImageHistory(user, 100),
        this.getCreditHistory(user, 100)
      ]);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();

      // Calculate analytics
      const totalCreditsSpent = creditHistory
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      const imagesThisMonth = imageHistory.filter(img => {
        const imgDate = img.createdAt?.toDate();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return imgDate && imgDate >= monthStart;
      }).length;

      return {
        totalImages: userData.totalImagesGenerated || 0,
        totalCreditsUsed: userData.totalCreditsUsed || 0,
        currentCredits: userData.credits || 0,
        imagesThisMonth,
        totalCreditsSpent,
        memberSince: userData.createdAt?.toDate(),
        lastActive: userData.lastLoginAt?.toDate()
      };
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;