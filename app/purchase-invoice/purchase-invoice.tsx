import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Search, Filter, ArrowLeft, Calendar, SortAsc, SortDesc, ChevronDown, User, Share2, Printer, X, FileText } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getPurchaseInvoices } from '@/db/purchase-invoice';
import { getAllVendors } from '@/db/vendor';
import type { PurchaseInvoice } from '@/db/schema';
import type { Vendor } from '@/db/schema';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';

export default function PurchaseInvoiceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allInvoices, setAllInvoices] = useState<PurchaseInvoice[]>([]);

  useEffect(() => {
    loadInvoices();
    loadVendors();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
      loadVendors();
    }, [sortBy])
  );

  const loadInvoices = async () => {
    try {
      if (!user) return;
      setLoading(true);
      let sortParam: 'newest' | 'oldest' = 'newest';
      if (sortBy === 'date-desc') sortParam = 'newest';
      else if (sortBy === 'date-asc') sortParam = 'oldest';
      const fetchedInvoices = await getPurchaseInvoices(user.id, sortParam);
      setAllInvoices(fetchedInvoices);
      setInvoices(fetchedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      Alert.alert('Error', 'Failed to load purchase invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const fetchedVendors = await getAllVendors();
      setVendors(fetchedVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const refreshInvoices = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  // Helper to get vendor name by id
  const getVendorName = (vendorId: number) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : `Vendor #${vendorId}`;
  };

  // Apply search, filter, and sort
  useEffect(() => {
    let filtered = [...allInvoices];
    // Filter by status
    if (filterBy !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filterBy);
    }
    // Search by invoice number or vendor name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(invoice =>
        (invoice.invoiceNumber ?? '').toLowerCase().includes(q) ||
        (getVendorName(invoice.vendorId) ?? '').toLowerCase().includes(q)
      );
    }
    // Only sort by amount here; date sort is handled in DB
    if (sortBy === 'amount-desc') {
      filtered.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'amount-asc') {
      filtered.sort((a, b) => a.total - b.total);
    }
    setInvoices(filtered);
  }, [allInvoices, vendors, searchQuery, filterBy, sortBy]);

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
    Alert.alert('Print', 'Printing purchase invoice...');
  };

  const handleShare = (id: number) => {
    Alert.alert('Share', 'Sharing purchase invoice...');
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

  const renderInvoiceItem = useCallback(({ item }: { item: PurchaseInvoice }) => (
    <TouchableOpacity
      style={styles.invoiceItem}
      onPress={() => router.push({
        pathname: '/purchase-invoice/[id]',
        params: { id: item.id.toString() }
      })}
    >
      <View style={styles.invoiceContent}>
        <View style={styles.invoiceMainInfo}>
          <Text style={styles.vendorName}>{getVendorName(item.vendorId)}</Text>
          <Text style={styles.amount}>${(item.total / 100).toFixed(2)}</Text>
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
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePrint(item.id)}
            >
              <Printer size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item.id)}
            >
              <Share2 size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [vendors]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Purchase Invoices</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/purchase-invoice/new')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterOptions(!showFilterOptions)}
        >
          <Filter size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          {sortBy.includes('desc') ? (
            <SortDesc size={20} color={Colors.text.secondary} />
          ) : (
            <SortAsc size={20} color={Colors.text.secondary} />
          )}
        </TouchableOpacity>
      </View>

      {showFilterOptions && (
        <View style={styles.filterOptions}>
          <TouchableOpacity
            style={[styles.filterOption, filterBy === 'all' && styles.selectedFilter]}
            onPress={() => handleFilter('all')}
          >
            <Text style={[styles.filterText, filterBy === 'all' && styles.selectedFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterOption, filterBy === 'paid' && styles.selectedFilter]}
            onPress={() => handleFilter('paid')}
          >
            <Text style={[styles.filterText, filterBy === 'paid' && styles.selectedFilterText]}>
              Paid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterOption, filterBy === 'unpaid' && styles.selectedFilter]}
            onPress={() => handleFilter('unpaid')}
          >
            <Text style={[styles.filterText, filterBy === 'unpaid' && styles.selectedFilterText]}>
              Unpaid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterOption, filterBy === 'overdue' && styles.selectedFilter]}
            onPress={() => handleFilter('overdue')}
          >
            <Text style={[styles.filterText, filterBy === 'overdue' && styles.selectedFilterText]}>
              Overdue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterOption, filterBy === 'cancelled' && styles.selectedFilter]}
            onPress={() => handleFilter('cancelled')}
          >
            <Text style={[styles.filterText, filterBy === 'cancelled' && styles.selectedFilterText]}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showSortOptions && (
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'date-desc' && styles.selectedSort]}
            onPress={() => handleSort('date-desc')}
          >
            <Text style={[styles.sortText, sortBy === 'date-desc' && styles.selectedSortText]}>
              Newest First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'date-asc' && styles.selectedSort]}
            onPress={() => handleSort('date-asc')}
          >
            <Text style={[styles.sortText, sortBy === 'date-asc' && styles.selectedSortText]}>
              Oldest First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'amount-desc' && styles.selectedSort]}
            onPress={() => handleSort('amount-desc')}
          >
            <Text style={[styles.sortText, sortBy === 'amount-desc' && styles.selectedSortText]}>
              Highest Amount
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'amount-asc' && styles.selectedSort]}
            onPress={() => handleSort('amount-asc')}
          >
            <Text style={[styles.sortText, sortBy === 'amount-asc' && styles.selectedSortText]}>
              Lowest Amount
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshInvoices}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No purchase invoices found</Text>
            </View>
          }
        />
      )}
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
    padding: 16,
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
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: Colors.background.secondary,
  },
  selectedFilter: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  selectedFilterText: {
    color: '#fff',
  },
  sortOptions: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  selectedSort: {
    backgroundColor: Colors.background.secondary,
  },
  sortText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  selectedSortText: {
    color: Colors.primary,
  },
  list: {
    padding: 16,
  },
  invoiceItem: {
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  invoiceContent: {
    padding: 16,
  },
  invoiceMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  invoiceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 