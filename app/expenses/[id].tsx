import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  StatusBar
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2, 
  Calendar, 
  Tag, 
  DollarSign, 
  User, 
  CreditCard, 
  Hash, 
  FileText,
  Printer,
  Receipt
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getExpenseById, deleteExpense } from "@/mocks/expensesData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ExpenseRecord } from "@/types/expenses";
import SnackBar from "@/components/SnackBar";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
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
      Alert.alert("Expense Restored", "The expense has been restored successfully.");
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
Category: ${expense.category}
Payment Method: ${expense.paymentMethod || "N/A"}
Notes: ${expense.notes || "N/A"}`,
        title: "Expense Details"
      });
    } catch (error) {
      console.error("Error sharing expense:", error);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing expense record...');
  };

  // Helper function to get category color
  function getCategoryColor(category: string): string {
    const categoryColors: Record<string, string> = {
      'food': '#4CAF50',
      'transportation': '#2196F3',
      'utilities': '#FBBC04',
      'entertainment': '#9C27B0',
      'other': '#757575'
    };
    
    return categoryColors[category.toLowerCase()] || '#757575';
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>Deleting expense record...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Text style={styles.errorText}>Expense record not found</Text>
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Expense Details</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handlePrint} style={styles.headerButton}>
            <Printer size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Share2 size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Edit size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Trash2 size={22} color={Colors.negative || "#FF3B30"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(expense.amount)}</Text>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: `${getCategoryColor(expense.category)}20` }
          ]}>
            <Tag size={16} color={getCategoryColor(expense.category)} style={styles.categoryIcon} />
            <Text style={[
              styles.categoryText,
              { color: getCategoryColor(expense.category) }
            ]}>
              {expense.category.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Information</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Receipt size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{expense.description}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Expense Date</Text>
              <Text style={styles.infoValue}>{formatDate(expense.date)}</Text>
            </View>
          </View>
          
          {expense.paymentMethod && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <CreditCard size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>{expense.paymentMethod}</Text>
              </View>
            </View>
          )}
          
          {expense.vendor && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Vendor</Text>
                <Text style={styles.infoValue}>{expense.vendor}</Text>
              </View>
            </View>
          )}
        </View>
        
        {expense.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <View style={styles.infoIconContainer}>
                <FileText size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.notesText}>{expense.notes}</Text>
              </View>
            </View>
          </View>
        )}
        
        {expense.receipt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <View style={styles.receiptContainer}>
              {/* In a real app, you would display the receipt image here */}
              <Text style={styles.receiptPlaceholder}>Receipt image available</Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <SnackBar
        visible={snackBarVisible}
        message={snackBarMessage}
        action="UNDO"
        onAction={handleUndoDelete}
        onDismiss={() => setSnackBarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.negative ? Colors.negative + '20' : '#FF3B3020',
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.negative || '#FF3B30',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  notesContainer: {
    flexDirection: 'row',
  },
  notesText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  receiptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  receiptPlaceholder: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.default,
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.negative || "#FF3B30",
    marginBottom: 16,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});