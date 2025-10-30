/**
 * Standardized image handling utilities for CloudTribe application
 * This ensures consistent image URL generation and fallback behavior across all components
 */

export interface ImageItem {
  img?: string;
  category?: string;
  item_name?: string;
  name?: string;
}

/**
 * Gets the appropriate fallback image based on item category
 * @param item - The item to get fallback image for
 * @returns The fallback image path
 */
export const getFallbackImage = (item: ImageItem): string => {
  const category = item.category?.toLowerCase() || '';
  const name = (item.item_name || item.name || '').toLowerCase();

  // Category-based fallback selection
  if (category.includes('茶') || category.includes('飲料') || category.includes('drink') || name.includes('茶') || name.includes('飲料')) {
    return '/fruit1.jpg'; // Use fruit image as fallback for drinks
  } else if (category.includes('水果') || category.includes('fruit') || name.includes('水果') || name.includes('fruit')) {
    return '/fruit1.jpg';
  } else if (category.includes('蔬菜') || category.includes('vegetable') || name.includes('蔬菜') || name.includes('vegetable')) {
    return '/vegetable1.jpg';
  } else if (category.includes('雞') || category.includes('鴨') || category.includes('肉') || category.includes('meat') || 
             name.includes('雞') || name.includes('鴨') || name.includes('肉')) {
    return '/eat.jpg'; // Use food image for meat products
  } else {
    return '/fruit1.jpg'; // Default fallback
  }
};

/**
 * Generates the correct image source URL based on category and image path
 * @param item - The item containing image information
 * @returns The complete image URL
 */
export const getImageSrc = (item: ImageItem): string => {
  // Handle missing or undefined image
  if (!item.img) {
    return getFallbackImage(item);
  }

  const img = item.img;
  const category = item.category || '';

  // Handle different image source types
  if (category === "小木屋鬆餅" || category === "金鮨" || category === "原丼力" || category === "得正" || category === "喜記港式燒臘" || category === "海南雞飯") {
    return `/test/${encodeURIComponent(img)}`; // Local test images
  } else if (img.includes('imgur.com') || img.includes('ibb.co')) {
    return img; // Direct external image URLs
  } else if (img.startsWith('http')) {
    return img; // Any other HTTP URL
  } else if (img.startsWith('/external-image/')) {
    // For Carrefour external images
    return `https://online.carrefour.com.tw${img}`;
  } else if (img.startsWith('/')) {
    // Relative paths - assume CloudTribe images
    return `https://www.cloudtribe.site${img}`;
  } else {
    // Default to CloudTribe base URL
    return `https://www.cloudtribe.site/${img}`;
  }
};

/**
 * Enhanced image source generator with retry logic for different URL formats
 * @param item - The item containing image information
 * @param retryCount - Number of previous failed attempts
 * @returns The image URL to try
 */
export const getImageSrcWithRetry = (item: ImageItem, retryCount: number = 0): string => {
  if (!item.img || retryCount >= 3) {
    return getFallbackImage(item);
  }

  const img = item.img;
  const category = item.category || '';

  // Handle local test images
  if (category === "小木屋鬆餅" || category === "金鮨" || category === "原丼力" || category === "得正" || category === "喜記港式燒臘" || category === "海南雞飯" ) {
    return `/test/${encodeURIComponent(img)}`;
  }

  // Handle direct URLs
  if (img.startsWith('http')) {
    return img;
  }

  // Handle Carrefour images with retry logic
  if (img.startsWith('/external-image/')) {
    const baseUrls = [
      'https://online.carrefour.com.tw',
      'https://www.carrefour.com.tw',
      'https://carrefour.com.tw'
    ];
    
    if (retryCount < baseUrls.length) {
      return `${baseUrls[retryCount]}${img}`;
    } else {
      return getFallbackImage(item);
    }
  }

  // Handle CloudTribe images
  if (retryCount === 0) {
    return `https://www.cloudtribe.site${img.startsWith('/') ? img : '/' + img}`;
  } else {
    return getFallbackImage(item);
  }
};

/**
 * Validates if an image URL is likely to be valid
 * @param url - The image URL to validate
 * @returns Boolean indicating if the URL seems valid
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  return validExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('imgur.com') || 
         lowerUrl.includes('ibb.co') ||
         lowerUrl.includes('cloudtribe.site') ||
         lowerUrl.includes('carrefour.com');
};

/**
 * Available fallback images in the public directory
 */
export const FALLBACK_IMAGES = {
  FRUIT: '/fruit1.jpg',
  VEGETABLE: '/vegetable1.jpg',
  VEGETABLE2: '/vegetable2.jpg',
  FOOD: '/eat.jpg',
  DEFAULT: '/fruit1.jpg'
} as const;
