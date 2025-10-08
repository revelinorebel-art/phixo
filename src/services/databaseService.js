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
import { withRetry, logFirestoreError, isRetryableError } from '../utils/firestoreUtils';

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
    return await withRetry(async () => {
      try {
        const user = userId || authService.getCurrentUser()?.uid;
        if (!user) {
          throw new Error('User must be authenticated');
        }

        // Ensure imagePath is not undefined - use a fallback if needed
        const imagePath = imageData.imagePath || imageData.fileName || null;
        
        console.log('🔄 DatabaseService: Saving image generation...', {
          userId: user,
          prompt: imageData.prompt,
          imageUrl: imageData.imageUrl,
          imagePath: imagePath,
          tool: imageData.tool,
          category: imageData.category
        });

        const generationData = {
          userId: user,
          prompt: imageData.prompt || '',
          imageUrl: imageData.imageUrl,
          imagePath: imagePath,
          tool: imageData.tool || 'unknown',
          category: imageData.category || 'general',
          model: imageData.model || 'flux-schnell',
          settings: imageData.settings || {},
          creditsUsed: imageData.creditsUsed || 1,
          status: imageData.status || 'completed',
          autoSaved: imageData.autoSaved || false,
          originalImage: imageData.originalImage || null,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(this.db, 'imageGenerations'), generationData);

        // Update user stats with retry logic
        await withRetry(async () => {
          await this.updateUserStats(user, {
            totalImagesGenerated: increment(1)
          });
        }, 'Update user stats');

        return {
          id: docRef.id,
          ...generationData
        };
      } catch (error) {
        logFirestoreError(error, 'saveImageGeneration', { 
          userId: userId || 'unknown',
          imageUrl: imageData?.imageUrl,
          tool: imageData?.tool 
        });
        throw new Error(`Failed to save image generation: ${error.message}`);
      }
    }, 'Save image generation');
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

  // Get user images from database
  async getUserImages(userId = null, limitCount = 20) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      console.log('🔄 DatabaseService: Fetching user images...', { userId: user, limit: limitCount });

      const q = query(
        collection(this.db, 'imageGenerations'),
        where('userId', '==', user),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const images = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        images.push({
          id: doc.id,
          ...data,
          // Ensure createdAt is properly formatted
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
        });
      });

      console.log('✅ DatabaseService: Retrieved images:', images.length);
      return images;
    } catch (error) {
      console.error('❌ DatabaseService: Error fetching user images:', error);
      throw new Error(`Failed to get user images: ${error.message}`);
    }
  }

  // Delete image generation from database
  async deleteImageGeneration(imageId, userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      console.log('🗄️ Deleting image generation:', { imageId, userId: user });

      // If imageId is provided, delete directly by document ID
      if (imageId && typeof imageId === 'string' && !imageId.startsWith('http')) {
        try {
          const docRef = doc(this.db, 'imageGenerations', imageId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().userId === user) {
            await deleteDoc(docRef);
            console.log('✅ Deleted image generation by ID:', imageId);
            return { 
              success: true, 
              deletedCount: 1,
              message: 'Image generation deleted successfully'
            };
          } else {
            console.warn('❌ Document not found or user mismatch for ID:', imageId);
          }
        } catch (error) {
          console.warn('⚠️ Failed to delete by ID, falling back to URL search:', error.message);
        }
      }

      // Fallback: search by URL (for backward compatibility)
      const imageUrl = imageId; // imageId might actually be a URL
      console.log('🔍 Searching for image generation by URL:', imageUrl);

      // First try to find by imageUrl
      let q = query(
        collection(this.db, 'imageGenerations'),
        where('userId', '==', user),
        where('imageUrl', '==', imageUrl)
      );

      let querySnapshot = await getDocs(q);
      
      // If not found by imageUrl, try to find by imagePath
      if (querySnapshot.empty) {
        console.log('🔍 Not found by imageUrl, trying imagePath...');
        q = query(
          collection(this.db, 'imageGenerations'),
          where('userId', '==', user),
          where('imagePath', '==', imageUrl)
        );
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        console.warn('❌ No image generation found to delete for URL:', imageUrl);
        return { success: true, message: 'No matching record found' };
      }

      console.log(`✅ Found ${querySnapshot.size} matching documents to delete`);

      // Delete all matching documents
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        console.log('🗑️ Deleting document:', doc.id, doc.data());
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      return { 
        success: true, 
        deletedCount: querySnapshot.size,
        message: `Deleted ${querySnapshot.size} image generation record(s)`
      };
    } catch (error) {
      console.error('❌ Database delete error:', error);
      throw new Error(`Failed to delete image generation: ${error.message}`);
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
    return await withRetry(async () => {
      try {
        const userRef = doc(this.db, 'users', userId);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        logFirestoreError(error, 'updateUserStats', { 
          userId,
          updates: Object.keys(updates)
        });
        throw new Error(`Failed to update user stats: ${error.message}`);
      }
    }, 'Update user statistics');
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

  // Real-time user data listener with improved error handling
  subscribeToUserData(userId, callback) {
    const user = userId || authService.getCurrentUser()?.uid;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const userRef = doc(this.db, 'users', user);
    let retryCount = 0;
    const maxRetries = 3;
    let unsubscribe = null;
    
    const createListener = () => {
      console.log(`🔄 Setting up user data listener (attempt ${retryCount + 1})`);
      
      unsubscribe = onSnapshot(userRef, 
        (doc) => {
          // Reset retry count on successful connection
          retryCount = 0;
          
          if (doc.exists()) {
            callback(doc.data());
          } else {
            callback(null);
          }
        }, 
        (error) => {
          logFirestoreError(error, 'subscribeToUserData', { userId: user });
          
          // Handle retryable errors
          if (retryCount < maxRetries && isRetryableError(error)) {
            retryCount++;
            console.log(`⏳ Retrying user data listener in 2 seconds (attempt ${retryCount}/${maxRetries})`);
            
            // Cleanup current listener
            if (unsubscribe) {
              unsubscribe();
            }
            
            // Retry after delay
            setTimeout(() => {
              createListener();
            }, 2000 * retryCount); // Exponential backoff
          } else {
            console.error('❌ User data listener failed permanently:', error);
            callback(null);
          }
        }
      );
    };
    
    // Start the listener
    createListener();
    
    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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