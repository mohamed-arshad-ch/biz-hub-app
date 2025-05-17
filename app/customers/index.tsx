import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  Image,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Search,
  X,
  ChevronDown,
  ArrowUpDown,
  User,
  Mail,
  Phone,
  Building2,
  ArrowLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  Filter,
  MessageCircle,
  Check
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as dbCustomer from '@/db/customer';
import * as schema from '@/db/schema';
import { SafeAreaView } from 'react-native-safe-area-context';

// Type definitions
type SortOption = 'name-asc' | 'name-desc' | 'type-asc' | 'type-desc' | 'recent';
type FilterOption = 'all' | 'business' | 'individual';
type Customer = {
  id: string;
  name: string;
  contactName: string | null;
  email: string;
  phone: string;
  type: 'Business' | 'Individual';
  address: string;
  notes: string;
  avatar: string | null;
};

export default function CustomersScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // Load customers data
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const dbCustomers = await dbCustomer.getAllCustomers();
      // Map DB customers to UI customers
      const mapped = dbCustomers.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        contactName: c.contactPerson || null,
        email: c.email || '',
        phone: c.phone || '',
        type: c.company && c.company.trim() !== '' ? 'Business' : 'Individual' as 'Business' | 'Individual',
        address: [c.address, c.city, c.state, c.zipCode, c.country].filter(Boolean).join(', '),
        notes: c.notes || '',
        avatar: null, // No avatar in schema
      }));
      setAllCustomers(mapped);
      setCustomers(mapped);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    
    // Apply sort to all filtered customers
    applyFiltersAndSort(option, filterBy);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Apply filter with current sort
    applyFiltersAndSort(sortBy, option);
  };

  // Apply search, filter, and sort
  useEffect(() => {
    applyFiltersAndSort(sortBy, filterBy);
  }, [allCustomers, searchQuery]);

  const applyFiltersAndSort = (sortOption: SortOption, filterOption: FilterOption) => {
    let filtered = [...allCustomers];
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query) || 
        customer.email.toLowerCase().includes(query) ||
        customer.phone.includes(query)
      );
    }
    
    // Apply filter
    if (filterOption !== 'all') {
      filtered = filtered.filter(customer => 
        customer.type.toLowerCase() === filterOption
      );
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortOption === 'type-asc') {
        return a.type.localeCompare(b.type);
      } else if (sortOption === 'type-desc') {
        return b.type.localeCompare(a.type);
      } else {
        // recent - sort by ID descending
        return b.id.localeCompare(a.id);
      }
    });
    
    setCustomers(sorted);
  };

  const handleCall = (phone: string, event: any) => {
    event.stopPropagation();
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('No Phone Number', 'This customer does not have a phone number.');
    }
  };

  const handleWhatsApp = (phone: string, event: any) => {
    event.stopPropagation();
    if (phone) {
      // Remove any non-digit characters from the phone number
      const cleanPhone = phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    } else {
      Alert.alert('No Phone Number', 'This customer does not have a phone number for WhatsApp.');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/customers/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    const customerToDelete = customers.find(customer => customer.id === id);
    if (!customerToDelete) return;
    
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customerToDelete.name}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete(id)
        }
      ]
    );
  };

  const performDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await dbCustomer.deleteCustomer(Number(id));
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
      Alert.alert('Success', 'Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      Alert.alert('Error', 'Failed to delete customer');
      setDeletingId(null);
    }
  };

  const renderCustomerItem = useCallback(({ item }: { item: Customer }) => {
    const isDeleting = deletingId === item.id;
    
    if (isDeleting) {
      return (
        <View style={styles.deletingItemContainer}>
          <ActivityIndicator size="small" color="#FF3B30" />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/customers/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={[styles.typeBadge, { 
              backgroundColor: item.type === 'Business' 
                ? 'rgba(33, 150, 243, 0.1)' 
                : 'rgba(76, 175, 80, 0.1)'
            }]}>
              <Text style={[styles.typeText, { 
                color: item.type === 'Business' 
                  ? Colors.info 
                  : Colors.primary 
              }]}>
                {item.type}
              </Text>
            </View>
          </View>
          
          {item.contactName && (
            <Text style={styles.contactName}>{item.contactName}</Text>
          )}
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.customerInfo}>
            <View style={styles.detailRow}>
              <Mail size={16} color={Colors.text.secondary} style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>{item.email || 'No email'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Phone size={16} color={Colors.text.secondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.phone || 'No phone'}</Text>
            </View>
          </View>
          
          <ChevronRight size={18} color={Colors.text.tertiary} />
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.cardActionButton}
            onPress={(e) => handleCall(item.phone, e)}
          >
            <Phone size={18} color={Colors.text.secondary} />
            <Text style={styles.cardActionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cardActionButton}
            onPress={(e) => handleWhatsApp(item.phone, e)}
          >
            <MessageCircle size={18} color={Colors.text.secondary} />
            <Text style={styles.cardActionText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [router, deletingId]);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {!loading && (
        <>
          <User size={50} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Customers Found</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery 
              ? `No customers match "${searchQuery}"`
              : 'Add your first customer to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/customers/new')}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Customer</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Customers</Text>
        <TouchableOpacity onPress={() => router.push('/customers/new')} style={styles.addButton}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers"
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
            {filterBy === 'all' ? 'All Types' : 
             filterBy === 'business' ? 'Business' : 'Individual'}
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
            {sortBy === 'name-asc' ? 'Name A-Z' :
             sortBy === 'name-desc' ? 'Name Z-A' :
             sortBy === 'type-asc' ? 'Type A-Z' :
             sortBy === 'type-desc' ? 'Type Z-A' : 'Recent'}
          </Text>
          <ChevronDown size={16} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {showFilterOptions && (
        <View style={styles.optionsDropdown}>
          <TouchableOpacity
            style={[styles.optionItem, filterBy === 'all' && styles.selectedOption]}
            onPress={() => handleFilter('all')}
          >
            <Text style={styles.optionText}>All Types</Text>
            {filterBy === 'all' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionItem, filterBy === 'business' && styles.selectedOption]}
            onPress={() => handleFilter('business')}
          >
            <Text style={styles.optionText}>Business</Text>
            {filterBy === 'business' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionItem, filterBy === 'individual' && styles.selectedOption]}
            onPress={() => handleFilter('individual')}
          >
            <Text style={styles.optionText}>Individual</Text>
            {filterBy === 'individual' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
        </View>
      )}
      
      {showSortOptions && (
        <View style={styles.optionsDropdown}>
          <TouchableOpacity
            style={[styles.optionItem, sortBy === 'name-asc' && styles.selectedOption]}
            onPress={() => handleSort('name-asc')}
          >
            <Text style={styles.optionText}>Name A-Z</Text>
            {sortBy === 'name-asc' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionItem, sortBy === 'name-desc' && styles.selectedOption]}
            onPress={() => handleSort('name-desc')}
          >
            <Text style={styles.optionText}>Name Z-A</Text>
            {sortBy === 'name-desc' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionItem, sortBy === 'type-asc' && styles.selectedOption]}
            onPress={() => handleSort('type-asc')}
          >
            <Text style={styles.optionText}>Type A-Z</Text>
            {sortBy === 'type-asc' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionItem, sortBy === 'type-desc' && styles.selectedOption]}
            onPress={() => handleSort('type-desc')}
          >
            <Text style={styles.optionText}>Type Z-A</Text>
            {sortBy === 'type-desc' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionItem, sortBy === 'recent' && styles.selectedOption]}
            onPress={() => handleSort('recent')}
          >
            <Text style={styles.optionText}>Most Recent</Text>
            {sortBy === 'recent' && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filterSortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  filterSortText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  optionsDropdown: {
    marginHorizontal: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
    zIndex: 100,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  selectedOption: {
    backgroundColor: Colors.background.tertiary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 8,
  },
  contactName: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  cardActionText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  deletingItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  deletingText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
});