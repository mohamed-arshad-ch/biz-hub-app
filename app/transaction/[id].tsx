import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity 
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from "lucide-react-native";

import { getTransactionById } from "@/mocks/dashboardData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Get transaction details
  const transaction = getTransactionById(id);
  
  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Transaction not found</Text>
        <TouchableOpacity 
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const { 
    type, 
    amount, 
    date, 
    description, 
    customer, 
    vendor, 
    paymentMethod, 
    reference,
    notes
  } = transaction;
  
  const isIncome = type === "sale";
  const iconColor = isIncome ? "#34a853" : "#ea4335";
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: "Transaction Details",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}10` }]}>
            {isIncome ? (
              <ArrowUpRight size={32} color={iconColor} />
            ) : (
              <ArrowDownLeft size={32} color={iconColor} />
            )}
          </View>
          
          <Text style={styles.transactionType}>
            {isIncome ? "Sale" : "Purchase"}
          </Text>
          
          <Text style={[styles.amount, { color: iconColor }]}>
            {isIncome ? "+" : "-"}{formatCurrency(amount)}
          </Text>
          
          <Text style={styles.date}>
            {formatDate(date)}
          </Text>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{description}</Text>
          </View>
          
          {isIncome && customer && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>{customer}</Text>
            </View>
          )}
          
          {!isIncome && vendor && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vendor</Text>
              <Text style={styles.detailValue}>{vendor}</Text>
            </View>
          )}
          
          {paymentMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{paymentMethod}</Text>
            </View>
          )}
          
          {reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>{reference}</Text>
            </View>
          )}
          
          {notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  backButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ea4335",
    marginBottom: 16,
  },
  backLink: {
    padding: 12,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 16,
  },
  header: {
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionType: {
    fontSize: 16,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: "#666",
  },
  detailsContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
});