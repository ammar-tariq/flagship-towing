import {Dimensions, PixelRatio, Platform} from 'react-native';

export type DeviceTier = 'high' | 'medium' | 'low';

/**
 * Coarse render-quality bucket for the weather map layers.
 *
 * Kept deliberately simple (no native module): OS version is a good proxy for
 * the GPU/CPU generation on iOS, and API level + screen density is a usable
 * proxy on Android. The wind engine additionally self-adapts at runtime from
 * measured frame times, so this only needs to pick a sensible starting point.
 */
export const getDeviceTier = (): DeviceTier => {
  if (Platform.OS === 'ios') {
    const major = parseInt(String(Platform.Version), 10);
    if (!Number.isFinite(major) || major >= 17) {
      return 'high';
    }
    return major >= 15 ? 'medium' : 'low';
  }

  const api = typeof Platform.Version === 'number' ? Platform.Version : 0;
  const ratio = PixelRatio.get();
  const {width, height} = Dimensions.get('screen');
  const physicalPixels = width * height * ratio * ratio;

  if (api >= 31 && ratio >= 2 && physicalPixels <= 1440 * 3200) {
    return 'high';
  }
  if (api >= 28) {
    return 'medium';
  }
  return 'low';
};

let cachedTier: DeviceTier | null = null;

export const deviceTier = (): DeviceTier => {
  if (!cachedTier) {
    cachedTier = getDeviceTier();
  }
  return cachedTier;
};
