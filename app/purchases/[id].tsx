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
  CreditCard, 
  FileText, 
  Package
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getPurchaseById, deletePurchase } from "@/mocks/purchasesData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { PurchaseRecord, PurchaseItem } from "@/types/purchases";
import SnackBar from "@/components/SnackBar";
import { getVendors, getProducts, getPurchase, updatePurchase } from "@/utils/asyncStorageUtils";

export default function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [purchase, setPurchase] = useState<PurchaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedPurchase, setDeletedPurchase] = useState<PurchaseRecord | null>(null);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const purchaseData = getPurchaseById(id);
        if (purchaseData) {
          setPurchase(purchaseData);
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id]);

  const handleEdit = () => {
    if (purchase) {
      router.push(`/purchases/edit/${purchase.id}`);
    }
  };

  const handleDelete = () => {
    if (!purchase) return;
    
    Alert.alert(
      "Delete Purchase",
      `Are you sure you want to delete purchase order ${purchase.poNumber}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => performDelete(),
          style: "destructive"
        }
      ]
    );
  };

  const performDelete = async () => {
    if (!purchase) return;
    
    setIsDeleting(true);
    setDeletedPurchase(purchase);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Delete the purchase
      const success = deletePurchase(purchase.id);
      
      if (success) {
        setIsDeleting(false);
        
        // Show snackbar with undo option
        setSnackBarMessage(`Purchase order ${purchase.poNumber} deleted`);
        setSnackBarVisible(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 300);
      } else {
        throw new Error("Failed to delete purchase");
      }
    } catch (error) {
      setIsDeleting(false);
      Alert.alert(
        "Error",
        "Failed to delete purchase. Please try again.",
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
    if (!deletedPurchase) return;
    
    // In a real app, this would restore the deleted purchase in the database
    // For now, we'll just show a message
    if (Platform.OS === "android") {
      ToastAndroid.show("Purchase restored", ToastAndroid.SHORT);
    } else {
      Alert.alert("Purchase Restored", "The purchase has been restored successfully.");
    }
    
    setSnackBarVisible(false);
    router.replace(`/purchases/${deletedPurchase.id}`);
  };

  const handleShare = async () => {
    if (!purchase) return;

    try {
      await Share.share({
        message: `Purchase Order: ${purchase.poNumber}
Vendor: ${purchase.vendor}
Amount: ${formatCurrency(purchase.amount)}
Date: ${formatDate(purchase.date)}
Status: ${purchase.status.toUpperCase()}`,
        title: `Purchase Order ${purchase.poNumber}`,
      });
    } catch (error) {
      console.error("Error sharing purchase:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "#34a853";
      case "pending":
        return "#fbbc04";
      case "overdue":
        return "#ea4335";
      case "cancelled":
        return "#9aa0a6";
      default:
        return "#9aa0a6";
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors before saving');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updatedPurchase = {
        id: purchase.id,
        poNumber: purchase.poNumber,
        date: purchase.date.toISOString(),
        dueDate: purchase.dueDate?.toISOString() || null,
        vendor: purchase.vendor,
        items: purchase.items,
        subtotal: purchase.subtotal,
        discount: parseFloat(purchase.discount) || 0,
        tax: parseFloat(purchase.tax) || 0,
        total: purchase.total,
        paymentStatus: purchase.status,
        paymentMethod: purchase.paymentMethod,
        amountPaid: parseFloat(purchase.amountPaid) || 0,
        notes: purchase.notes,
        lastUpdated: new Date().toISOString(),
      };
      
      await updatePurchase(updatedPurchase);
      
      Alert.alert(
        'Success',
        'Purchase has been updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('Error saving purchase:', error);
      Alert.alert('Error', 'Failed to save purchase');
    } finally {
      setIsLoading(false);
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

  if (!purchase) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Purchase not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(purchase.status);

  return (
    <>
      <Stack.Screen 
        options={{
          title: `PO: ${purchase.poNumber}`,
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
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.vendorName}>{purchase.vendor}</Text>
              <Text style={styles.poNumber}>{purchase.poNumber}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}10` }
            ]}>
              <Text style={[
                styles.statusText,
                { color: statusColor }
              ]}>
                {purchase.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.iconContainer}>
                <Calendar size={16} color="#666" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Purchase Date</Text>
                <Text style={styles.detailValue}>{formatDate(purchase.date)}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.iconContainer}>
                <Calendar size={16} color="#666" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {purchase.dueDate ? formatDate(purchase.dueDate) : "N/A"}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.iconContainer}>
                <CreditCard size={16} color="#666" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>
                  {purchase.paymentMethod || "Not specified"}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.iconContainer}>
                <FileText size={16} color="#666" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(purchase.amount)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {purchase.items && purchase.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            
            {purchase.items.map((item, index) => (
              <View key={item.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={styles.iconContainer}>
                    <Package size={16} color="#666" />
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Quantity</Text>
                    <Text style={styles.itemDetailValue}>{item.quantity}</Text>
                  </View>
                  
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Unit Price</Text>
                    <Text style={styles.itemDetailValue}>
                      {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Total</Text>
                    <Text style={styles.itemDetailValue}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
                
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
                
                {index < purchase.items.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))}
          </View>
        )}
        
        {purchase.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{purchase.notes}</Text>
          </View>
        )}
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Edit size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash size={16} color="#fff" />
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#ea4335",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  headerButton: {
    padding: 8,
  },
  headerRightContainer: {
    flexDirection: "row",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  poNumber: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    width: "48%",
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemDetail: {
    flex: 1,
  },
  itemDetailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  itemDetailValue: {
    fontSize: 14,
    color: "#333",
  },
  itemDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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