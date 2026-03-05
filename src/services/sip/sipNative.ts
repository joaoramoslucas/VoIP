import { NativeModules } from 'react-native';
import type { SipAccountCredentials } from './sipTypes';

type SipNativeModuleType = {
  initialize(options: Record<string, any>): Promise<boolean>;
  register(params: SipAccountCredentials): Promise<boolean>;
  unregister(): Promise<boolean>;
  startCall(params: { to: string }): Promise<boolean>;
  hangUp(): Promise<boolean>; // implementar no nativo depois
  acceptCall(): Promise<boolean>; // idem
  declineCall(): Promise<boolean>; // idem
  toggleMute(params: { isMuted: boolean }): Promise<boolean>; // idem
  toggleSpeaker(params: { isSpeakerEnabled: boolean }): Promise<boolean>; // idem
};

const { SipNativeModule } = NativeModules;

export const sipNative: SipNativeModuleType = SipNativeModule as SipNativeModuleType;