import React, {memo} from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type PressVariant = 'card' | 'icon' | 'soft';

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: PressVariant;
};

const VARIANT = {
  card: {scale: 0.98, y: 1.25},
  soft: {scale: 0.97, y: 1},
  icon: {scale: 0.86, y: 0},
} as const;

const PRESS_IN_MS = 90;
const PRESS_OUT_MS = 160;
const EASE = Easing.out(Easing.cubic);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PressableScale = ({
  children,
  style,
  variant = 'card',
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) => {
  const pressed = useSharedValue(0);
  const config = VARIANT[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: 1 - pressed.value * (1 - config.scale)},
      {translateY: pressed.value * config.y},
    ],
  }));

  const setPressed = (next: number) => {
    pressed.value = withTiming(next, {
      duration: next ? PRESS_IN_MS : PRESS_OUT_MS,
      easing: EASE,
    });
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      android_ripple={null}
      onPressIn={e => {
        if (!disabled) {
          setPressed(1);
        }
        onPressIn?.(e);
      }}
      onPressOut={e => {
        setPressed(0);
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
};

export default memo(PressableScale);
