import React, {memo, type ReactNode} from 'react';
import {Image, ImageSourcePropType, View} from 'react-native';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import {images} from '@Assets/Images';
import {heightPixel, font} from '@Utils/helpers';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {sheetStyles as styles} from './styles';

type SearchSheetHeaderProps = {
  title: string;
  icon?: ImageSourcePropType;
  onClose: () => void;
};

export const SearchSheetHeader = memo(
  ({title, icon, onClose}: SearchSheetHeaderProps) => {
    const {top} = useSafeAreaInsets();

    return (
      <View style={[styles.searchHeader, {paddingTop: top + heightPixel(10)}]}>
        <PressableScale
          variant="icon"
          onPress={onClose}
          style={styles.searchBack}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Image source={images.icons.back} style={styles.searchBackIcon} />
        </PressableScale>
        {icon ? (
          <View style={styles.searchTitleIconWrap}>
            <Image source={icon} style={styles.searchTitleIcon} />
          </View>
        ) : null}
        <AppText weight="bold" lines={1} style={[styles.searchTitle, {fontSize: font(18)}]}>
          {title}
        </AppText>
        <View style={styles.searchBack} />
      </View>
    );
  },
);

type SearchResultRowProps = {
  title: string;
  subtitle?: string;
  icon?: ImageSourcePropType;
  onPress: () => void;
};

export const SearchResultRow = memo(
  ({title, subtitle, icon, onPress}: SearchResultRowProps) => (
    <PressableScale variant="soft" onPress={onPress} style={styles.searchResult}>
      <View style={styles.searchResultIconWrap}>
        <Image
          source={icon ?? images.icons.home}
          style={styles.searchResultIcon}
        />
      </View>
      <View style={styles.searchResultBody}>
        <AppText style={styles.searchMainText} lines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.searchSecondaryText} lines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Image source={images.icons.forward} style={styles.searchChevron} />
    </PressableScale>
  ),
);

type SearchEmptyProps = {
  message: string;
  icon?: ImageSourcePropType;
};

export const SearchEmpty = memo(({message, icon}: SearchEmptyProps) => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyIconWrap}>
      <Image
        source={icon ?? images.icons.home}
        style={styles.emptyIcon}
      />
    </View>
    <AppText style={styles.emptyText}>{message}</AppText>
  </View>
));

type SearchSheetFooterProps = {
  children: ReactNode;
};

export const SearchSheetFooter = memo(
  ({children}: SearchSheetFooterProps) => {
    const {bottom} = useSafeAreaInsets();
    return (
      <View style={[styles.searchFooter, {paddingBottom: bottom + heightPixel(12)}]}>
        {children}
      </View>
    );
  },
);
