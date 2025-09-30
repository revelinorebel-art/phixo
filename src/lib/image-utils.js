// Helper to convert a data URL string to a File object
export const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
};

// Helper to convert File to data URL
export const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Helper to create canvas from image
export const createCanvasFromImage = (image, width, height) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width || image.naturalWidth;
    canvas.height = height || image.naturalHeight;
    
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    return canvas;
};

// Helper to crop image
export const cropImage = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not process the crop.');
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );
    
    return canvas.toDataURL('image/png');
};

// Helper to convert image URL to base64 using proxy server (avoids CORS issues)
export const urlToBase64ViaProxy = async (url) => {
    try {
        const response = await fetch('http://localhost:3001/api/url-to-base64', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: url })
        });

        if (!response.ok) {
            throw new Error(`Failed to convert URL to base64: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
            return result.base64;
        } else {
            throw new Error(result.error || 'Failed to convert URL to base64');
        }
    } catch (error) {
        console.error('Error converting URL to base64 via proxy:', error);
        throw error;
    }
};

// Helper to convert image URL to base64 (fallback method with CORS)
export const urlToBase64 = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            ctx.drawImage(img, 0, 0);
            
            try {
                const dataURL = canvas.toDataURL('image/jpeg', 0.9);
                const base64 = dataURL.split(',')[1];
                resolve(base64);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
};