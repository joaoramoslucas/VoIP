import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: spacing.xl },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: '#0E141D',
    fontSize: 16,
    fontWeight: '700',
  },

  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },

  buttonPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
  },
  buttonSecondary: {
    width: 120,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2536',
    borderWidth: 1,
    borderColor: colors.border,
  },

  buttonText: { color: colors.textPrimary, fontWeight: '900' },
  buttonTextSecondary: { color: colors.textSecondary, fontWeight: '900' },

  smallStatus: { marginTop: spacing.md, color: colors.textSecondary },
});