import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import MembershipLogsScreen from '@Screens/MembershipLogsScreen';

const Stack = createStackNavigator<GeneralParamList>();

const MembershipStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="MembershipLogs"
        component={MembershipLogsScreen}
        options={StackOptions}
      />
    </Stack.Navigator>
  );
};

export default MembershipStack;
