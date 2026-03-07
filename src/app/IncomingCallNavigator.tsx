import { useEffect, useRef } from 'react';
import { navigateToCall, navigationRef } from './navigationRef';
import { DeviceEventEmitter } from 'react-native';
import { useSipStore } from '../state/sip/sipStore';

/**
 * Polls every 150ms until the navigator is ready, then navigates to Call.
 * Used when the app wakes from dead state — the navigator may still be on Splash.
 */
function navigateToCallWhenReady(maxWaitMs = 10000) {
    const startedAt = Date.now();
    const attempt = () => {
        if (navigationRef.isReady()) {
            // Only navigate if not already on Call
            const currentRoute = navigationRef.getCurrentRoute();
            if (currentRoute?.name !== 'Call') {
                navigateToCall();
            }
            return;
        }
        if (Date.now() - startedAt < maxWaitMs) {
            setTimeout(attempt, 150);
        }
    };
    attempt();
}

/** States that mean "a call needs the CallScreen" */
const ACTIVE_CALL_STATES = new Set(['incoming', 'connected', 'outgoing']);

/**
 * Invisible component — auto-navigates to CallScreen whenever a call becomes active.
 *
 * Scenarios:
 * 1. Foreground: call.state → 'incoming' or 'outgoing'
 * 2. BG/FG notification accept: state → 'connected'
 * 3. Dead app: JS starts 'idle', native events fire later → catches idle → connected
 *    (SplashScreen is also a backup via callStateRef after DrawerHome mounts)
 */
export function IncomingCallNavigator() {
    const { call } = useSipStore();
    const previousStateRef = useRef(call.state);
    // NEVER pre-mark as handled at mount — we want both IncomingCallNavigator
    // AND SplashScreen to be able to trigger navigation (idempotent navigate('Call'))
    const hasNavigatedRef = useRef(false);

    useEffect(() => {
        const prevState = previousStateRef.current;
        previousStateRef.current = call.state;

        // Any non-active → active transition = open CallScreen
        if (ACTIVE_CALL_STATES.has(call.state) && !ACTIVE_CALL_STATES.has(prevState)) {
            if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                navigateToCallWhenReady();
            }
        }

        // Connected after incoming — accepted in-app (already on CallScreen, but ensure)
        if (call.state === 'connected' && prevState === 'incoming') {
            // Already on CallScreen, CallScreen handles the UI update — no navigation needed
        }

        // Reset guard when call ends so future calls work
        if (call.state === 'ended' || call.state === 'error' || call.state === 'idle') {
            hasNavigatedRef.current = false;
        }
    }, [call.state]);

    // Native event backup — incoming call while app was in background
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('onIncomingCall', () => {
            if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                navigateToCallWhenReady();
            }
        });
        return () => sub.remove();
    }, []);

    return null;
}
