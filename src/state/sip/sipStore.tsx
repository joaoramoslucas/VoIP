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
  SipAccountCredentials,
  SipCallSnapshot,
  SipRegistrationSnapshot,
} from '../../services/sip/sipTypes';

import { sipNative } from '../../services/sip/sipNative';
import { sipEvents } from '../../services/sip/sipEvents';

type SipStoreState = {
  isCoreInitialized: boolean;
  lastUsedCredentials: SipAccountCredentials | null;

  registration: SipRegistrationSnapshot;
  call: SipCallSnapshot;

  actions: {
    initializeCore: () => Promise<void>;
    registerAccount: (credentials: SipAccountCredentials) => Promise<void>;
    unregisterAccount: () => Promise<void>;
    startCall: (to: string) => Promise<void>;
    hangUp: () => Promise<void>;
    setMuted: (isMuted: boolean) => Promise<void>;
    setSpeakerEnabled: (isSpeakerEnabled: boolean) => Promise<void>;
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
          lastUpdatedAtMs: nowMs(),
        };
        return next;
      });
    });

    const incomingSub = sipEvents.onIncomingCall((payload) => {
      const next: SipCallSnapshot = {
        state: 'incoming',
        message: 'Incoming call',
        remoteUri: payload.from ?? null, // ✅ é "from" no Kotlin
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
    try {
      await sipNative.hangup(); // ✅ nome real do Kotlin
    } finally {
      const next: SipCallSnapshot = {
        state: 'ended',
        message: 'Call ended',
        remoteUri: null,
        direction: null,
        lastUpdatedAtMs: nowMs(),
      };
      setCall(next);
    }
  };

  const setMuted = async (isMuted: boolean) => {
    await initializeCore();
    await sipNative.setMute(isMuted); // wrapper já manda { muted }
  };

  const setSpeakerEnabled = async (isSpeakerEnabled: boolean) => {
    await initializeCore();
    await sipNative.setSpeaker(isSpeakerEnabled); // wrapper já manda { speakerOn }
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
        startCall,
        hangUp,
        setMuted,
        setSpeakerEnabled,
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