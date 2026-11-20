import AppText from '@Components/AppText';
import AppWrapper from '@Components/Wrapper/AppWrapper';
import WhiteWrapper from '@Components/Wrapper/WhiteWrapper';
import {formatDateToMMDDYYYYWithSlashes, heightPixel, font} from '@Utils/helpers';
import React, { memo } from 'react';
import { ScrollView, View } from 'react-native';
import { styles } from './styles';
import Row from '@Components/Row';
import {
  useGetPaymentLogsQuery,
} from '@Api/user';
import { Loader } from '@Components/Loader';
import { EmptyComponent } from '@Components/EmptyComponent';

const RenderLog = memo(({ item, cancelled }: { item: any; cancelled?: boolean }) => (
  <View style={styles.log_card}>
    <Row align="flex-start" style={styles.log_row}>
      <AppText weight="medium">Name:{'  '}</AppText>
      <AppText weight="regular"> {item?.name}</AppText>
    </Row>
    <Row style={styles.log_row}>
      <AppText weight="medium">Expire On:</AppText>
      <AppText weight="regular">
        {' '}
        {formatDateToMMDDYYYYWithSlashes(item?.current_period_end)}
      </AppText>
    </Row>
    <Row style={styles.log_row}>
      <AppText weight="medium">Amount Paid:</AppText>
      <AppText weight="regular"> ${item?.amount}</AppText>
    </Row>
    <Row style={styles.log_row}>
      <AppText weight="medium">Duration:</AppText>
      <AppText weight="regular"> {item?.interval}</AppText>
    </Row>
    {cancelled ? (
      <Row style={styles.log_row}>
        <AppText weight="medium">Ends on:</AppText>
        <AppText weight="regular">
          {' '}
          {formatDateToMMDDYYYYWithSlashes(item?.current_period_end)}
        </AppText>
      </Row>
    ) : null}
  </View>
));

const MembershipLogsScreen = () => {
  const { data, isLoading } = useGetPaymentLogsQuery();

  const activeSubscriptions = data?.data?.active_subscriptions ?? [];
  const inactiveSubscriptions = data?.data?.inactive_subscriptions ?? [];
  const hasLogs =
    activeSubscriptions.length > 0 || inactiveSubscriptions.length > 0;

  if (isLoading) {
    return <Loader />;
  }

  if (!hasLogs) {
    return <EmptyComponent text="No Logs Found" />;
  }

  return (
    <AppWrapper style={{ paddingTop: heightPixel(20) }}>
      <ScrollView>
        {activeSubscriptions.length > 0 ? (
          <WhiteWrapper>
            <AppText weight="semibold" style={{fontSize: font(16)}}>
              Current Subscription
            </AppText>
            {activeSubscriptions.map((item: any) => (
              <RenderLog
                key={item?.id ?? `active-${item?.name}`}
                item={item}
                cancelled={item?.cancel_at_period_end}
              />
            ))}
          </WhiteWrapper>
        ) : null}

        {inactiveSubscriptions.length > 0 ? (
          <WhiteWrapper>
            <AppText weight="semibold" style={{fontSize: font(16)}}>
              Past Subscription
            </AppText>
            {inactiveSubscriptions.map((item: any) => (
              <RenderLog key={item?.id ?? `inactive-${item?.name}`} item={item} />
            ))}
          </WhiteWrapper>
        ) : null}
      </ScrollView>
    </AppWrapper>
  );
};

export default MembershipLogsScreen;
