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
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Search,
  X,
  ChevronDown,
  Calendar,
  Filter,
  ArrowUpDown,
  DollarSign,
  Printer,
  Edit,
  Trash2,
  Tag,
  Check,
  ArrowLeft,
  CreditCard,
  User,
  Edit2
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { Income, getAllIncomes, deleteIncome } from '@/db/income';
import { formatCurrency } from '@/utils/format';

// Sort options
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterOption = 'all' | number;

export default function IncomeScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Load income records
  useEffect(() => {
    if (user) {
      loadIncomes();
    }
  }, [user]);

  const loadIncomes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const incomesData = await getAllIncomes(user.id);
      setIncomes(incomesData);
    } catch (error) {
      console.error('Error loading incomes:', error);
      Alert.alert('Error', 'Failed to load incomes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIncomes();
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    
    // Sort the incomes based on selected option
    const sortedIncomes = [...incomes].sort((a, b) => {
      if (option === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (option === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (option === 'amount-desc') {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });
    
    setIncomes(sortedIncomes);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Filter the incomes based on selected option
    if (option === 'all') {
      loadIncomes();
    } else {
      const filteredIncomes = incomes.filter(income => 
        income.categoryId === option
      );
      setIncomes(filteredIncomes);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/income/edit/${id}`);
  };

  const handleDeleteIncome = async (id: number) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await deleteIncome(id, user.id);
      setIncomes(incomes.filter(income => income.id !== id));
      Alert.alert('Success', 'Income deleted successfully');
    } catch (error) {
      console.error('Error deleting income:', error);
      Alert.alert('Error', 'An error occurred while deleting the income');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id: string) => {
    Alert.alert('Print', 'Printing income record...');
  };

  const renderIncomeItem = useCallback(({ item }: { item: Income }) => (
    <TouchableOpacity 
      style={styles.incomeItem}
      onPress={() => router.push(`/income/${item.id}`)}
    >
      <View style={styles.incomeInfo}>
        <Text style={styles.incomeAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.incomeDate}>{new Date(item.date).toLocaleDateString()}</Text>
        {item.description ? (
          <Text style={styles.incomeDescription}>{item.description}</Text>
        ) : null}
      </View>
      <View style={styles.incomeActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleEdit(item.id.toString());
          }}
        >
          <Edit2 size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handlePrint(item.id.toString());
          }}
        >
          <Printer size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteIncome(item.id);
          }}
        >
          <Trash2 size={18} color={Colors.negative || "#FF3B30"} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), []);

  // Helper function to get category color
  function getCategoryColor(category: string): string {
    const categoryColors: Record<string, string> = {
      'Salary': '#4CAF50',
      'Investment': '#2196F3',
      'Business': '#FBBC04',
      'Freelance': '#9C27B0',
      'Other': '#757575'
    };
    
    return categoryColors[category.toLowerCase()] || '#757575';
  }
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Income Records</Text>
      <Text style={styles.emptyText}>
        Add your income records to track your earnings.
      </Text>
      <TouchableOpacity 
        style={styles.emptyAddButton}
        onPress={() => router.push('/income/new')}
      >
        <Text style={styles.emptyAddButtonText}>Add Income</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSortOptions = () => (
    <Modal
      visible={showSortOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSortOptions(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortOptions(false)}>
              <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalOptions}>
            <TouchableOpacity
              style={[styles.modalOption, sortBy === 'date-desc' && styles.selectedOption]}
              onPress={() => handleSort('date-desc')}
            >
              <Text style={[styles.modalOptionText, sortBy === 'date-desc' && styles.selectedOptionText]}>
                Date (Newest First)
              </Text>
              {sortBy === 'date-desc' && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, sortBy === 'date-asc' && styles.selectedOption]}
              onPress={() => handleSort('date-asc')}
            >
              <Text style={[styles.modalOptionText, sortBy === 'date-asc' && styles.selectedOptionText]}>
                Date (Oldest First)
              </Text>
              {sortBy === 'date-asc' && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, sortBy === 'amount-desc' && styles.selectedOption]}
              onPress={() => handleSort('amount-desc')}
            >
              <Text style={[styles.modalOptionText, sortBy === 'amount-desc' && styles.selectedOptionText]}>
                Amount (High to Low)
              </Text>
              {sortBy === 'amount-desc' && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, sortBy === 'amount-asc' && styles.selectedOption]}
              onPress={() => handleSort('amount-asc')}
            >
              <Text style={[styles.modalOptionText, sortBy === 'amount-asc' && styles.selectedOptionText]}>
                Amount (Low to High)
              </Text>
              {sortBy === 'amount-asc' && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFilterOptions = () => (
    <Modal
      visible={showFilterOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterOptions(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter By Category</Text>
            <TouchableOpacity onPress={() => setShowFilterOptions(false)}>
              <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalOptions}>
            <TouchableOpacity
              style={[styles.modalOption, filterBy === 'all' && styles.selectedOption]}
              onPress={() => handleFilter('all')}
            >
              <Text style={[styles.modalOptionText, filterBy === 'all' && styles.selectedOptionText]}>
                All Categories
              </Text>
              {filterBy === 'all' && <Check size={20} color={Colors.primary} />}
            </TouchableOpacity>
            {/* Add category filters here when we have the category data */}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Income Records</Text>
        <View style={{width: 40}} />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search income records..."
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
            <Filter size={18} color={Colors.text.secondary} />
            <Text style={styles.filterSortText}>
              {filterBy === 'all' ? 'All Categories' : 'Category'}
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
              {sortBy === 'date-desc' ? 'Newest First' : 
               sortBy === 'date-asc' ? 'Oldest First' :
               sortBy === 'amount-desc' ? 'Highest Amount' :
               'Lowest Amount'}
            </Text>
            <ChevronDown size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading income records...</Text>
        </View>
      ) : (
        <FlatList
          data={incomes.filter(income => {
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              return (
                income.description?.toLowerCase().includes(query) ||
                income.paymentMethod?.toLowerCase().includes(query) ||
                income.referenceNumber?.toLowerCase().includes(query)
              );
            }
            return true;
          })}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderIncomeItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + 80 }
          ]}
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
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/income/new')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {renderSortOptions()}
      {renderFilterOptions()}
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
    marginBottom: 16,
  },
  emptyAddButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  incomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  incomeInfo: {
    flex: 1,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  incomeDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  incomeDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  incomeActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalOptions: {
    // Add any additional styles for the modal options container
  },
  modalOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 5,
  },
  selectedOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  modalOptionText: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
});