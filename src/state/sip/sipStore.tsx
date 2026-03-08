// src/store/sip/sipStore.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  SipCallSnapshot,
  SipAccountCredentials,
  SipRegistrationSnapshot,
} from '../../services/sip/sipTypes';

import { sipNative } from '../../services/sip/sipNative';
import { sipEvents } from '../../services/sip/sipEvents';
import { credentialStorage } from '../../services/storage/credentialStorage';
import { callHistory } from '../../screens/History/HistoryScreen';

type SipStoreState = {
  call: SipCallSnapshot;
  isCoreInitialized: boolean;
  registration: SipRegistrationSnapshot;
  lastUsedCredentials: SipAccountCredentials | null;

  actions: {
    logout: () => Promise<void>;
    hangUp: () => Promise<void>;
    acceptCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    autoLogin: () => Promise<boolean>;
    initializeCore: () => Promise<void>;
    unregisterAccount: () => Promise<void>;
    startCall: (to: string) => Promise<void>;
    setMuted: (isMuted: boolean) => Promise<void>;
    setSpeakerEnabled: (isSpeakerEnabled: boolean) => Promise<void>;
    registerAccount: (credentials: SipAccountCredentials) => Promise<void>;
  };
};

const SipStoreContext = createContext<SipStoreState | null>(null);

const nowMs = () => Date.now();

export const SipStoreProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isCoreInitialized, setIsCoreInitialized] = useState(false);
  const [lastUsedCredentials, setLastUsedCredentials] = useState<SipAccountCredentials | null>(null);

  const [registration, setRegistration] = useState<SipRegistrationSnapshot>({
    state: 'none',
    message: 'Sem registro',
    lastUpdatedAtMs: nowMs(),
  });

  const [call, setCall] = useState<SipCallSnapshot>({
    state: 'idle',
    message: 'Idle',
    remoteUri: null,
    direction: null,
    lastUpdatedAtMs: nowMs(),
  });

  const subscribedRef = useRef(false);
  const callStartRef = useRef<{ time: number; uri: string; direction: 'incoming' | 'outgoing' } | null>(null);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const registrationSub = sipEvents.onRegistrationStateChanged((payload) => {
      const next: SipRegistrationSnapshot = {
        state: payload.state,
        message: payload.message ?? '',
        lastUpdatedAtMs: nowMs(),
      };
      setRegistration(next);
    });

    const callSub = sipEvents.onCallStateChanged((payload) => {
      setCall((previous) => {
        const next: SipCallSnapshot = {
          ...previous,
          state: payload.state,
          message: payload.message ?? '',
          // Use remoteUri from payload if provided (dead-app restore), else keep previous
          remoteUri: payload.remoteUri !== undefined ? payload.remoteUri : previous.remoteUri,
          // Use direction from payload if provided, else keep previous
          direction: payload.direction ?? previous.direction,
          lastUpdatedAtMs: nowMs(),
        };

        // Track call start
        if (payload.state === 'connected' && !callStartRef.current) {
          callStartRef.current = {
            time: Date.now(),
            uri: previous.remoteUri ?? '',
            direction: previous.direction === 'Incoming' ? 'incoming' : 'outgoing',
          };
        }

        // Save to history on call end
        if ((payload.state === 'ended' || payload.state === 'error') && callStartRef.current) {
          const { time, uri, direction } = callStartRef.current;
          const durationSeconds = Math.floor((Date.now() - time) / 1000);
          callHistory.add({
            remoteUri: uri || previous.remoteUri || 'unknown',
            direction,
            startedAt: time,
            durationSeconds,
          });
          callStartRef.current = null;
        }

        // Also track missed calls (ended from incoming without connecting)
        if (payload.state === 'ended' && !callStartRef.current) {
          if (previous.state === 'incoming') {
            callHistory.add({
              remoteUri: previous.remoteUri || next.remoteUri || 'unknown',
              direction: 'missed',
              startedAt: Date.now(),
              durationSeconds: 0,
            });
          } else if (previous.state === 'outgoing') {
            callHistory.add({
              remoteUri: previous.remoteUri || next.remoteUri || 'unknown',
              direction: 'outgoing',
              startedAt: Date.now(),
              durationSeconds: 0,
            });
          }
        }

        return next;
      });
    });

    const incomingSub = sipEvents.onIncomingCall((payload) => {
      const next: SipCallSnapshot = {
        state: 'incoming',
        message: 'Incoming call',
        remoteUri: payload.from ?? null,
        direction: 'Incoming',
        lastUpdatedAtMs: nowMs(),
      };
      setCall(next);
    });

    return () => {
      registrationSub.remove();
      callSub.remove();
      incomingSub.remove();
    };
  }, []);

  const initializeCore = async () => {
    if (isCoreInitialized) return;
    await sipNative.initialize({});
    setIsCoreInitialized(true);
  };

  const registerAccount = async (credentials: SipAccountCredentials) => {
    await initializeCore();

    setLastUsedCredentials(credentials);

    await sipNative.register({
      sipDomain: credentials.sipDomain,
      username: credentials.username,
      password: credentials.password,
      transport: credentials.transport,
    });

    // Salvar credenciais para auto-login
    await credentialStorage.save(credentials);
  };

  const autoLogin = async (): Promise<boolean> => {
    const saved = await credentialStorage.load();
    if (!saved) return false;

    try {
      await initializeCore();
      setLastUsedCredentials(saved);
      await sipNative.register({
        sipDomain: saved.sipDomain,
        username: saved.username,
        password: saved.password,
        transport: saved.transport,
      });
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await credentialStorage.clear();
    await unregisterAccount();
    setLastUsedCredentials(null);
  };

  const unregisterAccount = async () => {
    await initializeCore();
    await sipNative.unregister();
  };

  const startCall = async (to: string) => {
    await initializeCore();

    const next: SipCallSnapshot = {
      state: 'outgoing',
      message: 'Calling...',
      remoteUri: to,
      direction: 'Outgoing',
      lastUpdatedAtMs: nowMs(),
    };
    setCall(next);

    await sipNative.startCall({ to });
  };

  const hangUp = async () => {
    await initializeCore();
    await sipNative.hangup();
    // NÃO setar estado manualmente aqui.
    // O listener onCallStateChanged do nativo vai emitir 'ended'
    // e o sipStore vai atualizar automaticamente.
  };

  const setMuted = async (isMuted: boolean) => {
    await initializeCore();
    await sipNative.setMute(isMuted); // wrapper já manda { muted }
  };

  const setSpeakerEnabled = async (isSpeakerEnabled: boolean) => {
    await initializeCore();
    await sipNative.setSpeaker(isSpeakerEnabled); // wrapper já manda { speakerOn }
  };

  const acceptCall = async () => {
    await initializeCore();
    await sipNative.acceptCall();
  };

  const declineCall = async () => {
    await initializeCore();
    try {
      await sipNative.declineCall();
    } finally {
      const next: SipCallSnapshot = {
        state: 'ended',
        message: 'Call declined',
        remoteUri: null,
        direction: null,
        lastUpdatedAtMs: nowMs(),
      };
      setCall(next);
    }
  };

  const storeValue = useMemo<SipStoreState>(() => {
    return {
      isCoreInitialized,
      lastUsedCredentials,
      registration,
      call,
      actions: {
        initializeCore,
        registerAccount,
        unregisterAccount,
        autoLogin,
        logout,
        startCall,
        hangUp,
        setMuted,
        setSpeakerEnabled,
        acceptCall,
        declineCall,
      },
    };
  }, [isCoreInitialized, lastUsedCredentials, registration, call]);

  return (
    <SipStoreContext.Provider value={storeValue}>
      {children}
    </SipStoreContext.Provider>
  );
};

export const useSipStore = (): SipStoreState => {
  const context = useContext(SipStoreContext);
  if (!context) throw new Error('useSipStore must be used within SipStoreProvider');
  return context;
};