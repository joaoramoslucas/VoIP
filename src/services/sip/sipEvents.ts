import { NativeEventEmitter, NativeModules } from 'react-native';
import type { SipCallMappedState, SipRegistrationMappedState } from './sipTypes';

// nomes exatamente pros eventos que emite no NativeModule
export const SIP_EVENT_NAMES = {
  registration: 'SIP_REGISTRATION_STATE',
  call: 'SIP_CALL_STATE',
  incoming: 'SIP_INCOMING_CALL',
} as const;

const nativeEmitter = new NativeEventEmitter(NativeModules.SipNativeModule);

export const sipEvents = {
  onRegistrationStateChanged: (
    handler: (payload: { state: SipRegistrationMappedState; message: string }) => void
  ) => nativeEmitter.addListener(SIP_EVENT_NAMES.registration, handler),

  onCallStateChanged: (
    handler: (payload: { state: SipCallMappedState; message: string }) => void
  ) => nativeEmitter.addListener(SIP_EVENT_NAMES.call, handler),

  onIncomingCall: (
    handler: (payload: { remote: string }) => void
  ) => nativeEmitter.addListener(SIP_EVENT_NAMES.incoming, handler),
};