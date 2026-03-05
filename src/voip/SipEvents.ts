export type SipRegistrationState =
  | 'none'
  | 'progress'
  | 'ok'
  | 'failed';

export type SipCallState =
  | 'idle'
  | 'incoming'
  | 'outgoing'
  | 'connected'
  | 'ended'
  | 'error';

export type SipEventMap = {
  onRegistrationState: { state: SipRegistrationState; message?: string };
  onIncomingCall: { from: string };
  onCallState: { state: SipCallState; message?: string };
};