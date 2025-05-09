import React, { useState, useCallback } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ArrowUpDown,
  Edit,
  Trash
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getExpensesData, deleteExpense } from "@/mocks/expensesData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ExpenseRecord } from "@/types/expenses";
import EmptyState from "@/components/EmptyState";
import FloatingActionButton from "@/components/FloatingActionButton";
import SwipeableActions from "@/components/SwipeableActions";
import SnackBar from "@/components/SnackBar";

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState(getExpensesData());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedExpense, setDeletedExpense] = useState<ExpenseRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setExpenses(getExpensesData());
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSort = (order: "newest" | "oldest" | "highest" | "lowest") => {
    setSortOrder(order);
    setShowSortOptions(false);
  };

  const handleAddExpense = () => {
    router.push("/expenses/new");
  };

  const handleEditExpense = (id: string) => {
    router.push(`/expenses/edit/${id}`);
  };

  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(expense => expense.id === id);
    if (!expenseToDelete) return;
    
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete this expense for ${expenseToDelete.description}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete(id, expenseToDelete)
        }
      ]
    );
  };

  const performDelete = async (id: string, expenseToDelete: ExpenseRecord) => {
    setDeletingId(id);
    setDeletedExpense(expenseToDelete);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Delete the expense
      const success = deleteExpense(id);
      
      if (success) {
        // Update the local state
        setExpenses(expenses.filter(expense => expense.id !== id));
        
        // Show snackbar with undo option
        setSnackBarMessage(`Expense for ${expenseToDelete.description} deleted`);
        setSnackBarVisible(true);
      } else {
        throw new Error("Failed to delete expense");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to delete expense. Please try again.",
        [
          { text: "OK" },
          { 
            text: "Retry", 
            onPress: () => performDelete(id, expenseToDelete) 
          }
        ]
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUndoDelete = () => {
    if (!deletedExpense) return;
    
    // In a real app, this would restore the deleted expense in the database
    // For now, we'll just add it back to the local state
    setExpenses(prevExpenses => [...prevExpenses, deletedExpense]);
    
    // Show a confirmation message
    if (Platform.OS === "android") {
      ToastAndroid.show("Expense restored", ToastAndroid.SHORT);
    } else {
      Alert.alert("Expense Restored", "The expense has been restored successfully.");
    }
    
    setSnackBarVisible(false);
  };

  const handleViewExpense = (id: string) => {
    router.push(`/expenses/${id}`);
  };

  const handleLongPressExpense = (expense: ExpenseRecord) => {
    Alert.alert(
      `Expense: ${expense.description}`,
      "Choose an action",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "View Details", 
          onPress: () => handleViewExpense(expense.id)
        },
        { 
          text: "Edit", 
          onPress: () => handleEditExpense(expense.id)
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => handleDeleteExpense(expense.id)
        }
      ]
    );
  };

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter(expense => {
    const searchLower = searchQuery.toLowerCase();
    return (
      expense.description.toLowerCase().includes(searchLower) ||
      expense.category.toLowerCase().includes(searchLower) ||
      formatCurrency(expense.amount).toLowerCase().includes(searchLower) ||
      formatDate(expense.date).toLowerCase().includes(searchLower)
    );
  });

  // Sort expenses based on selected order
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "highest":
        return b.amount - a.amount;
      case "lowest":
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  const renderExpenseItem = ({ item }: { item: ExpenseRecord }) => {
    const isDeleting = deletingId === item.id;
    
    if (isDeleting) {
      return (
        <View style={styles.deletingItemContainer}>
          <ActivityIndicator size="small" color="#ea4335" />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      );
    }
    
    return (
      <SwipeableActions
        leftActions={[
          {
            text: "Edit",
            icon: <Edit size={20} color="#fff" />,
            backgroundColor: "#1a73e8",
            onPress: () => handleEditExpense(item.id),
          }
        ]}
        rightActions={[
          {
            text: "Delete",
            icon: <Trash size={20} color="#fff" />,
            backgroundColor: "#ea4335",
            onPress: () => handleDeleteExpense(item.id),
          }
        ]}
      >
        <TouchableOpacity
          style={styles.expenseItem}
          onPress={() => handleViewExpense(item.id)}
          onLongPress={() => handleLongPressExpense(item)}
          activeOpacity={0.7}
        >
          <View style={styles.expenseDetails}>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.categoryName}>{item.category}</Text>
            <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
          </View>
          
          <View style={styles.expenseAmount}>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableActions>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Expenses",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => setShowSortOptions(!showSortOptions)}
              style={styles.headerButton}
            >
              <ArrowUpDown size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {showSortOptions && (
          <View style={styles.sortOptionsContainer}>
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "newest" && styles.activeSortOption]}
              onPress={() => handleSort("newest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "newest" && styles.activeSortOptionText]}>
                Newest First
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "oldest" && styles.activeSortOption]}
              onPress={() => handleSort("oldest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "oldest" && styles.activeSortOptionText]}>
                Oldest First
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "highest" && styles.activeSortOption]}
              onPress={() => handleSort("highest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "highest" && styles.activeSortOptionText]}>
                Highest Amount
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "lowest" && styles.activeSortOption]}
              onPress={() => handleSort("lowest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "lowest" && styles.activeSortOptionText]}>
                Lowest Amount
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={sortedExpenses}
            keyExtractor={(item) => item.id}
            renderItem={renderExpenseItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No expenses found"
                description="Add your first expense by clicking the + button below"
                icon="arrow-down-left"
              />
            }
          />
        )}
        
        <FloatingActionButton
          icon={<Plus size={24} color="#fff" />}
          onPress={handleAddExpense}
        />
      </View>
      
      <SnackBar
        visible={snackBarVisible}
        message={snackBarMessage}
        actionLabel="UNDO"
        onAction={handleUndoDelete}
        onDismiss={() => setSnackBarVisible(false)}
        duration={5000}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#666",
  },
  sortOptionsContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  activeSortOption: {
    backgroundColor: "#1a73e810",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#333",
  },
  activeSortOptionText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deletingItemContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deletingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ea4335",
  },
  expenseDetails: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: "#888",
  },
  expenseAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ea4335",
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: "#ea433510",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#ea4335",
  },
});