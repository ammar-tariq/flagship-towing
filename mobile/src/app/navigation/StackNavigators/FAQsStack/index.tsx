import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import FAQsScreen from '@Screens/FAQsScreen';

const Stack = createStackNavigator<GeneralParamList>();

const FAQsStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="FAQs" component={FAQsScreen} options={StackOptions} />
    </Stack.Navigator>
  );
};

export default FAQsStack;
