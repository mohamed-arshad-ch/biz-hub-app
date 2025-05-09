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
  Trash,
  Filter
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getPurchasesData, deletePurchase } from "@/mocks/purchasesData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { PurchaseRecord } from "@/types/purchases";
import EmptyState from "@/components/EmptyState";
import FloatingActionButton from "@/components/FloatingActionButton";
import SwipeableActions from "@/components/SwipeableActions";
import SnackBar from "@/components/SnackBar";

export default function PurchasesScreen() {
  const router = useRouter();
  const [purchases, setPurchases] = useState(getPurchasesData());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedPurchase, setDeletedPurchase] = useState<PurchaseRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setPurchases(getPurchasesData());
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

  const handleFilterByStatus = (status: string | null) => {
    setStatusFilter(status);
    setShowFilterOptions(false);
  };

  const handleAddPurchase = () => {
    router.push("/purchases/new");
  };

  const handleEditPurchase = (id: string) => {
    router.push(`/purchases/edit/${id}`);
  };

  const handleDeletePurchase = (id: string) => {
    const purchaseToDelete = purchases.find(purchase => purchase.id === id);
    if (!purchaseToDelete) return;
    
    Alert.alert(
      "Delete Purchase",
      `Are you sure you want to delete purchase order ${purchaseToDelete.poNumber}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => performDelete(id, purchaseToDelete),
          style: "destructive"
        }
      ]
    );
  };

  const performDelete = async (id: string, purchaseToDelete: PurchaseRecord) => {
    setDeletingId(id);
    setDeletedPurchase(purchaseToDelete);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Delete the purchase
      const success = deletePurchase(id);
      
      if (success) {
        // Update the local state
        setPurchases(purchases.filter(purchase => purchase.id !== id));
        
        // Show snackbar with undo option
        setSnackBarMessage(`Purchase order ${purchaseToDelete.poNumber} deleted`);
        setSnackBarVisible(true);
      } else {
        throw new Error("Failed to delete purchase");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to delete purchase. Please try again.",
        [
          { text: "OK" },
          { 
            text: "Retry", 
            onPress: () => performDelete(id, purchaseToDelete) 
          }
        ]
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUndoDelete = () => {
    if (!deletedPurchase) return;
    
    // In a real app, this would restore the deleted purchase in the database
    // For now, we'll just add it back to the local state
    setPurchases(prevPurchases => [...prevPurchases, deletedPurchase]);
    
    // Show a confirmation message
    if (Platform.OS === "android") {
      ToastAndroid.show("Purchase restored", ToastAndroid.SHORT);
    } else {
      Alert.alert("Purchase Restored", "The purchase has been restored successfully.");
    }
    
    setSnackBarVisible(false);
  };

  const handleViewPurchase = (id: string) => {
    router.push(`/purchases/${id}`);
  };

  const handleLongPressPurchase = (purchase: PurchaseRecord) => {
    Alert.alert(
      `Purchase Order ${purchase.poNumber}`,
      "Choose an action",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "View Details", 
          onPress: () => handleViewPurchase(purchase.id)
        },
        { 
          text: "Edit", 
          onPress: () => handleEditPurchase(purchase.id)
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => handleDeletePurchase(purchase.id)
        }
      ]
    );
  };

  // Filter purchases based on search query and status filter
  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      purchase.vendor.toLowerCase().includes(searchLower) ||
      purchase.poNumber.toLowerCase().includes(searchLower) ||
      formatCurrency(purchase.amount).toLowerCase().includes(searchLower) ||
      formatDate(purchase.date).toLowerCase().includes(searchLower);
    
    const matchesStatusFilter = statusFilter === null || purchase.status === statusFilter;
    
    return matchesSearch && matchesStatusFilter;
  });

  // Sort purchases based on selected order
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
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

  const renderPurchaseItem = ({ item }: { item: PurchaseRecord }) => {
    const statusColor = getStatusColor(item.status);
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
            onPress: () => handleEditPurchase(item.id),
          }
        ]}
        rightActions={[
          {
            text: "Delete",
            icon: <Trash size={20} color="#fff" />,
            backgroundColor: "#ea4335",
            onPress: () => handleDeletePurchase(item.id),
          }
        ]}
      >
        <TouchableOpacity
          style={styles.purchaseItem}
          onPress={() => handleViewPurchase(item.id)}
          onLongPress={() => handleLongPressPurchase(item)}
          activeOpacity={0.7}
        >
          <View style={styles.purchaseDetails}>
            <Text style={styles.vendorName}>{item.vendor}</Text>
            <Text style={styles.poNumber}>{item.poNumber}</Text>
            <Text style={styles.purchaseDate}>{formatDate(item.date)}</Text>
          </View>
          
          <View style={styles.purchaseAmount}>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}10` }
            ]}>
              <Text style={[
                styles.statusText,
                { color: statusColor }
              ]}>
                {item.status.toUpperCase()}
              </Text>
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
          title: "Purchases",
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
                onPress={() => {
                  setShowFilterOptions(!showFilterOptions);
                  setShowSortOptions(false);
                }}
                style={styles.headerButton}
              >
                <Filter size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setShowSortOptions(!showSortOptions);
                  setShowFilterOptions(false);
                }}
                style={styles.headerButton}
              >
                <ArrowUpDown size={20} color="#333" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search purchases..."
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
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Sort By</Text>
            <TouchableOpacity 
              style={[styles.optionItem, sortOrder === "newest" && styles.activeOptionItem]}
              onPress={() => handleSort("newest")}
            >
              <Text style={[styles.optionText, sortOrder === "newest" && styles.activeOptionText]}>
                Newest First
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, sortOrder === "oldest" && styles.activeOptionItem]}
              onPress={() => handleSort("oldest")}
            >
              <Text style={[styles.optionText, sortOrder === "oldest" && styles.activeOptionText]}>
                Oldest First
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, sortOrder === "highest" && styles.activeOptionItem]}
              onPress={() => handleSort("highest")}
            >
              <Text style={[styles.optionText, sortOrder === "highest" && styles.activeOptionText]}>
                Highest Amount
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, sortOrder === "lowest" && styles.activeOptionItem]}
              onPress={() => handleSort("lowest")}
            >
              <Text style={[styles.optionText, sortOrder === "lowest" && styles.activeOptionText]}>
                Lowest Amount
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showFilterOptions && (
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Filter By Status</Text>
            <TouchableOpacity 
              style={[styles.optionItem, statusFilter === null && styles.activeOptionItem]}
              onPress={() => handleFilterByStatus(null)}
            >
              <Text style={[styles.optionText, statusFilter === null && styles.activeOptionText]}>
                All Statuses
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, statusFilter === "paid" && styles.activeOptionItem]}
              onPress={() => handleFilterByStatus("paid")}
            >
              <View style={styles.optionWithIndicator}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor("paid") }]} />
                <Text style={[styles.optionText, statusFilter === "paid" && styles.activeOptionText]}>
                  Paid
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, statusFilter === "pending" && styles.activeOptionItem]}
              onPress={() => handleFilterByStatus("pending")}
            >
              <View style={styles.optionWithIndicator}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor("pending") }]} />
                <Text style={[styles.optionText, statusFilter === "pending" && styles.activeOptionText]}>
                  Pending
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, statusFilter === "overdue" && styles.activeOptionItem]}
              onPress={() => handleFilterByStatus("overdue")}
            >
              <View style={styles.optionWithIndicator}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor("overdue") }]} />
                <Text style={[styles.optionText, statusFilter === "overdue" && styles.activeOptionText]}>
                  Overdue
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, statusFilter === "cancelled" && styles.activeOptionItem]}
              onPress={() => handleFilterByStatus("cancelled")}
            >
              <View style={styles.optionWithIndicator}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor("cancelled") }]} />
                <Text style={[styles.optionText, statusFilter === "cancelled" && styles.activeOptionText]}>
                  Cancelled
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={sortedPurchases}
            keyExtractor={(item) => item.id}
            renderItem={renderPurchaseItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No purchases found"
                description="Add your first purchase by clicking the + button below"
                icon="shopping-cart"
              />
            }
          />
        )}
        
        <FloatingActionButton
          icon={<Plus size={24} color="#fff" />}
          onPress={handleAddPurchase}
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
  headerRightContainer: {
    flexDirection: "row",
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
  optionsContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 2,
  },
  activeOptionItem: {
    backgroundColor: "#1a73e810",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  activeOptionText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  optionWithIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
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
  purchaseItem: {
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
  purchaseDetails: {
    flex: 1,
    marginRight: 8,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  poNumber: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  purchaseDate: {
    fontSize: 12,
    color: "#888",
  },
  purchaseAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
});