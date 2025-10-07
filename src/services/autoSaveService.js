import { storageService, uploadEditedPhoto } from './storageService';
import { databaseService } from './databaseService';
import { authService } from './authService';
import { toast } from '@/components/ui/use-toast';

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
    if (!this.isEnabled) {
      console.log('AutoSave is disabled');
      return null;
    }

    try {
      console.log('🔄 Starting auto-save process...', { photoData, onProgress });
      
      const user = authService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ No authenticated user found for auto-save');
        toast({
          title: "Authenticatie vereist",
          description: "Je moet ingelogd zijn om foto's op te slaan.",
          variant: "destructive"
        });
        throw new Error('User must be authenticated to save photos');
      }
      
      console.log('✅ User authenticated:', user.uid);

      // Valideer input
      if (!photoData.imageUrl || !photoData.tool || !photoData.prompt) {
        throw new Error('Missing required photo data: imageUrl, tool, and prompt are required');
      }

      // Converteer foto URL naar blob
      console.log('🔄 Converting image URL to blob...');
      const response = await fetch(photoData.imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }
      const blob = await response.blob();
      console.log('✅ Blob created:', blob.size, 'bytes');

      // Genereer metadata voor opslag
      console.log('🔄 Generating metadata...');
      const metadata = {
        category: photoData.tool,
        prompt: photoData.prompt,
        aspectRatio: photoData.metadata?.aspectRatio || 'unknown',
        resolution: photoData.metadata?.resolution || 'unknown',
        originalFileName: photoData.metadata?.originalFileName || 'generated_photo',
        editedAt: new Date().toISOString(),
        tool: photoData.tool,
        ...photoData.metadata
      };
      console.log('✅ Metadata generated:', metadata);

      // Upload naar Firebase Storage
      console.log('🔄 Uploading to Firebase Storage...');
      const uploadResult = await this.uploadToFirebaseStorage(blob, metadata, onProgress);
      console.log('✅ Firebase upload completed:', uploadResult);

      // Sla metadata op in database
      console.log('🔄 Saving to database...');
      const dbResult = await this.saveToDatabase(uploadResult, photoData, user.uid);
      console.log('✅ Database save completed');

      // Sla ook op in localStorage voor snelle toegang
      console.log('🔄 Saving to localStorage...');
      await this.saveToLocalStorage(uploadResult, photoData);
      console.log('✅ localStorage save completed');

      // Toon success toast
      toast({
        title: "Foto automatisch opgeslagen! ☁️",
        description: `Je ${this.getToolDisplayName(photoData.tool)} foto is opgeslagen in Mijn Foto's.`,
        duration: 3000
      });

      return {
        success: true,
        firebaseUrl: uploadResult.downloadURL,
        databaseId: dbResult.id,
        metadata: uploadResult.metadata
      };

    } catch (error) {
      console.error('AutoSave error:', error);
      
      // Toon error toast alleen voor kritieke fouten
      if (!error.message.includes('User must be authenticated')) {
        toast({
          title: "Automatisch opslaan mislukt",
          description: `Kon de foto niet automatisch opslaan: ${error.message}`,
          variant: "destructive",
          duration: 5000
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload foto naar Firebase Storage
   */
  async uploadToFirebaseStorage(blob, metadata, onProgress) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to upload photos');
      }
      
      // Gebruik de geïmporteerde uploadEditedPhoto functie
      const result = await uploadEditedPhoto(blob, metadata, onProgress);
      return result;
    } catch (error) {
      console.error('Firebase Storage upload error:', error);
      throw new Error(`Failed to upload to Firebase Storage: ${error.message}`);
    }
  }

  /**
   * Sla foto metadata op in database
   */
  async saveToDatabase(uploadResult, photoData, userId) {
    try {
      const imageData = {
        userId: userId,
        prompt: photoData.prompt,
        imageUrl: uploadResult.downloadURL,
        imagePath: uploadResult.fileName,
        tool: photoData.tool,
        category: photoData.tool,
        settings: photoData.metadata || {},
        creditsUsed: photoData.creditsUsed || 0,
        status: 'completed',
        autoSaved: true,
        originalImage: photoData.originalImage || null
      };

      return await databaseService.saveImageGeneration(imageData, userId);
    } catch (error) {
      console.error('Database save error:', error);
      // Database opslag is niet kritiek, dus we gooien geen error
      return { id: null, error: error.message };
    }
  }

  /**
   * Sla foto op in localStorage voor snelle toegang
   */
  async saveToLocalStorage(uploadResult, photoData) {
    try {
      // Haal bestaande foto's op
      const savedPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
      
      // Creëer nieuwe foto entry
      const newPhoto = {
        id: `auto-saved-${Date.now()}`,
        name: this.generatePhotoName(photoData),
        url: uploadResult.downloadURL,
        category: photoData.tool,
        createdAt: new Date().toISOString(),
        prompt: photoData.prompt,
        tool: photoData.tool,
        autoSaved: true,
        firebasePath: uploadResult.fileName
      };
      
      // Voeg toe aan begin van array (meest recente eerst)
      const updatedPhotos = [newPhoto, ...savedPhotos];
      
      // Beperk tot maximaal 100 foto's in localStorage
      const limitedPhotos = updatedPhotos.slice(0, 100);
      
      localStorage.setItem('myPhotos', JSON.stringify(limitedPhotos));
      
      // Dispatch custom event to notify other components (like MyPhotos)
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { type: 'photoAdded', photo: newPhoto }
      }));
      
      return newPhoto;
    } catch (error) {
      console.error('LocalStorage save error:', error);
      // LocalStorage opslag is niet kritiek
      return null;
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
    const shortPrompt = photoData.prompt.length > 30 
      ? photoData.prompt.substring(0, 30) + '...'
      : photoData.prompt;
    
    return `${toolName} - ${shortPrompt} (${date} ${time})`;
  }

  /**
   * Krijg display naam voor tool
   */
  getToolDisplayName(tool) {
    const toolNames = {
      'photo-optimization': 'Foto Optimalisatie',
      'mockup-creator': 'Mockup Creator',
      'photo-generator': 'Foto Generator',
      'retouch-tools': 'Retouch Tool'
    };
    
    return toolNames[tool] || tool;
  }

  /**
   * Batch upload voor meerdere foto's
   */
  async autoSaveMultiplePhotos(photosData, onProgress = null) {
    const results = [];
    const total = photosData.length;
    
    for (let i = 0; i < photosData.length; i++) {
      const photoData = photosData[i];
      
      try {
        const result = await this.autoSavePhoto(photoData, (progress) => {
          if (onProgress) {
            const overallProgress = ((i / total) * 100) + ((progress / total));
            onProgress(Math.round(overallProgress));
          }
        });
        
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          photoData
        });
      }
    }
    
    return results;
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

  /**
   * Wis oude auto-saved foto's (cleanup functie)
   */
  async cleanupOldPhotos(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Cleanup localStorage
      const savedPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
      const filteredPhotos = savedPhotos.filter(photo => {
        if (!photo.autoSaved) return true; // Behoud handmatig opgeslagen foto's
        
        const photoDate = new Date(photo.createdAt);
        return photoDate > cutoffDate;
      });
      
      localStorage.setItem('myPhotos', JSON.stringify(filteredPhotos));
      
      const removedCount = savedPhotos.length - filteredPhotos.length;
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} old auto-saved photos from localStorage`);
      }
      
      return { success: true, removedCount };
    } catch (error) {
      console.error('Cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Krijg statistieken over auto-saved foto's
   */
  getAutoSaveStats() {
    try {
      const savedPhotos = JSON.parse(localStorage.getItem('myPhotos') || '[]');
      const autoSavedPhotos = savedPhotos.filter(photo => photo.autoSaved);
      
      const stats = {
        total: autoSavedPhotos.length,
        byTool: {},
        totalSize: 0,
        oldestDate: null,
        newestDate: null
      };
      
      autoSavedPhotos.forEach(photo => {
        // Count by tool
        stats.byTool[photo.tool] = (stats.byTool[photo.tool] || 0) + 1;
        
        // Track dates
        const photoDate = new Date(photo.createdAt);
        if (!stats.oldestDate || photoDate < stats.oldestDate) {
          stats.oldestDate = photoDate;
        }
        if (!stats.newestDate || photoDate > stats.newestDate) {
          stats.newestDate = photoDate;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Stats error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();
export default autoSaveService;