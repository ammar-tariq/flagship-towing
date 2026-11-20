import {Dimensions, PixelRatio, Platform, StatusBar} from 'react-native';
import {initialWindowMetrics} from 'react-native-safe-area-context';
import dayjs from 'dayjs';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Scale from the phone-sized edges of the window. A normal phone (short side
// ≤ 480, long side ≤ 1200) keeps today's sizes. Unfolded foldables, Duo spans,
// and landscape launches stay capped so a 375-wide design does not inflate
// across two screens or a sideways flip.
const SHORT_SIDE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
const LONG_SIDE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
const layoutWidth = Math.min(SHORT_SIDE, 480);
const layoutHeight = Math.min(LONG_SIDE, 1200);

const widthBaseScale: number = layoutWidth / 375;
const heightBaseScale: number = layoutHeight / 812;

function normalize(size: number, based: 'width' | 'height' = 'width'): number {
  const newSize =
    based === 'height' ? size * heightBaseScale : size * widthBaseScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export const heightPixel = (size: number): number => {
  return normalize(size, 'height');
};

export const widthPixel = (size: number): number => {
  return normalize(size, 'width');
};

export const font = (size: number): number => {
  return heightPixel(size);
};

export const getTimeDifferenceFromNow = (isoDate: string): string => {
  const now = new Date();
  const future = new Date(isoDate);

  const nowUtc = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );

  const futureUtc = future.getTime();
  const diffInSeconds = Math.floor((futureUtc - nowUtc) / 1000);

  if (diffInSeconds <= 0) {
    return 'now';
  }

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / 86400);
  const weeks = Math.floor(diffInSeconds / (86400 * 7));
  const months = Math.floor(diffInSeconds / (86400 * 30));
  const years = Math.floor(diffInSeconds / (86400 * 365));

  if (years >= 1) {
    return `in ${years} year${years > 1 ? 's' : ''}`;
  }
  if (months >= 1) {
    return `in ${months} month${months > 1 ? 's' : ''}`;
  }
  if (weeks >= 1) {
    return `in ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  if (days >= 1) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours >= 1) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes >= 1) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return `in ${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''}`;
};

export const dateFormatter = (secondsFromNow: number) => {
  if (typeof secondsFromNow === 'number') {
    const futureDate = new Date(Date.now() + secondsFromNow * 1000);
    let day: string | number = futureDate.getDate();
    const month = futureDate.getMonth();
    const year = futureDate.getFullYear();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    if (day < 10) {
      day = '0' + day;
    }

    return `${day} ${monthNames[month]} ${year}`;
  }
  return '-';
};

export const STATUSBAR_HEIGHT =
  (Platform.OS === 'ios'
    ? initialWindowMetrics?.insets.top ?? 59
    : StatusBar.currentHeight) || 0;

export const vh = (layoutHeight - STATUSBAR_HEIGHT) * 0.01;
export const vw = layoutWidth * 0.01;

export const dateHelper = (date: any) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDateToMMDDYYYY = (
  isoDate: string | number | Date | null | undefined,
): string => {
  if (!isoDate) {
    return '-';
  }
  return dayjs(isoDate).format('MM-DD-YYYY');
};

export const formatDateToMMDDYYYYWithSlashes = (
  isoDate: string | number | Date | null | undefined,
): string => {
  if (!isoDate) {
    return '-';
  }
  return dayjs(isoDate).format('MM/DD/YYYY');
};
