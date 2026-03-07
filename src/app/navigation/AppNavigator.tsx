import 'react-native-gesture-handler';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParams } from '../RootStackParams';
import { SplashScreen } from '../../screens/Splash/SplashScreen';
import { LoginScreen } from '../../screens/Login/LoginScreen';
import { SipConfigScreen } from '../../screens/SipConfig/SipConfigScreen';
import { CallScreen } from '../../screens/Call/CallScreen';
import { MainTabNavigator } from './MainTabNavigator';

const RootStack = createNativeStackNavigator<RootStackParams>();

export const AppNavigator: React.FC = () => {
  return (
    <RootStack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <RootStack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ animation: 'none' }}
      />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="SipConfig" component={SipConfigScreen} />
      <RootStack.Screen
        name="DrawerHome"
        component={MainTabNavigator}
        options={{ animation: 'fade' }}
      />
      <RootStack.Screen
        name="Call"
        component={CallScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </RootStack.Navigator>
  );
};