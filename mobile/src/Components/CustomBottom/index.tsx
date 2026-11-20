import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React, {memo, useCallback, useEffect} from 'react';
import {View, Image} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {styles} from './styles';
import {heightPixel, font} from '@Utils/helpers';
import {images} from '@Assets/Images';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import {useAuthMode} from '@Hooks/useAuthMode';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const TAB_ICONS: Record<string, number> = {
  Home: images.icons.home,
  Vessel: images.icons.vessel,
  Safety: images.icons.safety,
  Profile: images.icons.profile,
};

type TabItemProps = {
  labelText: string;
  isFocused: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
};

const TabBarItem = memo(
  ({
    labelText,
    isFocused,
    accessibilityLabel,
    onPress,
    onLongPress,
  }: TabItemProps) => {
    const progress = useSharedValue(isFocused ? 1 : 0);

    useEffect(() => {
      progress.value = withTiming(isFocused ? 1 : 0, {duration: 220});
    }, [isFocused, progress]);

    const barStyle = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{scaleX: 0.4 + progress.value * 0.6}],
    }));

    return (
      <PressableScale
        variant="soft"
        accessibilityRole="button"
        accessibilityState={isFocused ? {selected: true} : {}}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.buttonStyle}>
        <Image
          source={TAB_ICONS[labelText]}
          style={[
            styles.iconStyle,
            isFocused ? styles.iconFocused : styles.iconBlurred,
          ]}
        />
        <AppText style={[ styles.label, isFocused ? styles.labelFocused : styles.labelBlurred, , {fontSize: font(11)}]}>
          {labelText}
        </AppText>
        <Animated.View style={[styles.bar_style, barStyle]} />
      </PressableScale>
    );
  },
);

const CustomBottom = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const {isGuest, promptLogin} = useAuthMode();
  const {bottom} = useSafeAreaInsets();

  const handleGuestGate = useCallback(
    (labelText: string) => {
      if (isGuest && (labelText === 'Vessel' || labelText === 'Profile')) {
        promptLogin();
        return true;
      }
      return false;
    },
    [isGuest, promptLogin],
  );

  return (
    <View
      style={[
        styles.main_style,
        {height: bottom + heightPixel(70), paddingBottom: bottom},
      ]}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;
        const labelText = typeof label === 'string' ? label : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          if (handleGuestGate(labelText)) {
            return;
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarItem
            key={route.key}
            labelText={labelText}
            isFocused={isFocused}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
};

export default memo(CustomBottom);
