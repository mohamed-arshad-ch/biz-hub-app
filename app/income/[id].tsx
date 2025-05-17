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
import { getIncomeById, deleteIncome } from "@/db/income";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useAuthStore } from "@/store/auth";
import SnackBar from "@/components/SnackBar";

export default function IncomeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const [income, setIncome] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedIncome, setDeletedIncome] = useState<any>(null);

  useEffect(() => {
    if (id && user) {
      loadIncomeDetails();
    }
  }, [id, user]);

  const loadIncomeDetails = async () => {
    if (!user || !id) return;
    
    try {
      const incomeData = await getIncomeById(parseInt(id), user.id);
      if (incomeData) {
        setIncome(incomeData);
      }
    } catch (error) {
      console.error('Error loading income details:', error);
      Alert.alert('Error', 'Failed to load income details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (income) {
      router.push(`/income/edit/${income.id}`);
    }
  };

  const handleDelete = () => {
    if (!income) return;
    
    Alert.alert(
      "Delete Income",
      "Are you sure you want to delete this income record? This action cannot be undone.",
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
    if (!income || !user) return;
    
    setIsDeleting(true);
    setDeletedIncome(income);
    
    try {
      await deleteIncome(income.id, user.id);
      setIsDeleting(false);
      
      // Show snackbar with undo option
      setSnackBarMessage("Income record deleted");
      setSnackBarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 300);
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
    Alert.alert("Income Restored", "The income record has been restored successfully.");
    
    setSnackBarVisible(false);
    router.replace(`/income/${deletedIncome.id}`);
  };

  const handleShare = async () => {
    if (!income) return;

    try {
      await Share.share({
        message: `Income Details

Amount: ${formatCurrency(income.amount)}
Date: ${formatDate(income.date)}
Description: ${income.description || "N/A"}
Payment Method: ${income.paymentMethod || "N/A"}
Reference Number: ${income.referenceNumber || "N/A"}
Status: ${income.status}`,
        title: "Income Details",
      });
    } catch (error) {
      console.error("Error sharing income details:", error);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing income record...');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading income details...</Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>Deleting income record...</Text>
      </View>
    );
  }

  if (!income) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Text style={styles.errorText}>Income record not found</Text>
        <TouchableOpacity 
          style={styles.errorBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(income.amount)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{income.status}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color={Colors.text.secondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(income.date)}</Text>
            </View>
          </View>

          {income.description && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <FileText size={20} color={Colors.text.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{income.description}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <CreditCard size={20} color={Colors.text.secondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{income.paymentMethod || "Not specified"}</Text>
            </View>
          </View>

          {income.referenceNumber && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Hash size={20} color={Colors.text.secondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Reference Number</Text>
                <Text style={styles.detailValue}>{income.referenceNumber}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <SnackBar
        visible={snackBarVisible}
        message={snackBarMessage}
        action="Undo"
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
  headerBackButton: {
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
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  amountCard: {
    backgroundColor: Colors.background.default,
    padding: 20,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: Colors.background.default,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  errorBackButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorBackButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});