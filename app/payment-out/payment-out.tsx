import React, { useState, useCallback } from 'react';
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
  CreditCard
} from 'lucide-react-native';
import { paymentOutData } from '@/mocks/paymentOutData';
import { PaymentOut } from '@/types/payment-out';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Define sort and filter option types
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'completed' | 'pending' | 'cancelled';

export default function PaymentOutScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<PaymentOut[]>(paymentOutData);
  const [filteredPayments, setFilteredPayments] = useState<PaymentOut[]>(paymentOutData);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Sort and filter states
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate network delay
    setTimeout(() => {
      setPayments(paymentOutData);
      setFilteredPayments(paymentOutData);
      setRefreshing(false);
    }, 500);
  };

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      applyFilterAndSort(payments);
    } else {
      const filtered = payments.filter(
        payment => 
          payment.vendorName.toLowerCase().includes(text.toLowerCase()) ||
          payment.referenceNumber.toLowerCase().includes(text.toLowerCase())
      );
      applyFilterAndSort(filtered);
    }
  };

  // Handle sort
  const handleSort = (option: SortOption) => {
    setSortOption(option);
    setShowSortOptions(false);
    applyFilterAndSort(filteredPayments, option, filterOption);
  };
  
  // Handle filter
  const handleFilter = (option: FilterOption) => {
    setFilterOption(option);
    setShowFilterOptions(false);
    applyFilterAndSort(filteredPayments, sortOption, option);
  };
  
  // Apply filter and sort
  const applyFilterAndSort = (data: PaymentOut[], sortOpt = sortOption, filterOpt = filterOption) => {
    let result = [...data];
    
    // Apply filter
    if (filterOpt !== 'all') {
      result = result.filter(payment => payment.status === filterOpt);
    }
    
    // Apply sort
    switch (sortOpt) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
    }
    
    setFilteredPayments(result);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };
  
  // Handle print payment
  const handlePrint = (payment: PaymentOut) => {
    Alert.alert('Print', `Printing payment #${payment.referenceNumber}...`);
  };
  
  // Handle share payment
  const handleShare = (payment: PaymentOut) => {
    Alert.alert('Share', `Sharing payment #${payment.referenceNumber}...`);
  };

  const renderPaymentItem = useCallback(({ item }: { item: PaymentOut }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/payment-out/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.vendorName}</Text>
          <Text style={styles.refNumber}>#{item.referenceNumber}</Text>
        </View>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Calendar size={16} color={Colors.text.secondary} style={styles.infoIcon} />
            <Text style={styles.infoText}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoItem}>
            <CreditCard size={16} color={Colors.text.secondary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {item.paymentMethod.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status).bg }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status).text }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePrint(item)}
          >
            <Printer size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Share2 size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), []);
  
  // Render empty list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Payments Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || filterOption !== 'all' 
          ? 'Try changing your search or filter options' 
          : 'Tap the + button to create your first payment'}
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
        <Text style={styles.title}>Payment Out</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payments..."
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
              Filter: {filterOption === 'all' ? 'All' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
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
              Sort: {
                sortOption === 'date-desc' ? 'Newest' :
                sortOption === 'date-asc' ? 'Oldest' :
                sortOption === 'amount-desc' ? 'Highest' : 'Lowest'
              }
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
              <Text style={[styles.dropdownText, filterOption === 'all' && styles.selectedText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'completed' && styles.selectedItem]}
              onPress={() => handleFilter('completed')}
            >
              <Text style={[styles.dropdownText, filterOption === 'completed' && styles.selectedText]}>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'pending' && styles.selectedItem]}
              onPress={() => handleFilter('pending')}
            >
              <Text style={[styles.dropdownText, filterOption === 'pending' && styles.selectedText]}>Pending</Text>
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
              <Text style={[styles.dropdownText, sortOption === 'date-desc' && styles.selectedText]}>Date (Newest first)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortOption === 'date-asc' && styles.selectedItem]}
              onPress={() => handleSort('date-asc')}
            >
              <Text style={[styles.dropdownText, sortOption === 'date-asc' && styles.selectedText]}>Date (Oldest first)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortOption === 'amount-desc' && styles.selectedItem]}
              onPress={() => handleSort('amount-desc')}
            >
              <Text style={[styles.dropdownText, sortOption === 'amount-desc' && styles.selectedText]}>Amount (Highest first)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortOption === 'amount-asc' && styles.selectedItem]}
              onPress={() => handleSort('amount-asc')}
            >
              <Text style={[styles.dropdownText, sortOption === 'amount-asc' && styles.selectedText]}>Amount (Lowest first)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentItem}
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
        onPress={() => router.push('/payment-out/new')}
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
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  refNumber: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
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