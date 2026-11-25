/**
 * Resolves a stored image path (relative or absolute) to a full URL
 * pointing at the backend's uploads directory or storage bucket.
 */
export function getImageUrl(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '').replace(/\/+$/, '');

  // If it's already a full URL (S3, R2, etc.)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Normalize if pointing to a local dev server that might have a different port
    if (trimmed.includes('localhost')) {
      return trimmed.replace(/^http:\/\/localhost(?::\d+)?/, apiBase);
    }
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // Local uploads directory on the backend server
  if (cleanPath.startsWith('/uploads/')) {
    return `${apiBase}${cleanPath}`;
  }

  // For other relative paths, check if Cloudflare R2 or S3 base is configured
  const s3Base = process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_URL || process.env.NEXT_PUBLIC_S3_BASE_URL;
  if (s3Base) {
    const normalizedBase = s3Base.replace(/\/+$/, '');
    return `${normalizedBase}${cleanPath}`;
  }

  // Prepend the API base URL for relative paths as fallback
  return `${apiBase}${cleanPath}`;
}

/**
 * Safely compresses raster images using the Canvas API.
 * Never fails or rejects: falls back gracefully to the original file.
 * Automatically skips SVG, ICO, and already small files.
 *
 * @param file The original image file
 * @param maxWidth Maximum width of the compressed image
 * @param quality Compression quality (0 to 1)
 * @returns A promise that resolves to the compressed or original File
 */
export const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    // If not in a browser or not a valid file, return as-is
    if (typeof window === 'undefined' || !file || !(file instanceof File)) {
      return resolve(file);
    }

    // Only process raster images
    if (!file.type || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const lowerName = (file.name || '').toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || lowerName.endsWith('.svg');
    const isIco = file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon' || lowerName.endsWith('.ico');

    // Never compress vector SVGs or ICO icons - keep 100% fidelity
    if (isSvg || isIco) {
      return resolve(file);
    }

    // If file is already small (under 300KB), compression is unnecessary
    if (file.size <= 300 * 1024) {
      return resolve(file);
    }

    try {
      // PNG/GIF/WebP may have transparency — preserve format to avoid black background
      const hasTransparency = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp';
      const outputType = hasTransparency ? file.type : 'image/jpeg';

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              let width = img.width;
              let height = img.height;

              if (!width || !height) {
                return resolve(file);
              }

              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                return resolve(file);
              }

              // Fill white background for JPEG
              if (outputType === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
              }

              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (!blob || blob.size >= file.size) {
                    // If compressed blob is empty or larger, preserve original
                    return resolve(file);
                  }
                  const ext = outputType === 'image/png' ? '.png' : outputType === 'image/webp' ? '.webp' : '.jpg';
                  const baseName = file.name.replace(/\.[^.]+$/, '');
                  const compressedFile = new File([blob], baseName + ext, {
                    type: outputType,
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                },
                outputType,
                quality
              );
            } catch {
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
          img.src = event.target?.result as string;
        } catch {
          resolve(file);
        }
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
};
