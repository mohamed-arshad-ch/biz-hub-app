import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Grid, List } from "lucide-react-native";

import Colors from "@/constants/colors";

interface GridToggleProps {
  viewMode: "grid" | "list";
  onToggle: () => void;
}

export default function GridToggle({ viewMode, onToggle }: GridToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          styles.leftButton,
          viewMode === "list" && styles.activeButton
        ]}
        onPress={() => viewMode === "grid" && onToggle()}
      >
        <List 
          size={20} 
          color={viewMode === "list" ? "#fff" : "#666"} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.toggleButton,
          styles.rightButton,
          viewMode === "grid" && styles.activeButton
        ]}
        onPress={() => viewMode === "list" && onToggle()}
      >
        <Grid 
          size={20} 
          color={viewMode === "grid" ? "#fff" : "#666"} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  leftButton: {
    marginRight: 2,
  },
  rightButton: {
    marginLeft: 2,
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
});