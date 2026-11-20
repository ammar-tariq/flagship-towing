import {Platform} from 'react-native';
import {API_BASE_URL} from '@Api/baseQuery';
import type {CameraImage} from '@Hooks/useCamera';
import {getAuthToken} from '@Utils/secureToken';
import {store} from '@Store/index';
import {ensureLocalFileUri, resolveImageUrl} from '@Utils/imageUrl';

export type UploadAuthMode = 'public' | 'authenticated';

type UploadResult = {
  path: string;
};

function buildMultipart(image: CameraImage, fieldName: string): FormData {
  const uri = ensureLocalFileUri(image.uri);
  const type = image.type || 'image/jpeg';
  let name = image.name || 'photo.jpg';
  if (!/\.[a-z0-9]+$/i.test(name)) {
    name = `${name}.jpg`;
  }

  // Android FormData is picky about file://; keep scheme on both platforms.
  const fileUri =
    Platform.OS === 'android' && uri.startsWith('/')
      ? `file://${uri}`
      : uri;

  const form = new FormData();
  form.append(fieldName, {
    uri: fileUri,
    type,
    name,
  } as any);
  return form;
}

/**
 * Normalize any upload response into a public https URL for storage + display.
 * Uses the same staging-aware resolution as `resolveImageUrl`.
 */
export function toPublicImageUrl(pathOrUrl?: string | null): string | null {
  return resolveImageUrl(pathOrUrl);
}

async function resolveAccessToken(): Promise<string | null> {
  const fromRedux = store.getState()?.user?.token || null;
  if (fromRedux) {
    return fromRedux;
  }
  return getAuthToken();
}

/**
 * Upload a local image.
 *
 * - `public` → POST /general/upload-signup-image (NO Authorization)
 * - `authenticated` → POST /general/upload-image (Bearer required)
 */
export async function uploadImageFile(
  image: CameraImage,
  mode: UploadAuthMode,
): Promise<UploadResult> {
  if (!image?.uri) {
    throw {status: 400, data: {message: 'No image selected'}};
  }

  const endpoint =
    mode === 'public'
      ? '/general/upload-signup-image'
      : '/general/upload-image';

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (mode === 'authenticated') {
    const token = await resolveAccessToken();
    if (!token) {
      throw {
        status: 401,
        data: {message: 'Please log in again to upload images.'},
      };
    }
    headers.Authorization = `Bearer ${token}`;
  }
  // Intentionally do NOT set Content-Type — RN sets multipart boundary.

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: buildMultipart(image, 'image'),
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      data: json || {message: 'Image upload failed'},
    };
  }

  const rawPath = json?.data?.path;
  const path = toPublicImageUrl(rawPath);
  if (!path) {
    throw {
      status: 500,
      data: {message: 'Upload succeeded but no image path was returned.'},
    };
  }

  return {path};
}
