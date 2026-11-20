import {useState} from 'react';
import {Image} from 'react-native-compressor';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  ensureCameraPermission,
  ensurePhotoLibraryPermission,
} from '@Utils/permissions';
import {devLog} from '@Utils/devLog';
import {ensureLocalFileUri} from '@Utils/imageUrl';

export type CameraImage = {
  uri: string;
  type: string;
  name: string;
};

/** Force JPEG so FastImage / web can always display the uploaded file. */
async function toJpegFile(
  uri: string,
  nameHint?: string | null,
): Promise<CameraImage> {
  const compressedUri = await Image.compress(uri, {
    compressionMethod: 'auto',
    maxWidth: 1600,
    quality: 0.8,
    output: 'jpg',
  });
  const localUri = ensureLocalFileUri(compressedUri || uri);
  const base =
    (nameHint || 'photo').replace(/\.[a-z0-9]+$/i, '') || 'photo';
  return {
    uri: localUri,
    type: 'image/jpeg',
    name: `${base}.jpg`,
  };
}

const useCamera = () => {
  const [img, setImg] = useState<CameraImage | undefined>();
  const [isPicking, setIsPicking] = useState(false);

  const openCamera = async () => {
    if (isPicking) {
      return;
    }

    setIsPicking(true);
    try {
      const allowed = await ensureCameraPermission();
      if (!allowed) {
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        // Prefer JPEG from the picker when the platform supports it.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...( {includeExtra: true} as any),
      });

      if (!result.didCancel && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        const jpeg = await toJpegFile(asset.uri, asset.fileName);
        setImg(jpeg);
      }
    } catch (error) {
      devLog('Camera Error ======>' + error);
    } finally {
      setIsPicking(false);
    }
  };

  const openGallery = async () => {
    if (isPicking) {
      return;
    }

    setIsPicking(true);
    try {
      const allowed = await ensurePhotoLibraryPermission();
      if (!allowed) {
        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.didCancel && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        const jpeg = await toJpegFile(asset.uri, asset.fileName);
        setImg(jpeg);
      }
    } catch (error) {
      devLog('Gallery Error ======>' + error);
    } finally {
      setIsPicking(false);
    }
  };

  return {img, setImg, openCamera, openGallery, isPicking};
};

export default useCamera;
