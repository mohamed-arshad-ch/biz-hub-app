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
  Printer
} from "lucide-react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from "@/constants/colors";
import { getIncomeById, deleteIncome } from "@/mocks/incomeData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { IncomeRecord } from "@/types/income";
import SnackBar from "@/components/SnackBar";

export default function IncomeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [income, setIncome] = useState<IncomeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedIncome, setDeletedIncome] = useState<IncomeRecord | null>(null);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const incomeData = getIncomeById("i1");
        if (incomeData) {
          setIncome(incomeData);
        }
        setLoading(false);
      }, 500);
    }
  }, [id]);

  const handleEdit = () => {
    if (income) {
      router.push(`/income/edit/1`);
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
      Alert.alert("Income Restored", "The income record has been restored successfully.");
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

  const handlePrint = () => {
    Alert.alert('Print', 'Printing income record...');
  };

  // Get category color based on category name
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'Salary': '#4CAF50',
      'Investment': '#2196F3',
      'Business': '#FBBC04',
      'Freelance': '#9C27B0',
      'Other': '#757575'
    };
    
    return categoryColors[category] || '#757575';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading income details...</Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>Deleting income record...</Text>
      </View>
    );
  }

  if (!income) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Income Details</Text>
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
          <Text style={styles.amountValue}>{formatCurrency(income.amount)}</Text>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: `${getCategoryColor(income.category)}20` }
          ]}>
            <Tag size={16} color={getCategoryColor(income.category)} style={styles.categoryIcon} />
            <Text style={[
              styles.categoryText,
              { color: getCategoryColor(income.category) }
            ]}>
              {income.category.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Information</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <User size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Source</Text>
              <Text style={styles.infoValue}>{income.source}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Income Date</Text>
              <Text style={styles.infoValue}>{formatDate(income.date)}</Text>
            </View>
          </View>
          
          {income.paymentMethod && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <CreditCard size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>{income.paymentMethod}</Text>
              </View>
            </View>
          )}
          
          {income.reference && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Hash size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Reference Number</Text>
                <Text style={styles.infoValue}>{income.reference}</Text>
              </View>
            </View>
          )}
        </View>
        
        {income.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <View style={styles.infoIconContainer}>
                <FileText size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.notesText}>{income.notes}</Text>
              </View>
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
    borderColor: Colors.primary + '20',
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
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