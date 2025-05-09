import React, { useState, useCallback } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  RefreshControl,
  TouchableOpacity
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { TransactionItem } from "@/components/TransactionItem";
import { getAllTransactions } from "@/mocks/dashboardData";
import Colors from "@/constants/colors";

export default function TransactionsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState(getAllTransactions());

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setTransactions(getAllTransactions());
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleTransactionPress = (id: string) => {
    router.push(`/transaction/${id}`);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Transactions",
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
      
      <View style={styles.container}>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem 
              transaction={item}
              onPress={() => handleTransactionPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions found</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "#999",
    fontSize: 16,
  },
});