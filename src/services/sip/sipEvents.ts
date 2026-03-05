import { NativeEventEmitter, NativeModules } from 'react-native';
import type { SipCallMappedState, SipRegistrationMappedState } from './sipTypes';

// nomes exatamente pros eventos que emite no NativeModule
export const SIP_EVENT_NAMES = {
  registration: 'onRegistrationState',
  call: 'onCallState',
  incoming: 'onIncomingCall',
} as const;

const nativeEmitter = new NativeEventEmitter(NativeModules.SipNativeModule);

export const sipEvents = {
  onRegistrationStateChanged: (
    handler: (payload: { from: SipRegistrationMappedState; message: string }) => void
  ) => nativeEmitter.addListener(SIP_EVENT_NAMES.registration, handler),

  onCallStateChanged: (
    handler: (payload: { from: SipCallMappedState; message: string }) => void
  ) => nativeEmitter.addListener(SIP_EVENT_NAMES.call, handler),

  onIncomingCall: (
    handler: (payload: { from: string }) => void
  ) => nativeEmitter.addListener(SIP_EVENT_NAMES.incoming, handler),
};