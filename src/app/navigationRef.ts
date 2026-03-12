import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParams } from './RootStackParams';

export const navigationRef = createNavigationContainerRef<RootStackParams>();

export function navigateToCall() {
    console.log('[navigationRef] navigateToCall chamado');
    if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        console.log('[navigationRef] Rota atual:', currentRoute?.name);
        console.log('[navigationRef] Navegando para Call');
        navigationRef.navigate('Call');
    } else {
        console.log('[navigationRef] Navigation não está pronto ainda');
    }
}
