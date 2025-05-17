import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Pencil,
  Trash2,
  Printer,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getAllExpenses, deleteExpense } from '@/db/expense';
import { formatCurrency } from '@/utils/format';

type SortOption = 'date' | 'amount' | 'category';
type FilterOption = 'all' | 'pending' | 'paid' | 'cancelled';

export default function ExpensesScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      const expensesData = await getAllExpenses(user.id);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadExpenses();
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    const sortedExpenses = [...expenses].sort((a, b) => {
      switch (option) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return a.categoryId - b.categoryId;
        default:
          return 0;
      }
    });
    setExpenses(sortedExpenses);
  };

  const handleFilter = (option: FilterOption) => {
    setFilterBy(option);
    if (option === 'all') {
      loadExpenses();
    } else {
      const filteredExpenses = expenses.filter(expense => expense.status === option);
      setExpenses(filteredExpenses);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/expenses/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;

    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id, user.id);
              setExpenses(expenses.filter(expense => expense.id !== id));
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const handlePrint = (id: number) => {
    // TODO: Implement print functionality
    Alert.alert('Print', 'Print functionality coming soon');
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || expense.status === filterBy;
    
    return matchesSearch && matchesFilter;
  });

  // Helper to get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.status_pending;
      case 'paid':
        return styles.status_paid;
      case 'cancelled':
        return styles.status_cancelled;
      default:
        return styles.status_default;
    }
  };

  const renderExpenseItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/expenses/${item.id}`)}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.categoryDot, { backgroundColor: item.categoryColor || Colors.primary }]} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardDescription} numberOfLines={1}>{item.description || 'No description'}</Text>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardCategory}>{item.categoryName || 'Category'}</Text>
            <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.cardMetaRow}>
            <Text style={[styles.cardStatus, getStatusStyle(item.status)]}>{item.status || 'pending'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item.id)}
          >
            <Pencil size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrint(item.id)}
          >
            <Printer size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/expenses/new')}
        >
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.text.secondary}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'all' && styles.activeFilterButton]}
          onPress={() => handleFilter('all')}
        >
          <Text style={[styles.filterButtonText, filterBy === 'all' && styles.activeFilterButtonText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'pending' && styles.activeFilterButton]}
          onPress={() => handleFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filterBy === 'pending' && styles.activeFilterButtonText]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'paid' && styles.activeFilterButton]}
          onPress={() => handleFilter('paid')}
        >
          <Text style={[styles.filterButtonText, filterBy === 'paid' && styles.activeFilterButtonText]}>
            Paid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'cancelled' && styles.activeFilterButton]}
          onPress={() => handleFilter('cancelled')}
        >
          <Text style={[styles.filterButtonText, filterBy === 'cancelled' && styles.activeFilterButtonText]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
          onPress={() => handleSort('date')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'date' && styles.activeSortButtonText]}>
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'amount' && styles.activeSortButton]}
          onPress={() => handleSort('amount')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'amount' && styles.activeSortButtonText]}>
            Amount
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'category' && styles.activeSortButton]}
          onPress={() => handleSort('category')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'category' && styles.activeSortButtonText]}>
            Category
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + 80 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/expenses/new')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: Colors.background.tertiary,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: Colors.background.tertiary,
  },
  activeSortButton: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  activeSortButtonText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 12,
  },
  cardCategory: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  cardDate: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  status_pending: {
    backgroundColor: '#f6c34333',
    color: '#b8860b',
  },
  status_paid: {
    backgroundColor: '#4caf5033',
    color: '#388e3c',
  },
  status_cancelled: {
    backgroundColor: '#e74c3c33',
    color: '#c0392b',
  },
  status_default: {
    backgroundColor: '#e0e0e0',
    color: '#757575',
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});