import AppText from '@Components/AppText';
import {colors} from '@Utils/color';
import {heightPixel, widthPixel, font} from '@Utils/helpers';
import React, {FC, memo, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View} from 'react-native';
import Animated, {FadeIn} from 'react-native-reanimated';
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import {MarineTideDetail} from '@Hooks/useMarineDetail';

type TideChartProps = {
  tides: MarineTideDetail;
};

const CHART_HEIGHT = heightPixel(180);
const PADDING = {
  top: heightPixel(12),
  right: widthPixel(12),
  bottom: heightPixel(24),
  left: widthPixel(28),
};
const AXIS_HOURS = [6, 12, 18, 24];

const formatAxisHour = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  });

const TideChart: FC<TideChartProps> = ({tides}) => {
  const [chartWidth, setChartWidth] = useState(0);
  const points = tides.chartPoints;

  const onLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  if (!points.length) {
    return (
      <View style={styles.emptyWrap}>
        <AppText style={[styles.emptyText, {fontSize: font(13)}]}>
          Hourly tide data unavailable
        </AppText>
      </View>
    );
  }

  if (!chartWidth) {
    return <View style={styles.measureWrap} onLayout={onLayout} />;
  }

  const plotWidth = Math.max(chartWidth - PADDING.left - PADDING.right, 1);
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const range = tides.chartHigh - tides.chartLow || 1;
  const dayStart = tides.dayStartTimestamp ?? points[0].timestamp;
  const dayEnd =
    tides.dayEndTimestamp ?? dayStart + 24 * 60 * 60 * 1000;
  const timeRange = dayEnd - dayStart || 1;

  const toX = (timestamp: number) =>
    PADDING.left + ((timestamp - dayStart) / timeRange) * plotWidth;
  const toY = (height: number) =>
    PADDING.top + ((tides.chartHigh - height) / range) * plotHeight;

  const linePath = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command}${toX(point.timestamp)},${toY(point.height)}`;
    })
    .join(' ');

  const yTickCount = Math.max(tides.chartHigh - tides.chartLow + 1, 2);
  const yTicks = Array.from({length: yTickCount}, (_, index) => {
    if (yTickCount === 1) {
      return tides.chartHigh;
    }

    return tides.chartHigh - (index * range) / (yTickCount - 1);
  });

  const xLabelPositions = AXIS_HOURS.map(
    hour => (hour * 60 * 60 * 1000) / timeRange,
  );
  const xLabels = AXIS_HOURS.map(hour =>
    formatAxisHour(dayStart + hour * 60 * 60 * 1000),
  );

  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      style={styles.wrap}
      onLayout={onLayout}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Rect
          x={PADDING.left}
          y={PADDING.top}
          width={plotWidth}
          height={plotHeight}
          fill="#EEF0FF"
          rx={heightPixel(8)}
        />

        {yTicks.map((value, index) => {
          const y = toY(value);
          return (
            <Line
              key={`grid-${index}`}
              x1={PADDING.left}
              y1={y}
              x2={PADDING.left + plotWidth}
              y2={y}
              stroke={colors.cardSectionBorder}
              strokeDasharray="4 4"
            />
          );
        })}

        <Path d={linePath} stroke={colors.primary} strokeWidth={2} fill="none" />

        {tides.markers.map(marker => (
          <Circle
            key={`${marker.type}-${marker.timestamp}`}
            cx={toX(marker.timestamp)}
            cy={toY(marker.height)}
            r={heightPixel(8)}
            fill={colors.primary}
          />
        ))}

        {tides.markers.map(marker => (
          <SvgText
            key={`label-${marker.type}-${marker.timestamp}`}
            x={toX(marker.timestamp)}
            y={toY(marker.height) + 4}
            fontSize={10}
            fill={colors.white}
            textAnchor="middle">
            {marker.type}
          </SvgText>
        ))}

        <Line
          x1={toX(tides.currentTimestamp)}
          y1={PADDING.top}
          x2={toX(tides.currentTimestamp)}
          y2={PADDING.top + plotHeight}
          stroke={colors.black}
          strokeDasharray="4 4"
        />

        {yTicks.map((value, index) => (
          <SvgText
            key={`y-${index}`}
            x={PADDING.left - widthPixel(6)}
            y={toY(value) + 4}
            fontSize={9}
            fill={colors.granite}
            textAnchor="end">
            {`${Math.round(value * 10) / 10} ft`}
          </SvgText>
        ))}

        {xLabels.map((label, index) => (
          <SvgText
            key={`${label}-${index}`}
            x={PADDING.left + plotWidth * xLabelPositions[index]}
            y={CHART_HEIGHT - 6}
            fontSize={9}
            fill={colors.granite}
            textAnchor="middle">
            {label}
          </SvgText>
        ))}
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  measureWrap: {
    width: '100%',
    height: CHART_HEIGHT,
  },
  emptyWrap: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.granite,
  },
});

export default memo(TideChart);
