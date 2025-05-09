import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2 } from 'lucide-react-native';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#1a73e8', '#0d47a1']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Building2 size={80} color="#ffffff" strokeWidth={1.5} />
        
        <Text style={styles.title}>BizHub</Text>
        <Text style={styles.tagline}>Business Management Simplified</Text>
        
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 8,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  loaderContainer: {
    marginTop: 40,
  }
});