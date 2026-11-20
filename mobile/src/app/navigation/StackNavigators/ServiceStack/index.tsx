import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import ServiceLogsScreen from '@Screens/ServiceLogsScreen';

const Stack = createStackNavigator<GeneralParamList>();

const ServiceStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="ServiceLogs"
        component={ServiceLogsScreen}
        options={StackOptions}
      />
    </Stack.Navigator>
  );
};

export default ServiceStack;
