import React, {FC, useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {GeneralParamList} from '@Types/navigation';
import {StackOptions} from '../NavigationOptions';

// Screens
import AuthNavigator from '../AuthNavigator';
import DrawerNavigator from '../DrawerNavigator';
import FamilyMembersScreen from '@Screens/FamilyMembersScreen';
import AddFamilyMemberScreen from '@Screens/AddFamilyMemberScreen';
import EmergencyScreen from '@Screens/EmergencyScreen';
import ServicesListScreen from '@Screens/ServicesListScreen';
import ServiceDetailScreen from '@Screens/ServiceDetailScreen';
import MembershipsScreen from '@Screens/MembershipsScreen';
import MembershipDetailScreen from '@Screens/MembershipDetailScreen';
import ChangePasswordScreen from '@Screens/ChangePasswordScreen';
import NotificationScreen from '@Screens/NotificationScreen';
import AddVesselScreen from '@Screens/AddVesselScreen';
import PaymentStatusScreen from '@Screens/PaymentStatusScreen';
import ContentWebViewWrapperScreen from '@Screens/ContentWebViewWrapperScreen';
import EditProfileScreen from '@Screens/EditProfileScreen';
import {
  selectIsGuest,
  selectIsLoggedIn,
  selectUnauthenticated,
  signOut,
  dismissLoginPrompt,
} from '@Store/userSlice';
import {useDispatch, useSelector} from 'react-redux';
import {notificationListenerInstance} from '@Utils/Notification';
import {handlePaymentDeepLinkSuccess} from '@Utils/paymentCompletion';
import MapScreen from '@Screens/MapScreen';
import WeatherUpdateDetailScreen from '@Screens/WeatherUpdateDetailScreen';
import WindMapScreen from '@Screens/WindMapScreen';
import RadarMapScreen from '@Screens/RadarMapScreen';
import {DialogBox} from '@Components/DialogBox';
import {useDeepLinking} from '@Hooks/useDeepLinking';

const Stack = createStackNavigator<GeneralParamList>();

// Common Stack Screens using StackOptions
const commonScreens = [
  {name: 'FamilyMembers', component: FamilyMembersScreen},
  {name: 'AddFamilyMember', component: AddFamilyMemberScreen},
  {name: 'Emergency', component: EmergencyScreen},
  {name: 'ServicesList', component: ServicesListScreen},
  {name: 'ServiceDetail', component: ServiceDetailScreen},
  {name: 'Memberships', component: MembershipsScreen},
  {name: 'MembershipDetail', component: MembershipDetailScreen},
  {name: 'ChangePassword', component: ChangePasswordScreen},
  {name: 'Notifications', component: NotificationScreen},
  {name: 'AddVessel', component: AddVesselScreen},
  {name: 'PaymentStatus', component: PaymentStatusScreen},
  {name: 'Map', component: MapScreen},
  {name: 'WeatherUpdateDetail', component: WeatherUpdateDetailScreen},
  {name: 'WeatherMap', component: WindMapScreen},
  {name: 'WeatherRadar', component: RadarMapScreen},
  {name: 'TermsAndConditions', component: ContentWebViewWrapperScreen},
  {name: 'MemberAgreement', component: ContentWebViewWrapperScreen},
  {name: 'EditProfile', component: EditProfileScreen},
];

const MainNavigator: FC = () => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const unauthenticated = useSelector(selectUnauthenticated);
  const isGuest = useSelector(selectIsGuest);
  const dispatch = useDispatch();

  const closeBrowser = async (remoteMessage: any) => {
    if (remoteMessage?.data?.type == 'subscription_success') {
      const vesselId =
        typeof remoteMessage?.data?.vessel_id === 'string'
          ? remoteMessage.data.vessel_id
          : undefined;
      await handlePaymentDeepLinkSuccess({vesselId});
    }
  };

  const handleUnAuth = () => {
    dispatch(dismissLoginPrompt());
  };

  useEffect(() => {
    notificationListenerInstance.init(closeBrowser);
  }, []);

  useDeepLinking();

  return (
    <>
      <DialogBox
        status="warning"
        onClose={handleUnAuth}
        // Guest gate only — never overlay Auth (login/signup) screens.
        visible={unauthenticated && isGuest}
        heading="Please sign up or log in to continue"
        button={[
          {
            text: 'Continue',
            onPress: () => {
              handleUnAuth();
              dispatch(signOut());
            },
          },
        ]}
      />
      <Stack.Navigator>
        {!isLoggedIn ? (
          <Stack.Screen
            name="AuthNavigator"
            component={AuthNavigator}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen
              name="AppNavigator"
              component={DrawerNavigator}
              options={{headerShown: false}}
            />
            {commonScreens.map(screen => (
              <Stack.Screen
                key={screen.name}
                name={screen.name as keyof GeneralParamList}
                component={screen.component as React.ComponentType<any>}
                options={StackOptions}
              />
            ))}
          </>
        )}
      </Stack.Navigator>
    </>
  );
};

export default MainNavigator;
