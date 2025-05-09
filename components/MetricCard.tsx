import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { 
  TrendingUp, 
  ShoppingCart, 
  Calendar, 
  Activity,
  DollarSign,
  BarChart
} from "lucide-react-native";

type IconName = "trending-up" | "shopping-cart" | "calendar" | "activity" | "dollar-sign" | "bar-chart";

interface MetricCardProps {
  title: string;
  value: string;
  icon: IconName;
  color: string;
}

export function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const renderIcon = () => {
    const iconProps = { size: 24, color: color, strokeWidth: 2 };
    
    switch (icon) {
      case "trending-up":
        return <TrendingUp {...iconProps} />;
      case "shopping-cart":
        return <ShoppingCart {...iconProps} />;
      case "calendar":
        return <Calendar {...iconProps} />;
      case "activity":
        return <Activity {...iconProps} />;
      case "dollar-sign":
        return <DollarSign {...iconProps} />;
      case "bar-chart":
        return <BarChart {...iconProps} />;
      default:
        return <BarChart {...iconProps} />;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        {renderIcon()}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});