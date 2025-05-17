import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Search, Filter, ArrowLeft, Calendar, SortAsc, SortDesc, ChevronDown, User, Share2, Printer, X, FileText, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getSalesInvoices } from '@/db/sales-invoice';
import { getAllCustomers } from '@/db/customer';
import type { SalesInvoice } from '@/db/schema';
import type { Customer } from '@/db/schema';
import { formatCurrency } from '@/utils/currency';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';

export default function SalesInvoiceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allInvoices, setAllInvoices] = useState<SalesInvoice[]>([]);

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
      loadCustomers();
    }, [sortBy])
  );

  const loadInvoices = async () => {
    try {
      if (!user) return;
      setLoading(true);
      let sortParam: 'newest' | 'oldest' = 'newest';
      if (sortBy === 'date-desc') sortParam = 'newest';
      else if (sortBy === 'date-asc') sortParam = 'oldest';
      const fetchedInvoices = await getSalesInvoices(user.id, sortParam);
      setAllInvoices(fetchedInvoices);
      setInvoices(fetchedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      Alert.alert('Error', 'Failed to load sales invoices');
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

  const refreshInvoices = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  // Helper to get customer name by id
  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };

  // Apply search, filter, and sort
  useEffect(() => {
    let filtered = [...allInvoices];
    // Filter by status
    if (filterBy !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filterBy);
    }
    // Search by invoice number or customer name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(invoice =>
        (invoice.invoiceNumber ?? '').toLowerCase().includes(q) ||
        (getCustomerName(invoice.customerId) ?? '').toLowerCase().includes(q)
      );
    }
    // Only sort by amount here; date sort is handled in DB
    if (sortBy === 'amount-desc') {
      filtered.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'amount-asc') {
      filtered.sort((a, b) => a.total - b.total);
    }
    setInvoices(filtered);
  }, [allInvoices, customers, searchQuery, filterBy, sortBy]);

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    if (option === 'date-desc' || option === 'date-asc') {
      loadInvoices();
    } else {
      // For amount sort, do client-side sort
      const sortedInvoices = [...invoices].sort((a, b) => {
        if (option === 'amount-desc') {
          return b.total - a.total;
        } else {
          return a.total - b.total;
        }
      });
      setInvoices(sortedInvoices);
    }
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    // Filter the invoices based on selected option
    if (option === 'all') {
      loadInvoices();
    } else {
      const filteredInvoices = allInvoices.filter(invoice => invoice.status === option);
      setInvoices(filteredInvoices);
    }
  };

  const handlePrint = (id: number) => {
    Alert.alert('Print', 'Printing sales invoice...');
  };

  const handleShare = (id: number) => {
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
        params: { id: item.id.toString() }
      })}
    >
      <View style={styles.invoiceContent}>
        <View style={styles.invoiceMainInfo}>
          <Text style={styles.customerName}>{getCustomerName(item.customerId)}</Text>
          <Text style={styles.amount}>{formatCurrency(item.total / 100)}</Text>
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
              backgroundColor: getStatusColor(item.status ?? 'unpaid').bg
            }
          ]}>
            <Text style={[
              styles.statusText,
              { 
                color: getStatusColor(item.status ?? 'unpaid').text
              }
            ]}>
              {(item.status ?? 'unpaid').toUpperCase()}
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
  ), [customers]);

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
            placeholder="Search by invoice number or customer name"
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
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderInvoiceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshInvoices} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No invoices found</Text>
              <Text style={styles.emptySubtext}>Create a new invoice to get started</Text>
            </View>
          }
        />
      )}
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