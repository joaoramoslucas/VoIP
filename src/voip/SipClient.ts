import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { SipEventMap } from './SipEvents';

const { SipNative } = NativeModules;

class SipClient {
    private eventEmitter = new NativeEventEmitter(SipNative);

    on<K extends keyof SipEventMap>(eventName: K, handler: (payload: SipEventMap[K]) => void) {
        return this.eventEmitter.addListener(eventName as string, handler);
    }

    async initialize(): Promise<void> {
        if (!SipNative?.initialize) {
            throw new Error('SipNative não está instalado (Native Module não encontrado).');
        }
        await SipNative.initialize({ platform: Platform.OS });
    }

    async register(params: { sipDomain: string; username: string; password: string; transport?: 'udp' | 'tcp' | 'tls' }) {
        return SipNative.register(params);
    }

    async unregister() {
        return SipNative.unregister();
    }

    async startCall(params: { to: string }) {
        return SipNative.startCall(params);
    }

    async hangup() {
        return SipNative.hangup();
    }

    async setMute(params: { muted: boolean }) {
        return SipNative.setMute(params);
    }

    async setSpeaker(params: { speakerOn: boolean }) {
        return SipNative.setSpeaker(params);
    }
}

export const sipClient = new SipClient();