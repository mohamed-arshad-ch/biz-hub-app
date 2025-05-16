import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
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
  FileText
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Define the SalesInvoice interface
interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  subtotal: number;
  tax: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
}

// Mock data for sales invoices
const salesInvoiceData: SalesInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-0001',
    customerName: 'Acme Corporation',
    invoiceDate: '2023-05-15',
    dueDate: '2023-06-15',
    total: 1250.00,
    subtotal: 1136.36,
    tax: 113.64,
    status: 'paid',
    items: [
      {
        productId: 'p1',
        productName: 'Website Development',
        quantity: 1,
        unitPrice: 1000.00,
        total: 1000.00
      },
      {
        productId: 'p2',
        productName: 'SEO Services',
        quantity: 5,
        unitPrice: 50.00,
        total: 250.00
      }
    ]
  },
  {
    id: '2',
    invoiceNumber: 'INV-0002',
    customerName: 'Tech Solutions Inc.',
    invoiceDate: '2023-05-20',
    dueDate: '2023-06-20',
    total: 750.00,
    subtotal: 681.82,
    tax: 68.18,
    status: 'unpaid',
    items: [
      {
        productId: 'p3',
        productName: 'Consulting Services',
        quantity: 5,
        unitPrice: 150.00,
        total: 750.00
      }
    ]
  },
  {
    id: '3',
    invoiceNumber: 'INV-0003',
    customerName: 'Global Enterprises',
    invoiceDate: '2023-04-10',
    dueDate: '2023-05-10',
    total: 3500.00,
    subtotal: 3181.82,
    tax: 318.18,
    status: 'overdue',
    items: [
      {
        productId: 'p4',
        productName: 'Software License',
        quantity: 1,
        unitPrice: 2500.00,
        total: 2500.00
      },
      {
        productId: 'p5',
        productName: 'Support Package',
        quantity: 10,
        unitPrice: 100.00,
        total: 1000.00
      }
    ]
  },
  {
    id: '4',
    invoiceNumber: 'INV-0004',
    customerName: 'Startups Ltd.',
    invoiceDate: '2023-05-25',
    dueDate: '2023-06-25',
    total: 500.00,
    subtotal: 454.55,
    tax: 45.45,
    status: 'cancelled',
    items: [
      {
        productId: 'p6',
        productName: 'Marketing Materials',
        quantity: 1,
        unitPrice: 500.00,
        total: 500.00
      }
    ]
  }
];

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';

export default function SalesInvoiceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<SalesInvoice[]>(salesInvoiceData);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    
    // Sort the invoices based on selected option
    const sortedInvoices = [...invoices].sort((a, b) => {
      if (option === 'date-desc') {
        return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
      } else if (option === 'date-asc') {
        return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
      } else if (option === 'amount-desc') {
        return b.total - a.total;
      } else {
        return a.total - b.total;
      }
    });
    
    setInvoices(sortedInvoices);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Filter the invoices based on selected option
    if (option === 'all') {
      setInvoices(salesInvoiceData);
    } else {
      const filteredInvoices = salesInvoiceData.filter(invoice => invoice.status === option);
      setInvoices(filteredInvoices);
    }
  };
  
  const handlePrint = (id: string) => {
    Alert.alert('Print', 'Printing sales invoice...');
  };
  
  const handleShare = (id: string) => {
    Alert.alert('Share', 'Sharing sales invoice...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'unpaid':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'overdue':
        return { bg: 'rgba(244, 67, 54, 0.1)', text: Colors.negative };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };

  const renderInvoiceItem = useCallback(({ item }: { item: SalesInvoice }) => (
    <TouchableOpacity
      style={styles.invoiceItem}
      onPress={() => router.push({
        pathname: '/sales-invoice/[id]',
        params: { id: item.id }
      })}
    >
      <View style={styles.invoiceContent}>
        <View style={styles.invoiceMainInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.amount}>${item.total.toFixed(2)}</Text>
        </View>
        
        <View style={styles.invoiceDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {new Date(item.invoiceDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <FileText size={16} color={Colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              Invoice #{item.invoiceNumber}
            </Text>
          </View>
        </View>
        
        <View style={styles.invoiceFooter}>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: getStatusColor(item.status).bg
            }
          ]}>
            <Text style={[
              styles.statusText,
              { 
                color: getStatusColor(item.status).text
              }
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.actionIcons}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handleShare(item.id)}
            >
              <Share2 size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handlePrint(item.id)}
            >
              <Printer size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sales Invoices</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
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
              Filter: {filterBy === 'all' ? 'All' : filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
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
            {sortBy.includes('desc') ? (
              <SortDesc size={16} color={Colors.text.secondary} />
            ) : (
              <SortAsc size={16} color={Colors.text.secondary} />
            )}
            <Text style={styles.filterSortText}>
              Sort: {
                sortBy === 'date-desc' ? 'Newest' :
                sortBy === 'date-asc' ? 'Oldest' :
                sortBy === 'amount-desc' ? 'Highest' : 'Lowest'
              }
            </Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {showFilterOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'all' && styles.selectedItem]}
              onPress={() => handleFilter('all')}
            >
              <Text style={[styles.dropdownText, filterBy === 'all' && styles.selectedText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'paid' && styles.selectedItem]}
              onPress={() => handleFilter('paid')}
            >
              <Text style={[styles.dropdownText, filterBy === 'paid' && styles.selectedText]}>Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'unpaid' && styles.selectedItem]}
              onPress={() => handleFilter('unpaid')}
            >
              <Text style={[styles.dropdownText, filterBy === 'unpaid' && styles.selectedText]}>Unpaid</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'overdue' && styles.selectedItem]}
              onPress={() => handleFilter('overdue')}
            >
              <Text style={[styles.dropdownText, filterBy === 'overdue' && styles.selectedText]}>Overdue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'cancelled' && styles.selectedItem]}
              onPress={() => handleFilter('cancelled')}
            >
              <Text style={[styles.dropdownText, filterBy === 'cancelled' && styles.selectedText]}>Cancelled</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {showSortOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'date-desc' && styles.selectedItem]}
              onPress={() => handleSort('date-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'date-desc' && styles.selectedText]}>Date (Newest first)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'date-asc' && styles.selectedItem]}
              onPress={() => handleSort('date-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'date-asc' && styles.selectedText]}>Date (Oldest first)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'amount-desc' && styles.selectedItem]}
              onPress={() => handleSort('amount-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'amount-desc' && styles.selectedText]}>Amount (Highest first)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'amount-asc' && styles.selectedItem]}
              onPress={() => handleSort('amount-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'amount-asc' && styles.selectedText]}>Amount (Lowest first)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={invoices.filter(invoice => {
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              invoice.invoiceNumber.toLowerCase().includes(query) ||
              invoice.customerName.toLowerCase().includes(query) ||
              String(invoice.total).includes(query)
            );
          }
          return true;
        })}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No invoices found</Text>
            <Text style={styles.emptySubtext}>Create a new invoice to get started</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/sales-invoice/new')}
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
    backgroundColor: 'white',
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
  listContainer: {
    padding: 16,
  },
  invoiceItem: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  invoiceContent: {
    padding: 16,
  },
  invoiceMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  invoiceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  invoiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36, 
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
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
    elevation: 6,
  },
}); 