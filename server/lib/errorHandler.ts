import type { Request, Response, NextFunction } from 'express';

/**
 * Catch-all JSON 404 handler for unmatched `/api/*` endpoints so callers
 * never receive Express HTML error pages when parsing JSON.
 */
export function apiNotFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
}

/**
 * Shared Express global error handler. Converts malformed JSON bodies,
 * oversized payloads, and Mongoose cast/validation errors into proper 4xx
 * JSON responses instead of masking them as HTTP 500 errors.
 */
export function apiErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const anyErr = (err && typeof err === 'object' ? err : {}) as {
    name?: string;
    type?: string;
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
  };

  if (
    (err instanceof SyntaxError && (anyErr.status === 400 || 'body' in anyErr)) ||
    anyErr.type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON payload in request body.',
    });
    return;
  }

  if (anyErr.status === 413 || anyErr.statusCode === 413 || anyErr.type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      message: 'Request payload is too large. Maximum allowed size is 10MB.',
    });
    return;
  }

  if (anyErr.name === 'MulterError') {
    const msg =
      anyErr.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file exceeds the maximum allowed size.'
        : anyErr.message || 'File upload failed.';
    res.status(400).json({ success: false, message: msg });
    return;
  }

  if (anyErr.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid identifier format.',
    });
    return;
  }

  if (anyErr.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: anyErr.message || 'Validation failed.',
    });
    return;
  }

  const rawStatus = anyErr.statusCode ?? anyErr.status;
  const status = typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
  const rawMessage = err instanceof Error ? err.message : anyErr.message || 'Internal server error.';
  console.error('[API Error]:', rawMessage);

  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage =
    status < 500
      ? rawMessage
      : isProd
        ? 'Internal server error.'
        : rawMessage || 'Internal server error.';

  res.status(status).json({
    success: false,
    message: safeMessage,
  });
}
