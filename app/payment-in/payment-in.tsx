import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, StatusBar, RefreshControl, ActivityIndicator, Animated, Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Search, Filter, Calendar, SortAsc, SortDesc, ChevronDown, X, FileText, ArrowLeft, Share2, Printer, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { getPaymentIns } from '@/db/payment-in';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@/utils/currency';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'pending' | 'completed' | 'cancelled';

export default function PaymentInScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);

  useEffect(() => {
    loadPayments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [sortBy])
  );

  const loadPayments = async () => {
    try {
      if (!user) return;
      setLoading(true);
      let sortParam: 'newest' | 'oldest' = 'newest';
      if (sortBy === 'date-desc') sortParam = 'newest';
      else if (sortBy === 'date-asc') sortParam = 'oldest';
      const fetchedPayments = await getPaymentIns(user.id, sortParam);
      setAllPayments(fetchedPayments);
      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const refreshPayments = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  // Apply search, filter, and sort
  useEffect(() => {
    let filtered = [...allPayments];
    // Filter by status
    if (filterBy !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterBy);
    }
    // Search by payment number
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(payment =>
        (payment.paymentNumber ?? '').toLowerCase().includes(q)
      );
    }
    // Only sort by amount here; date sort is handled in DB
    if (sortBy === 'amount-desc') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'amount-asc') {
      filtered.sort((a, b) => a.amount - b.amount);
    }
    setPayments(filtered);
  }, [allPayments, searchQuery, filterBy, sortBy]);

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(33, 150, 243, 0.1)', text: Colors.info };
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.primary };
      case 'cancelled':
        return { bg: 'rgba(244, 67, 54, 0.1)', text: Colors.negative };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };

  const handleShare = async (item: any) => {
    try {
      const message = `Payment Receipt: #${item.paymentNumber}\nAmount: ${formatCurrency(item.amount)}\nDate: ${new Date(item.paymentDate).toLocaleDateString()}\nMethod: ${item.paymentMethod}`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.log('Error sharing receipt:', error);
    }
  };

  const handlePrint = (item: any) => {
    Alert.alert('Print', `Printing payment #${item.paymentNumber}`);
  };

  const renderPaymentItem = useCallback(({ item }: { item: any }) => {
    const statusColors = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/payment-in/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.paymentNumber}>#{item.paymentNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.customerInfo}>
            <Text style={styles.methodLabel}>{item.paymentMethod}</Text>
            {item.customer && (
              <Text style={styles.customerName} numberOfLines={1}>
                {item.customer.name}
              </Text>
            )}
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
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
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payments In</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by payment number"
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
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            setShowFilterOptions(!showFilterOptions);
            setShowSortOptions(false);
          }}
        >
          <Filter size={16} color={Colors.text.secondary} />
          <Text style={styles.filterSortText}>
            {filterBy === 'all' ? 'All' : filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
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
            {
              sortBy === 'date-desc' ? 'Newest' :
              sortBy === 'date-asc' ? 'Oldest' :
              sortBy === 'amount-desc' ? 'Highest' : 'Lowest'
            }
          </Text>
          <ChevronDown size={16} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {(showFilterOptions || showSortOptions) && (
        <View style={styles.dropdownOverlay}>
          {showFilterOptions && (
            <View style={styles.dropdown}>
              <TouchableOpacity 
                style={[styles.dropdownItem, filterBy === 'all' && styles.selectedItem]}
                onPress={() => handleFilter('all')}
              >
                <Text style={[styles.dropdownText, filterBy === 'all' && styles.selectedText]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, filterBy === 'pending' && styles.selectedItem]}
                onPress={() => handleFilter('pending')}
              >
                <Text style={[styles.dropdownText, filterBy === 'pending' && styles.selectedText]}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, filterBy === 'completed' && styles.selectedItem]}
                onPress={() => handleFilter('completed')}
              >
                <Text style={[styles.dropdownText, filterBy === 'completed' && styles.selectedText]}>Completed</Text>
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
                <Text style={[styles.dropdownText, sortBy === 'date-desc' && styles.selectedText]}>Newest First</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, sortBy === 'date-asc' && styles.selectedItem]}
                onPress={() => handleSort('date-asc')}
              >
                <Text style={[styles.dropdownText, sortBy === 'date-asc' && styles.selectedText]}>Oldest First</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, sortBy === 'amount-desc' && styles.selectedItem]}
                onPress={() => handleSort('amount-desc')}
              >
                <Text style={[styles.dropdownText, sortBy === 'amount-desc' && styles.selectedText]}>Highest Amount</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, sortBy === 'amount-asc' && styles.selectedItem]}
                onPress={() => handleSort('amount-asc')}
              >
                <Text style={[styles.dropdownText, sortBy === 'amount-asc' && styles.selectedText]}>Lowest Amount</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          {payments.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={60} color={Colors.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No Payments</Text>
              <Text style={styles.emptyStateText}>
                No payment records found. Tap the "+" button to create a new payment.
              </Text>
            </View>
          ) : (
            <FlatList
              data={payments}
              renderItem={renderPaymentItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refreshPayments}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
      
      {/* FAB Button */}
      <TouchableOpacity
        style={[styles.fabButton, { bottom: Math.max(insets.bottom + 16, 24) }]}
        onPress={() => router.push('/payment-in/new')}
      >
        <Plus size={24} color="#fff" />
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filterSortContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterSortText: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
  },
  dropdown: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  dateText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fabButton: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: 12,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 4,
    borderRadius: 6,
  },
  cardActionText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
}); 