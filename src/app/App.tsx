import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { SipDebugScreen } from '../screens/SipDebugScreen';

export function AppRoot() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="default" />
      <SipDebugScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});