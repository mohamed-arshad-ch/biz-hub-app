import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Calendar, 
  Download, 
  Printer, 
  Mail, 
  Filter, 
  ChevronLeft, 
  ChevronDown,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  CheckSquare,
  Square
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { formatCurrency, formatDate, formatDateShort, formatPercentage } from '@/utils/formatters';
import { useAuthStore } from '@/store/auth';
import { 
  getIncomeReportData, 
  getIncomeSummaryStats, 
  getIncomeByCategory,
  getIncomeByDateRange,
  getIncomeByPaymentMethod
} from '@/db/income';
import EmptyState from '@/components/EmptyState';

const { width } = Dimensions.get('window');

// Date range options
const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
];

// Payment method options for filtering
const PAYMENT_METHODS = [
  'All Methods',
  'Bank Transfer',
  'Credit Card',
  'PayPal',
  'Cash',
  'Check',
  'Direct Deposit',
];

// Category options for filtering
const CATEGORIES = [
  'All Categories',
  'Services',
  'Consulting',
  'Sales',
  'Training',
  'Commission',
  'Rent',
  'Interest',
];

export default function IncomeReportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('This Month');
  const [showDateRangeSelector, setShowDateRangeSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'summary'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All Methods');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // State for report data
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [dateRangeData, setDateRangeData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  
  // Load data
  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, dateRange]);

  const loadReportData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get date range
      const { startDate, endDate } = getDateRangeFromSelection(dateRange);
      
      // Fetch all data in parallel
      const [
        incomeData,
        summaryStats,
        categoryData,
        dateRangeData,
        paymentMethodData
      ] = await Promise.all([
        getIncomeReportData(user.id, startDate, endDate),
        getIncomeSummaryStats(user.id, startDate, endDate),
        getIncomeByCategory(user.id, startDate, endDate),
        getIncomeByDateRange(user.id, startDate, endDate),
        getIncomeByPaymentMethod(user.id, startDate, endDate)
      ]);

      setIncomeData(incomeData);
      setSummaryStats(summaryStats);
      setCategoryBreakdown(categoryData);
      setDateRangeData(dateRangeData);
      setPaymentMethodData(paymentMethodData);
    } catch (error) {
      console.error('Error loading income report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get date range from selection
  const getDateRangeFromSelection = (selection: string) => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (selection) {
      case 'Today':
        startDate = today;
        endDate = today;
        break;
      case 'Yesterday':
        startDate = new Date(today.setDate(today.getDate() - 1));
        endDate = startDate;
        break;
      case 'This Week':
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        endDate = new Date(today.setDate(today.getDate() + 6));
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'This Year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
    }

    return {
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0]
    };
  };

  // Filter income data based on search query and filters
  const filteredIncomeData = incomeData.filter(income => {
    const matchesSearch = 
      searchQuery === '' || 
      income.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      income.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All Categories' || 
      income.categoryId === selectedCategory;
    
    const matchesPaymentMethod = 
      selectedPaymentMethod === 'All Methods' || 
      income.paymentMethod === selectedPaymentMethod;
    
    return matchesSearch && matchesCategory && matchesPaymentMethod;
  });

  // Sort income data
  const sortedIncomeData = [...filteredIncomeData].sort((a, b) => {
    if (sortConfig.key === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else if (sortConfig.key === 'description') {
      return sortConfig.direction === 'asc' 
        ? (a.description || '').localeCompare(b.description || '') 
        : (b.description || '').localeCompare(a.description || '');
    }
    return 0;
  });

  // Calculate summary statistics
  const totalIncome = summaryStats?.totalAmount || 0;
  const averageIncome = summaryStats?.averageAmount || 0;
  const transactionCount = summaryStats?.count || 0;
  const maxAmount = summaryStats?.maxAmount || 0;
  const minAmount = summaryStats?.minAmount || 0;

  // Find highest income day
  const highestIncomeDay = dateRangeData.reduce(
    (max, day) => (day.totalAmount > max.amount ? { date: day.date, amount: day.totalAmount } : max),
    { date: '', amount: 0 }
  );

  // Calculate category breakdown
  const categoryBreakdownArray = categoryBreakdown.map((item) => ({
    categoryId: item.categoryId,
    count: item.count,
    totalAmount: item.totalAmount,
    percentage: (item.totalAmount / totalIncome) * 100,
  }));

  // Sort category breakdown by total amount (descending)
  categoryBreakdownArray.sort((a, b) => b.totalAmount - a.totalAmount);

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]);
  };

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prevSelected => 
      prevSelected.includes(id)
        ? prevSelected.filter(itemId => itemId !== id)
        : [...prevSelected, id]
    );
  };

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.length === filteredIncomeData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredIncomeData.map(item => item.id));
    }
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    setIsLoading(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsLoading(false);
      alert(`Report exported as ${format.toUpperCase()}`);
    }, 1500);
  };

  // Render sort indicator
  const renderSortIndicator = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={14} color="#999" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} color={Colors.primary} /> 
      : <ArrowDown size={14} color={Colors.primary} />;
  };

  // Render item in selection mode
  const renderSelectionItem = (id: string) => {
    const isSelected = selectedItems.includes(id);
    return isSelected 
      ? <CheckSquare size={20} color={Colors.primary} /> 
      : <Square size={20} color="#999" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Income Report</Text>
        {isSelectionMode ? (
          <TouchableOpacity onPress={toggleSelectionMode} style={styles.actionButton}>
            <X size={20} color="#333" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={toggleSelectionMode} style={styles.actionButton}>
            <CheckSquare size={20} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity 
          style={styles.dateRangeButton}
          onPress={() => setShowDateRangeSelector(!showDateRangeSelector)}
        >
          <Calendar size={18} color="#555" style={styles.dateRangeIcon} />
          <Text style={styles.dateRangeText}>{dateRange}</Text>
          <ChevronDown size={18} color="#555" />
        </TouchableOpacity>

        {/* Report Controls */}
        <View style={styles.reportControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleExport('pdf')}
          >
            <FileText size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleExport('excel')}
          >
            <Download size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => alert('Print functionality')}
          >
            <Printer size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => alert('Email functionality')}
          >
            <Mail size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} color={showFilters ? Colors.primary : "#555"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Range Selector Dropdown */}
      {showDateRangeSelector && (
        <View style={styles.dateRangeDropdown}>
          {DATE_RANGES.map((range) => (
            <TouchableOpacity
              key={range.value}
              style={[
                styles.dateRangeOption,
                dateRange === range.label && styles.dateRangeOptionActive,
              ]}
              onPress={() => {
                setDateRange(range.label);
                setShowDateRangeSelector(false);
              }}
            >
              <Text
                style={[
                  styles.dateRangeOptionText,
                  dateRange === range.label && styles.dateRangeOptionTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filter Section */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search income records..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterOptions}>
            <View style={styles.filterOption}>
              <Text style={styles.filterLabel}>Category:</Text>
              <TouchableOpacity 
                style={styles.filterSelector}
                onPress={() => {
                  // In a real app, show a dropdown or modal
                  const nextIndex = CATEGORIES.indexOf(selectedCategory) + 1;
                  setSelectedCategory(CATEGORIES[nextIndex % CATEGORIES.length]);
                }}
              >
                <Text style={styles.filterSelectorText}>{selectedCategory}</Text>
                <ChevronDown size={16} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOption}>
              <Text style={styles.filterLabel}>Payment Method:</Text>
              <TouchableOpacity 
                style={styles.filterSelector}
                onPress={() => {
                  // In a real app, show a dropdown or modal
                  const nextIndex = PAYMENT_METHODS.indexOf(selectedPaymentMethod) + 1;
                  setSelectedPaymentMethod(PAYMENT_METHODS[nextIndex % PAYMENT_METHODS.length]);
                }}
              >
                <Text style={styles.filterSelectorText}>{selectedPaymentMethod}</Text>
                <ChevronDown size={16} color="#555" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.filterActionButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setSelectedPaymentMethod('All Methods');
              }}
            >
              <Text style={styles.filterActionButtonText}>Clear Filters</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterActionButton, styles.filterActionButtonPrimary]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.filterActionButtonTextPrimary}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'detailed' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('detailed')}
        >
          <Text
            style={[
              styles.viewModeButtonText,
              viewMode === 'detailed' && styles.viewModeButtonTextActive,
            ]}
          >
            Detailed View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'summary' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('summary')}
        >
          <Text
            style={[
              styles.viewModeButtonText,
              viewMode === 'summary' && styles.viewModeButtonTextActive,
            ]}
          >
            Summary View
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading report data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Summary Statistics Section */}
          <View style={styles.summaryStatsContainer}>
            <Text style={styles.sectionTitle}>Summary Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={styles.statValue}>{formatCurrency(totalIncome)}</Text>
                <Text style={styles.statSubtext}>{transactionCount} transactions</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average Income</Text>
                <Text style={styles.statValue}>{formatCurrency(averageIncome)}</Text>
                <Text style={styles.statSubtext}>per transaction</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Highest Income Day</Text>
                <Text style={styles.statValue}>
                  {highestIncomeDay.date ? formatCurrency(highestIncomeDay.amount) : 'N/A'}
                </Text>
                <Text style={styles.statSubtext}>
                  {highestIncomeDay.date ? formatDate(highestIncomeDay.date) : ''}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Range</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(minAmount)} - {formatCurrency(maxAmount)}
                </Text>
                <Text style={styles.statSubtext}>min - max</Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown Section */}
          {viewMode === 'summary' && (
            <View style={styles.categoryBreakdownContainer}>
              <Text style={styles.sectionTitle}>Income by Category</Text>
              
              {categoryBreakdown.length === 0 ? (
                <EmptyState
                  title="No Data Available"
                  description="There are no income records matching your filters."
                  icon="trending-up"
                />
              ) : (
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Category</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Count</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Amount</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>%</Text>
                  </View>
                  
                  {categoryBreakdown.map((item, index) => (
                    <View 
                      key={item.categoryId} 
                      style={[
                        styles.tableRow,
                        index % 2 === 0 && styles.tableRowEven
                      ]}
                    >
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.categoryId}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{item.count}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{formatCurrency(item.totalAmount)}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>
                        {formatPercentage((item.totalAmount / totalIncome) * 100)}
                      </Text>
                    </View>
                  ))}
                  
                  <View style={styles.tableTotalRow}>
                    <Text style={[styles.tableTotalCell, { flex: 2 }]}>Total</Text>
                    <Text style={[styles.tableTotalCell, { flex: 1 }]}>{transactionCount}</Text>
                    <Text style={[styles.tableTotalCell, { flex: 2 }]}>{formatCurrency(totalIncome)}</Text>
                    <Text style={[styles.tableTotalCell, { flex: 1 }]}>100%</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Detailed Transactions Section */}
          {viewMode === 'detailed' && (
            <View style={styles.detailedTransactionsContainer}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Income Transactions</Text>
                {isSelectionMode && (
                  <TouchableOpacity onPress={selectAllItems} style={styles.selectAllButton}>
                    <Text style={styles.selectAllText}>
                      {selectedItems.length === filteredIncomeData.length ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {filteredIncomeData.length === 0 ? (
                <EmptyState
                  title="No Transactions Found"
                  description="There are no income transactions matching your filters."
                  icon="trending-up"
                />
              ) : (
                <View style={styles.tableContainer}>
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={{ width: Platform.OS === 'web' ? '100%' : width * 1.5 }}>
                      <View style={styles.tableHeader}>
                        {isSelectionMode && (
                          <View style={[styles.tableHeaderCell, { width: 40 }]} />
                        )}
                        <TouchableOpacity 
                          style={[styles.tableHeaderCell, { flex: 1.2 }]}
                          onPress={() => handleSort('date')}
                        >
                          <Text style={styles.tableHeaderText}>Date</Text>
                          {renderSortIndicator('date')}
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.tableHeaderCell, { flex: 2 }]}
                          onPress={() => handleSort('description')}
                        >
                          <Text style={styles.tableHeaderText}>Description</Text>
                          {renderSortIndicator('description')}
                        </TouchableOpacity>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Category</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Method</Text>
                        <TouchableOpacity 
                          style={[styles.tableHeaderCell, { flex: 1.2 }]}
                          onPress={() => handleSort('amount')}
                        >
                          <Text style={styles.tableHeaderText}>Amount</Text>
                          {renderSortIndicator('amount')}
                        </TouchableOpacity>
                      </View>
                      
                      {sortedIncomeData.map((income, index) => (
                        <TouchableOpacity
                          key={income.id}
                          style={[
                            styles.tableRow,
                            index % 2 === 0 && styles.tableRowEven,
                            selectedItems.includes(income.id) && styles.tableRowSelected,
                          ]}
                          onPress={() => {
                            if (isSelectionMode) {
                              toggleItemSelection(income.id);
                            } else {
                              router.push(`/income/${income.id}`);
                            }
                          }}
                          onLongPress={() => {
                            if (!isSelectionMode) {
                              setIsSelectionMode(true);
                              toggleItemSelection(income.id);
                            }
                          }}
                        >
                          {isSelectionMode && (
                            <View style={[styles.tableCell, { width: 40 }]}>
                              {renderSelectionItem(income.id)}
                            </View>
                          )}
                          <Text style={[styles.tableCell, { flex: 1.2 }]}>
                            {formatDateShort(income.date)}
                          </Text>
                          <Text 
                            style={[styles.tableCell, { flex: 2 }]} 
                            numberOfLines={1}
                          >
                            {income.description}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.5 }]}>
                            {income.categoryId}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                            {income.paymentMethod || 'N/A'}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.2, color: '#4CAF50' }]}>
                            {formatCurrency(income.amount)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Selection Mode Actions */}
      {isSelectionMode && selectedItems.length > 0 && (
        <View style={styles.selectionActionsContainer}>
          <Text style={styles.selectionCountText}>
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </Text>
          
          <View style={styles.selectionButtons}>
            <TouchableOpacity 
              style={styles.selectionButton}
              onPress={() => {
                alert(`Export ${selectedItems.length} items`);
                setIsSelectionMode(false);
                setSelectedItems([]);
              }}
            >
              <Download size={18} color="#fff" />
              <Text style={styles.selectionButtonText}>Export</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.selectionButton, styles.selectionButtonDelete]}
              onPress={() => {
                alert(`Delete ${selectedItems.length} items`);
                setIsSelectionMode(false);
                setSelectedItems([]);
              }}
            >
              <X size={18} color="#fff" />
              <Text style={styles.selectionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    padding: 4,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeIcon: {
    marginRight: 8,
  },
  dateRangeText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  reportControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginLeft: 4,
  },
  dateRangeDropdown: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 4,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  dateRangeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  dateRangeOptionActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  dateRangeOptionText: {
    fontSize: 15,
    color: '#333',
  },
  dateRangeOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 4,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterSelectorText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: '#f5f5f5',
  },
  filterActionButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  filterActionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterActionButtonTextPrimary: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  viewModeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  viewModeButtonTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  summaryStatsContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
  },
  categoryBreakdownContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  detailedTransactionsContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  tableRowSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 8,
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  tableTotalCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 8,
  },
  selectionActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  selectionCountText: {
    fontSize: 14,
    color: '#666',
  },
  selectionButtons: {
    flexDirection: 'row',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  selectionButtonDelete: {
    backgroundColor: '#F44336',
  },
  selectionButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
});