// Simple Express proxy server for Replicate API
import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

// Increase payload limit for base64 images (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Replicate with environment variable
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Test Replicate connectivity on startup
async function testReplicateConnection() {
  try {
    console.log('🔍 Testing Replicate API connectivity...');
    // Try to list models to test connection
    await replicate.models.list({ limit: 1 });
    console.log('✅ Replicate API connection successful');
    return true;
  } catch (error) {
    console.error('❌ Replicate API connection failed:', error.message);
    if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Network connectivity issue detected. Please check your internet connection.');
    } else if (error.message.includes('401') || error.message.includes('authentication')) {
      console.error('🔑 Authentication issue. Please check your REPLICATE_API_TOKEN.');
    }
    return false;
  }
}

// Proxy endpoint for Nano Banana
app.post('/api/nano-banana', async (req, res) => {
  try {
    console.log('Received nano-banana request:', req.body);
    
    const { prompt, image_input, output_format = 'jpg', hotspot } = req.body;
    
    if (!prompt || !image_input) {
      return res.status(400).json({ 
        error: 'Missing required fields: prompt and image_input' 
      });
    }
    
    // Process image_input to handle different formats and convert local URLs to base64
    const processedImageInput = Array.isArray(image_input) ? image_input : [image_input];
    const validImageInputs = [];
    
    for (const imageUrl of processedImageInput) {
      if (typeof imageUrl !== 'string') {
        return res.status(400).json({ 
          error: 'image_input must contain valid strings' 
        });
      }
      
      // Check if it's a blob URL (not supported by Replicate)
      if (imageUrl.startsWith('blob:')) {
        return res.status(400).json({ 
          error: 'Blob URLs are not supported. Please send base64 data or valid HTTP URLs.' 
        });
      }
      
      // Check if it's already base64 data (allow it)
      if (imageUrl.startsWith('data:')) {
        console.log('✅ Image is already base64 data');
        validImageInputs.push(imageUrl);
        continue;
      }
      
      // Check if it's our local temp image URL - convert to base64
      if (imageUrl.startsWith(`http://localhost:${PORT}/temp-images/`)) {
        console.log('🔄 Converting local temp image to base64:', imageUrl);
        
        // Extract image ID from URL
        const imageId = imageUrl.split('/temp-images/')[1];
        
        if (!global.tempImages || !global.tempImages.has(imageId)) {
          return res.status(400).json({
            error: `Temporary image not found: ${imageId}`
          });
        }
        
        const imageData = global.tempImages.get(imageId);
        
        // Convert to base64 data URL
        const base64DataUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
        validImageInputs.push(base64DataUrl);
        console.log('✅ Converted to base64 data URL for Replicate API');
        continue;
      }
      
      // Must be a valid HTTP URL or Replicate URL for external images
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && 
          !imageUrl.includes('replicate.delivery') && !imageUrl.startsWith('replicate://')) {
        console.log('⚠️ Ongeldige URL-indeling gedetecteerd:', imageUrl.substring(0, 100) + '...');
        try {
          // Controleer of het een base64 string is (met of zonder prefix)
          if (imageUrl.includes('/9j/') || 
              imageUrl.includes('AAAA') || 
              imageUrl.match(/[A-Za-z0-9+/=]{100,}/) ||
              imageUrl.includes('iVBOR')) {
            
            // Dit lijkt een base64 string te zijn zonder het data: prefix
            console.log('🔄 Herstellen van base64 string zonder prefix...');
            
            // Verwijder eventuele niet-base64 karakters aan het begin
            let cleanBase64 = imageUrl;
            const base64Start = cleanBase64.search(/[A-Za-z0-9+/=]{100,}/);
            
            if (base64Start > 0) {
              cleanBase64 = cleanBase64.substring(base64Start);
            }
            
            // Bepaal het juiste MIME-type op basis van de eerste karakters
            let mimeType = 'image/jpeg';
            if (cleanBase64.startsWith('iVBOR')) {
              mimeType = 'image/png';
            } else if (cleanBase64.startsWith('R0lGOD')) {
              mimeType = 'image/gif';
            } else if (cleanBase64.startsWith('UklGR')) {
              mimeType = 'image/webp';
            }
            
            const fixedUrl = `data:${mimeType};base64,${cleanBase64}`;
            console.log('✅ Base64 hersteld met MIME-type:', mimeType);
            validImageInputs.push(fixedUrl);
            continue;
          } else {
            // Probeer de URL te herstellen als deze beschadigd is
            const fixedUrl = imageUrl.replace(/^[^h]+http/, 'http');
            if (fixedUrl.startsWith('http')) {
              console.log('🔄 URL hersteld naar:', fixedUrl);
              validImageInputs.push(fixedUrl);
              continue;
            }
          }
          
          // Als laatste redmiddel, probeer het als data URL te behandelen
          console.log('🔄 Proberen als data URL te behandelen...');
          validImageInputs.push(`data:image/jpeg;base64,${Buffer.from(imageUrl).toString('base64')}`);
          continue;
          
        } catch (e) {
          console.error('Fout bij herstellen van URL:', e);
        }
        
        return res.status(400).json({ 
          error: `Invalid image URL format: ${imageUrl.substring(0, 50)}... Must be a valid HTTP/HTTPS URL, Replicate URL, or base64 data.` 
        });
      }
      
      validImageInputs.push(imageUrl);
    }
    
    const input = {
      prompt,
      image_input: validImageInputs,
      output_format,
      // Bypass content filtering by setting safety_mode to "disabled"
      safety_mode: "disabled"
    };
    
    // Add hotspot coordinates if provided
    if (hotspot && typeof hotspot.x === 'number' && typeof hotspot.y === 'number') {
      console.log('Adding hotspot coordinates to Replicate input:', hotspot);
      // Note: Nano Banana doesn't directly support hotspot coordinates in the API
      // We don't modify the prompt here because it's already enhanced in useNanoBanana.js
      // This prevents duplicate instructions in the prompt
    }
    
    console.log('Calling Replicate with processed input:', input);
    
    const output = await replicate.run("google/nano-banana", { 
      input,
      wait: { interval: 1000, maxAttempts: 60 }
    });
    
    console.log('Replicate output:', output);
    
    // Handle different output formats and convert to string URL
    let imageUrl;
    if (typeof output === 'string') {
      imageUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      imageUrl = typeof output[0] === 'string' ? output[0] : output[0].toString();
    } else if (output && typeof output.url === 'function') {
      const urlObject = output.url();
      imageUrl = urlObject.toString();
    } else if (output && typeof output === 'object' && output.url) {
      imageUrl = typeof output.url === 'string' ? output.url : output.url.toString();
    } else {
      throw new Error('Unexpected output format from Nano Banana API');
    }
    
    console.log('Final image URL:', imageUrl);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      data: output
    });
    
  } catch (error) {
    console.error('Nano Banana API Error:', error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    // Handle specific Gemini Flash IMAGE_SAFETY errors
    if (error.message.includes('IMAGE_SAFETY') || error.message.includes('finishReason')) {
      errorMessage = 'De afbeelding werd geweigerd door Gemini Flash vanwege veiligheidsfilters. Dit kan gebeuren bij AI-gegenereerde content. Probeer een andere prompt of afbeelding.';
      statusCode = 422; // Unprocessable Entity
    } else if (error.message.includes('No image content found in response')) {
      errorMessage = 'Gemini Flash kon geen afbeelding genereren. Dit kan door veiligheidsfilters komen. Probeer een andere prompt.';
      statusCode = 422;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'De bewerking duurde te lang. Probeer het opnieuw.';
      statusCode = 408;
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Netwerkconnectiviteitsprobleem. Controleer je internetverbinding.';
      statusCode = 503;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      originalError: error.message // Keep for debugging
    });
  }
});

// Helper function to process image URLs
async function processImageUrl(imageUrl, res) {
  if (typeof imageUrl !== 'string') {
    res.status(400).json({ 
      error: 'Image input must be a valid string' 
    });
    return null;
  }
  
  // Check if it's a blob URL (not supported by Replicate)
  if (imageUrl.startsWith('blob:')) {
    res.status(400).json({ 
      error: 'Blob URLs are not supported. Please send base64 data or valid HTTP URLs.' 
    });
    return null;
  }
  
  // Check if it's already base64 data (allow it)
  if (imageUrl.startsWith('data:')) {
    console.log('✅ Image is already base64 data');
    return imageUrl;
  }
  
  // Check if it's our local temp image URL - convert to base64
  if (imageUrl.startsWith(`http://localhost:${PORT}/temp-images/`)) {
    console.log('🔄 Converting local temp image to base64:', imageUrl);
    
    // Extract image ID from URL
    const imageId = imageUrl.split('/temp-images/')[1];
    
    if (!global.tempImages || !global.tempImages.has(imageId)) {
      res.status(400).json({
        error: `Temporary image not found: ${imageId}`
      });
      return null;
    }
    
    const imageData = global.tempImages.get(imageId);
    
    // Convert to base64 data URL
    const base64DataUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
    console.log('✅ Converted to base64 data URL for Replicate API');
    return base64DataUrl;
  }
  
  // For other HTTP URLs, pass them through
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('✅ Using external HTTP URL:', imageUrl);
    return imageUrl;
  }
  
  res.status(400).json({ 
    error: `Unsupported image URL format: ${imageUrl}` 
  });
  return null;
}

// Proxy endpoint for Seedream-4
app.post('/api/seedream-4', async (req, res) => {
  try {
    console.log('Received seedream-4 request:', req.body);
    
    const { prompt, aspect_ratio = '4:3', image_input, object_image } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }

    // Map aspect ratio values to Seedream-4 API compatible values
    const aspectRatioMapping = {
      'original': 'match_input_image',
      '1:1': '1:1',
      '4:3': '4:3', 
      '3:4': '3:4',
      '16:9': '16:9',
      '9:16': '9:16',
      '3:2': '3:2',
      '2:3': '2:3',
      '21:9': '21:9'
    };

    const mappedAspectRatio = aspectRatioMapping[aspect_ratio] || aspect_ratio;
    console.log(`Aspect ratio mapping: ${aspect_ratio} -> ${mappedAspectRatio}`);

    const input = {
      prompt,
      aspect_ratio: mappedAspectRatio
    };

    // Process all image inputs (background and object) for multi-reference generation
    const allImageInputs = [];
    let hasError = false;
    
    // Add background image(s) if provided
    if (image_input) {
      console.log('Processing background image_input for Seedream-4...');
      const processedImageInput = Array.isArray(image_input) ? image_input : [image_input];
      
      for (const imageUrl of processedImageInput) {
        const processedUrl = await processImageUrl(imageUrl, res);
        if (processedUrl === null) {
          hasError = true;
          break;
        }
        if (processedUrl) {
          allImageInputs.push(processedUrl);
        }
      }
    }
    
    // Add object image if provided (for mockup generation)
    if (!hasError && object_image) {
      console.log('Processing object_image for mockup generation...');
      const processedObjectUrl = await processImageUrl(object_image, res);
      if (processedObjectUrl === null) {
        hasError = true;
      } else if (processedObjectUrl) {
        allImageInputs.push(processedObjectUrl);
        console.log('✅ Object image added for mockup generation');
      }
    }
    
    // Return early if there was an error processing images
    if (hasError) {
      return;
    }
    
    // Set image_input if we have any images
    if (allImageInputs.length > 0) {
      input.image_input = allImageInputs;
      console.log('Multi-reference mode enabled with', allImageInputs.length, 'processed image(s)');
    }

    console.log('Calling Replicate Seedream-4 with input:', input);
    
    const output = await replicate.run("bytedance/seedream-4", { 
      input,
      wait: { interval: 1000, maxAttempts: 60 }
    });
    
    console.log('Replicate output:', output);
    
    // Seedream-4 specific output handling according to official docs
    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error('No output received from Seedream-4');
    }
    
    // According to Replicate docs: output[0].url() for Seedream-4
    const replicateImageUrl = output[0].url();
    
    console.log('Original Replicate image URL:', replicateImageUrl);
    
    // Download the image and serve it via our proxy to avoid CORS issues
    try {
      console.log('🔄 Downloading image from Replicate to serve via proxy...');
      const imageResponse = await fetch(replicateImageUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Data = Buffer.from(imageBuffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // Store the image temporarily
      const imageId = Date.now() + '_seedream_' + Math.random().toString(36).substr(2, 9);
      const proxyImageUrl = `http://localhost:3001/temp-images/${imageId}`;
      
      if (!global.tempImages) {
        global.tempImages = new Map();
      }
      
      global.tempImages.set(imageId, {
        data: base64Data,
        mimeType: contentType,
        fileName: 'seedream-generated-image',
        uploadTime: Date.now()
      });
      
      console.log('✅ Image downloaded and stored via proxy:', proxyImageUrl);
      
      res.json({
        success: true,
        imageUrl: proxyImageUrl,
        originalUrl: replicateImageUrl,
        data: output
      });
      
    } catch (downloadError) {
      console.error('❌ Failed to download image from Replicate:', downloadError);
      // Fallback to original URL if download fails
      res.json({
        success: true,
        imageUrl: replicateImageUrl,
        data: output,
        warning: 'Image served directly from Replicate (may have CORS issues)'
      });
    }
    
  } catch (error) {
    console.error('Seedream-4 API Error:', error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    // Provide more specific error messages
    if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Netwerkconnectiviteitsprobleem. Controleer je internetverbinding.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('401') || error.message.includes('authentication')) {
      errorMessage = 'API authenticatie mislukt. Controleer de API-sleutel.';
      statusCode = 401;
    } else if (error.message.includes('429')) {
      errorMessage = 'Te veel verzoeken. Probeer het later opnieuw.';
      statusCode = 429;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Verzoek time-out. Probeer het opnieuw.';
      statusCode = 408;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      originalError: error.message // Keep original for debugging
    });
  }
});

// Google Imagen-4 endpoint
app.post('/api/imagen4-generate', async (req, res) => {
  try {
    console.log('Received Google Imagen-4 request:', req.body);
    
    const { prompt, aspectRatio = '1:1' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }
    
    console.log('🎨 Generating image with Google Imagen-4...');
    console.log('Prompt:', prompt);
    console.log('Aspect Ratio:', aspectRatio);
    
    // Use Google Imagen-4 via Replicate
    const output = await replicate.run(
      "google/imagen-4",
      {
        input: {
          prompt,
          aspect_ratio: aspectRatio || "1:1",
          safety_filter_level: "block_medium_and_above"
        },
        wait: { interval: 1000, maxAttempts: 60 }
      }
    );
    
    console.log('✅ Google Imagen-4 generation completed');
    console.log('Raw output:', output);
    
    // Handle the output - Google Imagen-4 returns a file object
    let imageUrl;
    if (output && typeof output.url === 'function') {
      imageUrl = output.url();
    } else if (output && output.url) {
      imageUrl = output.url;
    } else if (Array.isArray(output) && output.length > 0) {
      const firstOutput = output[0];
      if (firstOutput && typeof firstOutput.url === 'function') {
        imageUrl = firstOutput.url();
      } else if (firstOutput && firstOutput.url) {
        imageUrl = firstOutput.url;
      } else if (typeof firstOutput === 'string') {
        imageUrl = firstOutput;
      }
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else {
      console.error('Unexpected output format:', output);
      throw new Error('Geen geldig afbeeldingsresultaat ontvangen van Google Imagen-4');
    }
    
    if (!imageUrl) {
      throw new Error('Geen geldig afbeeldingsresultaat ontvangen van Google Imagen-4');
    }
    
    console.log('Generated image URL:', imageUrl);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      model: 'google/imagen-4',
      prompt: prompt,
      aspectRatio: aspectRatio
    });
    
  } catch (error) {
    console.error('❌ Google Imagen-4 Error:', error);
    
    let errorMessage = error.message || 'Unknown error occurred';
    let statusCode = 500;
    
    // Handle specific error types
    if (error.message.includes('SAFETY') || error.message.includes('safety')) {
      errorMessage = 'Prompt rejected by Google Imagen-4 safety filters. Please try a different description.';
      statusCode = 400;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
      statusCode = 408;
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('authentication') || error.message.includes('401')) {
      errorMessage = 'Authentication failed. Please check API credentials.';
      statusCode = 401;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      model: 'google/imagen-4'
    });
  }
});

// Image upload endpoint for converting base64 to accessible URLs
app.post('/api/upload-image', async (req, res) => {
  try {
    console.log('📤 Image upload request received');
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Body keys:', Object.keys(req.body || {}));
    
    const { imageData, fileName } = req.body;
    
    if (!imageData) {
      console.error('❌ No image data provided');
      return res.status(400).json({ 
        success: false, 
        error: 'No image data provided' 
      });
    }

    console.log('📊 Image data length:', imageData.length);
    console.log('📊 Image data preview:', imageData.substring(0, 50) + '...');

    // Validate base64 data
    if (!imageData.startsWith('data:image/')) {
      console.error('❌ Invalid image data format');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid image data format. Expected base64 data URL.' 
      });
    }
    
    // Extract base64 data and mime type
    let base64Data, mimeType;
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        console.error('❌ Invalid base64 data format');
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid base64 data format' 
        });
      }
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Image data must be base64 encoded' 
      });
    }
    
    console.log('📷 MIME type:', mimeType);
    console.log('📷 Base64 data length:', base64Data.length);
    
    // For now, we'll use a simple temporary storage approach
    // In production, you'd upload to a proper cloud storage service
    const imageId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const imageUrl = `http://localhost:3001/temp-images/${imageId}`;
    
    // Store the image data temporarily (in memory for this demo)
    if (!global.tempImages) {
      global.tempImages = new Map();
    }
    
    global.tempImages.set(imageId, {
      data: base64Data,
      mimeType: mimeType,
      fileName: fileName || 'uploaded-image',
      uploadTime: Date.now()
    });
    
    console.log('✅ Image uploaded successfully:', imageUrl);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      imageId: imageId
    });
    
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during image upload: ' + error.message
    });
  }
});

// Serve temporary images
app.get('/temp-images/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    
    if (!global.tempImages || !global.tempImages.has(imageId)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageData = global.tempImages.get(imageId);
    const buffer = Buffer.from(imageData.data, 'base64');
    
    res.set({
      'Content-Type': imageData.mimeType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Error serving temp image:', error);
    res.status(500).json({ error: 'Error serving image' });
  }
});

// URL to base64 conversion endpoint
app.post('/api/url-to-base64', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing imageUrl parameter' 
      });
    }

    console.log('Converting URL to base64:', imageUrl);

    // If it's already a data URL, extract the base64 part
    if (imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1];
      return res.json({ 
        success: true, 
        base64: base64 
      });
    }

    // For external URLs, fetch and convert to base64
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    console.log('Successfully converted URL to base64');
    
    res.json({ 
      success: true, 
      base64: base64 
    });

  } catch (error) {
    console.error('Error converting URL to base64:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to convert URL to base64' 
    });
  }
});

// Download image endpoint to avoid CORS issues
app.get('/download-image', async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log('🔽 Downloading image:', url);
    
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Convert response to buffer
    const buffer = await response.buffer();
    
    // Get the content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Determine file extension from content type
    let fileExtension = '.jpg';
    if (contentType.includes('png')) fileExtension = '.png';
    else if (contentType.includes('gif')) fileExtension = '.gif';
    else if (contentType.includes('webp')) fileExtension = '.webp';
    
    // Ensure filename has correct extension
    const finalFilename = filename || `download${fileExtension}`;
    
    console.log(`✅ Image downloaded successfully: ${buffer.length} bytes, type: ${contentType}`);
    
    // Set headers to force download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send the buffer
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to download image' 
    });
  }
});

// Fetch image endpoint for handling CORS issues (especially Firebase Storage)
app.get('/api/fetch-image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log('🔄 Fetching image via proxy:', url);
    
    // Fetch the image
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Get the content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Convert response to buffer
    const buffer = await response.buffer();
    
    console.log(`✅ Image fetched successfully: ${buffer.length} bytes, type: ${contentType}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the buffer
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Fetch image error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch image' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nano Banana proxy server is running' });
});

app.listen(PORT, async () => {
  console.log(`🍌 Nano Banana proxy server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/nano-banana`);
  
  // Test Replicate connection
  await testReplicateConnection();
});