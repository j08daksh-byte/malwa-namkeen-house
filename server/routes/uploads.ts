import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import {
  uploadImageBuffer,
  uploadImageBase64,
  deleteImage,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type UploadTarget,
} from '../lib/cloudinary.ts';

const router = Router();

// Configure Multer with memory storage and size/MIME filtering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, AVIF, GIF.`));
    }
  },
});

/**
 * POST /api/admin/uploads
 * Protected admin route for uploading product or category images to Cloudinary.
 * Target folder is mapped to malwa-namkeen-house/products or malwa-namkeen-house/categories.
 */
router.post(
  '/',
  requireAdmin,
  (req: Request, res: Response, next) => {
    // If request contains multipart/form-data, process with multer
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      upload.single('image')(req, res, err => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              success: false,
              message: `Image too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
            });
            return;
          }
          res.status(400).json({ success: false, message: err.message });
          return;
        }
        next();
      });
    } else {
      next();
    }
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetParam = (req.body.target || req.query.target || 'products') as UploadTarget;
      const validTargets: UploadTarget[] = ['products', 'categories', 'banners', 'logo', 'gallery'];
      const target: UploadTarget = validTargets.includes(targetParam) ? targetParam : 'products';

      // 1. Handle multipart buffer upload
      if (req.file) {
        const result = await uploadImageBuffer(
          req.file.buffer,
          target,
          req.file.originalname
        );

        res.status(201).json({
          success: true,
          message: 'Image uploaded successfully.',
          ...result,
        });
        return;
      }

      // 2. Handle base64 / data-url upload
      const { image, base64 } = req.body;
      const imageData = image || base64;

      if (!imageData || typeof imageData !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Please provide an image file (multipart/form-data) or a base64 image string.',
        });
        return;
      }

      const result = await uploadImageBase64(imageData, target);

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully.',
        ...result,
      });
    } catch (err: unknown) {
      console.error('[Cloudinary Upload Error]', err instanceof Error ? err.message : err);
      res.status(500).json({
        success: false,
        message: 'Image upload failed. Check Cloudinary credentials and try again.',
      });
    }
  }
);

/**
 * DELETE /api/admin/uploads
 * Protected admin route to delete an asset from malwa-namkeen-house namespace.
 */
router.delete('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const publicId = req.body.publicId || (req.query.publicId as string);

    if (!publicId || typeof publicId !== 'string') {
      res.status(400).json({ success: false, message: 'publicId is required.' });
      return;
    }

    const result = await deleteImage(publicId);

    res.json({
      success: true,
      message: 'Asset removed successfully.',
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, message: msg });
  }
});

export default router;
