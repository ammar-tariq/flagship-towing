import { GeneralParamList, GeneralScreenProps } from '@Types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import React, { FC } from 'react';
import ForgotPasswordScreen from '@Screens/ForgotPasswordScreen';
import {LoginScreen} from '@Screens/LoginScreen';
import RecoverPasswordScreen from '@Screens/RecoverPasswordScreen';
import {SignupScreen} from '@Screens/SignupScreen';
import UserScreen from '@Screens/UserScreen';
import VerificationCodeScreen from '@Screens/VerificationCodeScreen';
import ContentWebViewWrapperScreen from '@Screens/ContentWebViewWrapperScreen';
import { StackOptions } from 'src/app/navigation/NavigationOptions';

const Stack = createStackNavigator<GeneralParamList>();

const AuthNavigator: FC = ({ }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="User" component={UserScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerificationCode" component={VerificationCodeScreen} />
      <Stack.Screen name="RecoverPassword" component={RecoverPasswordScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen
        name="TermsAndConditions"
        component={ContentWebViewWrapperScreen}
        options={StackOptions}
      />
      <Stack.Screen
        name="MemberAgreement"
        component={ContentWebViewWrapperScreen}
        options={StackOptions}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
