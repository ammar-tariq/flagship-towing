import {IMAGE_BASE_URL} from '@Api/user';

const hasScheme = (value: string) =>
  /^(https?|file|content|data|ph|assets-library):/i.test(value);

const isDeviceFilePath = (value: string) =>
  value.startsWith('/data/') ||
  value.startsWith('/storage/') ||
  value.startsWith('/var/') ||
  value.startsWith('/private/') ||
  value.startsWith('/Users/') ||
  value.startsWith('/tmp/') ||
  value.startsWith('/Containers/') ||
  /^[A-Za-z]:\//.test(value);

/** Ensure local filesystem paths are loadable by FastImage / RN Image. */
export const ensureLocalFileUri = (uri?: string | null): string => {
  if (!uri) {
    return '';
  }
  const trimmed = uri.trim();
  if (!trimmed) {
    return '';
  }
  if (hasScheme(trimmed)) {
    return trimmed;
  }
  if (isDeviceFilePath(trimmed)) {
    return `file://${trimmed}`;
  }
  // Bare absolute paths that are not public uploads/
  if (trimmed.startsWith('/') && !trimmed.includes('uploads/')) {
    return `file://${trimmed}`;
  }
  return trimmed;
};

/**
 * Resolve API image paths and absolute URLs into a single FastImage-ready URI.
 * Returns null when there is nothing usable to load.
 *
 * Package / profile images are preferably absolute https URLs (same as admin).
 * Relative `uploads/...` paths are prefixed with IMAGE_BASE_URL.
 */
export const resolveImageUrl = (
  pathOrUrl?: string | null,
): string | null => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') {
    return null;
  }

  let trimmed = pathOrUrl.trim().replace(/\\/g, '/');
  if (!trimmed) {
    return null;
  }

  if (hasScheme(trimmed)) {
    // Package images are still stored as absolute URLs on the retired
    // staging host. The files are served from this API under uploads/.
    if (/^https?:/i.test(trimmed)) {
      const uploadsIdx = trimmed.indexOf('uploads/');
      if (uploadsIdx >= 0) {
        const base = IMAGE_BASE_URL.replace(/\/$/, '');
        return `${base}/${trimmed.slice(uploadsIdx)}`;
      }
    }
    return trimmed;
  }

  if (isDeviceFilePath(trimmed)) {
    return `file://${trimmed}`;
  }

  // Absolute disk path → public uploads segment
  const uploadsIdx = trimmed.indexOf('uploads/');
  if (uploadsIdx >= 0) {
    trimmed = trimmed.slice(uploadsIdx);
  }

  const base = IMAGE_BASE_URL.replace(/\/$/, '');
  const path = trimmed.replace(/^\//, '');
  return `${base}/${path}`;
};

/** Content HTML still references the retired staging host for files under uploads/. */
export const rebaseContentHtml = (html: string) => {
  const uploadsBase = `${IMAGE_BASE_URL.replace(/\/$/, '')}/uploads`;
  let next = html.replace(
    /https?:\/\/flagship-towing\.projectstagingzone\.com\/uploads\//gi,
    `${uploadsBase}/`,
  );
  // Relative logos (logo.png) resolve against this even if the WebView drops baseUrl.
  if (!/<base\s/i.test(next)) {
    next = next.replace(/<head[^>]*>/i, match => `${match}<base href="${uploadsBase}/">`);
  }
  return next;
};
