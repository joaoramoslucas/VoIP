import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 68;
const HANGUP_SIZE = 72;
const AVATAR_SIZE = 100;
const INCOMING_CIRCLE = 72;

export const s = StyleSheet.create({
    screen: {
        flex: 1,
        paddingTop: 60,
        backgroundColor: '#0B0F14',
    },
    /* ───── Caller Info Section ───── */
    callerSection: {
        flex: 1,
        paddingTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        elevation: 10,
        borderWidth: 3,
        marginBottom: 20,
        shadowRadius: 15,
        width: AVATAR_SIZE,
        shadowOpacity: 0.5,
        height: AVATAR_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F8CFF',
        borderColor: '#4F8CFF',
        backgroundColor: '#1E3A5F',
        borderRadius: AVATAR_SIZE / 2,
        shadowOffset: { width: 0, height: 0 },
    },
    avatarIncoming: {
        borderColor: '#20D17A',
        shadowColor: '#20D17A',
        backgroundColor: '#1E3F2E',
    },
    avatarConnected: {
        borderColor: '#20D17A',
        shadowColor: '#20D17A',
        backgroundColor: '#1E3A5F',
    },
    avatarEnded: {
        borderColor: '#FF4D4D',
        shadowColor: '#FF4D4D',
        backgroundColor: '#3A1E1E',
    },
    avatarText: {
        fontSize: 36,
        letterSpacing: 2,
        fontWeight: '800',
        color: '#EAF0FF',
    },
    callerName: {
        fontSize: 26,
        marginBottom: 6,
        fontWeight: '700',
        color: '#EAF0FF',
        textAlign: 'center',
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
        marginTop: 12,
        letterSpacing: 4,
        fontWeight: '300',
        color: '#EAF0FF',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    bottomSection: {
        paddingBottom: 50,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    controlGrid: {
        gap: 32,
        marginBottom: 40,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    controlItem: {
        alignItems: 'center',
    },
    controlCircle: {
        borderWidth: 1,
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        alignItems: 'center',
        borderColor: '#223047',
        justifyContent: 'center',
        borderRadius: CIRCLE_SIZE / 2,
        backgroundColor: '#1A2536',
    },
    controlCircleActive: {
        elevation: 6,
        shadowRadius: 10,
        shadowOpacity: 0.4,
        borderColor: '#4F8CFF',
        shadowColor: '#4F8CFF',
        backgroundColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 0 },
    },
    controlIcon: {
        fontSize: 24,
    },
    controlLabel: {
        fontSize: 11,
        marginTop: 8,
        fontWeight: '600',
        color: '#AAB6D3',
    },
    /* ───── Hangup Button ───── */
    hangupCircle: {
        elevation: 8,
        shadowRadius: 12,
        shadowOpacity: 0.5,
        width: HANGUP_SIZE,
        height: HANGUP_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF4D4D',
        backgroundColor: '#FF4D4D',
        borderRadius: HANGUP_SIZE / 2,
        transform: [{ rotate: '135deg' }],
        shadowOffset: { width: 0, height: 4 },
    },
    hangupIcon: {
        fontSize: 28,
    },
    hangupLabel: {
        fontSize: 12,
        marginTop: 10,
        fontWeight: '700',
        color: '#FF4D4D',
    },
    /* ───── Incoming Call Actions ───── */
    incomingActions: {
        gap: 80,
        marginBottom: 40,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    incomingActionItem: {
        alignItems: 'center',
    },
    declineCircle: {
        elevation: 8,
        shadowRadius: 12,
        shadowOpacity: 0.5,
        alignItems: 'center',
        width: INCOMING_CIRCLE,
        height: INCOMING_CIRCLE,
        justifyContent: 'center',
        shadowColor: '#FF4D4D',
        backgroundColor: '#FF4D4D',
        borderRadius: INCOMING_CIRCLE / 2,
        shadowOffset: { width: 0, height: 4 },
    },
    acceptCircle: {
        elevation: 8,
        shadowRadius: 12,
        shadowOpacity: 0.5,
        alignItems: 'center',
        width: INCOMING_CIRCLE,
        height: INCOMING_CIRCLE,
        justifyContent: 'center',
        shadowColor: '#20D17A',
        backgroundColor: '#20D17A',
        borderRadius: INCOMING_CIRCLE / 2,
        shadowOffset: { width: 0, height: 4 },
    },
    actionIcon: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    actionLabel: {
        fontSize: 13,
        marginTop: 10,
        fontWeight: '700',
        color: '#AAB6D3',
    },
    /* ───── DTMF Keypad ───── */
    keypad: {
        gap: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    keypadRow: {
        gap: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    keypadBtn: {
        width: 70,
        height: 70,
        borderWidth: 1,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#223047',
        backgroundColor: '#1A2536',
    },
    keypadText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#EAF0FF',
    },
});