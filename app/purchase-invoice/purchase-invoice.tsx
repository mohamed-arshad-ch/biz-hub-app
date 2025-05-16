import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Calendar, 
  User, 
  ChevronDown, 
  SortAsc, 
  SortDesc,
  Printer,
  Share2,
  X,
  Receipt,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Mock data for purchase invoices
const purchaseInvoiceData = [
  {
    id: 'pi-001',
    invoiceNumber: 'PI-2023-001',
    vendorId: 'v-001',
    vendorName: 'ABC Suppliers',
    invoiceDate: '2023-08-15',
    dueDate: '2023-09-15',
    subtotal: 750.00,
    tax: 75.00,
    total: 825.00,
    status: 'paid',
    items: [
      { id: 'item-001', productName: 'Office Chair', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-002', productName: 'Desk Lamp', quantity: 6, unitPrice: 50.00, total: 300.00 }
    ]
  },
  {
    id: 'pi-002',
    invoiceNumber: 'PI-2023-002',
    vendorId: 'v-002',
    vendorName: 'XYZ Electronics',
    invoiceDate: '2023-08-20',
    dueDate: '2023-09-20',
    subtotal: 1200.00,
    tax: 120.00,
    total: 1320.00,
    status: 'unpaid',
    items: [
      { id: 'item-003', productName: 'Laptop', quantity: 1, unitPrice: 1200.00, total: 1200.00 }
    ]
  },
  {
    id: 'pi-003',
    invoiceNumber: 'PI-2023-003',
    vendorId: 'v-003',
    vendorName: 'Office Supplies Co.',
    invoiceDate: '2023-08-10',
    dueDate: '2023-09-10',
    subtotal: 480.00,
    tax: 48.00,
    total: 528.00,
    status: 'overdue',
    items: [
      { id: 'item-004', productName: 'Printer Paper', quantity: 20, unitPrice: 10.00, total: 200.00 },
      { id: 'item-005', productName: 'Ink Cartridges', quantity: 4, unitPrice: 70.00, total: 280.00 }
    ]
  },
  {
    id: 'pi-004',
    invoiceNumber: 'PI-2023-004',
    vendorId: 'v-004',
    vendorName: 'Tech Gadgets Inc.',
    invoiceDate: '2023-08-25',
    dueDate: '2023-09-25',
    subtotal: 900.00,
    tax: 90.00,
    total: 990.00,
    status: 'unpaid',
    items: [
      { id: 'item-006', productName: 'Wireless Headphones', quantity: 3, unitPrice: 150.00, total: 450.00 },
      { id: 'item-007', productName: 'Smart Speaker', quantity: 3, unitPrice: 150.00, total: 450.00 }
    ]
  },
  {
    id: 'pi-005',
    invoiceNumber: 'PI-2023-005',
    vendorId: 'v-005',
    vendorName: 'Furniture Warehouse',
    invoiceDate: '2023-07-30',
    dueDate: '2023-08-30',
    subtotal: 2500.00,
    tax: 250.00,
    total: 2750.00,
    status: 'cancelled',
    items: [
      { id: 'item-008', productName: 'Conference Table', quantity: 1, unitPrice: 1500.00, total: 1500.00 },
      { id: 'item-009', productName: 'Office Chair', quantity: 5, unitPrice: 200.00, total: 1000.00 }
    ]
  }
];

// Interface for PurchaseInvoice
interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

// Define sort and filter option types
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';

export default function PurchaseInvoiceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Sort and filter states
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // Fetch data on initial load
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fetch invoices
  const fetchInvoices = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setInvoices(purchaseInvoiceData);
      setFilteredInvoices(purchaseInvoiceData);
      setLoading(false);
    }, 800);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate network delay
    setTimeout(() => {
      setInvoices(purchaseInvoiceData);
      setFilteredInvoices(purchaseInvoiceData);
      setRefreshing(false);
    }, 800);
  };

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      applyFilterAndSort(invoices);
    } else {
      const filtered = invoices.filter(
        invoice => 
          invoice.vendorName.toLowerCase().includes(text.toLowerCase()) ||
          invoice.invoiceNumber.toLowerCase().includes(text.toLowerCase())
      );
      applyFilterAndSort(filtered);
    }
  };

  // Handle sort
  const handleSort = (option: SortOption) => {
    setSortOption(option);
    setShowSortOptions(false);
    applyFilterAndSort(filteredInvoices, option, filterOption);
  };
  
  // Handle filter
  const handleFilter = (option: FilterOption) => {
    setFilterOption(option);
    setShowFilterOptions(false);
    applyFilterAndSort(filteredInvoices, sortOption, option);
  };
  
  // Apply filter and sort
  const applyFilterAndSort = (data: PurchaseInvoice[], sortOpt = sortOption, filterOpt = filterOption) => {
    let result = [...data];
    
    // Apply filter
    if (filterOpt !== 'all') {
      result = result.filter(invoice => invoice.status === filterOpt);
    }
    
    // Apply sort
    switch (sortOpt) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.total - a.total);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.total - b.total);
        break;
    }
    
    setFilteredInvoices(result);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'unpaid':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'overdue':
        return { bg: 'rgba(255, 59, 48, 0.1)', text: '#FF3B30' };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={14} color={Colors.status.completed} />;
      case 'unpaid':
        return <Clock size={14} color={Colors.status.pending} />;
      case 'overdue':
        return <AlertCircle size={14} color="#FF3B30" />;
      case 'cancelled':
        return <XCircle size={14} color={Colors.status.cancelled} />;
      default:
        return null;
    }
  };
  
  // Handle print invoice
  const handlePrint = (invoice: PurchaseInvoice) => {
    Alert.alert('Print', `Printing invoice #${invoice.invoiceNumber}...`);
  };
  
  // Handle share invoice
  const handleShare = (invoice: PurchaseInvoice) => {
    Alert.alert('Share', `Sharing invoice #${invoice.invoiceNumber}...`);
  };
  
  // Handle delete invoice
  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
            setInvoices(updatedInvoices);
            setFilteredInvoices(updatedInvoices.filter(item => 
              filterOption === 'all' || item.status === filterOption
            ));
            Alert.alert('Success', 'Invoice deleted successfully');
          },
        },
      ]
    );
  };

  const renderInvoiceItem = useCallback(({ item }: { item: PurchaseInvoice }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/purchase-invoice/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          
          <View style={styles.vendorInfo}>
            <User size={14} color={Colors.text.secondary} style={styles.infoIcon} />
            <Text style={styles.vendorName}>{item.vendorName}</Text>
          </View>
        </View>
        
        <Text style={styles.amount}>${item.total.toFixed(2)}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRowGroup}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Calendar size={16} color={Colors.text.secondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Invoice: {new Date(item.invoiceDate).toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Calendar size={16} color={Colors.text.secondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Receipt size={16} color={Colors.text.secondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{item.items.length} {item.items.length === 1 ? 'item' : 'items'}</Text>
            </View>
            
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(item.status).bg }
            ]}>
              {getStatusIcon(item.status)}
              <Text style={[
                styles.statusText, 
                { color: getStatusColor(item.status).text }
              ]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/purchase-invoice/edit/${item.id}`)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <View style={styles.actionIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => handlePrint(item)}
          >
            <Printer size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => handleShare(item)}
          >
            <Share2 size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => handleDelete(item.id)}
          >
            <X size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), []);
  
  // Render empty list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Receipt size={60} color={Colors.border.light} style={{ marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>No Invoices Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || filterOption !== 'all' 
          ? 'Try changing your search or filter options' 
          : 'Tap the + button to create your first invoice'}
      </Text>
    </View>
  );

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
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices by vendor, number..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <X size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.filterSortContainer}>
        <View style={styles.filterSortWrapper}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              setShowFilterOptions(!showFilterOptions);
              setShowSortOptions(false);
            }}
          >
            <Filter size={16} color={Colors.text.secondary} />
            <Text style={styles.filterSortText}>
              {filterOption === 'all' ? 'All Invoices' : 
                filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              setShowSortOptions(!showSortOptions);
              setShowFilterOptions(false);
            }}
          >
            {sortOption.includes('desc') ? (
              <SortDesc size={16} color={Colors.text.secondary} />
            ) : (
              <SortAsc size={16} color={Colors.text.secondary} />
            )}
            <Text style={styles.filterSortText}>
              {sortOption === 'date-desc' ? 'Newest First' :
               sortOption === 'date-asc' ? 'Oldest First' :
               sortOption === 'amount-desc' ? 'Highest Amount' : 'Lowest Amount'}
            </Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {showFilterOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'all' && styles.selectedItem]}
              onPress={() => handleFilter('all')}
            >
              <Text style={[styles.dropdownText, filterOption === 'all' && styles.selectedText]}>All Invoices</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'paid' && styles.selectedItem]}
              onPress={() => handleFilter('paid')}
            >
              <Text style={[styles.dropdownText, filterOption === 'paid' && styles.selectedText]}>Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'unpaid' && styles.selectedItem]}
              onPress={() => handleFilter('unpaid')}
            >
              <Text style={[styles.dropdownText, filterOption === 'unpaid' && styles.selectedText]}>Unpaid</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'overdue' && styles.selectedItem]}
              onPress={() => handleFilter('overdue')}
            >
              <Text style={[styles.dropdownText, filterOption === 'overdue' && styles.selectedText]}>Overdue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'cancelled' && styles.selectedItem]}
              onPress={() => handleFilter('cancelled')}
            >
              <Text style={[styles.dropdownText, filterOption === 'cancelled' && styles.selectedText]}>Cancelled</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {showSortOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortOption === 'date-desc' && styles.selectedItem]}
              onPress={() => handleSort('date-desc')}
            >
              <Text style={[styles.dropdownText, sortOption === 'date-desc' && styles.selectedText]}>Newest First</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortOption === 'date-asc' && styles.selectedItem]}
              onPress={() => handleSort('date-asc')}
            >
              <Text style={[styles.dropdownText, sortOption === 'date-asc' && styles.selectedText]}>Oldest First</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortOption === 'amount-desc' && styles.selectedItem]}
              onPress={() => handleSort('amount-desc')}
            >
              <Text style={[styles.dropdownText, sortOption === 'amount-desc' && styles.selectedText]}>Highest Amount</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortOption === 'amount-asc' && styles.selectedItem]}
              onPress={() => handleSort('amount-asc')}
            >
              <Text style={[styles.dropdownText, sortOption === 'amount-asc' && styles.selectedText]}>Lowest Amount</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={renderInvoiceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/purchase-invoice/new')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filterSortContainer: {
    position: 'relative',
    zIndex: 100,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterSortWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 8,
  },
  filterSortText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    left: 16,
    right: 16,
    backgroundColor: Colors.background.default,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  selectedItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.default,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 16,
  },
  cardContent: {
    padding: 16,
    backgroundColor: Colors.background.default,
  },
  infoRowGroup: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background.secondary,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  actionIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
}); 