import { StyleSheet } from "react-native";


export const s = StyleSheet.create({
  danger: {
    opacity: 0.9,
  },
  secondary: {
    opacity: 0.8,
  },
  buttonText: {
    fontWeight: '700',
  },
  row: {
    gap: 10,
    flexDirection: 'row',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  logLine: {
    fontSize: 12,
    marginBottom: 6,
  },
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  label: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '600',
  },
  card: {
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
});