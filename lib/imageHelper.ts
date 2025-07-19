/**
 * Helper functions for handling image URLs in both development and production environments
 */

/**
 * Convert a database imageUrl to a proper serving URL
 * In development: serve directly from /uploads/
 * In production (Docker): serve through API route /api/uploads/
 */
export function getImageUrl(imageUrl: string | undefined | null): string | null {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }

  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // If it starts with /uploads/, transform it based on environment
  if (imageUrl.startsWith('/uploads/')) {
    // In production (Docker), use API route
    if (process.env.NODE_ENV === 'production') {
      return imageUrl.replace('/uploads/', '/api/uploads/');
    }
    // In development, use direct URL
    return imageUrl;
  }

  // If it doesn't start with /uploads/, assume it needs the prefix
  if (process.env.NODE_ENV === 'production') {
    return `/api/uploads/${imageUrl}`;
  }
  return `/uploads/${imageUrl}`;
}

/**
 * Get image props for use with img elements
 */
export function getImageProps(imageUrl: string | undefined | null, alt: string) {
  const src = getImageUrl(imageUrl);
  
  if (!src) {
    return null;
  }

  return {
    src,
    alt
  };
}