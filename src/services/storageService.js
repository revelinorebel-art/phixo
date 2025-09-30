import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { storage } from '../lib/firebase';
import { authService } from './authService';

class StorageService {
  constructor() {
    this.storage = storage;
  }

  // Generate unique filename
  generateFileName(originalName, userId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${userId}/${timestamp}_${randomString}.${extension}`;
  }

  // Development fallback - upload to proxy server
  async uploadToProxyServer(file, onProgress = null) {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      // Convert file to base64
      const base64Data = await this.fileToBase64(file);
      
      // Upload to proxy server
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Simulate progress completion
      if (onProgress) {
        onProgress(100);
      }

      return {
        url: result.url,
        path: result.filename,
        size: file.size,
        contentType: file.type,
        timeCreated: new Date().toISOString(),
        metadata: {
          uploadedBy: 'mock-user-123',
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Proxy upload error: ${error.message}`);
    }
  }

  // Upload image with progress tracking
  async uploadImage(file, onProgress = null) {
    try {
      const user = authService.getCurrentUser();
      
      // Development fallback - use proxy server if no Firebase user
      const isDevelopment = import.meta.env.DEV;
      if (isDevelopment && !user) {
        return await this.uploadToProxyServer(file, onProgress);
      }
      
      if (!user) {
        throw new Error('User must be authenticated to upload images');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const fileName = this.generateFileName(file.name, user.uid);
      const storageRef = ref(this.storage, `images/${fileName}`);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            // Handle upload errors
            reject(new Error(`Upload failed: ${error.message}`));
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              
              resolve({
                url: downloadURL,
                path: fileName,
                size: metadata.size,
                contentType: metadata.contentType,
                timeCreated: metadata.timeCreated,
                metadata: metadata.customMetadata
              });
            } catch (error) {
              reject(new Error(`Failed to get download URL: ${error.message}`));
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Upload error: ${error.message}`);
    }
  }

  // Upload generated image from URL
  async uploadGeneratedImage(imageUrl, prompt, userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated to save images');
      }

      // Fetch image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }

      const blob = await response.blob();
      
      // Generate filename for generated image
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${user}/generated/${timestamp}_${randomString}.png`;
      
      const storageRef = ref(this.storage, `images/${fileName}`);

      // Upload the blob
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/png',
        customMetadata: {
          uploadedBy: user,
          type: 'generated',
          prompt: prompt.substring(0, 500), // Limit prompt length
          generatedAt: new Date().toISOString()
        }
      });

      const downloadURL = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);

      return {
        url: downloadURL,
        path: fileName,
        size: metadata.size,
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated,
        metadata: metadata.customMetadata
      };
    } catch (error) {
      throw new Error(`Failed to save generated image: ${error.message}`);
    }
  }

  // Upload edited photo from canvas
  async uploadEditedPhoto(canvas, originalFileName = 'edited_photo.jpg', userId = null, onProgress = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated to save edited photos');
      }

      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to blob'));
            return;
          }

          try {
            // Generate filename for edited photo
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileName = `${user}/edited/${timestamp}_${randomString}_${originalFileName}`;
            
            const storageRef = ref(this.storage, `images/${fileName}`);

            if (onProgress) {
              // Upload with progress tracking
              const uploadTask = uploadBytesResumable(storageRef, blob, {
                contentType: 'image/jpeg',
                customMetadata: {
                  uploadedBy: user,
                  type: 'edited',
                  originalFileName: originalFileName,
                  editedAt: new Date().toISOString()
                }
              });

              uploadTask.on(
                'state_changed',
                (snapshot) => {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  onProgress(progress);
                },
                (error) => {
                  reject(new Error(`Upload failed: ${error.message}`));
                },
                async () => {
                  try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const metadata = await getMetadata(uploadTask.snapshot.ref);
                    
                    resolve({
                      url: downloadURL,
                      path: fileName,
                      size: metadata.size,
                      contentType: metadata.contentType,
                      timeCreated: metadata.timeCreated,
                      metadata: metadata.customMetadata
                    });
                  } catch (error) {
                    reject(new Error(`Failed to get download URL: ${error.message}`));
                  }
                }
              );
            } else {
              // Simple upload without progress
              const snapshot = await uploadBytes(storageRef, blob, {
                contentType: 'image/jpeg',
                customMetadata: {
                  uploadedBy: user,
                  type: 'edited',
                  originalFileName: originalFileName,
                  editedAt: new Date().toISOString()
                }
              });

              const downloadURL = await getDownloadURL(snapshot.ref);
              const metadata = await getMetadata(snapshot.ref);

              resolve({
                url: downloadURL,
                path: fileName,
                size: metadata.size,
                contentType: metadata.contentType,
                timeCreated: metadata.timeCreated,
                metadata: metadata.customMetadata
              });
            }
          } catch (error) {
            reject(new Error(`Failed to upload edited photo: ${error.message}`));
          }
        }, 'image/jpeg', 0.9); // High quality JPEG
      });
    } catch (error) {
      throw new Error(`Upload edited photo error: ${error.message}`);
    }
  }

  // Upload edited photo from File/Blob
  async uploadEditedPhotoFile(file, originalFileName = null, userId = null, onProgress = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated to save edited photos');
      }

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
      }

      // Generate filename for edited photo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${user}/edited/${timestamp}_${randomString}_${originalFileName || file.name}`;
      
      const storageRef = ref(this.storage, `images/${fileName}`);

      if (onProgress) {
        // Upload with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          customMetadata: {
            uploadedBy: user,
            type: 'edited',
            originalFileName: originalFileName || file.name,
            editedAt: new Date().toISOString()
          }
        });

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            },
            (error) => {
              reject(new Error(`Upload failed: ${error.message}`));
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const metadata = await getMetadata(uploadTask.snapshot.ref);
                
                resolve({
                  url: downloadURL,
                  path: fileName,
                  size: metadata.size,
                  contentType: metadata.contentType,
                  timeCreated: metadata.timeCreated,
                  metadata: metadata.customMetadata
                });
              } catch (error) {
                reject(new Error(`Failed to get download URL: ${error.message}`));
              }
            }
          );
        });
      } else {
        // Simple upload without progress
        const snapshot = await uploadBytes(storageRef, file, {
          contentType: file.type,
          customMetadata: {
            uploadedBy: user,
            type: 'edited',
            originalFileName: originalFileName || file.name,
            editedAt: new Date().toISOString()
          }
        });

        const downloadURL = await getDownloadURL(snapshot.ref);
        const metadata = await getMetadata(snapshot.ref);

        return {
          url: downloadURL,
          path: fileName,
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated,
          metadata: metadata.customMetadata
        };
      }
    } catch (error) {
      throw new Error(`Upload edited photo file error: ${error.message}`);
    }
  }

  // Delete image
  async deleteImage(imagePath) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to delete images');
      }

      // Check if user owns the image (path should start with user ID)
      if (!imagePath.startsWith(user.uid)) {
        throw new Error('You can only delete your own images');
      }

      const imageRef = ref(this.storage, `images/${imagePath}`);
      await deleteObject(imageRef);
      
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  // Get user's images
  async getUserImages(userId = null) {
    try {
      const user = userId || authService.getCurrentUser()?.uid;
      if (!user) {
        throw new Error('User must be authenticated to view images');
      }

      const userImagesRef = ref(this.storage, `images/${user}`);
      const result = await listAll(userImagesRef);

      const images = await Promise.all(
        result.items.map(async (itemRef) => {
          try {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);
            
            return {
              name: itemRef.name,
              path: itemRef.fullPath,
              url,
              size: metadata.size,
              contentType: metadata.contentType,
              timeCreated: metadata.timeCreated,
              metadata: metadata.customMetadata
            };
          } catch (error) {
            console.error(`Error getting image ${itemRef.name}:`, error);
            return null;
          }
        })
      );

      // Filter out failed items and sort by creation time
      return images
        .filter(image => image !== null)
        .sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
    } catch (error) {
      throw new Error(`Failed to get user images: ${error.message}`);
    }
  }

  // Get image metadata
  async getImageMetadata(imagePath) {
    try {
      const imageRef = ref(this.storage, `images/${imagePath}`);
      const metadata = await getMetadata(imageRef);
      const url = await getDownloadURL(imageRef);

      return {
        url,
        size: metadata.size,
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated,
        metadata: metadata.customMetadata
      };
    } catch (error) {
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }

  // Convert file to base64 (for preview)
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Validate image file
  validateImageFile(file) {
    const errors = [];

    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('Only image files are allowed');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    // Check supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
      errors.push('Supported formats: JPEG, PNG, WebP');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;

// Nieuwe functies voor bewerkte foto's uploaden
export async function uploadEditedPhoto(blob, metadata, progressCallback) {
  try {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to upload edited photos');
    }

    // Valideer blob
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('Invalid blob provided');
    }

    // Valideer metadata
    if (!metadata || !metadata.category || !metadata.prompt) {
      throw new Error('Metadata with category and prompt is required');
    }

    // Genereer unieke bestandsnaam
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${user.uid}/edited/${metadata.category}/${timestamp}_${randomString}.jpg`;
    
    const storageRef = ref(storage, `images/${fileName}`);

    // Upload met progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedBy: user.uid,
        type: 'edited',
        category: metadata.category,
        prompt: metadata.prompt,
        aspectRatio: metadata.aspectRatio || 'unknown',
        resolution: metadata.resolution || 'unknown',
        originalFileName: metadata.originalFileName || 'unknown',
        editedAt: metadata.editedAt || new Date().toISOString()
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (progressCallback) {
            progressCallback(Math.round(progress));
          }
        },
        (error) => {
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const uploadMetadata = await getMetadata(uploadTask.snapshot.ref);
            
            resolve({
              fileName: fileName,
              downloadURL: downloadURL,
              metadata: {
                size: uploadMetadata.size,
                contentType: uploadMetadata.contentType,
                timeCreated: uploadMetadata.timeCreated,
                customMetadata: uploadMetadata.customMetadata
              }
            });
          } catch (error) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Failed to upload edited photo: ${error.message}`);
  }
}

// Upload van canvas element
export async function uploadFromCanvas(canvas, metadata, progressCallback) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to convert canvas to blob'));
        return;
      }

      try {
        const result = await uploadEditedPhoto(blob, metadata, progressCallback);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, 'image/jpeg', 0.9);
  });
}

// Upload van bestand
export async function uploadFromFile(file, metadata, progressCallback) {
  try {
    // Valideer bestand
    const validation = storageService.validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
    }

    // Converteer bestand naar blob indien nodig
    const blob = file instanceof Blob ? file : new Blob([file]);
    
    // Voeg originele bestandsnaam toe aan metadata
    const enhancedMetadata = {
      ...metadata,
      originalFileName: file.name || metadata.originalFileName || 'unknown'
    };

    return await uploadEditedPhoto(blob, enhancedMetadata, progressCallback);
  } catch (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}