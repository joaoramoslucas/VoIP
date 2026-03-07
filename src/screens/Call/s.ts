import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 68;
const HANGUP_SIZE = 72;
const AVATAR_SIZE = 100;
const INCOMING_CIRCLE = 72;

export const s = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0B0F14',
        paddingTop: 60,
    },

    /* ───── Caller Info Section ───── */
    callerSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },

    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: '#1E3A5F',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#4F8CFF',
        // Glow effect
        shadowColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarIncoming: {
        borderColor: '#20D17A',
        backgroundColor: '#1E3F2E',
        shadowColor: '#20D17A',
    },
    avatarConnected: {
        borderColor: '#20D17A',
        backgroundColor: '#1E3A5F',
        shadowColor: '#20D17A',
    },
    avatarEnded: {
        borderColor: '#FF4D4D',
        backgroundColor: '#3A1E1E',
        shadowColor: '#FF4D4D',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#EAF0FF',
        letterSpacing: 2,
    },

    callerName: {
        fontSize: 26,
        fontWeight: '700',
        color: '#EAF0FF',
        textAlign: 'center',
        marginBottom: 6,
    },

    callStatus: {
        fontSize: 15,
        color: '#AAB6D3',
        textAlign: 'center',
    },
    callStatusConnected: {
        color: '#20D17A',
    },
    callStatusEnded: {
        color: '#FF4D4D',
    },

    timerText: {
        fontSize: 40,
        fontWeight: '300',
        color: '#EAF0FF',
        textAlign: 'center',
        marginTop: 12,
        letterSpacing: 4,
        fontVariant: ['tabular-nums'],
    },

    /* ───── Bottom Section ───── */
    bottomSection: {
        paddingBottom: 50,
        paddingHorizontal: 20,
        alignItems: 'center',
    },

    /* ───── In-Call Controls Grid ───── */
    controlGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 40,
    },

    controlItem: {
        alignItems: 'center',
    },

    controlCircle: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        backgroundColor: '#1A2536',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#223047',
    },
    controlCircleActive: {
        backgroundColor: '#4F8CFF',
        borderColor: '#4F8CFF',
        shadowColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },

    controlIcon: {
        fontSize: 24,
    },

    controlLabel: {
        fontSize: 11,
        color: '#AAB6D3',
        marginTop: 8,
        fontWeight: '600',
    },

    /* ───── Hangup Button ───── */
    hangupCircle: {
        width: HANGUP_SIZE,
        height: HANGUP_SIZE,
        borderRadius: HANGUP_SIZE / 2,
        backgroundColor: '#FF4D4D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF4D4D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
        transform: [{ rotate: '135deg' }],
    },

    hangupIcon: {
        fontSize: 28,
    },

    hangupLabel: {
        fontSize: 12,
        color: '#FF4D4D',
        marginTop: 10,
        fontWeight: '700',
    },

    /* ───── Incoming Call Actions ───── */
    incomingActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 80,
        marginBottom: 40,
    },

    incomingActionItem: {
        alignItems: 'center',
    },

    declineCircle: {
        width: INCOMING_CIRCLE,
        height: INCOMING_CIRCLE,
        borderRadius: INCOMING_CIRCLE / 2,
        backgroundColor: '#FF4D4D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF4D4D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },

    acceptCircle: {
        width: INCOMING_CIRCLE,
        height: INCOMING_CIRCLE,
        borderRadius: INCOMING_CIRCLE / 2,
        backgroundColor: '#20D17A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#20D17A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },

    actionIcon: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
    },

    actionLabel: {
        fontSize: 13,
        color: '#AAB6D3',
        marginTop: 10,
        fontWeight: '700',
    },
});