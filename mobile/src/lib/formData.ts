import type {CameraImage} from '@Hooks/useCamera';
import {toPublicImageUrl} from '@Utils/uploadImage';

/**
 * @deprecated Prefer `uploadImageFile` from `@Utils/uploadImage`.
 * Kept for any remaining call sites that still build FormData manually.
 */
export function buildImageFormData(
  image: CameraImage,
  fieldName = 'image',
): FormData {
  const form = new FormData();
  form.append(fieldName, {
    uri: image.uri,
    type: image.type || 'image/jpeg',
    name: image.name || 'photo.jpg',
  } as any);
  return form;
}

/** @deprecated Use `toPublicImageUrl` — preserves absolute https URLs. */
export function normalizeUploadPath(path?: string | null): string | null {
  return toPublicImageUrl(path);
}
