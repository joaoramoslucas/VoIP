import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParams } from './RootStackParams';

export const navigationRef = createNavigationContainerRef<RootStackParams>();

export function navigateToCall() {
    if (navigationRef.isReady()) {
        navigationRef.navigate('Call');
    }
}
