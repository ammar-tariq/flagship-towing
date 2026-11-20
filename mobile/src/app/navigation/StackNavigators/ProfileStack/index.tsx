import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import ProfileScreen from '@Screens/ProfileScreen';

const Stack = createStackNavigator<GeneralParamList>();

const ProfileStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={StackOptions}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
