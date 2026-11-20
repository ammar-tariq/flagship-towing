import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModal as BottomSheetModalRef,
} from '@gorhom/bottom-sheet';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export type AppBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ImageSourcePropType;
  children: ReactNode;
  /** Snap points, e.g. ['55%'] or ['90%']. Defaults to ['70%']. */
  snapPoints?: Array<string | number>;
  /**
   * @deprecated Prefer snapPoints. Mapped to a content-friendly snap when true.
   */
  dynamicSizing?: boolean;
  /**
   * Use for long lists. Avoids BottomSheetView (which breaks nested scroll)
   * and gives the body a flex height so BottomSheetFlatList can scroll.
   */
  fill?: boolean;
  /** Optional row under the title (search field, etc.). */
  stickyHeader?: ReactNode;
  footer?: ReactNode;
  enablePanDownToClose?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Controlled bottom sheet on @gorhom/bottom-sheet.
 * Mounts only while open, then present().
 */
const AppBottomSheet = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  children,
  snapPoints: snapPointsProp,
  dynamicSizing = false,
  fill = false,
  stickyHeader,
  footer,
  enablePanDownToClose = true,
  contentContainerStyle,
}: AppBottomSheetProps) => {
  if (!visible) {
    return null;
  }

  return (
    <AppBottomSheetOpen
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      snapPointsProp={snapPointsProp}
      dynamicSizing={dynamicSizing}
      fill={fill}
      stickyHeader={stickyHeader}
      footer={footer}
      enablePanDownToClose={enablePanDownToClose}
      contentContainerStyle={contentContainerStyle}>
      {children}
    </AppBottomSheetOpen>
  );
};

type OpenProps = Omit<AppBottomSheetProps, 'visible' | 'snapPoints'> & {
  snapPointsProp?: Array<string | number>;
};

const AppBottomSheetOpen = ({
  onClose,
  title,
  subtitle,
  icon,
  children,
  snapPointsProp,
  dynamicSizing = false,
  fill = false,
  stickyHeader,
  footer,
  enablePanDownToClose = true,
  contentContainerStyle,
}: OpenProps) => {
  const ref = useRef<BottomSheetModalRef>(null);
  const {bottom} = useSafeAreaInsets();

  const snapPoints = useMemo(() => {
    if (snapPointsProp?.length) {
      return snapPointsProp;
    }
    return dynamicSizing ? ['55%'] : ['70%'];
  }, [dynamicSizing, snapPointsProp]);

  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.present();
    }, 0);
    return () => {
      clearTimeout(timer);
      ref.current?.dismiss();
    };
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const header = (
    <View style={styles.header}>
      {icon ? (
        <View style={styles.headerIconWrap}>
          <Image source={icon} style={styles.headerIcon} />
        </View>
      ) : null}
      <View style={styles.headerTitleWrap}>
        <AppText weight="bold" style={[styles.headerTitle, {fontSize: font(18)}]}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={[styles.headerSubtitle, {fontSize: font(12)}]}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <PressableScale
        variant="icon"
        onPress={() => ref.current?.dismiss()}
        style={styles.closeBtn}
        accessibilityRole="button"
        accessibilityLabel="Close">
        <Image source={images.icons.cross} style={styles.closeIcon} />
      </PressableScale>
    </View>
  );

  const footerNode = footer ? (
    <View style={[styles.footer, {paddingBottom: Math.max(bottom, heightPixel(8))}]}>
      {footer}
    </View>
  ) : null;

  /**
   * Long lists: do NOT wrap in BottomSheetView — it fights BottomSheetFlatList
   * gestures and prevents scrolling. Header + list are siblings under the modal.
   */
  if (fill) {
    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={enablePanDownToClose}
        enableContentPanningGesture
        onDismiss={onClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        topInset={heightPixel(48)}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize">
        <View
          style={[
            styles.fillRoot,
            !footer && {paddingBottom: Math.max(bottom, heightPixel(12))},
            contentContainerStyle,
          ]}>
          {header}
          {stickyHeader}
          {children}
          {footerNode}
        </View>
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={enablePanDownToClose}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
      topInset={heightPixel(48)}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <BottomSheetView
        style={[
          styles.sheetInner,
          {paddingBottom: Math.max(bottom, heightPixel(12))},
          contentContainerStyle,
        ]}>
        {header}
        {stickyHeader}
        {children}
        {footerNode}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: heightPixel(22),
    borderTopRightRadius: heightPixel(22),
  },
  handleIndicator: {
    width: widthPixel(40),
    height: heightPixel(4),
    borderRadius: heightPixel(2),
    backgroundColor: colors.offWhite,
  },
  fillRoot: {
    flex: 1,
  },
  sheetInner: {
    paddingTop: heightPixel(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: widthPixel(10),
  },
  headerIconWrap: {
    width: heightPixel(40),
    height: heightPixel(40),
    borderRadius: heightPixel(12),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: heightPixel(20),
    height: heightPixel(20),
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: colors.darkBlack,
  },
  headerSubtitle: {
    color: colors.granite,
    marginTop: heightPixel(2),
  },
  closeBtn: {
    width: heightPixel(36),
    height: heightPixel(36),
    borderRadius: heightPixel(18),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: heightPixel(12),
    height: heightPixel(12),
    resizeMode: 'contain',
    tintColor: colors.darkBlack,
  },
  footer: {
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});

export default memo(AppBottomSheet);

export {
  BottomSheetFlatList as AppBottomSheetFlatList,
  BottomSheetScrollView as AppBottomSheetScrollView,
  BottomSheetTextInput as AppBottomSheetTextInput,
  BottomSheetView as AppBottomSheetView,
};
