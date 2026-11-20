export type DeviceLayoutMode = 'phone' | 'landscape' | 'dual';

export type DeviceLayout = {
  mode: DeviceLayoutMode;
  width: number;
  height: number;
  /** Unfolded fold or both Duo screens: menu stays on the left pane. */
  isDual: boolean;
  /** One screen turned sideways: content uses the full width. */
  isLandscape: boolean;
  /** Folded cover, flip closed, or a normal phone. */
  isPhone: boolean;
  /** Width of the persistent side menu. 0 when the menu overlays. */
  drawerWidth: number;
};

const DUAL_MIN_WIDTH = 640;
const DUAL_MIN_HEIGHT = 600;
const LANDSCAPE_MIN_WIDTH = 520;

/** One pane for the menu, at least a phone-width page left for content. */
export const sideMenuWidth = (windowWidth: number): number => {
  const preferred = Math.round(windowWidth * 0.46);
  const maxLeavingContent = windowWidth - 340;
  return Math.round(
    Math.max(300, Math.min(preferred, 420, maxLeavingContent)),
  );
};

export const getDeviceLayout = (width: number, height: number): DeviceLayout => {
  const isDual = width >= DUAL_MIN_WIDTH && height >= DUAL_MIN_HEIGHT;
  const isLandscape =
    !isDual && width > height && width >= LANDSCAPE_MIN_WIDTH;
  const mode: DeviceLayoutMode = isDual
    ? 'dual'
    : isLandscape
      ? 'landscape'
      : 'phone';

  return {
    mode,
    width,
    height,
    isDual,
    isLandscape,
    isPhone: mode === 'phone',
    drawerWidth: isDual ? sideMenuWidth(width) : 0,
  };
};

/**
 * Sign-in and the other auth forms use two panes when the window is wide
 * and short: tablet landscape, a Duo spanned across both screens, and an
 * unfolded foldable turned sideways. A single phone column leaves a blank
 * band on either side and pushes the fields below the fold.
 */
export const usesWideAuthLayout = ({width, height}: DeviceLayout): boolean =>
  width >= 600 && height >= 320 && width > height * 1.05;
