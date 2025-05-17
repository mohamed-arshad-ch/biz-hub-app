import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { 
  ShoppingCart, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight,
  BarChart,
  Users,
  Building,
  Package,
  Plus
} from "lucide-react-native";

import Colors from "@/constants/colors";

type IconName = "shopping-cart" | "trending-up" | "arrow-down-left" | "arrow-up-right" | "bar-chart" | "users" | "building" | "package";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: IconName | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const getIconComponent = (iconName: IconName) => {
  switch (iconName) {
    case "shopping-cart":
      return <ShoppingCart size={48} color={Colors.primary} />;
    case "trending-up":
      return <TrendingUp size={48} color={Colors.primary} />;
    case "arrow-down-left":
      return <ArrowDownLeft size={48} color={Colors.primary} />;
    case "arrow-up-right":
      return <ArrowUpRight size={48} color={Colors.primary} />;
    case "bar-chart":
      return <BarChart size={48} color={Colors.primary} />;
    case "users":
      return <Users size={48} color={Colors.primary} />;
    case "building":
      return <Building size={48} color={Colors.primary} />;
    case "package":
      return <Package size={48} color={Colors.primary} />;
    default:
      return null;
  }
};

export default function EmptyState({ 
  title, 
  description, 
  icon,
  actionLabel,
  onAction
}: EmptyStateProps) {
  const iconComponent = typeof icon === 'string' ? getIconComponent(icon as IconName) : icon;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {iconComponent}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onAction}
        >
          <Plus size={16} color="#fff" style={styles.actionIcon} />
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 300,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});