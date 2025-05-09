import React, { ReactNode, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  TouchableOpacity,
  Alert,
  Platform
} from "react-native";
import { Swipeable, RectButton } from "react-native-gesture-handler";

interface ActionProps {
  text: string;
  icon: ReactNode;
  backgroundColor: string;
  onPress: () => void;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface SwipeableActionsProps {
  children: ReactNode;
  leftActions?: ActionProps[];
  rightActions?: ActionProps[];
  confirmationThreshold?: number;
  enabled?: boolean;
}

export default function SwipeableActions({ 
  children, 
  leftActions = [], 
  rightActions = [], 
  confirmationThreshold = 0.5,
  enabled = true
}: SwipeableActionsProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleAction = (action: ActionProps) => {
    swipeableRef.current?.close();
    
    if (action.requiresConfirmation) {
      Alert.alert(
        "Confirm Action",
        action.confirmationMessage || "Are you sure you want to perform this action?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Confirm",
            style: action.backgroundColor === "#ea4335" ? "destructive" : "default",
            onPress: action.onPress
          }
        ]
      );
    } else {
      action.onPress();
    }
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (leftActions.length === 0 || !enabled) return null;

    return (
      <View style={styles.leftActionsContainer}>
        {leftActions.map((action, index) => {
          const trans = dragX.interpolate({
            inputRange: [0, 50, 100, 101],
            outputRange: [-20, 0, 0, 1],
            extrapolate: "clamp",
          });

          const pressHandler = () => handleAction(action);

          return (
            <Animated.View 
              key={index} 
              style={[
                styles.actionContainer, 
                { 
                  backgroundColor: action.backgroundColor,
                  transform: [{ translateX: trans }],
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={pressHandler}
              >
                <View style={styles.actionIconContainer}>
                  {action.icon}
                </View>
                <Text style={styles.actionText}>{action.text}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (rightActions.length === 0 || !enabled) return null;

    return (
      <View style={styles.rightActionsContainer}>
        {rightActions.map((action, index) => {
          const trans = dragX.interpolate({
            inputRange: [-101, -100, -50, 0],
            outputRange: [1, 0, 0, 20],
            extrapolate: "clamp",
          });

          // Use progress to determine if we've swiped far enough for auto-confirmation
          const swipeProgress = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          });

          const pressHandler = () => handleAction(action);

          return (
            <Animated.View 
              key={index} 
              style={[
                styles.actionContainer, 
                { 
                  backgroundColor: action.backgroundColor,
                  transform: [{ translateX: trans }],
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={pressHandler}
              >
                <View style={styles.actionIconContainer}>
                  {action.icon}
                </View>
                <Text style={styles.actionText}>{action.text}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const onSwipeableOpen = (direction: "left" | "right") => {
    // Auto-close the swipeable after a short delay
    setTimeout(() => {
      swipeableRef.current?.close();
    }, 1000);
    
    // For delete actions (usually on the right), we could add confirmation here
    if (direction === "right" && rightActions.length > 0) {
      const deleteAction = rightActions.find(action => 
        action.text.toLowerCase() === "delete" || 
        action.backgroundColor === "#ea4335"
      );
      
      if (deleteAction && deleteAction.requiresConfirmation) {
        handleAction(deleteAction);
      }
    }
  };

  // On web, we don't use Swipeable
  if (Platform.OS === "web" || !enabled) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={onSwipeableOpen}
      friction={2}
      leftThreshold={30}
      rightThreshold={30}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftActionsContainer: {
    flexDirection: "row",
  },
  rightActionsContainer: {
    flexDirection: "row-reverse",
  },
  actionContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 100,
  },
  actionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  actionIconContainer: {
    marginBottom: 4,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});