/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import {onBackgroundMessage} from './src/lib/Notification';
import App from './App';
import {name as appName} from './app.json';

setBackgroundMessageHandler(getMessaging(), onBackgroundMessage);

AppRegistry.registerComponent(appName, () => App);
