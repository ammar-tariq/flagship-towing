import React, {memo, useCallback, useEffect, useState} from 'react';
import {
  Image as RNImage,
  ImageRequireSource,
  ImageResizeMode,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {colors} from '@Utils/color';
import {resolveImageUrl} from '@Utils/imageUrl';
import {images} from '@Assets/Images';

type CachedImageProps = {
  /** Absolute URL, relative upload path, or local file URI */
  source?: string | null;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  /** Accepted so existing call sites can pass a priority hint. */
  priority?: string;
  /** immutable for static uploads; web when the asset can change (avatars) */
  cache?: 'immutable' | 'web';
  /** Shown when source is missing or fails to load */
  fallback?: ImageRequireSource;
  placeholderColor?: string;
  children?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
};

const isLocalUri = (uri: string) =>
  /^(file|content|ph|assets-library):/i.test(uri);

/**
 * Remote photos use the system image view. FastImage does not paint on the
 * new architecture, which left membership, service, and vessel pictures blank
 * in the 5.0.0 store build.
 */
const CachedImage = ({
  source,
  style,
  resizeMode = 'cover',
  cache = 'immutable',
  fallback = images.main.placeholder,
  placeholderColor = colors.lightGray,
  children,
  onLoad,
  onError,
}: CachedImageProps) => {
  const uri = resolveImageUrl(source);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setFailed(true);
    onError?.();
  }, [onError]);

  const showFallback = !uri || failed;
  const local = Boolean(uri && isLocalUri(uri));

  return (
    <View
      style={[
        styles.wrap,
        {backgroundColor: placeholderColor},
        style,
      ]}>
      {showFallback ? (
        <RNImage
          source={fallback}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <RNImage
          key={uri!}
          source={
            local
              ? {uri: uri!}
              : {uri: uri!, cache: cache === 'web' ? 'default' : 'force-cache'}
          }
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {children ? (
        <View style={styles.overlay} pointerEvents="box-none">
          {children}
        </View>
      ) : null}
    </View>
  );
};

export const preloadImages = (
  pathsOrUrls: Array<string | null | undefined>,
) => {
  pathsOrUrls
    .map(resolveImageUrl)
    .filter((uri): uri is string => Boolean(uri))
    .filter(uri => !isLocalUri(uri))
    .forEach(uri => {
      RNImage.prefetch(uri).catch(() => {});
    });
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  // Must sit above the image (absoluteFill) so gradient + title remain visible.
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    elevation: 1,
  },
});

export default memo(CachedImage);
