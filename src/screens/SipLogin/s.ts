import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
    subtitle: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
    title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', marginTop: spacing.xl },

    card: {
        borderWidth: 1,
        borderRadius: 16,
        padding: spacing.lg,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },

    label: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.md, marginBottom: spacing.xs },
    input: {
        height: 46,
        borderWidth: 1,
        borderRadius: 12,
        color: colors.textPrimary,
        borderColor: colors.border,
        backgroundColor: '#0E141D',
        paddingHorizontal: spacing.md,
    },

    row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    chip: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.border,
        backgroundColor: '#0E141D',
    },
    chipTextActive: { color: colors.textPrimary },
    chipText: { color: colors.textSecondary, fontWeight: '700' },
    chipActive: { borderColor: colors.primary, backgroundColor: '#0E1B33' },

    button: {
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: spacing.xl,
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
    buttonText: { color: colors.textPrimary, fontWeight: '800' },

    statusLine: { marginTop: spacing.md, color: colors.textSecondary },
});