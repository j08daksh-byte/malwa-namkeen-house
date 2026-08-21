/**
 * Cloudinary URL optimization utility for Malwa Namkeen House.
 * Applies automatic WebP/AVIF format selection (f_auto), automatic visual quality compression (q_auto),
 * and responsive width transformations.
 */

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:good' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'scale' | 'limit' | 'fit';
}

export function optimizeCloudinary(url?: string, options: CloudinaryOptions = {}): string {
  if (!url || typeof url !== 'string') {
    return '/mishtichaat/chaat-plate.jpg';
  }

  // Only apply transformations to Cloudinary media assets
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'limit',
  } = options;

  const transformations: string[] = [`f_${format}`, `q_${quality}`];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop && (width || height)) transformations.push(`c_${crop}`);

  const transformStr = transformations.join(',');

  // Insert transformations immediately after /upload/
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transformStr}/`);
  }

  return url;
}
