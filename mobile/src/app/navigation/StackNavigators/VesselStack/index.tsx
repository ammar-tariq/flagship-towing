import { GeneralParamList, GeneralScreenProps } from '@Types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import React, { FC } from 'react';
import { StackOptions } from 'src/app/navigation/NavigationOptions';
import VesselScreen from '@Screens/VesselScreen';


const Stack = createStackNavigator<GeneralParamList>();

const VesselStack: FC = ({ }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Vessel" component={VesselScreen} options={StackOptions} />
    </Stack.Navigator>
  );
};

export default VesselStack;
