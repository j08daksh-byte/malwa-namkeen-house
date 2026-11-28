import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';

export type UploadTarget = 'products' | 'categories' | 'banners' | 'logo' | 'gallery' | 'general';

/**
 * Configure Cloudinary dynamically using current environment variables.
 */
export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Initial configuration
configureCloudinary();

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
];

export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

/**
 * Resolves Cloudinary folder path.
 * Strictly scopes all uploads under 'malwa-namkeen-house/' namespace.
 */
export function getUploadFolder(target: UploadTarget | string): string {
  if (target === 'categories') {
    return 'malwa-namkeen-house/categories';
  }
  if (target === 'products') {
    return 'malwa-namkeen-house/products';
  }
  if (target === 'banners') {
    return 'malwa-namkeen-house/banners';
  }
  if (target === 'logo') {
    return 'malwa-namkeen-house/logo';
  }
  if (target === 'gallery') {
    return 'malwa-namkeen-house/gallery';
  }
  return `malwa-namkeen-house/${target.replace(/^malwa-namkeen-house\/?/, '')}`;
}

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Upload an image buffer directly to Cloudinary using upload_stream.
 */
export function uploadImageBuffer(
  buffer: Buffer,
  target: UploadTarget | string = 'products',
  customFilename?: string
): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Promise.reject(new Error('Cloudinary credentials are not configured. Upload is unavailable.'));
  }
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const folder = getUploadFolder(target);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const baseName = customFilename
      ? customFilename.replace(/\.[^/.]+$/, '').replace(/[^\w-]/g, '_')
      : 'img';
    const publicId = `${baseName}_${uniqueSuffix}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: publicId,
        overwrite: false,
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload returned empty response.'));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Upload a Base64 data string to Cloudinary.
 */
export async function uploadImageBase64(
  base64Data: string,
  target: UploadTarget | string = 'products'
): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not configured. Upload is unavailable.');
  }
  configureCloudinary();
  const folder = getUploadFolder(target);
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const publicId = `img_${uniqueSuffix}`;

  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: 'image',
    public_id: publicId,
    overwrite: false,
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Delete an image by publicId.
 * SECURITY GUARD: Strictly verifies that the asset begins with 'malwa-namkeen-house/'
 * and contains no path traversal sequences (..), ensuring foreign/external assets can NEVER be deleted.
 */
export async function deleteImage(publicId: string): Promise<{ success: boolean; result?: string }> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not configured. Deletion is unavailable.');
  }
  configureCloudinary();

  if (!publicId || typeof publicId !== 'string') {
    throw new Error('publicId is required.');
  }

  const clean = publicId.trim().replace(/\\/g, '/');

  // Strict namespace boundary & anti-traversal validation
  if (
    !clean.startsWith('malwa-namkeen-house/') ||
    clean.includes('..') ||
    clean.includes('%2e') ||
    clean.includes('%2E') ||
    !/^malwa-namkeen-house\/[a-zA-Z0-9_\-\/]+$/.test(clean)
  ) {
    throw new Error('Deletion restricted: publicId must belong to malwa-namkeen-house namespace.');
  }

  const res = await cloudinary.uploader.destroy(clean, { resource_type: 'image' });
  return {
    success: res.result === 'ok',
    result: res.result,
  };
}

export { cloudinary };
