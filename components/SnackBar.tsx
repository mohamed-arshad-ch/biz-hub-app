import React, { useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  TouchableOpacity, 
  Dimensions
} from "react-native";

interface SnackBarProps {
  visible: boolean;
  message: string;
  action?: string;
  duration?: number;
  onActionPress?: () => void;
  onDismiss: () => void;
}

export default function SnackBar({ 
  visible, 
  message, 
  action, 
  duration = 4000,
  onActionPress,
  onDismiss
}: SnackBarProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Show snackbar
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto-hide after duration
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      // Hide snackbar
      handleDismiss();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, message]);
  
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };
  
  if (!visible && opacity._value === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      
      {action && onActionPress && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onActionPress}
        >
          <Text style={styles.actionText}>{action}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(50, 50, 50, 0.9)",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: width - 32,
  },
  message: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: "#4caf50",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});