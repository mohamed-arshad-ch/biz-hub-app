import React, { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View, Animated, Dimensions } from "react-native";
import Colors from "@/constants/colors";

interface FloatingActionButtonProps {
  icon: ReactNode;
  onPress: () => void;
  color?: string;
  position?: "bottomRight" | "bottomCenter" | "bottomLeft";
}

export default function FloatingActionButton({ 
  icon, 
  onPress, 
  color = Colors.primary,
  position = "bottomRight"
}: FloatingActionButtonProps) {
  const getPositionStyle = () => {
    switch (position) {
      case "bottomCenter":
        return styles.bottomCenter;
      case "bottomLeft":
        return styles.bottomLeft;
      case "bottomRight":
      default:
        return styles.bottomRight;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        getPositionStyle(),
        { backgroundColor: color }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon}
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomRight: {
    bottom: 24,
    right: 24,
  },
  bottomCenter: {
    bottom: 24,
    alignSelf: "center",
  },
  bottomLeft: {
    bottom: 24,
    left: 24,
  },
});