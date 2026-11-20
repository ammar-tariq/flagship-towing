import React, {memo, useCallback} from 'react';
import {Image, ImageSourcePropType, View} from 'react-native';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import AppBottomSheet, {
  AppBottomSheetScrollView,
} from '@Components/AppBottomSheet';
import {images} from '@Assets/Images';
import {sheetStyles as styles} from './styles';
import {font} from '@Utils/helpers';

export type ActionSheetItem = {
  label: string;
  icon?: ImageSourcePropType;
  danger?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ImageSourcePropType;
  actions: ActionSheetItem[];
};

const ActionSheet = ({
  visible,
  onClose,
  title,
  subtitle,
  icon = images.icons.menu,
  actions,
}: ActionSheetProps) => {
  const handlePress = useCallback(
    (action: ActionSheetItem) => {
      onClose();
      requestAnimationFrame(() => action.onPress());
    },
    [onClose],
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      dynamicSizing>
      <AppBottomSheetScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {actions.map(action => (
          <PressableScale
            key={action.label}
            variant="soft"
            onPress={() => handlePress(action)}
            style={[
              styles.optionRow,
              action.danger && styles.actionRowDanger,
            ]}>
            <View
              style={[
                styles.optionLeading,
                action.danger && styles.menuIconWrapDanger,
              ]}>
              <Image
                source={action.icon ?? images.icons.forward}
                style={[
                  styles.optionLeadingIcon,
                  action.danger && styles.menuIconDanger,
                ]}
              />
            </View>
            <AppText
              weight="semibold"
              style={[
                styles.optionLabel,
                action.danger && styles.menuLabelDanger,
                {fontSize: font(15)},
              ]}>
              {action.label}
            </AppText>
            <Image
              source={images.icons.forward}
              style={styles.searchChevron}
            />
          </PressableScale>
        ))}
      </AppBottomSheetScrollView>
    </AppBottomSheet>
  );
};

export default memo(ActionSheet);
