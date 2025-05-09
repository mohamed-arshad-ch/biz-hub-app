import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
  Share,
  ToastAndroid
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2, 
  Printer, 
  CreditCard,
  Calendar,
  User,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getSaleById, deleteSale } from "@/mocks/salesData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { SaleRecord, SaleItem } from "@/types/sales";
import SnackBar from "@/components/SnackBar";

export default function SaleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<SaleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedSale, setDeletedSale] = useState<SaleRecord | null>(null);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const saleData = getSaleById(id);
        if (saleData) {
          setSale(saleData);
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id]);

  const handleEdit = () => {
    if (sale) {
      router.push(`/sales/edit/${sale.id}`);
    }
  };

  const handleDelete = () => {
    if (!sale) return;
    
    Alert.alert(
      "Delete Sale",
      `Are you sure you want to delete invoice ${sale.invoiceNumber}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => performDelete()
        }
      ]
    );
  };

  const performDelete = async () => {
    if (!sale) return;
    
    setIsDeleting(true);
    setDeletedSale(sale);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Delete the sale
      const success = deleteSale(sale.id);
      
      if (success) {
        setIsDeleting(false);
        
        // Show snackbar with undo option
        setSnackBarMessage(`Invoice ${sale.invoiceNumber} deleted`);
        setSnackBarVisible(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 300);
      } else {
        throw new Error("Failed to delete sale");
      }
    } catch (error) {
      setIsDeleting(false);
      Alert.alert(
        "Error",
        "Failed to delete sale. Please try again.",
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
    if (!deletedSale) return;
    
    // In a real app, this would restore the deleted sale in the database
    // For now, we'll just show a message
    if (Platform.OS === "android") {
      ToastAndroid.show("Sale restored", ToastAndroid.SHORT);
    } else {
      Alert.alert("Sale Restored", "The sale has been restored successfully.");
    }
    
    setSnackBarVisible(false);
    router.replace(`/sales/${deletedSale.id}`);
  };

  const handleShare = async () => {
    if (!sale) return;
    
    try {
      await Share.share({
        message: `Sale details for ${sale.invoiceNumber}
Customer: ${sale.customer}
Amount: ${formatCurrency(sale.amount)}
Date: ${formatDate(sale.date)}`,
        title: `Sale ${sale.invoiceNumber}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handlePrint = () => {
    // Print functionality would be implemented here
    Alert.alert("Print", "Printing functionality would be implemented here");
  };

  const handleRecordPayment = () => {
    // Record payment functionality would be implemented here
    Alert.alert("Record Payment", "Payment recording functionality would be implemented here");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return Colors.status.active;
      case "pending":
        return Colors.status.pending;
      case "overdue":
        return Colors.status.blocked;
      case "cancelled":
        return "#9aa0a6";
      default:
        return Colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={20} color={Colors.status.active} />;
      case "pending":
        return <Clock size={20} color={Colors.status.pending} />;
      case "overdue":
        return <XCircle size={20} color={Colors.status.blocked} />;
      case "cancelled":
        return <XCircle size={20} color="#9aa0a6" />;
      default:
        return <Clock size={20} color={Colors.primary} />;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.blocked} />
        <Text style={styles.deletingText}>Deleting...</Text>
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Sale not found</Text>
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
          title: `Invoice ${sale.invoiceNumber}`,
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
              {Platform.OS !== "web" && (
                <TouchableOpacity 
                  onPress={handlePrint}
                  style={styles.headerButton}
                >
                  <Printer size={20} color="#333" />
                </TouchableOpacity>
              )}
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
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.invoiceNumberContainer}>
              <FileText size={20} color={Colors.primary} style={styles.icon} />
              <Text style={styles.invoiceNumber}>{sale.invoiceNumber}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(sale.status)}15` }
            ]}>
              {getStatusIcon(sale.status)}
              <Text style={[
                styles.statusText,
                { color: getStatusColor(sale.status) }
              ]}>
                {sale.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <Calendar size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoLabelText}>Sale Date</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(sale.date)}</Text>
            </View>
            
            {sale.dueDate && (
              <View style={styles.infoItem}>
                <View style={styles.infoLabel}>
                  <Calendar size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoLabelText}>Due Date</Text>
                </View>
                <Text style={styles.infoValue}>{formatDate(sale.dueDate)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabel}>
                <User size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoLabelText}>Customer</Text>
              </View>
              <Text style={styles.infoValue}>{sale.customer}</Text>
            </View>
            
            {sale.paymentMethod && (
              <View style={styles.infoItem}>
                <View style={styles.infoLabel}>
                  <CreditCard size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoLabelText}>Payment Method</Text>
                </View>
                <Text style={styles.infoValue}>{sale.paymentMethod}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Items Card */}
        {sale.items && sale.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Price</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Total</Text>
            </View>
            
            {sale.items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  )}
                </View>
                <Text style={[styles.itemQuantity, { flex: 1, textAlign: "center" }]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.itemPrice, { flex: 1, textAlign: "right" }]}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={[styles.itemTotal, { flex: 1, textAlign: "right" }]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(sale.amount)}</Text>
            </View>
          </View>
        )}
        
        {/* Notes Card */}
        {sale.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{sale.notes}</Text>
          </View>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        {sale.status !== "paid" && (
          <TouchableOpacity 
            style={[styles.footerButton, styles.footerButtonPrimary]}
            onPress={handleRecordPayment}
          >
            <DollarSign size={20} color="#fff" />
            <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>
              Record Payment
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.footerButtonDanger]}
          onPress={handleDelete}
        >
          <Trash2 size={20} color="#fff" />
          <Text style={[styles.footerButtonText, styles.footerButtonTextDanger]}>
            Delete Sale
          </Text>
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  deletingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.status.blocked,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.status.blocked,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  invoiceNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoLabelText: {
    fontSize: 12,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  itemDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#333",
  },
  itemPrice: {
    fontSize: 14,
    color: "#333",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  notes: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonPrimary: {
    backgroundColor: Colors.status.active,
  },
  footerButtonDanger: {
    backgroundColor: Colors.status.blocked,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerButtonTextPrimary: {
    color: '#fff',
  },
  footerButtonTextDanger: {
    color: '#fff',
  },
});