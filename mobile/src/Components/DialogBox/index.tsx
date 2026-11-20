import React, {FC, memo, ReactNode, useEffect, useRef, useState} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {BlurView} from '@react-native-community/blur';
import {styles} from './styles';
import Button from '@Components/Button';
import PressableScale from '@Components/PressableScale';
import {images} from '@Assets/Images';
import {heightPixel, widthPixel} from '@Utils/helpers';
import AppText from '@Components/AppText';
import {colors} from '@Utils/color';

export type DialogBoxProps = {
  visible: boolean;
  button?: {text: string; onPress?: () => void; isLoading?: boolean}[];
  onClose: () => void;
  heading?: string;
  subheading?: string;
  status?: 'correct' | 'warning';
  children?: ReactNode;
};

const ENTER_MS = 220;
const EXIT_MS = 160;
const EASE = Easing.out(Easing.cubic);

const isDestructiveLabel = (text?: string) =>
  /delete|remove|logout|sign out|cancel membership/i.test(text || '');

const isNeutralLabel = (text?: string) =>
  /^(cancel|keep|close|no|dismiss)\b/i.test((text || '').trim());

const DialogBoxComponent: FC<DialogBoxProps> = ({
  visible,
  button = [{text: 'Ok', isLoading: false}],
  onClose,
  heading,
  subheading,
  status = 'correct',
  children,
}) => {
  const [mounted, setMounted] = useState(visible);
  const aliveRef = useRef(true);
  const backdrop = useSharedValue(0);
  const panel = useSharedValue(0);
  const singleAction = button.length === 1;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const hideMounted = () => {
    if (aliveRef.current) {
      setMounted(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (aliveRef.current) {
        setMounted(true);
      }
      backdrop.value = 0;
      panel.value = 0;
      backdrop.value = withTiming(1, {duration: ENTER_MS, easing: EASE});
      panel.value = withTiming(1, {duration: ENTER_MS, easing: EASE});
      return;
    }

    if (!mounted) {
      return;
    }

    backdrop.value = withTiming(0, {duration: EXIT_MS, easing: EASE});
    panel.value = withTiming(0, {duration: EXIT_MS, easing: EASE}, finished => {
      if (finished) {
        runOnJS(hideMounted)();
      }
    });
  }, [visible, mounted, backdrop, panel]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    opacity: panel.value,
    transform: [{scale: 0.96 + panel.value * 0.04}],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      statusBarTranslucent
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={dialogStyles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={6}
              reducedTransparencyFallbackColor="rgba(0,0,0,0.55)"
            />
            <View style={dialogStyles.dim} />
          </Pressable>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={dialogStyles.keyboard}
          pointerEvents="box-none">
        <Animated.View
          style={[styles.modalContainer, panelStyle]}
          pointerEvents="box-none">
          <View style={styles.dialogContainer}>
            <PressableScale
              variant="icon"
              onPress={onClose}
              style={dialogStyles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Image
                source={images.icons.cross}
                style={dialogStyles.closeIcon}
              />
            </PressableScale>

            <Image
              source={
                status == 'warning' ? images.main.warning : images.main.correct
              }
              style={dialogStyles.statusIcon}
            />

            {heading ? (
              <AppText
                weight="bold"
                style={[styles.textStyle, styles.heading_style]}>
                {heading}
              </AppText>
            ) : null}
            {subheading ? (
              <AppText
                weight="medium"
                style={[styles.textStyle, styles.sub_text]}>
                {subheading}
              </AppText>
            ) : null}
            {children ? (
              <View style={dialogStyles.children}>{children}</View>
            ) : null}

            <View style={styles.actions}>
              {button.map((x, i) => {
                const neutral = i === 1 && isNeutralLabel(x.text);
                const destructive =
                  i === 1 && isDestructiveLabel(x.text) && !neutral;
                return (
                  <Button
                    isLoading={x.isLoading}
                    onPress={x.onPress || onClose}
                    secondary={destructive}
                    key={i}
                    style={[
                      styles.actionBtn,
                      singleAction
                        ? styles.actionBtnSingle
                        : styles.actionBtnHalf,
                      neutral && dialogStyles.neutralBtn,
                    ]}
                    text_style={[
                      {lineHeight: heightPixel(20)},
                      neutral && {color: colors.black},
                    ]}
                    text={x.text}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const dialogStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboard: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  children: {
    alignSelf: 'stretch',
    marginTop: heightPixel(12),
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  closeBtn: {
    position: 'absolute',
    top: heightPixel(12),
    right: widthPixel(12),
    width: heightPixel(32),
    height: heightPixel(32),
    borderRadius: heightPixel(16),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeIcon: {
    width: heightPixel(11),
    height: heightPixel(11),
    resizeMode: 'contain',
    tintColor: colors.darkBlack,
  },
  statusIcon: {
    width: heightPixel(72),
    height: heightPixel(72),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: heightPixel(8),
  },
  neutralBtn: {
    backgroundColor: colors.lightGray,
  },
});

export const DialogBox = memo(DialogBoxComponent);
export default DialogBox;
