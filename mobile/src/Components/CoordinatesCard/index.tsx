import AppText from '@Components/AppText';
import Row from '@Components/Row';
import PressableScale from '@Components/PressableScale';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {devLog} from '@Utils/devLog';
import React, {memo, useCallback} from 'react';
import {Share, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

type CoordinatesCardProps = {
  latitude: number | null;
  longitude: number | null;
  isLoading?: boolean;
  needsPermission: boolean;
  canOpenSettings: boolean;
  message?: string;
  onRequestPermission: () => void;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** US convention: hemisphere letter instead of a leading minus. */
const formatCardinal = (
  value: number,
  positive: 'N' | 'E',
  negative: 'S' | 'W',
) => {
  const hemisphere = value < 0 ? negative : positive;
  return `${Math.abs(value).toFixed(6)}° ${hemisphere}`;
};

const formatLatitude = (latitude: number) => formatCardinal(latitude, 'N', 'S');

const formatLongitude = (longitude: number) =>
  formatCardinal(longitude, 'E', 'W');

const shareMessage = (latitude: number, longitude: number) =>
  `${formatLatitude(latitude)}, ${formatLongitude(longitude)}`;

const CoordinatesCard = ({
  latitude,
  longitude,
  isLoading,
  needsPermission,
  canOpenSettings,
  message,
  onRequestPermission,
  onRetry,
  style,
}: CoordinatesCardProps) => {
  const hasCoords = latitude != null && longitude != null;

  const handleShare = useCallback(async () => {
    if (latitude == null || longitude == null) {
      return;
    }
    try {
      await Share.share({
        message: shareMessage(latitude, longitude),
        title: 'My location',
      });
    } catch (error) {
      devLog('Share coordinates error ======>' + error);
    }
  }, [latitude, longitude]);

  const permissionActionLabel = needsPermission
    ? canOpenSettings
      ? 'Open Settings'
      : 'Enable Location'
    : 'Try Again';

  return (
    <View style={[styles.section, style]}>
      <AppText weight="bold" style={[styles.sectionTitle, {fontSize: font(18)}]}>
        Your coordinates
      </AppText>
      <View style={styles.card}>
        {!hasCoords ? (
          <>
            <AppText style={[styles.message, {fontSize: font(13)}]}>
              {message ||
                (needsPermission
                  ? 'Enable location so you can share your position with a captain.'
                  : 'Unable to get current location')}
            </AppText>
            <PressableScale
              variant="soft"
              style={styles.actionButton}
              onPress={
                needsPermission ? onRequestPermission : onRetry ?? onRequestPermission
              }>
              <AppText
                weight="semibold"
                style={[styles.actionText, {fontSize: font(14)}]}>
                {isLoading ? 'Locating…' : permissionActionLabel}
              </AppText>
            </PressableScale>
          </>
        ) : (
          <>
            <Row style={styles.metricsRow}>
              <View style={styles.metricCell}>
                <AppText
                  weight="regular"
                  style={[styles.label, {fontSize: font(12)}]}>
                  Latitude
                </AppText>
                <AppText
                  weight="semibold"
                  style={[styles.value, {fontSize: font(13)}]}>
                  {formatLatitude(latitude!)}
                </AppText>
              </View>
              <View style={styles.metricCell}>
                <View style={styles.metricDivider} />
                <AppText
                  weight="regular"
                  style={[styles.label, {fontSize: font(12)}]}>
                  Longitude
                </AppText>
                <AppText
                  weight="semibold"
                  style={[styles.value, {fontSize: font(13)}]}>
                  {formatLongitude(longitude!)}
                </AppText>
              </View>
            </Row>
            <PressableScale
              variant="soft"
              style={styles.actionButton}
              onPress={handleShare}>
              <AppText
                weight="semibold"
                style={[styles.actionText, {fontSize: font(14)}]}>
                Share with captain
              </AppText>
            </PressableScale>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    marginTop: heightPixel(20),
    backgroundColor: colors.white,
  },
  sectionTitle: {
    color: colors.black,
    marginBottom: heightPixel(12),
  },
  card: {
    width: '100%',
    borderRadius: heightPixel(10),
    backgroundColor: colors.lightGray,
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(14),
    overflow: 'hidden',
  },
  metricsRow: {
    marginVertical: 0,
    marginBottom: heightPixel(14),
    alignItems: 'stretch',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: widthPixel(4),
    minHeight: heightPixel(44),
  },
  metricDivider: {
    position: 'absolute',
    left: 0,
    top: heightPixel(2),
    bottom: heightPixel(2),
    width: heightPixel(1),
    backgroundColor: colors.cardSectionBorder,
  },
  label: {
    color: colors.black,
    marginBottom: heightPixel(4),
    textAlign: 'center',
  },
  value: {
    color: colors.black,
    textAlign: 'center',
  },
  message: {
    color: colors.granite,
    marginBottom: heightPixel(12),
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: heightPixel(8),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(10),
  },
  actionText: {
    color: colors.white,
  },
});

export default memo(CoordinatesCard);
