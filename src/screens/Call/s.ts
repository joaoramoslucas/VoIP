import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },

    header: { marginTop: spacing.xl },
    subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
    title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },

    centerCard: {
        borderWidth: 1,
        borderRadius: 18,
        padding: spacing.xl,
        marginTop: spacing.xl,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },

    remoteText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
    stateText: { color: colors.textSecondary, marginTop: spacing.sm },

    controlsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
    controlButton: {
        flex: 1,
        height: 52,
        borderWidth: 1,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.border,
        backgroundColor: '#1A2536',
    },
    controlText: { color: colors.textPrimary, fontWeight: '900' },

    endButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: spacing.lg,
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