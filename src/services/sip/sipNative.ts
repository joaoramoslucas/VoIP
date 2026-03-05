import { NativeModules } from 'react-native'
import type { SipAccountCredentials } from './sipTypes'

type SipNativeModuleType = {
  initialize(options: Record<string, any>): Promise<boolean>
  register(params: SipAccountCredentials): Promise<boolean>
  unregister(): Promise<boolean>

  startCall(params: { to: string }): Promise<boolean>

  hangup(): Promise<boolean>

  setMute(params: { muted: boolean }): Promise<boolean>
  setSpeaker(params: { speakerOn: boolean }): Promise<boolean>
}

const { SipNativeModule } = NativeModules

export const sipNative: SipNativeModuleType =
  SipNativeModule as SipNativeModuleType