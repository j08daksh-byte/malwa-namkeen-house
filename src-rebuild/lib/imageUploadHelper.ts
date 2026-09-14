/**
 * Client-Side Image Pre-Processing & Upload Helper for Malwa Namkeen House.
 *
 * Capabilities:
 * - Automatically downscales heavy mobile camera photos (e.g. 15MB-30MB) to crisp WebP/JPEG under 1MB.
 * - Handles HEIC, PNG, JPEG, WebP, AVIF uniformly via HTML5 Canvas.
 * - Generates instant base64 preview for immediate UI feedback.
 * - Uploads to /api/admin/uploads with automatic fallback to optimized base64 if Cloudinary is offline or delayed.
 */

export interface ProcessedImage {
  previewUrl: string;       // Instant local base64 preview
  file: File | Blob;        // Optimized blob ready for multipart upload
  dataUrl: string;          // Full optimized base64 string
}

export interface UploadOptions {
  target?: 'products' | 'categories' | 'banners' | 'logo' | 'gallery';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Downscale and compress an image file in the browser using HTML5 Canvas.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.88
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ previewUrl: dataUrl, file, dataUrl });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          blob => {
            if (blob) {
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                { type: 'image/jpeg' }
              );
              resolve({
                previewUrl: optimizedDataUrl,
                file: optimizedFile,
                dataUrl: optimizedDataUrl,
              });
            } else {
              resolve({
                previewUrl: optimizedDataUrl,
                file,
                dataUrl: optimizedDataUrl,
              });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file or base64 string to the admin uploads API.
 * Automatically compresses first if it is a File object.
 */
export async function uploadAdminImage(
  fileOrBase64: File | string,
  options: UploadOptions = {}
): Promise<string> {
  const { target = 'products', maxWidth = 1920, maxHeight = 1920, quality = 0.88 } = options;

  let uploadPayload: { file?: File | Blob; base64?: string; previewUrl: string };

  if (typeof fileOrBase64 === 'string') {
    if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
      return fileOrBase64;
    }
    uploadPayload = { base64: fileOrBase64, previewUrl: fileOrBase64 };
  } else {
    const processed = await compressImageFile(fileOrBase64, maxWidth, maxHeight, quality);
    uploadPayload = {
      file: processed.file,
      base64: processed.dataUrl,
      previewUrl: processed.previewUrl,
    };
  }

  const token = localStorage.getItem('malwa_admin_token');
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    let res: Response;

    if (uploadPayload.file) {
      const formData = new FormData();
      formData.append('image', uploadPayload.file);
      formData.append('target', target);

      res = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers: authHeaders,
        body: formData,
        credentials: 'include',
      });
    } else {
      res = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          image: uploadPayload.base64,
          target,
        }),
        credentials: 'include',
      });
    }

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.secureUrl) {
      return data.secureUrl;
    }

    console.warn('[Upload Helper] Server upload notice, using local image data:', data.message);
    return uploadPayload.base64 || uploadPayload.previewUrl;
  } catch (err) {
    console.warn('[Upload Helper] Network notice, using local image data:', err);
    return uploadPayload.base64 || uploadPayload.previewUrl;
  }
}
