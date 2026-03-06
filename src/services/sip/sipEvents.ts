import { DeviceEventEmitter, type EmitterSubscription } from 'react-native';

import type {
    SipIncomingCallPayload,
    SipCallStateChangedPayload,
    SipRegistrationMappedState,
} from './sipTypes';

export const SIP_EVENT_NAMES = {
    call: 'onCallState',
    incoming: 'onIncomingCall',
    registration: 'onRegistrationState',
} as const;

export const sipEvents = {
    onRegistrationStateChanged(
        handler: (payload: { state: SipRegistrationMappedState; message?: string }) => void
    ): EmitterSubscription {
        return DeviceEventEmitter.addListener(SIP_EVENT_NAMES.registration, handler);
    },

    onCallStateChanged(
        handler: (payload: SipCallStateChangedPayload) => void
    ): EmitterSubscription {
        return DeviceEventEmitter.addListener(SIP_EVENT_NAMES.call, handler);
    },

    onIncomingCall(
        handler: (payload: SipIncomingCallPayload) => void
    ): EmitterSubscription {
        return DeviceEventEmitter.addListener(SIP_EVENT_NAMES.incoming, handler);
    },
};