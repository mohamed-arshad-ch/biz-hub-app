import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Image,
  Share,
  Platform,
  ToastAndroid
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Share2, 
  Copy,
  Receipt,
  Calendar,
  Tag,
  DollarSign,
  CreditCard,
  FileText,
  User
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getExpenseById, deleteExpense } from "@/mocks/expensesData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ExpenseRecord } from "@/types/expenses";
import SnackBar from "@/components/SnackBar";

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedExpense, setDeletedExpense] = useState<ExpenseRecord | null>(null);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const fetchedExpense = getExpenseById(id);
        if (fetchedExpense) {
          setExpense(fetchedExpense);
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id]);

  const handleEdit = () => {
    if (expense) {
      router.push(`/expenses/edit/${expense.id}`);
    }
  };

  const handleDelete = () => {
    if (!expense) return;
    
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete this expense for ${expense.description}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete()
        }
      ]
    );
  };

  const performDelete = async () => {
    if (!expense) return;
    
    setIsDeleting(true);
    setDeletedExpense(expense);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Delete the expense
      const success = deleteExpense(expense.id);
      
      if (success) {
        setIsDeleting(false);
        
        // Show snackbar with undo option
        setSnackBarMessage(`Expense for ${expense.description} deleted`);
        setSnackBarVisible(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 300);
      } else {
        throw new Error("Failed to delete expense");
      }
    } catch (error) {
      setIsDeleting(false);
      Alert.alert(
        "Error",
        "Failed to delete expense. Please try again.",
        [
          { text: "OK" },
          { 
            text: "Retry", 
            onPress: performDelete 
          }
        ]
      );
    }
  };

  const handleUndoDelete = () => {
    if (!deletedExpense) return;
    
    // In a real app, this would restore the deleted expense in the database
    // For now, we'll just show a message
    if (Platform.OS === "android") {
      ToastAndroid.show("Expense restored", ToastAndroid.SHORT);
    } else {
      Alert.alert("Expense Restored", "The expense has been restored successfully.");
    }
    
    setSnackBarVisible(false);
    router.replace(`/expenses/${deletedExpense.id}`);
  };

  const handleShare = async () => {
    if (!expense) return;
    
    try {
      await Share.share({
        message: `Expense: ${expense.description}
Amount: ${formatCurrency(expense.amount)}
Date: ${formatDate(expense.date)}
Category: ${expense.category}`,
        title: "Expense Details"
      });
    } catch (error) {
      console.error("Error sharing expense:", error);
    }
  };

  const handleDuplicate = () => {
    if (expense) {
      router.push({
        pathname: "/expenses/new",
        params: { duplicate: expense.id }
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea4335" />
        <Text style={styles.deletingText}>Deleting...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Expense not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Expense Details",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={handleShare}
                style={styles.headerButton}
              >
                <Share2 size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleEdit}
                style={styles.headerButton}
              >
                <Edit size={20} color="#333" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(expense.amount)}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{expense.category}</Text>
          </View>
        </View>
        
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Tag size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{expense.category}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <DollarSign size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{formatCurrency(expense.amount)}</Text>
            </View>
          </View>
          
          {expense.paymentMethod && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <CreditCard size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>{expense.paymentMethod}</Text>
                </View>
              </View>
            </>
          )}
          
          {expense.vendor && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <User size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Vendor</Text>
                  <Text style={styles.detailValue}>{expense.vendor}</Text>
                </View>
              </View>
            </>
          )}
          
          {expense.reference && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Receipt size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reference</Text>
                  <Text style={styles.detailValue}>{expense.reference}</Text>
                </View>
              </View>
            </>
          )}
          
          {expense.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <FileText size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{expense.notes}</Text>
                </View>
              </View>
            </>
          )}
        </View>
        
        {expense.receipt && (
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>Receipt</Text>
            <Image 
              source={{ uri: expense.receipt }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </View>
        )}
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.duplicateButton]}
            onPress={handleDuplicate}
          >
            <Copy size={20} color={Colors.primary} />
            <Text style={styles.duplicateButtonText}>Duplicate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash size={20} color="#ea4335" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
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
  headerActions: {
    flexDirection: "row",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  deletingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ea4335",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: "#ea4335",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  amountCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    margin: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ea4335",
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "#ea433510",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ea4335",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 56,
  },
  receiptCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  receiptImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  duplicateButton: {
    backgroundColor: "#f0f4ff",
  },
  duplicateButtonText: {
    color: Colors.primary,
    fontWeight: "500",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
  },
  deleteButtonText: {
    color: "#ea4335",
    fontWeight: "500",
    marginLeft: 8,
  },
});