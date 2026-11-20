import {images} from '@Assets/Images';
import Row from '@Components/Row';
import AppWrapper from '@Components/Wrapper/AppWrapper';
import WhiteWrapper from '@Components/Wrapper/WhiteWrapper';
import PressableScale from '@Components/PressableScale';
import {heightPixel, font} from '@Utils/helpers';
import {navigate} from '@Utils/navigation';
import React, {memo, useCallback, useEffect} from 'react';
import {FlatList, Image, ListRenderItem, View} from 'react-native';
import {styles} from './styles';
import AppText from '@Components/AppText';
import {useGetServicesQuery} from '@Api/user';
import {EmptyComponent} from '@Components/EmptyComponent';
import CachedImage, {preloadImages} from '@Components/CachedImage';

type ServiceItem = {
  _id: string;
  image?: string;
  title?: string;
  short_description?: string;
};

const ServiceListItem = memo(({item}: {item: ServiceItem}) => {
  const handlePress = useCallback(() => {
    navigate('ServiceDetail', {id: item._id});
  }, [item._id]);

  return (
    <PressableScale variant="soft" onPress={handlePress}>
      <WhiteWrapper style={styles.white_box}>
        <View style={styles.btn_style}>
          <Image source={images.icons.forward} style={styles.forward_icon} />
        </View>
        <Row>
          <CachedImage source={item?.image} style={styles.image_style} />
          <View style={styles.desc_box}>
            <AppText weight="semibold" lines={2} style={[styles.desc_title, {fontSize: font(16)}]}>
              {item?.title}
            </AppText>
            <AppText lines={3} style={[styles.desc_text, {fontSize: font(12)}]}>
              {item?.short_description}
            </AppText>
          </View>
        </Row>
      </WhiteWrapper>
    </PressableScale>
  );
});

const ServicesListScreen = () => {
  const {data, isLoading, refetch} = useGetServicesQuery();

  useEffect(() => {
    const list = data?.data;
    if (Array.isArray(list)) {
      preloadImages(list.map((item: ServiceItem) => item?.image));
    }
  }, [data?.data]);

  const handleRefetch = useCallback(() => {
    if (!isLoading) {
      refetch();
    }
  }, [isLoading, refetch]);

  const renderItem: ListRenderItem<ServiceItem> = useCallback(
    ({item}) => <ServiceListItem item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: ServiceItem) => item._id, []);

  return (
    <AppWrapper style={[styles.screen, {paddingTop: heightPixel(20)}]}>
      <FlatList
        refreshing={isLoading}
        onRefresh={handleRefetch}
        ListEmptyComponent={() => (
          <EmptyComponent text="No Service Logs Found" />
        )}
        data={data?.data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={7}
        initialNumToRender={6}
      />
    </AppWrapper>
  );
};

export default ServicesListScreen;
