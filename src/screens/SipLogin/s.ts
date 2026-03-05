import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
    title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', marginTop: spacing.xl },
    subtitle: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },

    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },

    label: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.md, marginBottom: spacing.xs },
    input: {
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        color: colors.textPrimary,
        backgroundColor: '#0E141D',
    },

    row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    chip: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E141D',
    },
    chipActive: { borderColor: colors.primary, backgroundColor: '#0E1B33' },
    chipText: { color: colors.textSecondary, fontWeight: '700' },
    chipTextActive: { color: colors.textPrimary },

    button: {
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        backgroundColor: colors.primary,
    },
    buttonText: { color: colors.textPrimary, fontWeight: '800' },

    statusLine: { marginTop: spacing.md, color: colors.textSecondary },
});