import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import MembershipCardScreen from '@Screens/MembershipCardScreen';

const Stack = createStackNavigator<GeneralParamList>();

const MembershipCardStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="MembershipCard"
        component={MembershipCardScreen}
        options={StackOptions}
      />
    </Stack.Navigator>
  );
};

export default MembershipCardStack;
