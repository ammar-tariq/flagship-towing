import Row from '@Components/Row';
import AppText from '@Components/AppText';
import AppWrapper from '@Components/Wrapper/AppWrapper';
import React, {memo, useCallback, useMemo} from 'react';
import {FlatList, ListRenderItem, RefreshControl, View} from 'react-native';
import {styles} from './styles';
import {formatDateToMMDDYYYYWithSlashes} from '@Utils/helpers';
import {useGetIncidentQuery} from '@Api/user';
import {Loader} from '@Components/Loader';
import {EmptyComponent} from '@Components/EmptyComponent';
import {colors} from '@Utils/color';
import type {Incident} from '@Types/models/service';

const InfoRow = memo(({label, value}: {label: string; value: string}) => (
  <Row justify="space-between" align="flex-start" style={styles.row}>
    <AppText weight="medium" style={styles.label_text}>
      {label}
    </AppText>
    <View style={styles.value_wrap}>
      <AppText weight="semibold" style={styles.value_text}>
        {value || '—'}
      </AppText>
    </View>
  </Row>
));

const ServiceLogItem = memo(({item}: {item: Incident}) => {
  const title = item?.service?.title?.trim() || '—';
  const dateLabel = formatDateToMMDDYYYYWithSlashes(
    item?.date || item?.createdAt,
  );

  return (
    <View style={styles.card}>
      <InfoRow label="Service type" value={title} />
      <InfoRow label="Date" value={dateLabel || '—'} />
      <InfoRow
        label="Service ID"
        value={item?.service_id ? String(item.service_id) : '—'}
      />
    </View>
  );
});

const ServiceLogsScreen = () => {
  const {data, isLoading, isFetching, refetch} = useGetIncidentQuery();

  const list = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data?.data],
  );

  const handleRefetch = useCallback(() => {
    if (!isLoading) {
      refetch();
    }
  }, [isLoading, refetch]);

  const renderItem: ListRenderItem<Incident> = useCallback(
    ({item}) => <ServiceLogItem item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Incident) => item._id, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <AppWrapper style={styles.screen}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.list_content,
          list.length === 0 && styles.list_content_empty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRefetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <EmptyComponent text="No Incident Logs Found" />
        )}
        showsVerticalScrollIndicator={false}
        data={list}
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

export default ServiceLogsScreen;
