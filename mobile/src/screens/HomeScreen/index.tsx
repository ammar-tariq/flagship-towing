import Row from '@Components/Row';
import React, {useCallback} from 'react';
import {Image, ImageBackground, View} from 'react-native';
import {styles} from './styles';
import AppWrapper from '@Components/Wrapper/AppWrapper';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import {images} from '@Assets/Images';
import {heightPixel, font} from '@Utils/helpers';
import {navigate} from '@Utils/navigation';
import {useAuthMode} from '@Hooks/useAuthMode';
import Button from '@Components/Button';
import WeatherUpdateCard from '@Components/WeatherUpdateCard';
import CurrentLocationMap from '@Components/CurrentLocationMap';
import CoordinatesCard from '@Components/CoordinatesCard';
import {useWeatherUpdate} from '@Hooks/useWeatherUpdate';
import {useGetProfileQuery} from '@Api/user';

const HomeScreen = () => {
  const {user, requireAuth, isUser} = useAuthMode();
  const weather = useWeatherUpdate();

  // Keep membership_status fresh — Home reads Redux user, which otherwise
  // stays stuck at login-time values after checkout.
  useGetProfileQuery(undefined, {
    skip: !isUser,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const membershipStatus = user?.membership_status ?? 'none';
  const membershipStatusLabel =
    membershipStatus === 'active'
      ? 'Active'
      : membershipStatus === 'expired'
        ? 'Expired'
        : 'Inactive';
  const hasMembershipCard =
    membershipStatus === 'active' || membershipStatus === 'expired';

  const handleFamilyPress = useCallback(() => {
    requireAuth(() => navigate('FamilyMembers'));
  }, [requireAuth]);

  return (
    <AppWrapper scroll style={{paddingBottom: heightPixel(16)}}>
      <>
        {membershipStatus !== 'active' ? (
          <PressableScale
            onPress={() =>
              navigate('MembershipTypesStack', {screen: 'MembershipTypes'})
            }>
            <ImageBackground
              source={images.covers.card}
              style={styles.card_image}>
              <Row justify="space-between" style={styles.card_row}>
                <AppText weight="bold" style={[styles.step_text, {fontSize: font(18)}]}>
                  FREE TOWING FOR MEMBERS Buy Membership Now
                </AppText>
                <View style={styles.forward_box}>
                  <Image
                    source={images.icons.forward}
                    style={styles.step_forward}
                  />
                </View>
              </Row>
            </ImageBackground>
          </PressableScale>
        ) : null}
        <Button
          text="NEED HELP? CALL NOW"
          weight="bold"
          size={18}
          text_style={styles.help_btn_text}
          style={styles.btn_style}
          onPress={() => navigate('Emergency')}
        />
        <PressableScale
          disabled={!hasMembershipCard}
          onPress={() =>
            navigate('AppNavigator', {screen: 'MembershipCardStack'})
          }
          style={styles.membership_active_card}>
          <AppText weight="bold" style={[styles.membership_text, styles.membership_text_spacing, {fontSize: font(15)}]}>
            Membership Card{' '}
          </AppText>
          <Image
            source={images.main.whiteLogo}
            style={[styles.logo_style, styles.logo_scale]}
          />
          <View style={[styles.bar_style, styles.bar_active_style]}>
            <AppText weight="bold" style={[styles.title_style, {fontSize: font(12)}]}>
              BIG OR SMALL , WE TOW IT ALL
            </AppText>
          </View>
          <Row justify="space-between" style={styles.row_style}>
            <Row>
              <View
                style={[
                  styles.dot_style,
                  membershipStatus !== 'active' && styles.dot_inactive,
                ]}
              />
              <AppText weight="semibold" style={[styles.status_text, {fontSize: font(10)}]}>
                {membershipStatusLabel}
              </AppText>
            </Row>
            {hasMembershipCard ? (
              <Image
                source={images.icons.forward}
                style={styles.forward_icon}
              />
            ) : null}
          </Row>
        </PressableScale>

        <Row style={styles.active_row}>
          <PressableScale
            variant="soft"
            onPress={handleFamilyPress}
            style={styles.half_card}>
            <ImageBackground
              resizeMode="stretch"
              style={styles.small_card}
              source={images.covers.green}>
              <AppText weight="bold" style={[styles.card_text, {fontSize: font(18)}]}>
                Authorized Users
              </AppText>
            </ImageBackground>
          </PressableScale>
          <PressableScale
            variant="soft"
            onPress={() => navigate('ServicesList')}
            style={styles.half_card}>
            <ImageBackground
              resizeMode="stretch"
              style={styles.small_card}
              source={images.covers.blue}>
              <AppText weight="bold" style={[styles.card_text, {fontSize: font(18)}]}>
                List Of Services
              </AppText>
            </ImageBackground>
          </PressableScale>
        </Row>
      </>
      <AppText weight="bold" style={[styles.current_text, {fontSize: font(18)}]}>
        Current Locations
      </AppText>
      <CurrentLocationMap
        latitude={weather.latitude}
        longitude={weather.longitude}
      />
      <CoordinatesCard
        latitude={weather.latitude}
        longitude={weather.longitude}
        isLoading={weather.isLoading}
        needsPermission={weather.needsPermission}
        canOpenSettings={weather.canOpenSettings}
        message={
          weather.needsPermission
            ? weather.address
            : weather.latitude == null
              ? 'Unable to get current location'
              : undefined
        }
        onRequestPermission={weather.requestPermission}
        onRetry={weather.refresh}
      />
      <WeatherUpdateCard weather={weather} />
    </AppWrapper>
  );
};

export default HomeScreen;
