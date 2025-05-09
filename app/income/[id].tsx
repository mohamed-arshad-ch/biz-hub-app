import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
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
  Calendar, 
  Tag, 
  DollarSign, 
  User, 
  CreditCard, 
  Hash, 
  FileText
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getIncomeById, deleteIncome } from "@/mocks/incomeData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { IncomeRecord } from "@/types/income";
import SnackBar from "@/components/SnackBar";

export default function IncomeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [income, setIncome] = useState<IncomeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedIncome, setDeletedIncome] = useState<IncomeRecord | null>(null);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const incomeData = getIncomeById(id);
        if (incomeData) {
          setIncome(incomeData);
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id]);

  const handleEdit = () => {
    if (income) {
      router.push(`/income/edit/${income.id}`);
    }
  };

  const handleDelete = () => {
    if (!income) return;
    
    Alert.alert(
      "Delete Income",
      `Are you sure you want to delete this income record from ${income.source}? This action cannot be undone.`,
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
    if (!income) return;
    
    setIsDeleting(true);
    setDeletedIncome(income);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Delete the income
      const success = deleteIncome(income.id);
      
      if (success) {
        setIsDeleting(false);
        
        // Show snackbar with undo option
        setSnackBarMessage(`Income record from ${income.source} deleted`);
        setSnackBarVisible(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 300);
      } else {
        throw new Error("Failed to delete income record");
      }
    } catch (error) {
      setIsDeleting(false);
      Alert.alert(
        "Error",
        "Failed to delete income record. Please try again.",
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
    if (!deletedIncome) return;
    
    // In a real app, this would restore the deleted income in the database
    // For now, we'll just show a message
    if (Platform.OS === "android") {
      ToastAndroid.show("Income record restored", ToastAndroid.SHORT);
    } else {
      Alert.alert("Income Restored", "The income record has been restored successfully.");
    }
    
    setSnackBarVisible(false);
    router.replace(`/income/${deletedIncome.id}`);
  };

  const handleShare = async () => {
    if (!income) return;

    try {
      await Share.share({
        message: `Income Details

Source: ${income.source}
Amount: ${formatCurrency(income.amount)}
Date: ${formatDate(income.date)}
Category: ${income.category}
Payment Method: ${income.paymentMethod || "N/A"}
Reference: ${income.reference || "N/A"}
Notes: ${income.notes || "N/A"}`,
        title: `Income from ${income.source}`,
      });
    } catch (error) {
      console.error("Error sharing income details:", error);
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

  if (!income) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Income record not found</Text>
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
          title: "Income Details",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
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
              <TouchableOpacity 
                onPress={handleDelete}
                style={styles.headerButton}
              >
                <Trash size={20} color="#ea4335" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(income.amount)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(income.date)}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Tag size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{income.category}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <User size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Source</Text>
                <Text style={styles.detailValue}>{income.source}</Text>
              </View>
            </View>
            
            {income.paymentMethod && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <CreditCard size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>{income.paymentMethod}</Text>
                </View>
              </View>
            )}
            
            {income.reference && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Hash size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Reference</Text>
                  <Text style={styles.detailValue}>{income.reference}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        
        {income.notes && (
          <View style={styles.card}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.notesHeaderText}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{income.notes}</Text>
          </View>
        )}
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Edit size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
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
  headerRightContainer: {
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
    fontSize: 16,
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  amountContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "600",
    color: "#34a853",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    alignItems: "center",
  },
  detailTextContainer: {
    flex: 1,
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
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  notesHeaderText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    marginTop: 8,
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
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: "#ea4335",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
});