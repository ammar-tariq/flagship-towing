import {EmptyComponent} from '@Components/EmptyComponent';
import {Loader} from '@Components/Loader';
import AppText from '@Components/AppText';
import AppScreen from '@Components/AppScreen';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import React, {memo, useCallback, useMemo} from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {useGetNotificationListQuery} from '@Api/user';

dayjs.extend(relativeTime);

type NotificationItem = {
  _id: string;
  createdAt?: string;
  isRead?: boolean;
  notification?: {
    title?: string;
    body?: string;
  };
};

const formatWhen = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = dayjs(value);
  if (!date.isValid()) {
    return '';
  }
  if (dayjs().diff(date, 'day') < 7) {
    return date.fromNow();
  }
  return date.format('MMM D, YYYY');
};

const NotificationListItem = memo(({item}: {item: NotificationItem}) => {
  const unread = item.isRead === false;
  const title = item.notification?.title?.trim() || 'Notification';
  const body = item.notification?.body?.trim() || '';
  const when = formatWhen(item.createdAt);

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, unread && styles.iconWrapUnread]}>
        <Image source={images.icons.bell} style={styles.icon} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText
            weight={unread ? 'semibold' : 'medium'}
            style={[styles.title, {fontSize: font(15)}]}
            lines={2}>
            {title}
          </AppText>
          {when ? (
            <AppText style={[styles.time, {fontSize: font(11)}]}>{when}</AppText>
          ) : null}
        </View>
        {body ? (
          <AppText style={[styles.body, {fontSize: font(13)}]} lines={3}>
            {body}
          </AppText>
        ) : null}
      </View>
    </View>
  );
});

const NotificationScreen = () => {
  const {data, isLoading, isFetching, refetch} = useGetNotificationListQuery(
    undefined,
    {refetchOnFocus: true},
  );

  const list = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data?.data],
  );

  const renderItem: ListRenderItem<NotificationItem> = useCallback(
    ({item}) => <NotificationListItem item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: NotificationItem) => item._id, []);

  const handleRefresh = useCallback(() => {
    if (!isLoading) {
      refetch();
    }
  }, [isLoading, refetch]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <AppScreen edges={[]} style={styles.screen}>
      <FlatList
        data={list}
        style={styles.list}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          list.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={() => (
          <EmptyComponent text="No notifications yet" />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={7}
        initialNumToRender={8}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingHorizontal: widthPixel(15),
    paddingTop: heightPixel(12),
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: heightPixel(24),
    flexGrow: 1,
  },
  listContentEmpty: {
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: heightPixel(14),
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
    marginBottom: heightPixel(10),
    gap: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconWrap: {
    width: heightPixel(42),
    height: heightPixel(42),
    borderRadius: heightPixel(12),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: {
    backgroundColor: 'rgba(1, 24, 255, 0.12)',
  },
  icon: {
    width: heightPixel(18),
    height: heightPixel(18),
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: widthPixel(8),
    marginBottom: heightPixel(4),
  },
  title: {
    flex: 1,
    color: colors.darkBlack,
    lineHeight: heightPixel(20),
  },
  time: {
    color: colors.placeholder,
    marginTop: heightPixel(2),
  },
  body: {
    color: colors.granite,
    lineHeight: heightPixel(18),
  },
});

export default NotificationScreen;
