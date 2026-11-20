import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {getDeviceLayout, type DeviceLayout} from '@Lib/deviceLayout';

const DeviceLayoutContext = createContext<DeviceLayout | null>(null);

type DeviceLayoutProviderProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const sameSize = (
  current: {width: number; height: number} | null,
  width: number,
  height: number,
) =>
  !!current &&
  Math.abs(current.width - width) < 1 &&
  Math.abs(current.height - height) < 1;

/**
 * Folding resizes the native window without always emitting a Dimensions
 * event, so a launch-time size would stick: the cover keeps a dead menu
 * column, and opening the fold only stretches the phone layout.
 * onLayout and measure() follow the view the user is actually looking at.
 */
export function DeviceLayoutProvider({
  children,
  style,
}: DeviceLayoutProviderProps) {
  const window = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const viewSizeSeen = useRef(false);
  const [measured, setMeasured] = useState<{width: number; height: number} | null>(
    null,
  );

  const commitSize = useCallback((width: number, height: number, fromView: boolean) => {
    if (width < 1 || height < 1) {
      return;
    }
    // A late Dimensions event still reports the size from launch. Once the
    // view has been measured, only the view can move the layout.
    if (!fromView && viewSizeSeen.current) {
      return;
    }
    if (fromView) {
      viewSizeSeen.current = true;
    }
    setMeasured(current =>
      sameSize(current, width, height) ? current : {width, height},
    );
  }, []);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const {width, height} = event.nativeEvent.layout;
      commitSize(width, height, true);
    },
    [commitSize],
  );

  useEffect(() => {
    commitSize(window.width, window.height, false);
  }, [commitSize, window.width, window.height]);

  useEffect(() => {
    const readView = () => {
      rootRef.current?.measure((_x, _y, width, height) => {
        commitSize(width, height, true);
      });
    };
    readView();
    const timer = setInterval(readView, 350);
    const subscription = Dimensions.addEventListener('change', ({window: next}) => {
      commitSize(next.width, next.height, false);
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [commitSize]);

  const width = measured?.width ?? window.width;
  const height = measured?.height ?? window.height;
  const layout = useMemo(
    () => getDeviceLayout(width, height),
    [width, height],
  );

  return (
    <DeviceLayoutContext.Provider value={layout}>
      <View
        ref={rootRef}
        collapsable={false}
        style={[styles.fill, style]}
        onLayout={onLayout}>
        {children}
      </View>
    </DeviceLayoutContext.Provider>
  );
}

export const useDeviceLayout = (): DeviceLayout => {
  const layout = useContext(DeviceLayoutContext);
  const window = useWindowDimensions();
  const fallback = useMemo(
    () => getDeviceLayout(window.width, window.height),
    [window.width, window.height],
  );
  return layout ?? fallback;
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
