import { GeneralParamList, GeneralScreenProps } from '@Types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import React, { FC } from 'react';
import { StackOptions } from 'src/app/navigation/NavigationOptions';
import ContentWebViewWrapperScreen from '@Screens/ContentWebViewWrapperScreen';
const Stack = createStackNavigator<GeneralParamList>();

const PrivacyStack: FC = ({ }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="PrivacyPolicy" component={ContentWebViewWrapperScreen} options={StackOptions} />
    </Stack.Navigator>
  );
};

export default PrivacyStack;
