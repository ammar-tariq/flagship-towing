import AppWrapper from '@Components/Wrapper/AppWrapper';
import React, {memo, useCallback} from 'react';
import {
  FlatList,
  ListRenderItem,
  View,
} from 'react-native';
import {styles} from './styles';
import LinearGradient from 'react-native-linear-gradient';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import {navigate} from '@Utils/navigation';
import {useGetPackagesQuery} from '@Api/user';
import {useRoute} from '@react-navigation/native';
import {font} from '@Utils/helpers';
import CachedImage from '@Components/CachedImage';

type PackageItem = {
  _id?: string;
  images?: string[];
  name?: string;
  description?: string;
  prices?: {id: string}[];
};

type MembershipListItemProps = {
  item: PackageItem;
  readOnly: boolean;
};

const MembershipListItem = memo(({item, readOnly}: MembershipListItemProps) => {
  const handlePress = useCallback(() => {
    navigate('MembershipDetail', {item, readOnly});
  }, [item, readOnly]);

  return (
    <PressableScale onPress={handlePress} style={styles.card_pressable}>
      <CachedImage source={item?.images?.[0]} style={styles.card}>
        <LinearGradient
          colors={['rgba(30,30,30,0)', '#1E1E1E']}
          style={styles.gradient}>
          <View style={styles.card_content}>
            <AppText
              weight="semibold"
              lines={1}
              style={[styles.card_text, {fontSize: font(18)}]}>
              {item?.name}
            </AppText>
            <AppText lines={2} style={[styles.card_text, {fontSize: font(11)}]}>
              {item?.description}
            </AppText>
          </View>
        </LinearGradient>
      </CachedImage>
    </PressableScale>
  );
});

const MembershipsScreen = () => {
  const route: any = useRoute();
  const isTypeOnly = route.name === 'MembershipTypes';

  const {data, isLoading, refetch} = useGetPackagesQuery();

  const handleRefetch = useCallback(() => {
    if (!isLoading) {
      refetch();
    }
  }, [isLoading, refetch]);

  const renderItem: ListRenderItem<PackageItem> = useCallback(
    ({item}) => (
      <MembershipListItem item={item} readOnly={isTypeOnly} />
    ),
    [isTypeOnly],
  );

  const keyExtractor = useCallback(
    (item: PackageItem, index: number) => item._id ?? String(index),
    [],
  );

  return (
    <AppWrapper>
      <FlatList
        refreshing={isLoading}
        onRefresh={handleRefetch}
        data={data?.data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        removeClippedSubviews={false}
        maxToRenderPerBatch={6}
        windowSize={5}
        initialNumToRender={4}
        contentContainerStyle={styles.list_content}
      />
    </AppWrapper>
  );
};

export default MembershipsScreen;
