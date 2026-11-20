import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import ContactUsScreen from '@Screens/ContactUsScreen';

const Stack = createStackNavigator<GeneralParamList>();

const ContactStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ContactUs" component={ContactUsScreen} options={StackOptions} />
    </Stack.Navigator>
  );
};

export default ContactStack;
