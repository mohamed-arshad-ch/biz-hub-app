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
  ChevronDown, 
  User, 
  Share2,
  Printer,
  X
} from 'lucide-react-native';
import { salesOrderData } from '@/mocks/salesOrderData';
import { SalesOrder } from '@/types/sales-order';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'completed' | 'processing' | 'draft' | 'cancelled';

export default function SalesOrderScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<SalesOrder[]>(salesOrderData);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    
    // Sort the orders based on selected option
    const sortedOrders = [...orders].sort((a, b) => {
      if (option === 'date-desc') {
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      } else if (option === 'date-asc') {
        return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      } else if (option === 'amount-desc') {
        return b.total - a.total;
      } else {
        return a.total - b.total;
      }
    });
    
    setOrders(sortedOrders);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Filter the orders based on selected option
    if (option === 'all') {
      setOrders(salesOrderData);
    } else {
      const filteredOrders = salesOrderData.filter(order => order.status === option);
      setOrders(filteredOrders);
    }
  };
  
  const handlePrint = (id: string) => {
    Alert.alert('Print', 'Printing sales order...');
  };
  
  const handleShare = (id: string) => {
    Alert.alert('Share', 'Sharing sales order...');
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

  const renderOrderItem = useCallback(({ item }: { item: SalesOrder }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => router.push({
        pathname: '/sales-order/[id]',
        params: { id: item.id }
      })}
    >
      <View style={styles.orderContent}>
        <View style={styles.orderMainInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.amount}>${item.total.toFixed(2)}</Text>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {new Date(item.orderDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <User size={16} color={Colors.text.secondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              Order #{item.orderNumber}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderFooter}>
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
        <Text style={styles.title}>Sales Orders</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
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
              <SortAsc size={16} color={Colors.text.secondary} />
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
              style={[styles.dropdownItem, filterBy === 'completed' && styles.selectedItem]}
              onPress={() => handleFilter('completed')}
            >
              <Text style={[styles.dropdownText, filterBy === 'completed' && styles.selectedText]}>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'processing' && styles.selectedItem]}
              onPress={() => handleFilter('processing')}
            >
              <Text style={[styles.dropdownText, filterBy === 'processing' && styles.selectedText]}>Processing</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'draft' && styles.selectedItem]}
              onPress={() => handleFilter('draft')}
            >
              <Text style={[styles.dropdownText, filterBy === 'draft' && styles.selectedText]}>Draft</Text>
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
        data={orders.filter(order => {
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              order.customerName.toLowerCase().includes(query) ||
              order.orderNumber.toLowerCase().includes(query) ||
              String(order.total).includes(query)
            );
          }
          return true;
        })}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/sales-order/new')}
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
  orderItem: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  orderContent: {
    padding: 16,
  },
  orderMainInfo: {
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
  orderDetails: {
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
  orderFooter: {
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