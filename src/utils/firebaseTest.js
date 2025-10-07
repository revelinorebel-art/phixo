import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { authService } from '../services/authService';

/**
 * Test Firebase Storage verbinding
 */
export const testFirebaseConnection = async () => {
  try {
    console.log('🔄 Testing Firebase Storage connection...');
    
    // Check if user is authenticated
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to test Firebase Storage');
    }
    
    console.log('✅ User authenticated:', user.uid);
    
    // Create a simple test blob
    const testData = 'Firebase Storage test';
    const testBlob = new Blob([testData], { type: 'text/plain' });
    
    // Create storage reference
    const testRef = ref(storage, `test/${user.uid}/connection-test-${Date.now()}.txt`);
    console.log('✅ Storage reference created:', testRef.fullPath);
    
    // Upload test file
    console.log('🔄 Uploading test file...');
    const uploadResult = await uploadBytes(testRef, testBlob);
    console.log('✅ Test file uploaded successfully');
    
    // Get download URL
    console.log('🔄 Getting download URL...');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('✅ Download URL obtained:', downloadURL);
    
    console.log('✅ Firebase Storage connection test PASSED');
    return {
      success: true,
      downloadURL,
      message: 'Firebase Storage connection is working correctly'
    };
    
  } catch (error) {
    console.error('❌ Firebase Storage connection test FAILED:', error);
    return {
      success: false,
      error: error.message,
      message: 'Firebase Storage connection failed'
    };
  }
};

/**
 * Test Firebase Storage met image upload
 */
export const testImageUpload = async () => {
  try {
    console.log('🔄 Testing Firebase Storage image upload...');
    
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to test image upload');
    }
    
    // Create a simple 1x1 pixel image blob
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    // Convert canvas to blob
    const imageBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
    
    console.log('✅ Test image blob created:', imageBlob.size, 'bytes');
    
    // Create storage reference
    const imageRef = ref(storage, `test/${user.uid}/image-test-${Date.now()}.jpg`);
    console.log('✅ Image storage reference created:', imageRef.fullPath);
    
    // Upload image
    console.log('🔄 Uploading test image...');
    const uploadResult = await uploadBytes(imageRef, imageBlob, {
      customMetadata: {
        uploadedBy: user.uid,
        type: 'test',
        testUpload: 'true'
      }
    });
    console.log('✅ Test image uploaded successfully');
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('✅ Image download URL obtained:', downloadURL);
    
    console.log('✅ Firebase Storage image upload test PASSED');
    return {
      success: true,
      downloadURL,
      message: 'Firebase Storage image upload is working correctly'
    };
    
  } catch (error) {
    console.error('❌ Firebase Storage image upload test FAILED:', error);
    return {
      success: false,
      error: error.message,
      message: 'Firebase Storage image upload failed'
    };
  }
};