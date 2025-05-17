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
import { useRouter, useFocusEffect } from 'expo-router';
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
import * as dbVendor from '@/db/vendor';
import * as schema from '@/db/schema';
import { SafeAreaView } from 'react-native-safe-area-context';

// Type definitions
type SortOption = 'name-asc' | 'name-desc' | 'type-asc' | 'type-desc' | 'recent';
type FilterOption = 'all' | 'business' | 'individual';
type Vendor = {
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

export default function VendorsScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load vendors data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchVendors();
    }, [])
  );

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const dbVendors = await dbVendor.getAllVendors();
      // Map DB vendors to UI vendors
      const mapped = dbVendors.map((v) => ({
        id: v.id.toString(),
        name: v.name,
        contactName: v.contactPerson || null,
        email: v.email || '',
        phone: v.phone || '',
        type: v.company && v.company.trim() !== '' ? 'Business' : 'Individual' as 'Business' | 'Individual',
        address: [v.address, v.city, v.state, v.zipCode, v.country].filter(Boolean).join(', '),
        notes: v.notes || '',
        avatar: null, // No avatar in schema
      }));
      setVendors(mapped);
      setLoading(false);
        setRefreshing(false);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to load vendors');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    
    // Sort the vendors based on selected option
    const sortedVendors = [...vendors].sort((a, b) => {
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
    
    setVendors(sortedVendors);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Filter the vendors based on selected option
    if (option === 'all') {
      setVendors(vendors);
    } else {
      const filteredVendors = vendors.filter(vendor => 
        vendor.type.toLowerCase() === option
      );
      setVendors(filteredVendors);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/vendors/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    const vendorToDelete = vendors.find(vendor => vendor.id === id);
    if (!vendorToDelete) return;
    
    Alert.alert(
      "Delete Vendor",
      `Are you sure you want to delete ${vendorToDelete.name}? This action cannot be undone.`,
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
      await dbVendor.deleteVendor(Number(id));
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setDeletingId(null);
      Alert.alert('Success', 'Vendor deleted successfully');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      Alert.alert('Error', 'Failed to delete vendor');
      setDeletingId(null);
    }
  };

  const renderVendorItem = useCallback(({ item }: { item: Vendor }) => {
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
        style={styles.vendorItem}
        onPress={() => router.push(`/vendors/${item.id}`)}
      >
        <View style={styles.vendorContent}>
          <View style={styles.vendorMainInfo}>
            <View style={styles.vendorAvatarContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.vendorAvatar} />
              ) : (
                <View style={[
                  styles.vendorAvatarPlaceholder, 
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
            
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{item.name}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.vendorDetails}>
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
          
          <View style={styles.vendorActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEdit(item.id)}
            >
              <Edit size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item.id)}
            >
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [deletingId]);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Building2 size={48} color={Colors.text.secondary} />
      <Text style={styles.emptyTitle}>No Vendors Found</Text>
      <Text style={styles.emptyText}>
        Add your first vendor to start managing your business relationships
      </Text>
    </View>
  );

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.phone.includes(searchQuery) ||
    (vendor.contactName && vendor.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Vendors</Text>
        <View style={{width: 40}} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.text.secondary}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <X size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Filter and Sort */}
      <View style={styles.filterSortContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterOptions(!showFilterOptions)}
        >
          <Text style={styles.filterButtonText}>
            {filterBy === 'all' ? 'All Types' : filterBy === 'business' ? 'Business' : 'Individual'}
          </Text>
          <ChevronDown size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <ArrowUpDown size={20} color={Colors.text.primary} />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sort Options Modal */}
      {showSortOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>
            {[
              { label: 'Name (A-Z)', value: 'name-asc' },
              { label: 'Name (Z-A)', value: 'name-desc' },
              { label: 'Type (A-Z)', value: 'type-asc' },
              { label: 'Type (Z-A)', value: 'type-desc' },
              { label: 'Most Recent', value: 'recent' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => handleSort(option.value as SortOption)}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
                {sortBy === option.value && (
                  <Check size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Filter Options Modal */}
      {showFilterOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter By</Text>
            {[
              { label: 'All Types', value: 'all' },
              { label: 'Business', value: 'business' },
              { label: 'Individual', value: 'individual' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => handleFilter(option.value as FilterOption)}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
                {filterBy === option.value && (
                  <Check size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Vendors List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorItem}
          keyExtractor={(item) => item.id}
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
      )}
      
      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vendors/new')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    color: Colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  filterSortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  filterButtonText: {
    marginRight: 4,
    color: Colors.text.primary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  sortButtonText: {
    marginLeft: 4,
    color: Colors.text.primary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text.primary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  vendorItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorContent: {
    padding: 16,
  },
  vendorMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorAvatarContainer: {
    marginRight: 12,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  vendorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  vendorDetails: {
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
  vendorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  deletingItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    marginBottom: 16,
  },
  deletingText: {
    marginLeft: 8,
    color: '#FF3B30',
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});