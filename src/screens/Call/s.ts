import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },

    header: { marginTop: spacing.xl },
    title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
    subtitle: { color: colors.textSecondary, marginTop: spacing.xs },

    centerCard: {
        marginTop: spacing.xl,
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },

    remoteText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
    stateText: { color: colors.textSecondary, marginTop: spacing.sm },

    controlsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
    controlButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A2536',
        borderWidth: 1,
        borderColor: colors.border,
    },
    controlText: { color: colors.textPrimary, fontWeight: '900' },

    endButton: {
        marginTop: spacing.lg,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.danger,
    },

    incomingRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    acceptButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
    },
    declineButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.danger,
    },
});