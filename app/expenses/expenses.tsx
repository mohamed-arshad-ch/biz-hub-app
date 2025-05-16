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
  FileText
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getExpensesData, deleteExpense } from '@/mocks/expensesData';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ExpenseRecord } from '@/types/expenses';
import SnackBar from '@/components/SnackBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Sort options
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'description-asc' | 'description-desc';
type FilterOption = 'all' | 'food' | 'transportation' | 'utilities' | 'entertainment' | 'other';

export default function ExpensesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(getExpensesData());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  
  const [snackBarVisible, setSnackBarVisible] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [deletedExpense, setDeletedExpense] = useState<ExpenseRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load expenses data
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch from an API
      setTimeout(() => {
        setExpenses(getExpensesData());
        setLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching expense records:', error);
      Alert.alert('Error', 'Failed to load expense records');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
    
    // Sort the expenses based on selected option
    const sortedExpenses = [...expenses].sort((a, b) => {
      if (option === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (option === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (option === 'amount-desc') {
        return b.amount - a.amount;
      } else if (option === 'amount-asc') {
        return a.amount - b.amount;
      } else if (option === 'description-asc') {
        return a.description.localeCompare(b.description);
      } else {
        return b.description.localeCompare(a.description);
      }
    });
    
    setExpenses(sortedExpenses);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    setShowFilterOptions(false);
    
    // Filter the expenses based on selected option
    if (option === 'all') {
      setExpenses(getExpensesData());
    } else {
      const filteredExpenses = getExpensesData().filter(expense => 
        expense.category.toLowerCase() === option
      );
      setExpenses(filteredExpenses);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/expenses/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    const expenseToDelete = expenses.find(expense => expense.id === id);
    if (!expenseToDelete) return;
    
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete this expense for ${expenseToDelete.description}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete(id, expenseToDelete)
        }
      ]
    );
  };

  const performDelete = async (id: string, expenseToDelete: ExpenseRecord) => {
    setDeletingId(id);
    setDeletedExpense(expenseToDelete);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Delete the expense
      const success = deleteExpense(id);
      
      if (success) {
        // Update the local state
        setExpenses(expenses.filter(expense => expense.id !== id));
        
        // Show snackbar with undo option
        setSnackBarMessage(`Expense for ${expenseToDelete.description} deleted`);
        setSnackBarVisible(true);
      } else {
        throw new Error("Failed to delete expense");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to delete expense. Please try again.",
        [
          { text: "OK" },
          { 
            text: "Retry", 
            onPress: () => performDelete(id, expenseToDelete) 
          }
        ]
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUndoDelete = () => {
    if (!deletedExpense) return;
    
    // In a real app, this would restore the deleted expense in the database
    // For now, we'll just add it back to the local state
    setExpenses(prevExpenses => [...prevExpenses, deletedExpense]);
    
    // Show a confirmation message
    Alert.alert("Expense Restored", "The expense has been restored successfully.");
    
    setSnackBarVisible(false);
  };

  const handlePrint = (id: string) => {
    Alert.alert('Print', 'Printing expense record...');
  };

  // Helper function to get category color
  function getCategoryColor(category: string): string {
    const categoryColors: Record<string, string> = {
      'food': '#4CAF50',
      'transportation': '#2196F3',
      'utilities': '#FBBC04',
      'entertainment': '#9C27B0',
      'other': '#757575'
    };
    
    return categoryColors[category.toLowerCase()] || '#757575';
  }

  const renderExpenseItem = useCallback(({ item }: { item: ExpenseRecord }) => {
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
        style={styles.expenseItem}
        onPress={() => router.push(`/expenses/${item.id}`)}
      >
        <View style={styles.expenseContent}>
          <View style={styles.expenseMainInfo}>
            <Text style={styles.descriptionText}>{item.description}</Text>
            <View style={styles.amountContainer}>
              <DollarSign size={16} color={Colors.negative || "#FF3B30"} style={styles.amountIcon} />
              <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.expenseDetails}>
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
                <Text style={styles.detailText}>{formatDate(item.date)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.expenseActions}>
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
    );
  }, [deletingId]);
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No expense records found</Text>
      {searchQuery !== '' && (
        <Text style={styles.emptySubtext}>
          Try adjusting your search or filter criteria
        </Text>
      )}
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/expenses/new')}
      >
        <Plus size={16} color="#FFF" />
        <Text style={styles.emptyButtonText}>Add New Expense</Text>
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
        <Text style={styles.title}>Expense Records</Text>
        <View style={{width: 40}} />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expense records..."
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
               sortBy === 'description-asc' ? 'A to Z' : 'Z to A'}
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
              style={[styles.dropdownItem, sortBy === 'description-asc' && styles.selectedItem]}
              onPress={() => handleSort('description-asc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'description-asc' && styles.selectedText]}>Description: A to Z</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, sortBy === 'description-desc' && styles.selectedItem]}
              onPress={() => handleSort('description-desc')}
            >
              <Text style={[styles.dropdownText, sortBy === 'description-desc' && styles.selectedText]}>Description: Z to A</Text>
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
              style={[styles.dropdownItem, filterBy === 'food' && styles.selectedItem]}
              onPress={() => handleFilter('food')}
            >
              <Text style={[styles.dropdownText, filterBy === 'food' && styles.selectedText]}>Food</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'transportation' && styles.selectedItem]}
              onPress={() => handleFilter('transportation')}
            >
              <Text style={[styles.dropdownText, filterBy === 'transportation' && styles.selectedText]}>Transportation</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'utilities' && styles.selectedItem]}
              onPress={() => handleFilter('utilities')}
            >
              <Text style={[styles.dropdownText, filterBy === 'utilities' && styles.selectedText]}>Utilities</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, filterBy === 'entertainment' && styles.selectedItem]}
              onPress={() => handleFilter('entertainment')}
            >
              <Text style={[styles.dropdownText, filterBy === 'entertainment' && styles.selectedText]}>Entertainment</Text>
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
          <Text style={styles.loadingText}>Loading expense records...</Text>
        </View>
      ) : (
        <FlatList
          data={expenses.filter(expense => {
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              return (
                expense.description.toLowerCase().includes(query) ||
                expense.category.toLowerCase().includes(query) ||
                (expense.notes && expense.notes.toLowerCase().includes(query)) ||
                (expense.paymentMethod && expense.paymentMethod.toLowerCase().includes(query)) ||
                formatCurrency(expense.amount).toLowerCase().includes(query) ||
                formatDate(expense.date).toLowerCase().includes(query)
              );
            }
            return true;
          })}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
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
        onPress={() => router.push('/expenses/new')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <SnackBar
        visible={snackBarVisible}
        message={snackBarMessage}
        action="UNDO"
        onAction={handleUndoDelete}
        onDismiss={() => setSnackBarVisible(false)}
      />
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
  expenseItem: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  expenseContent: {
    padding: 16,
  },
  expenseMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  descriptionText: {
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
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.negative || '#FF3B30',
  },
  expenseDetails: {
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
  expenseActions: {
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