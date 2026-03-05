import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

        acceptCall: () => Promise<void>;
        declineCall: () => Promise<void>;

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

    const didSubscribeRef = useRef(false);

    useEffect(() => {
        if (didSubscribeRef.current) return;
        didSubscribeRef.current = true;

        const registrationSubscription = sipEvents.onRegistrationStateChanged((payload) => {
            setRegistration({
                state: payload.state,
                message: payload.message ?? '',
                lastUpdatedAtMs: nowMs(),
            });
        });

        const callSubscription = sipEvents.onCallStateChanged((payload) => {
            setCall((previous) => ({
                ...previous,
                state: payload.state,
                message: payload.message ?? '',
                lastUpdatedAtMs: nowMs(),
            }));
        });

        const incomingSubscription = sipEvents.onIncomingCall((payload) => {
            setCall({
                state: 'incoming',
                message: 'Incoming call',
                remoteUri: payload.remote ?? null,
                direction: 'Incoming',
                lastUpdatedAtMs: nowMs(),
            });
        });

        return () => {
            registrationSubscription.remove();
            callSubscription.remove();
            incomingSubscription.remove();
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
        await sipNative.register(credentials);
    };

    const unregisterAccount = async () => {
        await initializeCore();
        await sipNative.unregister();
    };

    const startCall = async (to: string) => {
        await initializeCore();
        setCall({
            state: 'outgoing',
            message: 'Calling...',
            remoteUri: to,
            direction: 'Outgoing',
            lastUpdatedAtMs: nowMs(),
        });
        await sipNative.startCall({ to });
    };

    const hangUp = async () => {
        await initializeCore();
        try {
            await sipNative.hangUp();
        } finally {
            setCall({
                state: 'ended',
                message: 'Call ended',
                remoteUri: null,
                direction: null,
                lastUpdatedAtMs: nowMs(),
            });
        }
    };

    const acceptCall = async () => {
        await initializeCore();
        await sipNative.acceptCall();
    };

    const declineCall = async () => {
        await initializeCore();
        await sipNative.declineCall();
        setCall({
            state: 'ended',
            message: 'Declined',
            remoteUri: null,
            direction: null,
            lastUpdatedAtMs: nowMs(),
        });
    };

    const setMuted = async (isMuted: boolean) => {
        await initializeCore();
        await sipNative.toggleMute({ isMuted });
    };

    const setSpeakerEnabled = async (isSpeakerEnabled: boolean) => {
        await initializeCore();
        await sipNative.toggleSpeaker({ isSpeakerEnabled });
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
                acceptCall,
                declineCall,
                setMuted,
                setSpeakerEnabled,
            },
        };
    }, [isCoreInitialized, lastUsedCredentials, registration, call]);

    return (
        <SipStoreContext.Provider value={ storeValue }>
             { children } 
        </SipStoreContext.Provider>
    );
};

export const useSipStore = (): SipStoreState => {
    const context = useContext(SipStoreContext);
    if (!context) throw new Error('useSipStore must be used within SipStoreProvider');
    return context;
};