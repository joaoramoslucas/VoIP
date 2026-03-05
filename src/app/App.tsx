import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { SipStoreProvider } from '../state/sip/sipStore';
import { AppNavigator } from './navigation/AppNavigator';

export function AppRoot() {
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="dark-content" />

            <SipStoreProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </SipStoreProvider>

        </SafeAreaProvider>
    );
}