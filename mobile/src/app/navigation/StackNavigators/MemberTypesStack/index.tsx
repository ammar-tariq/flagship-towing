import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import MembershipsScreen from '@Screens/MembershipsScreen';

const Stack = createStackNavigator<GeneralParamList>();

const MembershipTypesStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="MembershipTypes"
        component={MembershipsScreen}
        options={StackOptions}
      />
    </Stack.Navigator>
  );
};

export default MembershipTypesStack;
