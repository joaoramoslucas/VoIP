import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParams } from '../RootStackParams';
import { CallScreen } from '../../screens/Call/CallScreen';
import { DialerScreen } from '../../screens/Dialer/SipDialerScreen';
import { SipLoginScreen } from '../../screens/SipLogin/SipLoginScreen';

const RootStack = createNativeStackNavigator<RootStackParams>();

export const AppNavigator: React.FC = () => {
    return (
        <RootStack.Navigator
            initialRouteName="SipLogin"
            screenOptions={{
                headerShown: false,
                animation: 'fade',
            }}
        >
            <RootStack.Screen name="SipLogin" component={SipLoginScreen} />
            <RootStack.Screen name="SipDialer" component={DialerScreen} />
            <RootStack.Screen name="Call" component={CallScreen} />
        </RootStack.Navigator>
    );
};