import { DeviceEventEmitter, type EmitterSubscription } from 'react-native';

import type {
  SipCallStateChangedPayload,
  SipIncomingCallPayload,
  SipRegistrationMappedState,
} from './sipTypes';

export const SIP_EVENT_NAMES = {
  registration: 'onRegistrationState',
  call: 'onCallState',
  incoming: 'onIncomingCall',
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