import React, { useState, useCallback, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ChevronDown,
  Filter,
  SlidersHorizontal,
  Edit,
  Trash2,
  Eye,
  X,
  Phone,
  Mail,
  Building,
  DollarSign,
  Check,
  Clipboard,
  User
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { formatCurrency, formatDate } from "@/utils/formatters";
import EmptyState from "@/components/EmptyState";
import FloatingActionButton from "@/components/FloatingActionButton";
import SnackBar from "@/components/SnackBar";
import { Vendor } from "@/types/vendor";
import BottomSheet from "@/components/BottomSheet";

const WINDOW_WIDTH = Dimensions.get('window').width;

type SortOption = {
  id: 'name' | 'balance' | 'recent';
  label: string;
};

type FilterOption = {
  id: 'all' | 'active' | 'inactive' | 'blocked';
  label: string;
};

// Mock data for vendors
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Acme Supply Co.',
    company: 'Acme Supply Co.',
    email: 'info@acmesupply.com',
    phone: '+1 (555) 123-4567',
    address: '123 Supplier St, Vendorville, CA 94107',
    status: 'active',
    outstandingBalance: 2300.50,
    totalPurchases: 12500.75,
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-05-10'),
    category: 'Office Supplies',
    tags: ['regular', 'wholesale'],
    paymentTerms: 'Net 30',
    creditLimit: 5000,
    notes: 'Primary supplier for office materials and equipment.'
  },
  {
    id: '2',
    name: 'Global Manufacturing Inc.',
    company: 'Global Manufacturing Inc.',
    email: 'sales@globalmanufacturing.com',
    phone: '+1 (555) 234-5678',
    address: '456 Industrial Ave, Factorytown, NY 10001',
    status: 'active',
    outstandingBalance: 5400.25,
    totalPurchases: 45000.00,
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-06-05'),
    category: 'Raw Materials',
    tags: ['wholesale', 'international'],
    paymentTerms: 'Net 45',
    creditLimit: 10000,
    notes: 'Main provider for raw materials for production.'
  },
  {
    id: '3',
    name: 'Tech Solutions Ltd.',
    company: 'Tech Solutions Ltd.',
    email: 'support@techsolutions.com',
    phone: '+1 (555) 345-6789',
    address: '789 Tech Blvd, Silicon Valley, CA 94025',
    status: 'inactive',
    outstandingBalance: 0,
    totalPurchases: 8750.50,
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2023-04-15'),
    category: 'Technology',
    tags: ['software', 'services'],
    paymentTerms: 'Net 15',
    creditLimit: 2000,
    notes: 'Provider for software licenses and IT services.'
  },
  {
    id: '4',
    name: 'Local Logistic Partners',
    company: 'Local Logistic Partners',
    email: 'dispatch@locallogistics.com',
    phone: '+1 (555) 456-7890',
    address: '101 Transport Lane, Deliveryville, FL 33101',
    status: 'active',
    outstandingBalance: 1250.75,
    totalPurchases: 9800.25,
    createdAt: new Date('2023-02-25'),
    updatedAt: new Date('2023-05-20'),
    category: 'Logistics',
    tags: ['shipping', 'local'],
    paymentTerms: 'Net 15',
    creditLimit: 3000,
    notes: 'Handles all local deliveries and transportation.'
  },
  {
    id: '5',
    name: 'Premium Foods Wholesale',
    company: 'Premium Foods Wholesale',
    email: 'orders@premiumfoods.com',
    phone: '+1 (555) 567-8901',
    address: '222 Fresh Market St, Foodtown, IL 60601',
    status: 'blocked',
    outstandingBalance: 3600.00,
    totalPurchases: 31400.50,
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-03-30'),
    category: 'Food & Beverage',
    tags: ['perishable', 'wholesale'],
    paymentTerms: 'Net 7',
    creditLimit: 7500,
    notes: 'Supplier for all food and beverage products.'
  }
];

const sortOptions: SortOption[] = [
  { id: 'name', label: 'Name (A-Z)' },
  { id: 'balance', label: 'Balance (High-Low)' },
  { id: 'recent', label: 'Recently Updated' }
];

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All Vendors' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'blocked', label: 'Blocked' }
];

export default function VendorsScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"name" | "balance" | "recent">("name");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  
  // UI state
  const [showSortBottomSheet, setShowSortBottomSheet] = useState(false);
  const [showFilterBottomSheet, setShowFilterBottomSheet] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [searchInputVisible, setSearchInputVisible] = useState(false);

  // Load vendors on initial render
  useEffect(() => {
    loadVendors();
  }, []);

  // Load vendors from mock data
  const loadVendors = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      setTimeout(() => {
        setVendors(mockVendors);
        // Apply initial filtering and sorting
        setFilteredVendors(filterAndSortVendors(mockVendors, "", activeFilter, sortOrder));
        setIsLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      setShowSnackbar(true);
      setSnackbarMessage("Failed to load vendors");
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filtering and sorting to vendors
  const filterAndSortVendors = (
    data: Vendor[],
    query: string,
    filter: "all" | "active" | "inactive" | "blocked",
    order: "name" | "balance" | "recent"
  ) => {
    // First filter the vendors
    let result = [...data];
    
    if (query) {
      const searchLower = query.toLowerCase();
      result = result.filter(vendor => 
        vendor.name.toLowerCase().includes(searchLower) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchLower)) ||
        (vendor.phone && vendor.phone.toLowerCase().includes(searchLower)) ||
        (vendor.company && vendor.company.toLowerCase().includes(searchLower))
      );
    }
    
    if (filter !== "all") {
      result = result.filter(vendor => vendor.status === filter);
    }
    
    // Then sort the vendors
    result.sort((a, b) => {
      switch (order) {
        case "name":
          return a.name.localeCompare(b.name);
        case "balance":
          return b.outstandingBalance - a.outstandingBalance;
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
    
    return result;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setFilteredVendors(filterAndSortVendors(vendors, text, activeFilter, sortOrder));
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredVendors(filterAndSortVendors(vendors, "", activeFilter, sortOrder));
  };

  const handleSort = (order: "name" | "balance" | "recent") => {
    setSortOrder(order);
    setFilteredVendors(filterAndSortVendors(vendors, searchQuery, activeFilter, order));
    setShowSortBottomSheet(false);
  };

  const handleFilter = (filter: "all" | "active" | "inactive" | "blocked") => {
    setActiveFilter(filter);
    setFilteredVendors(filterAndSortVendors(vendors, searchQuery, filter, sortOrder));
    setShowFilterBottomSheet(false);
  };

  const handleAddVendor = () => {
    router.push("/vendors/new");
  };

  const handleEditVendor = (id: string) => {
    router.push(`/vendors/edit/${id}`);
  };

  const handleDeleteVendor = async (id: string) => {
    Alert.alert(
      "Delete Vendor",
      "Are you sure you want to delete this vendor? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const updatedVendors = vendors.filter(vendor => vendor.id !== id);
              setVendors(updatedVendors);
              setFilteredVendors(filterAndSortVendors(updatedVendors, searchQuery, activeFilter, sortOrder));
              setSnackbarMessage("Vendor deleted successfully");
              setShowSnackbar(true);
            } catch (error) {
              console.error("Error deleting vendor:", error);
              setSnackbarMessage("Failed to delete vendor");
              setShowSnackbar(true);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleViewVendor = (id: string) => {
    router.push(`/vendors/${id}`);
  };

  const getSortOptionLabel = (): string => {
    const option = sortOptions.find(option => option.id === sortOrder);
    return option ? option.label : 'Sort';
  };

  const getFilterOptionLabel = (): string => {
    const option = filterOptions.find(option => option.id === activeFilter);
    return option ? option.label : 'Filter';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.status.active;
      case 'inactive':
        return Colors.status.inactive;
      case 'blocked':
        return Colors.status.blocked;
      default:
        return Colors.status.inactive;
    }
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <View style={styles.vendorCard}>
      <TouchableOpacity 
        style={styles.vendorCardContent}
        onPress={() => handleViewVendor(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.vendorHeader}>
          <View style={styles.avatarContainer}>
            {false ? (
              <Image source={{ uri: "placeholder" }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.background.tertiary }]}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{item.name}</Text>
            {item.company && (
              <Text style={styles.companyName}>{item.company}</Text>
            )}
            <View style={styles.tagRow}>
              <View 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: `${getStatusColor(item.status)}20` }
                ]}
              >
                <View 
                  style={[
                    styles.statusDot, 
                    { backgroundColor: getStatusColor(item.status) }
                  ]} 
                />
                <Text 
                  style={[
                    styles.statusText, 
                    { color: getStatusColor(item.status) }
                  ]}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.vendorDetails}>
          {item.email && (
            <View style={styles.detailRow}>
              <Mail size={14} color={Colors.text.secondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.email}</Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.detailRow}>
              <Phone size={14} color={Colors.text.secondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>{formatCurrency(item.outstandingBalance)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total Purchases</Text>
              <Text style={styles.balanceValue}>{formatCurrency(item.totalPurchases)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewVendor(item.id)}
        >
          <Eye size={18} color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditVendor(item.id)}
        >
          <Edit size={18} color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteVendor(item.id)}
        >
          <Trash2 size={18} color={Colors.negative} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Vendors</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterSortButtons}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterBottomSheet(true)}
          >
            <Filter size={18} color={Colors.text.primary} />
            <Text style={styles.filterButtonText}>{getFilterOptionLabel()}</Text>
            <ChevronDown size={16} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortBottomSheet(true)}
          >
            <SlidersHorizontal size={18} color={Colors.text.primary} />
            <Text style={styles.sortButtonText}>{getSortOptionLabel()}</Text>
            <ChevronDown size={16} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading vendors...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Clipboard size={48} color={Colors.text.secondary} />}
              title="No vendors found"
              description={searchQuery ? "Try a different search term or filter" : "Add your first vendor to get started"}
              actionLabel={searchQuery ? "Clear search" : "Add Vendor"}
              onAction={searchQuery ? handleClearSearch : handleAddVendor}
            />
          }
        />
      )}
      
      {/* Sort Bottom Sheet */}
      <BottomSheet
        isVisible={showSortBottomSheet}
        onClose={() => setShowSortBottomSheet(false)}
        title="Sort Vendors"
      >
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              sortOrder === option.id && styles.selectedOptionItem,
            ]}
            onPress={() => handleSort(option.id)}
          >
            <Text
              style={[
                styles.optionText,
                sortOrder === option.id && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
            {sortOrder === option.id && (
              <Check size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheet>
      
      {/* Filter Bottom Sheet */}
      <BottomSheet
        isVisible={showFilterBottomSheet}
        onClose={() => setShowFilterBottomSheet(false)}
        title="Filter Vendors"
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              activeFilter === option.id && styles.selectedOptionItem,
            ]}
            onPress={() => handleFilter(option.id)}
          >
            <Text
              style={[
                styles.optionText,
                activeFilter === option.id && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
            {activeFilter === option.id && (
              <Check size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheet>
      
      <FloatingActionButton
        icon={<Plus size={24} color="#fff" />}
        onPress={handleAddVendor}
      />
      
      <SnackBar
        visible={showSnackbar}
        message={snackbarMessage}
        onDismiss={() => setShowSnackbar(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  searchFilterContainer: {
    backgroundColor: Colors.background.default,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    marginLeft: 8,
    color: Colors.text.primary,
  },
  filterSortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginHorizontal: 6,
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginHorizontal: 6,
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for the FAB
  },
  vendorCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  vendorCardContent: {
    padding: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  vendorDetails: {
    marginTop: 8,
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  selectedOptionItem: {
    backgroundColor: `${Colors.primary}10`,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});