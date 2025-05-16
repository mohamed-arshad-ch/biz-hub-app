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
  ShoppingCart,
  Tag,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import { purchaseReturnData } from '@/mocks/purchaseReturnData';
import { PurchaseReturn } from '@/types/purchase-return';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Define sort and filter option types
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'draft' | 'pending' | 'completed' | 'cancelled';

export default function PurchaseReturnScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Sort and filter states
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // Fetch data on initial load
  useEffect(() => {
    fetchReturns();
  }, []);

  // Fetch returns
  const fetchReturns = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setReturns(purchaseReturnData);
      setFilteredReturns(purchaseReturnData);
      setLoading(false);
    }, 800);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate network delay
    setTimeout(() => {
      setReturns(purchaseReturnData);
      setFilteredReturns(purchaseReturnData);
      setRefreshing(false);
    }, 800);
  };

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      applyFilterAndSort(returns);
    } else {
      const filtered = returns.filter(
        returnItem => 
          returnItem.vendorName.toLowerCase().includes(text.toLowerCase()) ||
          returnItem.returnNumber.toLowerCase().includes(text.toLowerCase()) ||
          returnItem.originalOrderNumber.toLowerCase().includes(text.toLowerCase())
      );
      applyFilterAndSort(filtered);
    }
  };

  // Handle sort
  const handleSort = (option: SortOption) => {
    setSortOption(option);
    setShowSortOptions(false);
    applyFilterAndSort(filteredReturns, option, filterOption);
  };
  
  // Handle filter
  const handleFilter = (option: FilterOption) => {
    setFilterOption(option);
    setShowFilterOptions(false);
    applyFilterAndSort(filteredReturns, sortOption, option);
  };
  
  // Apply filter and sort
  const applyFilterAndSort = (data: PurchaseReturn[], sortOpt = sortOption, filterOpt = filterOption) => {
    let result = [...data];
    
    // Apply filter
    if (filterOpt !== 'all') {
      result = result.filter(returnItem => returnItem.status === filterOpt);
    }
    
    // Apply sort
    switch (sortOpt) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.total - a.total);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.total - b.total);
        break;
    }
    
    setFilteredReturns(result);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'draft':
        return { bg: 'rgba(90, 200, 250, 0.1)', text: '#5AC8FA' };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} color={Colors.status.completed} />;
      case 'pending':
        return <Clock size={14} color={Colors.status.pending} />;
      case 'draft':
        return <AlertCircle size={14} color="#5AC8FA" />;
      case 'cancelled':
        return <XCircle size={14} color={Colors.status.cancelled} />;
      default:
        return null;
    }
  };
  
  // Handle print return
  const handlePrint = (returnItem: PurchaseReturn) => {
    Alert.alert('Print', `Printing return #${returnItem.returnNumber}...`);
  };
  
  // Handle share return
  const handleShare = (returnItem: PurchaseReturn) => {
    Alert.alert('Share', `Sharing return #${returnItem.returnNumber}...`);
  };
  
  // Handle delete return
  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Return',
      'Are you sure you want to delete this return?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedReturns = returns.filter(returnItem => returnItem.id !== id);
            setReturns(updatedReturns);
            setFilteredReturns(updatedReturns.filter(item => 
              filterOption === 'all' || item.status === filterOption
            ));
            Alert.alert('Success', 'Return deleted successfully');
          },
        },
      ]
    );
  };

  const renderReturnItem = useCallback(({ item }: { item: PurchaseReturn }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/purchase-return/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.returnNumber}>{item.returnNumber}</Text>
          
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
              <Text style={styles.infoText}>{new Date(item.returnDate).toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <ShoppingCart size={16} color={Colors.text.secondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{item.originalOrderNumber}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Package size={16} color={Colors.text.secondary} style={styles.infoIcon} />
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
          onPress={() => router.push(`/purchase-return/edit/${item.id}`)}
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
      <Package size={60} color={Colors.border.light} style={{ marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>No Returns Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || filterOption !== 'all' 
          ? 'Try changing your search or filter options' 
          : 'Tap the + button to create your first return'}
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
        <Text style={styles.title}>Purchase Returns</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search returns by vendor, number..."
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
              {filterOption === 'all' ? 'All Returns' : 
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
              <Text style={[styles.dropdownText, filterOption === 'all' && styles.selectedText]}>All Returns</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'draft' && styles.selectedItem]}
              onPress={() => handleFilter('draft')}
            >
              <Text style={[styles.dropdownText, filterOption === 'draft' && styles.selectedText]}>Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'pending' && styles.selectedItem]}
              onPress={() => handleFilter('pending')}
            >
              <Text style={[styles.dropdownText, filterOption === 'pending' && styles.selectedText]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterOption === 'completed' && styles.selectedItem]}
              onPress={() => handleFilter('completed')}
            >
              <Text style={[styles.dropdownText, filterOption === 'completed' && styles.selectedText]}>Completed</Text>
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
          <Text style={styles.loadingText}>Loading returns...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReturns}
          keyExtractor={(item) => item.id}
          renderItem={renderReturnItem}
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
        onPress={() => router.push('/purchase-return/new')}
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
  returnNumber: {
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