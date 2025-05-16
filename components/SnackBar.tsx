import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Colors from '@/constants/colors';

export interface SnackBarProps {
  visible: boolean;
  message: string;
  action?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export default function SnackBar({ visible, message, action, onAction, onDismiss }: SnackBarProps) {
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 14,
  },
  action: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
  dismissText: {
    color: Colors.light.tabIconDefault,
    fontSize: 16,
  },
});