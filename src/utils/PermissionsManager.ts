import { NativeModules, Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';

const { PermissionsModule } = NativeModules;

export class PermissionsManager {
    static async requestMicrophonePermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            if (!PermissionsModule) {
                console.error('PermissionsModule not found');
                return false;
            }
            try {
                return await PermissionsModule.requestMicrophonePermission();
            } catch (error) {
                console.error('Error requesting microphone permission:', error);
                return false;
            }
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    }

    static async requestNotificationPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            if (!PermissionsModule) return false;
            try {
                return await PermissionsModule.requestNotificationPermission();
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                return false;
            }
        } else {
            if (Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true;
        }
    }

    static async requestContactsPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            if (!PermissionsModule) return false;
            try {
                return await PermissionsModule.requestContactsPermission();
            } catch (error) {
                console.error('Error requesting contacts permission:', error);
                return false;
            }
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    }

    static async requestAllPermissions(): Promise<{
        microphone: boolean;
        notifications: boolean;
        contacts: boolean;
    }> {
        const [microphone, notifications, contacts] = await Promise.all([
            this.requestMicrophonePermission(),
            this.requestNotificationPermission(),
            this.requestContactsPermission(),
        ]);

        return { microphone, notifications, contacts };
    }
}
