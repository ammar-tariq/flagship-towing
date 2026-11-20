import CustomBottom from '@Components/CustomBottom';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {FC} from 'react';
import HomeStack from '../StackNavigators/HomeStack';
import ProfileStack from '../StackNavigators/ProfileStack';
import SafetyStack from '../StackNavigators/SafetyStack';
import VesselStack from '../StackNavigators/VesselStack';

const Bottom = createBottomTabNavigator();

const renderTabBar = (props: any) => <CustomBottom {...props} />;

const BottomNavigator: FC = () => {
  return (
    <Bottom.Navigator
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
      tabBar={renderTabBar}>
      <Bottom.Screen
        options={{title: 'Home'}}
        name="HomeStack"
        component={HomeStack}
      />
      <Bottom.Screen
        options={{title: 'Vessel'}}
        name="VesselStack"
        component={VesselStack}
      />
      <Bottom.Screen
        options={{title: 'Safety'}}
        name="SafetyStack"
        component={SafetyStack}
      />
      <Bottom.Screen
        options={{title: 'Profile'}}
        name="ProfileStack"
        component={ProfileStack}
      />
    </Bottom.Navigator>
  );
};

export default BottomNavigator;
