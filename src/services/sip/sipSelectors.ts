import type { SipCallSnapshot, SipRegistrationSnapshot } from './sipTypes';

export const getIsRegistered = (registration: SipRegistrationSnapshot): boolean => {
  return registration.state === 'ok';
};

export const getIsInCall = (call: SipCallSnapshot): boolean => {
  return call.state === 'connected' || call.state === 'incoming' || call.state === 'outgoing';
};

export const getIsIncomingCall = (call: SipCallSnapshot): boolean => {
  return call.state === 'incoming';
};