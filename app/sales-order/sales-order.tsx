import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, StatusBar, RefreshControl, ActivityIndicator, Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Calendar, 
  SortAsc,
  SortDesc, 
  ChevronDown, 
  User, 
  Share2,
  Printer,
  X,
  ChevronRight,
  FileText,
  Check,
  Hash
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getSalesOrders } from '@/db/sales-order';
import type { SalesOrder as DbSalesOrder } from '@/db/schema';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllCustomers } from '@/db/customer';
import type { Customer } from '@/db/schema';
import { formatCurrency } from '@/utils/currency';

// Extended SalesOrder type to include items property which is added by the getSalesOrderById function
interface SalesOrder extends DbSalesOrder {
  items?: Array<{
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    total: number;
    notes?: string | null;
    createdAt: string;
  }>;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'completed' | 'processing' | 'draft' | 'cancelled';

export default function SalesOrderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allOrders, setAllOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
      loadCustomers();
    }, [])
  );

  const loadOrders = async (sortOverride?: SortOption) => {
    try {
      if (!user) return;
      setLoading(true);
      let sortParam: 'newest' | 'oldest' = 'newest';
      const sortValue = sortOverride || sortBy;
      if (sortValue === 'date-desc') sortParam = 'newest';
      else if (sortValue === 'date-asc') sortParam = 'oldest';
      const fetchedOrders = await getSalesOrders(user.id, sortParam);
      setAllOrders(fetchedOrders);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const fetchedCustomers = await getAllCustomers();
      setCustomers(fetchedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const refreshOrders = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    if (option === 'date-desc' || option === 'date-asc') {
      loadOrders(option);
    }
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
  };
  
  const handlePrint = (order: SalesOrder) => {
    Alert.alert('Print', `Printing order #${order.orderNumber}`);
  };
  
  const handleShare = async (order: SalesOrder) => {
    try {
      const customerName = getCustomerName(order.customerId);
      const message = `Sales Order: #${order.orderNumber}\nCustomer: ${customerName}\nAmount: ${formatCurrency(order.total / 100)}\nDate: ${new Date(order.orderDate).toLocaleDateString()}`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.log('Error sharing order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'processing':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'draft':
        return { bg: 'rgba(0, 122, 255, 0.1)', text: '#007AFF' };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };

  // Helper to get customer name by id
  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };

  // Apply search, filter, and sort
  useEffect(() => {
    let filtered = [...allOrders];
    // Filter by status
    if (filterBy !== 'all') {
      filtered = filtered.filter(order => order.status === filterBy);
    }
    // Search by order number or customer name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(q) ||
        getCustomerName(order.customerId).toLowerCase().includes(q)
      );
    }
    // Only sort by amount here; date sort is handled in DB
    if (sortBy === 'amount-desc') {
      filtered.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'amount-asc') {
      filtered.sort((a, b) => a.total - b.total);
    }
    setOrders(filtered);
  }, [allOrders, customers, searchQuery, filterBy, sortBy]);

  const renderOrderItem = useCallback(({ item }: { item: SalesOrder }) => {
    const customerName = getCustomerName(item.customerId);
    const statusColors = getStatusColor(item.status || 'draft');
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({
          pathname: '/sales-order/[id]',
          params: { id: item.id.toString() }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {(item.status || 'Draft').charAt(0).toUpperCase() + (item.status || 'Draft').slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{new Date(item.orderDate).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customerName}
            </Text>
            <Text style={styles.itemsCount}>
              View Details
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{formatCurrency(item.total / 100)}</Text>
            <ChevronRight size={18} color={Colors.text.tertiary} />
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.cardActionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleShare(item);
            }}
          >
            <Share2 size={18} color={Colors.text.secondary} />
            <Text style={styles.cardActionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cardActionButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePrint(item);
            }}
          >
            <Printer size={18} color={Colors.text.secondary} />
            <Text style={styles.cardActionText}>Print</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [router, customers]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sales Orders</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.tertiary}
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <View style={styles.filterSortContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, showFilterOptions && styles.activeFilterButton]} 
            onPress={() => {
              setShowFilterOptions(!showFilterOptions);
              setShowSortOptions(false);
            }}
          >
            <Filter size={18} color={showFilterOptions ? Colors.primary : Colors.text.secondary} />
            <Text style={[styles.filterButtonText, showFilterOptions && styles.activeFilterButtonText]}>
              {filterBy === 'all' ? 'All' : filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
            </Text>
            <ChevronDown size={16} color={showFilterOptions ? Colors.primary : Colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, showSortOptions && styles.activeSortButton]} 
            onPress={() => {
              setShowSortOptions(!showSortOptions);
              setShowFilterOptions(false);
            }}
          >
            {sortBy.includes('desc') ? (
              <SortDesc size={18} color={showSortOptions ? Colors.primary : Colors.text.secondary} />
            ) : (
              <SortAsc size={18} color={showSortOptions ? Colors.primary : Colors.text.secondary} />
            )}
            <Text style={[styles.sortButtonText, showSortOptions && styles.activeSortButtonText]}>
              {sortBy.includes('date') ? 'Date' : 'Amount'}
            </Text>
            <ChevronDown size={16} color={showSortOptions ? Colors.primary : Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {showFilterOptions && (
          <View style={styles.optionsDropdown}>
            <TouchableOpacity
              style={[styles.optionItem, filterBy === 'all' && styles.activeOption]}
              onPress={() => handleFilter('all')}
            >
              <Text style={[styles.optionText, filterBy === 'all' && styles.activeOptionText]}>All</Text>
              {filterBy === 'all' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, filterBy === 'completed' && styles.activeOption]}
              onPress={() => handleFilter('completed')}
            >
              <Text style={[styles.optionText, filterBy === 'completed' && styles.activeOptionText]}>Completed</Text>
              {filterBy === 'completed' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, filterBy === 'processing' && styles.activeOption]}
              onPress={() => handleFilter('processing')}
            >
              <Text style={[styles.optionText, filterBy === 'processing' && styles.activeOptionText]}>Processing</Text>
              {filterBy === 'processing' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, filterBy === 'draft' && styles.activeOption]}
              onPress={() => handleFilter('draft')}
            >
              <Text style={[styles.optionText, filterBy === 'draft' && styles.activeOptionText]}>Draft</Text>
              {filterBy === 'draft' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, filterBy === 'cancelled' && styles.activeOption]}
              onPress={() => handleFilter('cancelled')}
            >
              <Text style={[styles.optionText, filterBy === 'cancelled' && styles.activeOptionText]}>Cancelled</Text>
              {filterBy === 'cancelled' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        )}
        
        {showSortOptions && (
          <View style={styles.optionsDropdown}>
            <TouchableOpacity
              style={[styles.optionItem, sortBy === 'date-desc' && styles.activeOption]}
              onPress={() => handleSort('date-desc')}
            >
              <Text style={[styles.optionText, sortBy === 'date-desc' && styles.activeOptionText]}>
                Date (Newest first)
              </Text>
              {sortBy === 'date-desc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, sortBy === 'date-asc' && styles.activeOption]}
              onPress={() => handleSort('date-asc')}
            >
              <Text style={[styles.optionText, sortBy === 'date-asc' && styles.activeOptionText]}>
                Date (Oldest first)
              </Text>
              {sortBy === 'date-asc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, sortBy === 'amount-desc' && styles.activeOption]}
              onPress={() => handleSort('amount-desc')}
            >
              <Text style={[styles.optionText, sortBy === 'amount-desc' && styles.activeOptionText]}>
                Amount (High to low)
              </Text>
              {sortBy === 'amount-desc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionItem, sortBy === 'amount-asc' && styles.activeOption]}
              onPress={() => handleSort('amount-asc')}
            >
              <Text style={[styles.optionText, sortBy === 'amount-asc' && styles.activeOptionText]}>
                Amount (Low to high)
              </Text>
              {sortBy === 'amount-asc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={refreshOrders}
              colors={[Colors.primary]} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <FileText size={60} color={Colors.text.tertiary} />
              <Text style={styles.emptyStateText}>No sales orders found</Text>
              <Text style={styles.emptyStateSubText}>
                Create a new sales order to get started
              </Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/sales-order/new')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.default,
    zIndex: 10,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    zIndex: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  filterSortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 6,
  },
  activeFilterButton: {
    backgroundColor: `${Colors.primary}15`,
  },
  filterButtonText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 6,
  },
  activeFilterButtonText: {
    color: Colors.primary,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingVertical: 10,
    marginLeft: 6,
  },
  activeSortButton: {
    backgroundColor: `${Colors.primary}15`,
  },
  sortButtonText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 6,
  },
  activeSortButtonText: {
    color: Colors.primary,
  },
  optionsDropdown: {
    position: 'absolute',
    top: 88,
    left: 16,
    right: 16,
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: 8,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeOption: {
    backgroundColor: `${Colors.primary}10`,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  activeOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  itemsCount: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 6,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  Check: {
    // Just for import, this is required by TypeScript for the code to compile
  }
}); 