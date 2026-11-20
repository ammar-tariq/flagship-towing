import {GeneralParamList} from '@Types/navigation';
import {createStackNavigator} from '@react-navigation/stack';
import React, {FC} from 'react';
import {StackOptions} from 'src/app/navigation/NavigationOptions';
import SafetyScreen from '@Screens/SafetyScreen';

const Stack = createStackNavigator<GeneralParamList>();

const SafetyStack: FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Safety" component={SafetyScreen} options={StackOptions} />
    </Stack.Navigator>
  );
};

export default SafetyStack;
