import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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