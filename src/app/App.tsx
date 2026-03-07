import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { navigationRef } from './navigationRef';
import { SipStoreProvider } from '../state/sip/sipStore';
import { AppNavigator } from './navigation/AppNavigator';
import { IncomingCallNavigator } from './IncomingCallNavigator';

export function AppRoot() {
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#0B0F14" />

            <SipStoreProvider>
                <NavigationContainer ref={navigationRef}>
                    <AppNavigator />
                    <IncomingCallNavigator />
                </NavigationContainer>
            </SipStoreProvider>

        </SafeAreaProvider>
    );
}