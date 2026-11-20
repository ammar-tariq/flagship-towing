import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import ServicesListScreen from '@Screens/ServicesListScreen';

const Stack = createStackNavigator<GeneralParamList>();

const ServiceListStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="ServicesList"
        component={ServicesListScreen}
        options={StackOptions}
      />
    </Stack.Navigator>
  );
};

export default ServiceListStack;
