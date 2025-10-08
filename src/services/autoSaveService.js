import { storageService, uploadEditedPhoto } from './storageService';
import { databaseService } from './databaseService';
import { authService } from './authService';
import { toast } from '@/components/ui/use-toast';
import { ref, deleteObject, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { withRetry, logFirestoreError } from '../utils/firestoreUtils';

/**
 * AutoSaveService - Centrale service voor automatische foto opslag
 * Handelt automatische opslag naar Firebase Storage en database af voor alle tools
 */
class AutoSaveService {
  constructor() {
    this.isEnabled = true;
    this.uploadQueue = [];
    this.isProcessing = false;
  }

  /**
   * Automatisch opslaan van bewerkte/gegenereerde foto
   * @param {Object} photoData - Foto data object
   * @param {string} photoData.imageUrl - URL van de foto
   * @param {string} photoData.tool - Tool die de foto heeft gemaakt ('photo-optimization', 'mockup-creator', 'photo-generator', 'retouch-tools')
   * @param {string} photoData.prompt - Beschrijving van de bewerking
   * @param {Object} photoData.metadata - Extra metadata
   * @param {Function} onProgress - Progress callback (optioneel)
   * @returns {Promise<Object>} Upload resultaat
   */
  async autoSavePhoto(photoData, onProgress = null) {
    console.log('🔄 AutoSaveService: Starting autoSavePhoto...', photoData);
    
    if (!this.isEnabled) {
      console.log('AutoSave is disabled');
      return null;
    }

    try {
      // Check if user is authenticated
      const user = authService.getCurrentUser();
      console.log('👤 AutoSaveService: Current user:', user ? user.uid : 'Not authenticated');
      
      if (!user) {
        console.warn('⚠️ AutoSaveService: User not authenticated, skipping auto-save');
        toast({
          title: "Authenticatie vereist",
          description: "Je moet ingelogd zijn om foto's op te slaan.",
          variant: "destructive"
        });
        return { success: false, error: 'User not authenticated' };
      }

      // Validate input
      if (!photoData || !photoData.imageUrl) {
        console.error('❌ AutoSaveService: Invalid photo data:', photoData);
        return { success: false, error: 'Invalid photo data' };
      }

      console.log('🔄 AutoSaveService: Converting image URL to blob...');
      // Convert image URL to blob
      const response = await fetch(photoData.imageUrl);
      if (!response.ok) {
        console.error('❌ AutoSaveService: Failed to fetch image:', response.status, response.statusText);
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('✅ AutoSaveService: Image converted to blob:', blob.size, 'bytes');

      // Generate metadata
      const metadata = {
        category: photoData.metadata?.category || 'edited',
        prompt: photoData.prompt || '',
        aspectRatio: photoData.metadata?.aspectRatio || 'unknown',
        resolution: photoData.metadata?.resolution || 'unknown',
        originalFileName: photoData.metadata?.originalFileName || 'unknown',
        editedAt: photoData.metadata?.editedAt || new Date().toISOString(),
        tool: photoData.tool || 'unknown'
      };

      console.log('📋 AutoSaveService: Generated metadata:', metadata);

      // Upload to Firebase Storage
      console.log('☁️ AutoSaveService: Uploading to Firebase Storage...');
      const uploadResult = await uploadEditedPhoto(blob, metadata, onProgress);
      console.log('✅ AutoSaveService: Firebase upload result:', uploadResult);

      if (!uploadResult || !uploadResult.downloadURL) {
        console.error('❌ AutoSaveService: Upload failed - no download URL');
        throw new Error('Upload failed - no download URL received');
      }

      // Validate uploadResult structure
      if (!uploadResult.fileName) {
        console.warn('⚠️ AutoSaveService: No fileName in uploadResult, using fallback');
        console.log('🔍 AutoSaveService: Full uploadResult:', uploadResult);
      }

      // Save to database
      console.log('💾 AutoSaveService: Saving to database...');
      const imageData = {
        userId: user.uid,
        prompt: photoData.prompt || '',
        imageUrl: uploadResult.downloadURL,
        imagePath: uploadResult.fileName || null,
        fileName: uploadResult.fileName || null, // Add fileName as backup
        tool: photoData.tool || 'photo-optimization',
        category: metadata.category,
        settings: photoData.settings || {},
        creditsUsed: 1,
        status: 'completed',
        autoSaved: true,
        originalImage: photoData.originalImage || null
      };

      console.log('📋 AutoSaveService: Saving image data to database:', imageData);
      const dbResult = await withRetry(async () => {
        return await databaseService.saveImageGeneration(imageData);
      }, 'AutoSave database operation');
      console.log('✅ AutoSaveService: Database save result:', dbResult);

      // Save to localStorage for quick access
      console.log('💾 AutoSaveService: Saving to localStorage...');
      const autoSavedPhotos = JSON.parse(localStorage.getItem('autoSavedPhotos') || '[]');
      
      const newPhoto = {
        id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Bewerkte foto ${new Date().toLocaleDateString()}`,
        url: uploadResult.downloadURL,
        category: metadata.category,
        createdAt: new Date().toISOString(),
        prompt: photoData.prompt || '',
        tool: photoData.tool || 'photo-optimization',
        firebasePath: uploadResult.fileName,
        autoSaved: true
      };

      autoSavedPhotos.unshift(newPhoto);
      
      // Keep only last 100 auto-saved photos
      if (autoSavedPhotos.length > 100) {
        autoSavedPhotos.splice(100);
      }
      
      localStorage.setItem('autoSavedPhotos', JSON.stringify(autoSavedPhotos));
      console.log('✅ AutoSaveService: Saved to localStorage, total photos:', autoSavedPhotos.length);

      // Trigger dashboard refresh
      this.triggerDashboardRefresh();

      // Show success toast
      console.log('🎉 AutoSaveService: Showing success toast...');
      toast({
        title: "Foto automatisch opgeslagen! ☁️",
        description: "Je bewerkte foto is veilig opgeslagen.",
        duration: 3000
      });

      console.log('✅ AutoSaveService: Auto-save completed successfully!');
      return {
        success: true,
        firebaseUrl: uploadResult.downloadURL,
        metadata: uploadResult.metadata,
        localPhoto: newPhoto
      };

    } catch (error) {
      console.error('❌ AutoSaveService: Auto-save failed:', error);
      
      toast({
        title: "Auto-save mislukt",
        description: `Kon de foto niet automatisch opslaan: ${error.message}`,
        variant: "destructive",
        duration: 5000
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Haal alle opgeslagen foto's op uit Firebase Storage voor de huidige gebruiker
   * @returns {Promise<Array>} Array van foto objecten
   */
  async getRecentPhotos(limit = 20) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ AutoSaveService: User not authenticated, returning empty array');
        return [];
      }

      console.log('🔄 AutoSaveService: Fetching recent photos from database...');
      
      // Haal foto's op uit de database
      const photos = await databaseService.getUserImages(user.uid, limit);
      console.log('✅ AutoSaveService: Retrieved photos from database:', photos.length);

      // Converteer naar dashboard formaat
      const formattedPhotos = photos.map(photo => ({
        id: photo.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: this.generatePhotoName({
          tool: photo.tool,
          prompt: photo.prompt
        }),
        url: photo.imageUrl,
        originalImage: photo.originalImage || null, // Voeg originele foto URL toe
        category: photo.category || photo.tool,
        createdAt: photo.createdAt || new Date().toISOString(),
        prompt: photo.prompt || '',
        tool: photo.tool || 'unknown',
        firebasePath: photo.imagePath,
        autoSaved: photo.autoSaved || true,
        displayCategory: this.getDisplayCategory(photo.tool || photo.category)
      }));

      console.log('✅ AutoSaveService: Formatted photos for dashboard:', formattedPhotos.length);
      return formattedPhotos;

    } catch (error) {
      console.error('❌ AutoSaveService: Error fetching recent photos:', error);
      return [];
    }
  }

  /**
   * Verwijder een foto uit Firebase Storage en database
   * @param {Object} photo - Foto object met firebasePath en id
   * @returns {Promise<boolean>} Success status
   */
  async deletePhoto(photo) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to delete photos');
      }

      console.log('🗑️ AutoSaveService: Deleting photo...', photo);

      // Verwijder uit Firebase Storage
      if (photo.firebasePath) {
        try {
          const storageRef = ref(storage, `images/${photo.firebasePath}`);
          await deleteObject(storageRef);
          console.log('✅ AutoSaveService: Photo deleted from Firebase Storage');
        } catch (storageError) {
          console.warn('⚠️ AutoSaveService: Could not delete from Firebase Storage:', storageError.message);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Verwijder uit database
      if (photo.id) {
        try {
          await databaseService.deleteImageGeneration(photo.id, user.uid);
          console.log('✅ AutoSaveService: Photo deleted from database');
        } catch (dbError) {
          console.warn('⚠️ AutoSaveService: Could not delete from database:', dbError.message);
        }
      }

      // Verwijder uit localStorage
      try {
        const autoSavedPhotos = JSON.parse(localStorage.getItem('autoSavedPhotos') || '[]');
        const filteredPhotos = autoSavedPhotos.filter(p => p.id !== photo.id && p.url !== photo.url);
        localStorage.setItem('autoSavedPhotos', JSON.stringify(filteredPhotos));
        console.log('✅ AutoSaveService: Photo removed from localStorage');
      } catch (localError) {
        console.warn('⚠️ AutoSaveService: Could not remove from localStorage:', localError.message);
      }

      // Trigger dashboard refresh
      this.triggerDashboardRefresh();

      toast({
        title: "Foto verwijderd! 🗑️",
        description: "De foto is succesvol verwijderd.",
        duration: 3000
      });

      return true;

    } catch (error) {
      console.error('❌ AutoSaveService: Error deleting photo:', error);
      
      toast({
        title: "Verwijderen mislukt",
        description: `Kon de foto niet verwijderen: ${error.message}`,
        variant: "destructive",
        duration: 5000
      });

      return false;
    }
  }

  /**
   * Trigger een refresh van het dashboard
   */
  triggerDashboardRefresh() {
    // Dispatch een custom event voor dashboard refresh
    window.dispatchEvent(new CustomEvent('photosUpdated', {
      detail: { timestamp: Date.now() }
    }));
    
    // Ook localStorage event voor backwards compatibility
    window.dispatchEvent(new CustomEvent('localStorageUpdated', {
      detail: { key: 'autoSavedPhotos', timestamp: Date.now() }
    }));
  }

  /**
   * Get display category voor dashboard
   */
  getDisplayCategory(category) {
    switch (category) {
      case 'photo-optimization':
      case 'foto-optimalisatie':
        return 'Bewerkt';
      case 'photo-generator':
      case 'foto-generator':
      case 'ai-gegenereerd':
        return 'AI Gegenereerd';
      case 'mockup-creator':
        return 'Mockup';
      case 'retouch-tools':
        return 'Geretoucheerd';
      default:
        return 'Foto';
    }
  }

  /**
   * Genereer een beschrijvende naam voor de foto
   */
  generatePhotoName(photoData) {
    const toolName = this.getToolDisplayName(photoData.tool);
    const date = new Date().toLocaleDateString('nl-NL');
    const time = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    
    // Kort de prompt in als deze te lang is
    const shortPrompt = photoData.prompt && photoData.prompt.length > 30 
      ? photoData.prompt.substring(0, 30) + '...'
      : photoData.prompt || 'Bewerkte foto';
    
    return `${toolName} - ${shortPrompt} (${date} ${time})`;
  }

  /**
   * Krijg display naam voor tool
   */
  getToolDisplayName(tool) {
    const toolNames = {
      'photo-optimization': 'Foto Optimalisatie',
      'foto-optimalisatie': 'Foto Optimalisatie',
      'mockup-creator': 'Mockup Creator',
      'photo-generator': 'Foto Generator',
      'foto-generator': 'Foto Generator',
      'retouch-tools': 'Retouch Tool'
    };
    
    return toolNames[tool] || tool;
  }

  /**
   * Schakel automatisch opslaan in/uit
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`AutoSave ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Krijg status van automatisch opslaan
   */
  isAutoSaveEnabled() {
    return this.isEnabled;
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();
export default autoSaveService;