import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react-native";

import { Transaction } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { type, amount, date, description } = transaction;
  
  const isIncome = type === "sale";
  const iconColor = isIncome ? "#34a853" : "#ea4335";
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}10` }]}>
        {isIncome ? (
          <ArrowUpRight size={20} color={iconColor} />
        ) : (
          <ArrowDownLeft size={20} color={iconColor} />
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
        <Text style={styles.date}>{formatDate(date)}</Text>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount, 
          { color: isIncome ? "#34a853" : "#ea4335" }
        ]}>
          {isIncome ? "+" : "-"}{formatCurrency(amount)}
        </Text>
        <Text style={styles.type}>
          {isIncome ? "Sale" : "Purchase"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: "#888",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  type: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
  },
});