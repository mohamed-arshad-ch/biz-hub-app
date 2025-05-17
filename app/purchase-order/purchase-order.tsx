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
  ArrowLeft,
  ChevronDown,
  FileText,
  Package,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../db';
import { purchaseOrders, vendors } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { useAuthStore } from '@/store/auth';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';

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
  id: number;
  orderNumber: string;
  vendorId: number;
  vendorName: string;
  orderDate: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  notes: string;
  shippingAddress: string;
  billingAddress: string;
  paymentTerms: string;
  dueDate: string;
}

export default function PurchaseOrderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadOrders();
  }, [user]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchQuery, statusFilter, dateFilter, sortBy, sortOrder]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const result = await db
        .select({
          id: purchaseOrders.id,
          orderNumber: purchaseOrders.orderNumber,
          orderDate: purchaseOrders.orderDate,
          status: purchaseOrders.status,
          total: purchaseOrders.total,
          subtotal: purchaseOrders.subtotal,
          tax: purchaseOrders.tax,
          discount: purchaseOrders.discount,
          notes: purchaseOrders.notes,
          shippingAddress: purchaseOrders.shippingAddress,
          billingAddress: purchaseOrders.billingAddress,
          paymentTerms: purchaseOrders.paymentTerms,
          dueDate: purchaseOrders.dueDate,
          vendorId: purchaseOrders.vendorId,
          vendorName: vendors.name,
        })
        .from(purchaseOrders)
        .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
        .where(eq(purchaseOrders.userId, user.id));

      setOrders(result.map(order => ({
        ...order,
        vendorName: order.vendorName || 'Unknown Vendor',
        status: order.status || 'pending',
        tax: order.tax || 0,
        discount: order.discount || 0,
        notes: order.notes || '',
        shippingAddress: order.shippingAddress || '',
        billingAddress: order.billingAddress || '',
        paymentTerms: order.paymentTerms || '',
        dueDate: order.dueDate || ''
      })));
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      Alert.alert('Error', 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        order =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.vendorName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.toDateString() === filterDate.toDateString();
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
          : new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      } else {
        return sortOrder === 'asc' ? a.total - b.total : b.total - a.total;
      }
    });

    setFilteredOrders(filtered);
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

  const renderOrderItem = ({ item }: { item: PurchaseOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/purchase-order/${item.id}`)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status).bg }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status).text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>
          {format(new Date(item.orderDate), 'MMM dd, yyyy')}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <User size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{item.vendorName}</Text>
        </View>
        <View style={styles.detailRow}>
          <DollarSign size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{formatCurrency(item.total)}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.footerItem}>
          <Calendar size={16} color={Colors.text.secondary} />
          <Text style={styles.footerText}>
            Due: {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : 'N/A'}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <FileText size={16} color={Colors.text.secondary} />
          <Text style={styles.footerText}>{item.paymentTerms || 'No terms'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/purchase-order/new')}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>New Order</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'pending', 'processing', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    statusFilter === status && styles.filterOptionActive,
                  ]}
                  onPress={() => setStatusFilter(status === 'all' ? null : status)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      statusFilter === status && styles.filterOptionTextActive,
                    ]}
                  >
                    {status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  setSortBy('date');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                <Calendar size={16} color={Colors.primary} />
                <Text style={styles.sortButtonText}>Date</Text>
                <ChevronDown
                  size={16}
                  color={Colors.primary}
                  style={[
                    styles.sortIcon,
                    sortBy === 'date' && sortOrder === 'asc' && styles.sortIconRotated,
                  ]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  setSortBy('amount');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                <DollarSign size={16} color={Colors.primary} />
                <Text style={styles.sortButtonText}>Amount</Text>
                <ChevronDown
                  size={16}
                  color={Colors.primary}
                  style={[
                    styles.sortIcon,
                    sortBy === 'amount' && sortOrder === 'asc' && styles.sortIconRotated,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  filtersPanel: {
    backgroundColor: Colors.background.default,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
    marginRight: 4,
  },
  sortIcon: {
    transform: [{ rotate: '0deg' }],
  },
  sortIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
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
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
}); 