import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: spacing.xl },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },

  input: {
    height: 54,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    borderColor: colors.border,
    backgroundColor: '#0E141D',
    paddingHorizontal: spacing.md,
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
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    backgroundColor: '#1A2536',
  },

  buttonText: { color: colors.textPrimary, fontWeight: '900' },
  buttonTextSecondary: { color: colors.textSecondary, fontWeight: '900' },

  smallStatus: { marginTop: spacing.md, color: colors.textSecondary },
});