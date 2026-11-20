import { GeneralParamList, GeneralScreenProps } from '@Types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import React, { FC } from 'react';
import { StackOptions } from 'src/app/navigation/NavigationOptions';
import HomeScreen from '@Screens/HomeScreen';
const Stack = createStackNavigator<GeneralParamList>();

const HomeStack: FC = ({ }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Home" component={HomeScreen} options={StackOptions} />
    </Stack.Navigator>
  );
};

export default HomeStack;
