import { StyleSheet } from "react-native";


export const s = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  card: { padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 },
  label: { fontSize: 12, opacity: 0.8, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  secondary: { opacity: 0.8 },
  danger: { opacity: 0.9 },
  buttonText: { fontWeight: '700' },
  logLine: { fontSize: 12, marginBottom: 6 },
});