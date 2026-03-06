import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  danger: { opacity: 0.9 },
  secondary: { opacity: 0.8 },
  buttonText: { fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  logLine: { fontSize: 12, marginBottom: 6 },
  container: { flex: 1, padding: 16, gap: 12 },
  label: { fontSize: 12, opacity: 0.8, fontWeight: '600' },
  card: { padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
});