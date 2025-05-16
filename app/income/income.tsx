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
  User
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { IncomeRecord } from '@/types/income';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Mock income records
// In a real app, this would come from an API or local storage
const mockIncomeRecords: IncomeRecord[] = [
  {
    id: '1',
    source: 'Monthly Salary',
    amount: 4500,
    date: new Date('2023-11-01T00:00:00.000Z'),
    category: 'Salary',
    notes: 'Regular monthly salary for November',
    paymentMethod: 'Bank Transfer',
    reference: 'SALARY-NOV-2023'
  },
  {
    id: '2',
    source: 'Freelance Project',
    amount: 1200,
    date: new Date('2023-11-15T00:00:00.000Z'),
    category: 'Freelance',
    notes: 'Website development for client XYZ',
    paymentMethod: 'Digital Wallet',
    reference: 'PROJ-XYZ-001'
  },
  {
    id: '3',
    source: 'Stock Dividends',
    amount: 350,
    date: new Date('2023-11-20T00:00:00.000Z'),
    category: 'Investment',
    notes: 'Quarterly dividends from stock portfolio',
    paymentMethod: 'Bank Transfer',
    reference: 'DIV-Q4-2023'
  },
  {
    id: '4',
    source: 'Online Course Sales',
    amount: 870,
    date: new Date('2023-11-25T00:00:00.000Z'),
    category: 'Business',
    notes: 'Revenue from online course platform',
    paymentMethod: 'Credit Card',
    reference: 'COURSE-NOV-2023'
  },
  {
    id: '5',
    source: 'Rental Income',
    amount: 1500,
    date: new Date('2023-11-30T00:00:00.000Z'),
    category: 'Other',
    notes: 'Monthly rental income from property',
    paymentMethod: 'Bank Transfer',
    reference: 'RENT-NOV-2023'
  },
  {
    id: '6',
    source: 'Consulting Fee',
    amount: 2000,
    date: new Date('2023-12-05T00:00:00.000Z'),
    category: 'Freelance',
    notes: 'Consulting services for client ABC',
    paymentMethod: 'Bank Transfer',
    reference: 'CONS-ABC-002'
  },
  {
    id: '7',
    source: 'Bonus Payment',
    amount: 1000,
    date: new Date('2023-12-10T00:00:00.000Z'),
    category: 'Salary',
    notes: 'End of year performance bonus',
    paymentMethod: 'Bank Transfer',
    reference: 'BONUS-DEC-2023'
  }
];

// Sort options
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'source-asc' | 'source-desc';
type FilterOption = 'all' | 'salary' | 'investment' | 'business' | 'freelance' | 'other';

export default function IncomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [incomes, setIncomes] = useState<IncomeRecord[]>(mockIncomeRecords);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Load income records
  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch from an API
      setTimeout(() => {
        setIncomes(mockIncomeRecords);
        setLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching income records:', error);
      Alert.alert('Error', 'Failed to load income records');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncomes();
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
      } else if (option === 'amount-asc') {
        return a.amount - b.amount;
      } else if (option === 'source-asc') {
        return a.source.localeCompare(b.source);
      } else {
        return b.source.localeCompare(a.source);
      }
    });
    
    setIncomes(sortedIncomes);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Filter the incomes based on selected option
    if (option === 'all') {
      setIncomes(mockIncomeRecords);
    } else {
      const filteredIncomes = mockIncomeRecords.filter(income => 
        income.category.toLowerCase() === option
      );
      setIncomes(filteredIncomes);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/income/edit/1`);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income record? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would call an API to delete the income
            const updatedRecords = incomes.filter(income => income.id !== id);
            setIncomes(updatedRecords);
            Alert.alert('Success', 'Income record deleted successfully');
          },
        },
      ]
    );
  };

  const handlePrint = (id: string) => {
    Alert.alert('Print', 'Printing income record...');
  };

  const renderIncomeItem = useCallback(({ item }: { item: IncomeRecord }) => (
    <TouchableOpacity
      style={styles.incomeItem}
      onPress={() => router.push(`/income/${item.id}`)}
    >
      <View style={styles.incomeContent}>
        <View style={styles.incomeMainInfo}>
          <Text style={styles.sourceName}>{item.source}</Text>
          <View style={styles.amountContainer}>
            <DollarSign size={16} color={Colors.primary} style={styles.amountIcon} />
            <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.incomeDetails}>
          {/* Category */}
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Tag size={12} color="#FFF" />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <View style={styles.detailsContainer}>
            {/* Payment Method */}
            {item.paymentMethod && (
              <View style={styles.detailRow}>
                <CreditCard size={16} color={Colors.text.secondary} style={styles.detailIcon} />
                <Text style={styles.detailText}>{item.paymentMethod}</Text>
              </View>
            )}
            
            {/* Date */}
            <View style={styles.detailRow}>
              <Calendar size={16} color={Colors.text.secondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.date.toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.incomeActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEdit(item.id)}
          >
            <Edit size={16} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePrint(item.id)}
          >
            <Printer size={16} color={Colors.text.secondary} />
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
      <Text style={styles.emptyText}>No income records found</Text>
      {searchQuery !== '' && (
        <Text style={styles.emptySubtext}>
          Try adjusting your search or filter criteria
        </Text>
      )}
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/income/new')}
      >
        <Plus size={16} color="#FFF" />
        <Text style={styles.emptyButtonText}>Add New Income</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
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
              {filterBy === 'all' ? 'All Categories' : 
                filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
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
               sortBy === 'amount-asc' ? 'Lowest Amount' :
               sortBy === 'source-asc' ? 'A to Z' : 'Z to A'}
            </Text>
            <ChevronDown size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {showSortOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'date-desc' && styles.selectedItem]}
              onPress={() => handleSort('date-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'date-desc' && styles.selectedText]}>Date: Newest First</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'date-asc' && styles.selectedItem]}
              onPress={() => handleSort('date-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'date-asc' && styles.selectedText]}>Date: Oldest First</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'amount-desc' && styles.selectedItem]}
              onPress={() => handleSort('amount-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'amount-desc' && styles.selectedText]}>Amount: Highest First</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'amount-asc' && styles.selectedItem]}
              onPress={() => handleSort('amount-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'amount-asc' && styles.selectedText]}>Amount: Lowest First</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'source-asc' && styles.selectedItem]}
              onPress={() => handleSort('source-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'source-asc' && styles.selectedText]}>Source: A to Z</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'source-desc' && styles.selectedItem]}
              onPress={() => handleSort('source-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'source-desc' && styles.selectedText]}>Source: Z to A</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {showFilterOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'all' && styles.selectedItem]}
              onPress={() => handleFilter('all')}
            >
              <Text style={[styles.dropdownText, filterBy === 'all' && styles.selectedText]}>All Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'salary' && styles.selectedItem]}
              onPress={() => handleFilter('salary')}
            >
              <Text style={[styles.dropdownText, filterBy === 'salary' && styles.selectedText]}>Salary</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'investment' && styles.selectedItem]}
              onPress={() => handleFilter('investment')}
            >
              <Text style={[styles.dropdownText, filterBy === 'investment' && styles.selectedText]}>Investment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'business' && styles.selectedItem]}
              onPress={() => handleFilter('business')}
            >
              <Text style={[styles.dropdownText, filterBy === 'business' && styles.selectedText]}>Business</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'freelance' && styles.selectedItem]}
              onPress={() => handleFilter('freelance')}
            >
              <Text style={[styles.dropdownText, filterBy === 'freelance' && styles.selectedText]}>Freelance</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'other' && styles.selectedItem]}
              onPress={() => handleFilter('other')}
            >
              <Text style={[styles.dropdownText, filterBy === 'other' && styles.selectedText]}>Other</Text>
            </TouchableOpacity>
          </View>
        )}
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
                income.source.toLowerCase().includes(query) ||
                income.category.toLowerCase().includes(query) ||
                (income.notes && income.notes.toLowerCase().includes(query)) ||
                (income.paymentMethod && income.paymentMethod.toLowerCase().includes(query)) ||
                (income.reference && income.reference.toLowerCase().includes(query))
              );
            }
            return true;
          })}
          keyExtractor={(item) => item.id}
          renderItem={renderIncomeItem}
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
        onPress={() => router.push('/income/new')}
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
  incomeItem: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  incomeContent: {
    padding: 16,
  },
  incomeMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountIcon: {
    marginRight: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  incomeDetails: {
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsContainer: {
    marginTop: 6,
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
  incomeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 12,
    marginTop: 6,
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
});