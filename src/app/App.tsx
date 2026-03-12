import React, { useEffect } from 'react';
import { StatusBar, DeviceEventEmitter, Platform, NativeEventEmitter, NativeModules } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { navigationRef } from './navigationRef';
import { SipStoreProvider } from '../state/sip/sipStore';
import { AppNavigator } from './navigation/AppNavigator';
import { IncomingCallNavigator } from './IncomingCallNavigator';
import { migrateLegacyCredentials } from '../utils/migrateLegacyCredentials';

export function AppRoot() {
    // Migrar credenciais antigas na primeira execução
    useEffect(() => {
        migrateLegacyCredentials().catch(console.error);
    }, []);

    // Listener para navegação de chamada recebida (app morto)
    useEffect(() => {
        const eventEmitter = Platform.OS === 'android' 
            ? DeviceEventEmitter 
            : new NativeEventEmitter(NativeModules.SipNativeModule);

        const subscription = eventEmitter.addListener('navigateToIncomingCall', (caller) => {
            console.log('[App] Evento navigateToIncomingCall recebido:', caller);
            
            // Aguardar navegação estar pronta e ir direto para Call
            const tryNavigate = () => {
                if (navigationRef.isReady()) {
                    const currentRoute = navigationRef.getCurrentRoute();
                    console.log('[App] Rota atual:', currentRoute?.name);
                    
                    // Se já está na tela de chamada, não fazer nada
                    if (currentRoute?.name === 'Call') {
                        console.log('[App] Já está na tela Call');
                        return;
                    }
                    
                    // Se está no DrawerHome, navegar para Call
                    if (currentRoute?.name === 'DrawerHome') {
                        console.log('[App] Navegando para Call');
                        navigationRef.navigate('Call' as never);
                        return;
                    }
                    
                    // Se ainda não chegou no DrawerHome, tentar novamente
                    console.log('[App] Aguardando chegar no DrawerHome...');
                    setTimeout(tryNavigate, 300);
                } else {
                    setTimeout(tryNavigate, 300);
                }
            };
            
            // Começar a tentar imediatamente
            tryNavigate();
        });

        return () => subscription.remove();
    }, []);

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