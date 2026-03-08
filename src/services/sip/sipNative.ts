// src/services/sip/sipNative.ts
import { NativeModules } from 'react-native';

export type SipNativeInitializeOptions = Record<string, unknown>;

export type SipNativeRegisterParams = {
  username: string;
  password: string;
  sipDomain: string;
  transport?: 'udp' | 'tcp' | 'tls';
};

export type SipNativeStartCallParams = {
  to: string;
};

type SipNativeModuleType = {
  hangup: () => Promise<boolean>;
  unregister: () => Promise<boolean>;
  acceptCall: () => Promise<boolean>;
  declineCall: () => Promise<boolean>;
  getPushToken: () => Promise<string | null>;
  setMute: (params: { muted: boolean }) => Promise<boolean>;
  setPushToken: (params: { token: string }) => Promise<boolean>;
  register: (params: SipNativeRegisterParams) => Promise<boolean>;
  setSpeaker: (params: { speakerOn: boolean }) => Promise<boolean>;
  startCall: (params: SipNativeStartCallParams) => Promise<boolean>;
  initialize: (options: SipNativeInitializeOptions) => Promise<boolean>;
};

const sipNativeModule = NativeModules.SipNativeModule as SipNativeModuleType | undefined;

function assertNativeFunction<K extends keyof SipNativeModuleType>(name: K): SipNativeModuleType[K] {
  const fn = sipNativeModule?.[name];
  if (typeof fn !== 'function') {
    const keys = sipNativeModule ? Object.keys(sipNativeModule) : [];
    throw new Error(
      `[SIP] Função nativa "${String(name)}" não existe. ` +
      `Keys disponíveis: ${keys.join(', ')}`
    );
  }
  return (fn.bind(sipNativeModule)) as unknown as SipNativeModuleType[K];
}

export const sipNative = {
  initialize: (options: SipNativeInitializeOptions = {}) =>
    assertNativeFunction('initialize')(options),

  register: (params: SipNativeRegisterParams) =>
    assertNativeFunction('register')(params),

  unregister: () => assertNativeFunction('unregister')(),

  startCall: (params: SipNativeStartCallParams) =>
    assertNativeFunction('startCall')(params),

  setMute: (muted: boolean) =>
    assertNativeFunction('setMute')({ muted }),

  setSpeaker: (speakerOn: boolean) =>
    assertNativeFunction('setSpeaker')({ speakerOn }),

  hangup: () => assertNativeFunction('hangup')(),

  acceptCall: () => assertNativeFunction('acceptCall')(),

  declineCall: () => assertNativeFunction('declineCall')(),

  setPushToken: (token: string) =>
    assertNativeFunction('setPushToken')({ token }),

  getPushToken: () => assertNativeFunction('getPushToken')(),
};