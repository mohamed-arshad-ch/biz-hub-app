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
  Image
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
  Edit,
  Trash2,
  FileText,
  Check,
  ArrowLeft
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
    
    // Sort the customers based on selected option
    const sortedCustomers = [...customers].sort((a, b) => {
      if (option === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (option === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (option === 'type-asc') {
        return a.type.localeCompare(b.type);
      } else if (option === 'type-desc') {
        return b.type.localeCompare(a.type);
      } else {
        // recent - sort by ID descending (assuming newer records have higher IDs)
        return b.id.localeCompare(a.id);
      }
    });
    
    setCustomers(sortedCustomers);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Filter the customers based on selected option
    if (option === 'all') {
      setCustomers(customers);
    } else {
      const filteredCustomers = customers.filter(customer => 
        customer.type.toLowerCase() === option
      );
      setCustomers(filteredCustomers);
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
        style={styles.customerItem}
        onPress={() => router.push(`/customers/${item.id}`)}
      >
        <View style={styles.customerContent}>
          <View style={styles.customerMainInfo}>
            <View style={styles.customerAvatarContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.customerAvatar} />
              ) : (
                <View style={[
                  styles.customerAvatarPlaceholder, 
                  { backgroundColor: item.type === 'Business' ? '#E3F2FD' : '#E8F5E9' }
                ]}>
                  {item.type === 'Business' ? (
                    <Building2 size={20} color="#2196F3" />
                  ) : (
                    <User size={20} color="#4CAF50" />
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.customerDetails}>
            {item.contactName && (
              <View style={styles.detailRow}>
                <User size={16} color={Colors.text.secondary} style={styles.detailIcon} />
                <Text style={styles.detailText}>{item.contactName}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Mail size={16} color={Colors.text.secondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.email}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Phone size={16} color={Colors.text.secondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          </View>
          
          <View style={styles.customerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEdit(item.id)}
            >
              <Edit size={16} color={Colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/customers/${item.id}`)}
            >
              <FileText size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDelete(item.id)}
            >
              <Trash2 size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [deletingId]);
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No customers found</Text>
      {searchQuery !== '' && (
        <Text style={styles.emptySubtext}>
          Try adjusting your search or filter criteria
        </Text>
      )}
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/customers/new')}
      >
        <Plus size={16} color="#FFF" />
        <Text style={styles.emptyButtonText}>Add New Customer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Customers</Text>
        <View style={{width: 40}} />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
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
            <Text style={styles.filterSortText}>
              {filterBy === 'all' ? 'All Customers' : 
               filterBy === 'business' ? 'Business Customers' : 'Individual Customers'}
            </Text>
            <ChevronDown size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              setShowSortOptions(!showSortOptions);
              setShowFilterOptions(false);
            }}
          >
            <ArrowUpDown size={18} color={Colors.text.secondary} />
            <Text style={styles.filterSortText}>
              {sortBy === 'name-asc' ? 'Name: A to Z' : 
               sortBy === 'name-desc' ? 'Name: Z to A' :
               sortBy === 'type-asc' ? 'Type: A to Z' :
               sortBy === 'type-desc' ? 'Type: Z to A' : 'Most Recent'}
            </Text>
            <ChevronDown size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {showSortOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'name-asc' && styles.selectedItem]}
              onPress={() => handleSort('name-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'name-asc' && styles.selectedText]}>Name: A to Z</Text>
              {sortBy === 'name-asc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'name-desc' && styles.selectedItem]}
              onPress={() => handleSort('name-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'name-desc' && styles.selectedText]}>Name: Z to A</Text>
              {sortBy === 'name-desc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'type-asc' && styles.selectedItem]}
              onPress={() => handleSort('type-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'type-asc' && styles.selectedText]}>Type: A to Z</Text>
              {sortBy === 'type-asc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'type-desc' && styles.selectedItem]}
              onPress={() => handleSort('type-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'type-desc' && styles.selectedText]}>Type: Z to A</Text>
              {sortBy === 'type-desc' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'recent' && styles.selectedItem]}
              onPress={() => handleSort('recent')}
            >
              <Text style={[styles.dropdownText, sortBy === 'recent' && styles.selectedText]}>Most Recent</Text>
              {sortBy === 'recent' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        )}
        
        {showFilterOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'all' && styles.selectedItem]}
              onPress={() => handleFilter('all')}
            >
              <Text style={[styles.dropdownText, filterBy === 'all' && styles.selectedText]}>All Customers</Text>
              {filterBy === 'all' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'business' && styles.selectedItem]}
              onPress={() => handleFilter('business')}
            >
              <Text style={[styles.dropdownText, filterBy === 'business' && styles.selectedText]}>Business Customers</Text>
              {filterBy === 'business' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'individual' && styles.selectedItem]}
              onPress={() => handleFilter('individual')}
            >
              <Text style={[styles.dropdownText, filterBy === 'individual' && styles.selectedText]}>Individual Customers</Text>
              {filterBy === 'individual' && <Check size={18} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={customers.filter(customer => {
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              return (
                customer.name.toLowerCase().includes(query) ||
                (customer.contactName && customer.contactName.toLowerCase().includes(query)) ||
                customer.email.toLowerCase().includes(query) ||
                customer.phone.toLowerCase().includes(query) ||
                customer.type.toLowerCase().includes(query) ||
                (customer.notes && customer.notes.toLowerCase().includes(query))
              );
            }
            return true;
          })}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
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
        onPress={() => router.push('/customers/new')}
      >
        <Plus size={24} color="#FFFFFF" />
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
    justifyContent: 'space-between',
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
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
    marginLeft: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    padding: 20,
    minHeight: 300,
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
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  customerItem: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    // // shadowColor: "#000",
    // // shadowOffset: {
    // //   width: 0,
    // //   height: 2,
    // // },
    // // shadowOpacity: 0.1,
    // // shadowRadius: 3,
    // elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  customerContent: {
    padding: 16,
  },
  customerMainInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  customerAvatarContainer: {
    marginRight: 12,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  customerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  customerDetails: {
    marginBottom: 12,
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
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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
    shadowRadius: 4.65,
    elevation: 8,
  },
  deletingItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF3B3020',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deletingText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
  },
});