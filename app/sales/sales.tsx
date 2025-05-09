import React, { useState, useCallback, useRef } from "react";
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
  ToastAndroid,
  Animated,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ArrowUpDown,
  Edit,
  Trash,
  X,
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { getSalesData, deleteSale } from "@/mocks/salesData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { SaleRecord } from "@/types/sales";
import EmptyState from "@/components/EmptyState";
import SwipeableActions from "@/components/SwipeableActions";
import SnackBar from "@/components/SnackBar";

export default function SalesScreen() {
  const router = useRouter();
  const [sales, setSales] = useState(getSalesData());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedSale, setDeletedSale] = useState<SaleRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const sortMenuAnimation = useRef(new Animated.Value(0)).current;

  const toggleSortMenu = () => {
    if (isSortMenuOpen) {
      Animated.timing(sortMenuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsSortMenuOpen(false));
    } else {
      setIsSortMenuOpen(true);
      Animated.timing(sortMenuAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setSales(getSalesData());
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSort = (order: "newest" | "oldest" | "highest" | "lowest") => {
    setSortOrder(order);
    toggleSortMenu();
  };

  const handleAddSale = () => {
    router.push("/sales/new");
  };

  const handleEditSale = (id: string) => {
    router.push(`/sales/edit/${id}`);
  };

  const handleDeleteSale = (id: string) => {
    const saleToDelete = sales.find(sale => sale.id === id);
    if (!saleToDelete) return;
    
    Alert.alert(
      "Delete Sale",
      `Are you sure you want to delete invoice ${saleToDelete.invoiceNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => performDelete(id, saleToDelete)
        }
      ]
    );
  };

  const performDelete = async (id: string, saleToDelete: SaleRecord) => {
    setDeletingId(id);
    setDeletedSale(saleToDelete);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Delete the sale
      const success = deleteSale(id);
      
      if (success) {
        // Update the local state
        setSales(sales.filter(sale => sale.id !== id));
        
        // Show snackbar with undo option
        setSnackBarMessage(`Invoice ${saleToDelete.invoiceNumber} deleted`);
        setSnackBarVisible(true);
      } else {
        throw new Error("Failed to delete sale");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to delete sale. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUndoDelete = () => {
    if (!deletedSale) return;
    
    // Add the deleted sale back to the local state
    setSales(prevSales => [...prevSales, deletedSale]);
    
    // Show a confirmation message
    if (Platform.OS === "android") {
      ToastAndroid.show("Sale restored", ToastAndroid.SHORT);
    }
    
    setSnackBarVisible(false);
  };

  const handleViewSale = (id: string) => {
    router.push(`/sales/${id}`);
  };

  // Filter sales based on search query
  const filteredSales = sales.filter(sale => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sale.customer.toLowerCase().includes(searchLower) ||
      sale.invoiceNumber.toLowerCase().includes(searchLower) ||
      formatCurrency(sale.amount).toLowerCase().includes(searchLower) ||
      formatDate(sale.date).toLowerCase().includes(searchLower)
    );
  });

  // Sort sales based on selected order
  const sortedSales = [...filteredSales].sort((a, b) => {
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

  const renderSaleItem = ({ item }: { item: SaleRecord }) => {
    if (deletingId === item.id) {
      return (
        <View style={styles.deletingItemContainer}>
          <ActivityIndicator size="small" color="#ea4335" />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      );
    }
    
    return (
      <SwipeableActions
        rightActions={[
          {
            text: "Edit",
            icon: <Edit size={20} color="#fff" />,
            backgroundColor: "#4285F4",
            onPress: () => handleEditSale(item.id),
          },
          {
            text: "Delete",
            icon: <Trash size={20} color="#fff" />,
            backgroundColor: "#EA4335",
            onPress: () => handleDeleteSale(item.id),
          }
        ]}
      >
        <TouchableOpacity
          style={styles.saleCard}
          onPress={() => handleViewSale(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.customerName}>{item.customer}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === "paid" ? "#34a85315" : "#fbbc0415" }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.status === "paid" ? "#34a853" : "#fbbc04" }
              ]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice</Text>
              <Text style={styles.detailValue}>{item.invoiceNumber}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
            </View>
            
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
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
          title: "Sales",
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
              onPress={toggleSortMenu}
              style={styles.headerButton}
            >
              <ArrowUpDown size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sales by customer, invoice, amount..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <X size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Sort Options Menu */}
        {isSortMenuOpen && (
          <Animated.View 
            style={[
              styles.sortOptionsContainer,
              {
                opacity: sortMenuAnimation,
                transform: [{
                  translateY: sortMenuAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.sortOptionTitle}>Sort by</Text>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "newest" && styles.activeSortOption]}
              onPress={() => handleSort("newest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "newest" && styles.activeSortOptionText]}>
                Newest First
              </Text>
              {sortOrder === "newest" && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "oldest" && styles.activeSortOption]}
              onPress={() => handleSort("oldest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "oldest" && styles.activeSortOptionText]}>
                Oldest First
              </Text>
              {sortOrder === "oldest" && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "highest" && styles.activeSortOption]}
              onPress={() => handleSort("highest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "highest" && styles.activeSortOptionText]}>
                Highest Amount
              </Text>
              {sortOrder === "highest" && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === "lowest" && styles.activeSortOption]}
              onPress={() => handleSort("lowest")}
            >
              <Text style={[styles.sortOptionText, sortOrder === "lowest" && styles.activeSortOptionText]}>
                Lowest Amount
              </Text>
              {sortOrder === "lowest" && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={sortedSales}
            keyExtractor={(item) => item.id}
            renderItem={renderSaleItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No sales found"
                description={searchQuery ? "Try a different search term" : "Add your first sale by tapping the + button"}
                icon="shopping-cart"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddSale}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#fff" />
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
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  sortOptionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  activeSortOption: {
    backgroundColor: '#e8f0fe',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#333',
  },
  activeSortOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  deletingItemContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  deletingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ea4335',
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 999,
  },
});