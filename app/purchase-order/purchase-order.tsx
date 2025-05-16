import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Trash,
  Printer,
  Pencil,
  ChevronRight,
  X,
  Check,
  MoreVertical,
  ArrowLeft
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Mock data for purchase orders
const purchaseOrderData = [
  {
    id: 'po-001',
    orderNumber: 'PO-2023-001',
    vendorId: 'v-001',
    vendorName: 'ABC Suppliers',
    orderDate: '2023-08-15',
    deliveryDate: '2023-09-15',
    subtotal: 750.00,
    tax: 75.00,
    total: 825.00,
    status: 'completed',
    items: [
      { id: 'item-001', productId: 'p-001', productName: 'Office Chair', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-002', productId: 'p-002', productName: 'Desk Lamp', quantity: 6, unitPrice: 50.00, total: 300.00 }
    ]
  },
  {
    id: 'po-002',
    orderNumber: 'PO-2023-002',
    vendorId: 'v-002',
    vendorName: 'XYZ Electronics',
    orderDate: '2023-08-20',
    deliveryDate: '2023-09-20',
    subtotal: 1200.00,
    tax: 120.00,
    total: 1320.00,
    status: 'pending',
    items: [
      { id: 'item-003', productId: 'p-003', productName: 'Laptop', quantity: 1, unitPrice: 1200.00, total: 1200.00 }
    ]
  },
  {
    id: 'po-003',
    orderNumber: 'PO-2023-003',
    vendorId: 'v-003',
    vendorName: 'Office Supplies Co.',
    orderDate: '2023-08-10',
    deliveryDate: '2023-09-10',
    subtotal: 480.00,
    tax: 48.00,
    total: 528.00,
    status: 'processing',
    items: [
      { id: 'item-004', productId: 'p-004', productName: 'Printer Paper', quantity: 20, unitPrice: 10.00, total: 200.00 },
      { id: 'item-005', productId: 'p-005', productName: 'Ink Cartridges', quantity: 4, unitPrice: 70.00, total: 280.00 }
    ]
  },
  {
    id: 'po-004',
    orderNumber: 'PO-2023-004',
    vendorId: 'v-004',
    vendorName: 'Tech Gadgets Inc.',
    orderDate: '2023-08-25',
    deliveryDate: '2023-09-25',
    subtotal: 900.00,
    tax: 90.00,
    total: 990.00,
    status: 'pending',
    items: [
      { id: 'item-006', productId: 'p-006', productName: 'Wireless Headphones', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-007', productId: 'p-007', productName: 'Smart Speaker', quantity: 3, unitPrice: 150.00, total: 450.00 }
    ]
  },
  {
    id: 'po-005',
    orderNumber: 'PO-2023-005',
    vendorId: 'v-005',
    vendorName: 'Furniture Warehouse',
    orderDate: '2023-07-30',
    deliveryDate: '2023-08-30',
    subtotal: 2500.00,
    tax: 250.00,
    total: 2750.00,
    status: 'cancelled',
    items: [
      { id: 'item-008', productId: 'p-008', productName: 'Conference Table', quantity: 1, unitPrice: 1500.00, total: 1500.00 },
      { id: 'item-009', productId: 'p-001', productName: 'Office Chair', quantity: 5, unitPrice: 200.00, total: 1000.00 }
    ]
  }
];

// Define types for sorting and filtering
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled';

// Interface for PurchaseOrder
interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  deliveryDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export default function PurchaseOrderScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>('newest');
  const [currentFilter, setCurrentFilter] = useState<FilterOption>('all');
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Amount' },
    { value: 'lowest', label: 'Lowest Amount' }
  ];

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchQuery, currentSort, currentFilter, orders]);

  const fetchOrders = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOrders(purchaseOrderData);
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const applyFiltersAndSort = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        order =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(order => order.status === currentFilter);
    }

    // Apply sorting
    switch (currentSort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.total - a.total);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.total - b.total);
        break;
      default:
        break;
    }

    setFilteredOrders(filtered);
  };

  const handleSortSelect = (sortOption: SortOption) => {
    setCurrentSort(sortOption);
    setShowSortModal(false);
  };

  const handleFilterSelect = (filterOption: FilterOption) => {
    setCurrentFilter(filterOption);
    setShowFilterModal(false);
  };

  const handleDeleteOrder = (id: string) => {
    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this purchase order?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Here you would typically call an API to delete the order
            setOrders(orders.filter(order => order.id !== id));
            Alert.alert('Success', 'Purchase order deleted successfully');
          },
        },
      ]
    );
  };

  const handlePrintOrder = (id: string) => {
    // Here you would typically call a printing service
    Alert.alert('Print', 'Printing purchase order...');
  };

  const handleShowActions = (id: string) => {
    setSelectedOrderId(id);
    setShowActionsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'processing':
        return { bg: 'rgba(33, 150, 243, 0.1)', text: '#2196F3' };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };

  const renderOrder = ({ item }: { item: PurchaseOrder }) => {
    return (
      <View style={styles.orderCardContainer}>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => router.push(`/purchase-order/${item.id}`)}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderNumberContainer}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <Text style={styles.orderDate}>
                {new Date(item.orderDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(item.status).bg }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: getStatusColor(item.status).text }
              ]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.orderDetails}>
            <Text style={styles.vendorName}>{item.vendorName}</Text>
            <Text style={styles.itemCount}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
          
          <View style={styles.orderFooter}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>${item.total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.chevronContainer}>
            <ChevronRight size={20} color={Colors.text.secondary} />
          </View>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => router.push(`/purchase-order/edit/${item.id}`)}
          >
            <Pencil size={16} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.printButton]}
            onPress={() => handlePrintOrder(item.id)}
          >
            <Printer size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteOrder(item.id)}
          >
            <Trash size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
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
        <Text style={styles.title}>Purchase Invoices</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={16} color={Colors.primary} />
          <Text style={styles.filterButtonText}>
            {filterOptions.find(option => option.value === currentFilter)?.label || 'Filter'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={16} color={Colors.primary} />
          <Text style={styles.sortButtonText}>
            {sortOptions.find(option => option.value === currentSort)?.label || 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.ordersList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No purchase orders found</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/purchase-order/new')}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalItem}
                  onPress={() => handleSortSelect(option.value)}
                >
                  <Text style={styles.modalItemText}>{option.label}</Text>
                  {currentSort === option.value && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalItem}
                  onPress={() => handleFilterSelect(option.value)}
                >
                  <Text style={styles.modalItemText}>{option.label}</Text>
                  {currentFilter === option.value && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  orderCardContainer: {
    marginBottom: 8,
  },
  orderCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumberContainer: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 12,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  chevronContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: `${Colors.primary}10`,
    borderColor: `${Colors.primary}30`,
  },
  printButton: {
    backgroundColor: `${Colors.text.secondary}10`,
    borderColor: `${Colors.text.secondary}30`,
  },
  deleteButton: {
    backgroundColor: '#FF3B3010',
    borderColor: '#FF3B3030',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalContent: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
}); 