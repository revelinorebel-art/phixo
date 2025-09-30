import { toast } from '@/components/ui/use-toast';

// Proxy server URL for PHIXO API calls
const PROXY_SERVER_URL = 'http://localhost:3001';

const checkProxyServer = async () => {
  try {
    const response = await fetch(`${PROXY_SERVER_URL}/health`);
    if (!response.ok) {
      throw new Error('Proxy server not responding');
    }
    return true;
  } catch (error) {
    const errorMessage = "PHIXO proxy server is niet beschikbaar. Zorg ervoor dat de server draait op poort 3001.";
    toast({
      title: "Verbindingsfout",
      description: errorMessage,
      variant: "destructive",
    });
    throw new Error(errorMessage);
  }
};

/**
 * Voert een PHIXO bewerking uit via Replicate.com
 * @param {string} prompt - De prompt voor de afbeelding generatie
 * @param {string} aspectRatio - De gewenste aspect ratio (4:3, 16:9, 1:1, etc.)
 * @param {string|Array|File} imageInput - Optionele input afbeelding(en) voor image-to-image transformatie
 * @param {File} objectImage - Optioneel object bestand voor mockup generatie
 * @param {string} resolution - De gewenste resolutie ('1k', '2k', '4k')
 * @returns {Promise<Object>} Het resultaat van de API call
 */
export const performSeedreamGeneration = async (prompt, aspectRatio = '4:3', imageInput = null, objectImage = null, resolution = '1k', retries = 3, originalDimensions = null) => {
  await checkProxyServer();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Starting PHIXO generation (attempt ${attempt}/${retries}) with:`, { prompt, aspectRatio, imageInput, originalDimensions });
      
      // Convert resolution to actual pixel dimensions
      const getResolutionDimensions = (resolution, aspectRatio, originalDimensions = null) => {
        // If aspectRatio is 'original' and we have original dimensions, use them
        if (aspectRatio === 'original' && originalDimensions) {
          const baseResolutions = {
            '1k': 1024,
            '2k': 2048,
            '4k': 4096
          };
          
          const baseSize = baseResolutions[resolution] || 1024;
          const originalAspectValue = originalDimensions.width / originalDimensions.height;
          
          let width, height;
          if (originalAspectValue >= 1) {
            // Landscape or square
            width = baseSize;
            height = Math.round(baseSize / originalAspectValue);
          } else {
            // Portrait
            height = baseSize;
            width = Math.round(baseSize * originalAspectValue);
          }
          
          return { width, height };
        }
        
        // Standard aspect ratio handling
        const baseResolutions = {
          '1k': 1024,
          '2k': 2048,
          '4k': 4096
        };
        
        const baseSize = baseResolutions[resolution] || 1024;
        
        // Calculate dimensions based on aspect ratio
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
        const aspectValue = widthRatio / heightRatio;
        
        let width, height;
        if (aspectValue >= 1) {
          // Landscape or square
          width = baseSize;
          height = Math.round(baseSize / aspectValue);
        } else {
          // Portrait
          height = baseSize;
          width = Math.round(baseSize * aspectValue);
        }
        
        return { width, height };
      };

      const { width, height } = getResolutionDimensions(resolution, aspectRatio, originalDimensions);

      const requestBody = {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        width: width,
        height: height,
        resolution: resolution
      };

      // Add image_input for image-to-image transformation if provided
      if (imageInput) {
        // Handle multiple images (array) or single image
        if (Array.isArray(imageInput)) {
          console.log('Converting multiple File objects to base64 data URLs...');
          const imageInputArray = [];
          
          for (const image of imageInput) {
            if (image instanceof File) {
              const base64DataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(image);
              });
              imageInputArray.push(base64DataUrl);
            } else {
              // If it's already a URL or base64 string, use it directly
              imageInputArray.push(image);
            }
          }
          
          requestBody.image_input = imageInputArray;
          console.log(`Multi-image mode enabled with ${imageInputArray.length} images converted to base64`);
        } else {
          // Single image handling (existing logic)
          if (imageInput instanceof File) {
            console.log('Converting background File object to base64 data URL...');
            const base64DataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(imageInput);
            });
            requestBody.image_input = base64DataUrl;
            console.log('Image-to-image mode enabled with background File object converted to base64');
          } else {
            requestBody.image_input = imageInput;
            console.log('Image-to-image mode enabled with provided URL/data');
          }
        }
      }

      // Add object_image for mockup generation if provided
      if (objectImage && objectImage instanceof File) {
        console.log('Converting object File to base64 data URL for mockup generation...');
        const objectBase64DataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(objectImage);
        });
        requestBody.object_image = objectBase64DataUrl;
        console.log('Mockup mode enabled with object image converted to base64');
      }

      console.log('PHIXO request body:', requestBody);

      // Call the proxy server instead of Replicate directly
      const response = await fetch(`${PROXY_SERVER_URL}/api/seedream-4`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('PHIXO proxy response:', result);
      
      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Unexpected response format from proxy server');
      }
      
      console.log('PHIXO image URL:', result.imageUrl);
      
      return {
        success: true,
        imageUrl: result.imageUrl,
        data: result.data
      };
      
    } catch (error) {
      console.error(`PHIXO API Error (attempt ${attempt}/${retries}):`, error);
      
      // If it's a timeout error and we have retries left, wait and try again
      if (error.message.includes('timeout') || error.message.includes('fetch')) {
        if (attempt < retries) {
          console.log(`Retrying in ${attempt * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
      }
      
      // If it's the last attempt or not a timeout error, throw
      throw new Error(`PHIXO generatie mislukt: ${error.message}`);
    }
  }
};

/**
 * Genereert een categorie-specifieke prompt voor verschillende use cases
 * @param {string} category - De categorie (restaurant, ecommerce, advertentie)
 * @param {string} customPrompt - Aangepaste prompt tekst
 * @returns {string} De gegenereerde prompt
 */
export const generateCategoryPrompt = (category, customPrompt = '') => {
  const categoryPrompts = {
    foodfoto: {
      prefix: "Professional food photography, high-quality, appetizing, perfect lighting, ",
      suffix: ", food styling, restaurant quality, vibrant colors, shallow depth of field, gourmet presentation"
    },
    restaurant: {
      prefix: "Restaurant menu photography, professional lighting, appetizing presentation, ",
      suffix: ", commercial food photography, high-end dining, elegant plating"
    },
    ecommerce: {
      prefix: "Product photography, clean background, professional lighting, commercial quality, ",
      suffix: ", e-commerce ready, high resolution, marketing material"
    },
    advertentie: {
      prefix: "Advertisement photography, eye-catching, professional, marketing quality, ",
      suffix: ", commercial use, brand-focused, high impact visual"
    }
  };

  const categoryConfig = categoryPrompts[category] || categoryPrompts.advertentie;
  
  if (customPrompt.trim()) {
    return `${categoryConfig.prefix}${customPrompt}${categoryConfig.suffix}`;
  }
  
  return `${categoryConfig.prefix}high-quality professional image${categoryConfig.suffix}`;
};

/**
 * Geeft prompt suggesties voor verschillende categorieën
 * @param {string} category - De categorie
 * @returns {Array<string>} Array van prompt suggesties
 */
export const getCategoryPromptSuggestions = (category) => {
  const suggestions = {
    foodfoto: [
      "Gourmet burger with crispy fries and perfect lighting",
      "Fresh sushi platter with wasabi and ginger garnish",
      "Artisanal pizza with melted cheese and fresh basil",
      "Decadent chocolate dessert with berry garnish",
      "Colorful salad bowl with vibrant vegetables and dressing"
    ],

    restaurant: [
      "Gourmet steak with roasted vegetables and wine sauce",
      "Elegant seafood platter with lobster and oysters",
      "Fine dining dessert with chocolate and gold leaf",
      "Chef's special pasta with truffle and herbs",
      "Premium sushi platter with wasabi and ginger"
    ],
    ecommerce: [
      "Modern smartphone on clean white background",
      "Luxury watch with elegant lighting and shadows",
      "Fashion accessories arranged aesthetically",
      "High-tech gadget with professional product lighting",
      "Skincare products with natural lighting setup"
    ],
    advertentie: [
      "Dynamic sports car in urban environment",
      "Happy family enjoying vacation at beach resort",
      "Professional business team in modern office",
      "Luxury lifestyle product in elegant setting",
      "Technology innovation concept with futuristic design"
    ]
  };

  return suggestions[category] || suggestions.advertentie;
};

/**
 * Aspect ratio opties voor verschillende use cases
 */
export const getAspectRatioOptions = () => {
  return [
    { value: 'original', label: 'Origineel formaat - Behoudt originele afmetingen' },
    { value: '1:1', label: 'Vierkant (1:1) - Social Media' },
    { value: '4:3', label: 'Standaard (4:3) - Algemeen gebruik' },
    { value: '16:9', label: 'Widescreen (16:9) - Banners/Headers' },
    { value: '3:4', label: 'Portret (3:4) - Mobiel/Stories' },
    { value: '9:16', label: 'Verticaal (9:16) - TikTok/Reels' }
  ];
};