import Row from '@Components/Row';
import AppText from '@Components/AppText';
import TideChart from '@Components/TideChart';
import {Loader} from '@Components/Loader';
import Button from '@Components/Button';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {heightPixel, widthPixel, font} from '@Utils/helpers';
import {serviceAreaSupportsTides, type ServiceArea} from '@Utils/serviceAreas';
import React, {FC} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {MarineTideDetail} from '@Hooks/useMarineDetail';

type TidesTabProps = {
  tides: MarineTideDetail | null;
  isLoading: boolean;
  selectedServiceArea: ServiceArea | null;
  onChangeLocation?: () => void;
};

const TidesTab: FC<TidesTabProps> = ({
  tides,
  isLoading,
  selectedServiceArea,
  onChangeLocation,
}) => {
  if (isLoading && !tides) {
    return (
      <View style={styles.loadingWrap}>
        <Loader />
      </View>
    );
  }

  if (!tides) {
    const areaName = selectedServiceArea?.name ?? 'this location';
    const supportsTides = serviceAreaSupportsTides(selectedServiceArea);

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Image source={images.icons.ship} style={styles.emptyIcon} />
          </View>
          <AppText weight="bold" style={[styles.emptyTitle, {fontSize: font(18)}]}>
            {supportsTides
              ? 'Tide data unavailable'
              : 'No tides for this area'}
          </AppText>
          <AppText style={[styles.emptyText, {fontSize: font(14)}]}>
            {supportsTides
              ? `We couldn't load tide predictions for ${areaName}. Try another coastal service area.`
              : `${areaName} is inland / freshwater. Choose a coastal service area to view tides.`}
          </AppText>
          {onChangeLocation ? (
            <Button
              text="Choose location"
              onPress={onChangeLocation}
              style={styles.emptyButton}
              size={15}
            />
          ) : null}
        </View>
      </View>
    );
  }

  const chartLow = tides.markers.find(marker => marker.type === 'L');
  const chartHigh = tides.markers.find(marker => marker.type === 'H');

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      <View style={styles.chartCard}>
        <Row justify="space-between" style={styles.chartHeader}>
          <AppText weight="bold" style={[styles.chartTitle, {fontSize: font(14)}]}>
            TIDE CHART
          </AppText>
          <AppText weight="semibold" style={[styles.chartRange, {fontSize: font(12)}]}>
            L: {chartLow ? `${chartLow.height.toFixed(2)} ft` : '-'} H:{' '}
            {chartHigh ? `${chartHigh.height.toFixed(2)} ft` : '-'}
          </AppText>
        </Row>
        {isLoading ? (
          <View style={styles.chartLoader}>
            <Loader />
          </View>
        ) : (
          <TideChart tides={tides} />
        )}
      </View>

      <View style={styles.infoCard}>
        <Row justify="space-between" style={styles.currentRow}>
          <Row style={styles.currentTideRow}>
            <AppText weight="bold" style={[styles.tidesLabel, {fontSize: font(14)}]}>
              TIDES.
            </AppText>
            <AppText weight="bold" style={[styles.currentHeight, {fontSize: font(14)}]}>
              {tides.currentHeight != null
                ? `${tides.currentHeight.toFixed(2)}ft`
                : '-'}
            </AppText>
            <AppText style={[styles.trendIcon, {fontSize: font(14)}]}>
              {tides.currentTrend === 'up' ? '↑' : '↓'}
            </AppText>
          </Row>
          <AppText weight="semibold" style={[styles.moonPhase, {fontSize: font(13)}]}>
            {tides.moonPhase}
          </AppText>
        </Row>

        <Row justify="space-between" style={styles.countdownRow}>
          <View style={styles.countdownItem}>
            <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
              Next High tide
            </AppText>
            <AppText weight="bold" style={[styles.countdownValue, {fontSize: font(16)}]}>
              {tides.nextHighCountdown}
            </AppText>
          </View>
          <View style={styles.countdownItem}>
            <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
              Next Low tide
            </AppText>
            <AppText weight="bold" style={[styles.countdownValue, {fontSize: font(16)}]}>
              {tides.nextLowCountdown}
            </AppText>
          </View>
        </Row>

        <View style={styles.cardDivider} />

        <Row justify="space-between">
          <View style={styles.tideEvent}>
            <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
              High tide
            </AppText>
            <AppText weight="bold" style={[styles.eventTime, {fontSize: font(16)}]}>
              {tides.highTideTime}
            </AppText>
            <AppText style={[styles.eventHeight, {fontSize: font(12)}]}>
              {tides.highTideHeight}
            </AppText>
          </View>
          <View style={styles.tideEvent}>
            <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
              Low tide
            </AppText>
            <AppText weight="bold" style={[styles.eventTime, {fontSize: font(16)}]}>
              {tides.lowTideTime}
            </AppText>
            <AppText style={[styles.eventHeight, {fontSize: font(12)}]}>
              {tides.lowTideHeight}
            </AppText>
          </View>
        </Row>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: heightPixel(20),
  },
  loadingWrap: {
    flex: 1,
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(12),
    padding: widthPixel(16),
    marginBottom: heightPixel(12),
  },
  chartHeader: {
    marginVertical: 0,
    marginBottom: heightPixel(12),
  },
  chartTitle: {
    color: colors.black,
  },
  chartRange: {
    color: colors.black,
  },
  chartLoader: {
    minHeight: heightPixel(180),
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(12),
    padding: widthPixel(16),
  },
  currentRow: {
    marginVertical: 0,
    marginBottom: heightPixel(16),
    alignItems: 'center',
  },
  currentTideRow: {
    marginVertical: 0,
    alignItems: 'center',
  },
  tidesLabel: {
    color: colors.black,
    marginRight: widthPixel(6),
  },
  currentHeight: {
    color: colors.black,
    marginRight: widthPixel(4),
  },
  trendIcon: {
    color: colors.black,
  },
  moonPhase: {
    color: colors.black,
  },
  countdownRow: {
    marginVertical: 0,
    marginBottom: heightPixel(16),
  },
  countdownItem: {
    flex: 1,
  },
  cardLabel: {
    color: colors.granite,
    marginBottom: heightPixel(4),
  },
  countdownValue: {
    color: colors.black,
  },
  cardDivider: {
    height: heightPixel(1),
    backgroundColor: colors.cardSectionBorder,
    marginBottom: heightPixel(16),
  },
  tideEvent: {
    flex: 1,
  },
  eventTime: {
    color: colors.black,
    marginBottom: heightPixel(2),
  },
  eventHeight: {
    color: colors.granite,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: widthPixel(8),
    paddingBottom: heightPixel(40),
  },
  emptyCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: heightPixel(16),
    paddingHorizontal: widthPixel(24),
    paddingVertical: heightPixel(32),
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: heightPixel(72),
    height: heightPixel(72),
    borderRadius: heightPixel(36),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightPixel(16),
  },
  emptyIcon: {
    width: heightPixel(32),
    height: heightPixel(32),
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  emptyTitle: {
    color: colors.black,
    textAlign: 'center',
    marginBottom: heightPixel(8),
  },
  emptyText: {
    color: colors.granite,
    textAlign: 'center',
    lineHeight: font(20),
    marginBottom: heightPixel(20),
  },
  emptyButton: {
    width: '100%',
    marginVertical: 0,
  },
});

export default TidesTab;
