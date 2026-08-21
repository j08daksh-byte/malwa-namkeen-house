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
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const folder = getUploadFolder(target);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: customFilename ? customFilename.replace(/\.[^/.]+$/, '') : undefined,
        overwrite: true,
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
  configureCloudinary();
  const folder = getUploadFolder(target);

  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: 'image',
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
 * so foreign assets (e.g. Amaze assets) can NEVER be deleted.
 */
export async function deleteImage(publicId: string): Promise<{ success: boolean; result?: string }> {
  configureCloudinary();
  if (!publicId || !publicId.startsWith('malwa-namkeen-house/')) {
    throw new Error('Deletion restricted: publicId must belong to malwa-namkeen-house namespace.');
  }

  const res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  return {
    success: res.result === 'ok',
    result: res.result,
  };
}

export { cloudinary };
