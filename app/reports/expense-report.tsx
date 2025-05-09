import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal
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
  ChevronUp,
  Search,
  X,
  Check,
  FileText,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Trash2,
  Share2
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { getExpensesData } from '@/mocks/expensesData';
import { ExpenseRecord } from '@/types/expenses';
import { formatCurrency, formatDate, formatDateShort, formatPercentage } from '@/utils/formatters';
import EmptyState from '@/components/EmptyState';

const { width } = Dimensions.get('window');

// Predefined date ranges
const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
];

// Payment methods
const PAYMENT_METHODS = [
  'All Methods',
  'Cash',
  'Credit Card',
  'Bank Transfer',
  'Check',
  'PayPal',
  'Other'
];

// Expense categories
const EXPENSE_CATEGORIES = [
  'All Categories',
  'Rent',
  'Utilities',
  'Supplies',
  'Meals',
  'Software',
  'Marketing',
  'Training',
  'Travel',
  'Insurance',
  'Maintenance',
  'Salaries',
  'Other'
];

export default function ExpenseReportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All Methods');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  
  // Get expense data
  const allExpenses = useMemo(() => getExpensesData(), []);
  
  // Apply filters and sorting to expenses
  const filteredExpenses = useMemo(() => {
    let result = [...allExpenses];
    
    // Apply date range filter
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    switch (dateRange) {
      case 'today':
        result = result.filter(expense => 
          expense.date.getDate() === today.getDate() &&
          expense.date.getMonth() === today.getMonth() &&
          expense.date.getFullYear() === today.getFullYear()
        );
        break;
      case 'yesterday':
        result = result.filter(expense => 
          expense.date.getDate() === yesterday.getDate() &&
          expense.date.getMonth() === yesterday.getMonth() &&
          expense.date.getFullYear() === yesterday.getFullYear()
        );
        break;
      case 'this_week':
        result = result.filter(expense => expense.date >= startOfWeek);
        break;
      case 'this_month':
        result = result.filter(expense => expense.date >= startOfMonth);
        break;
      case 'this_quarter':
        result = result.filter(expense => expense.date >= startOfQuarter);
        break;
      case 'this_year':
        result = result.filter(expense => expense.date >= startOfYear);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          endDate.setHours(23, 59, 59, 999); // End of day
          
          result = result.filter(expense => 
            expense.date >= startDate && expense.date <= endDate
          );
        }
        break;
    }
    
    // Apply category filter
    if (selectedCategory !== 'All Categories') {
      result = result.filter(expense => expense.category === selectedCategory);
    }
    
    // Apply payment method filter
    if (selectedPaymentMethod !== 'All Methods') {
      result = result.filter(expense => expense.paymentMethod === selectedPaymentMethod);
    }
    
    // Apply search text filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(expense => 
        expense.description.toLowerCase().includes(searchLower) ||
        expense.vendor?.toLowerCase().includes(searchLower) ||
        expense.reference?.toLowerCase().includes(searchLower) ||
        expense.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'vendor':
          comparison = (a.vendor || '').localeCompare(b.vendor || '');
          break;
        default:
          comparison = a.date.getTime() - b.date.getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [allExpenses, dateRange, customDateRange, selectedCategory, selectedPaymentMethod, searchText, sortField, sortDirection]);
  
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalExpense = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Find highest expense day
    const expensesByDay: Record<string, number> = {};
    filteredExpenses.forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0];
      expensesByDay[dateKey] = (expensesByDay[dateKey] || 0) + expense.amount;
    });
    
    let highestExpenseDay = { date: new Date(), amount: 0 };
    Object.entries(expensesByDay).forEach(([dateStr, amount]) => {
      if (amount > highestExpenseDay.amount) {
        highestExpenseDay = { date: new Date(dateStr), amount };
      }
    });
    
    // Calculate average expense per day
    const uniqueDays = Object.keys(expensesByDay).length;
    const avgExpensePerDay = uniqueDays > 0 ? totalExpense / uniqueDays : 0;
    
    return {
      totalExpense,
      transactionCount: filteredExpenses.length,
      highestExpenseDay,
      avgExpensePerDay,
      // Mock budget data
      budget: 10000,
      budgetVariance: 10000 - totalExpense
    };
  }, [filteredExpenses]);
  
  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number, amount: number, percentage: number }> = {};
    
    filteredExpenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = { count: 0, amount: 0, percentage: 0 };
      }
      
      breakdown[expense.category].count += 1;
      breakdown[expense.category].amount += expense.amount;
    });
    
    // Calculate percentages
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    Object.keys(breakdown).forEach(category => {
      breakdown[category].percentage = totalAmount > 0 
        ? (breakdown[category].amount / totalAmount) * 100 
        : 0;
    });
    
    return breakdown;
  }, [filteredExpenses]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  // Handle date range selection
  const handleDateRangeSelect = (range: string) => {
    setDateRange(range);
    setShowDateRangeModal(false);
  };
  
  // Handle sort toggle
  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Handle item selection
  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredExpenses.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredExpenses.map(expense => expense.id));
    }
  };
  
  // Handle export
  const handleExport = () => {
    setShowExportModal(true);
  };
  
  // Start export process
  const startExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export process
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            setShowExportSuccess(true);
            setTimeout(() => {
              setShowExportSuccess(false);
              setShowExportModal(false);
            }, 2000);
          }, 500);
        }
        return newProgress;
      });
    }, 300);
  };
  
  // Handle delete selected
  const handleDeleteSelected = () => {
    // In a real app, this would delete the selected items
    // For this demo, we'll just clear the selection
    setSelectedItems([]);
    setSelectMode(false);
  };
  
  // Render date range selector
  const renderDateRangeSelector = () => {
    const getDateRangeLabel = () => {
      const range = DATE_RANGES.find(r => r.value === dateRange);
      if (range) {
        if (range.value === 'custom' && customDateRange.start && customDateRange.end) {
          return `${customDateRange.start} to ${customDateRange.end}`;
        }
        return range.label;
      }
      return 'Select Date Range';
    };
    
    return (
      <View style={styles.dateSelector}>
        <Calendar size={18} color="#555" />
        <TouchableOpacity 
          style={styles.dateRangeButton}
          onPress={() => setShowDateRangeModal(true)}
        >
          <Text style={styles.dateRangeText}>{getDateRangeLabel()}</Text>
          <ChevronDown size={16} color={Colors.primary} />
        </TouchableOpacity>
        
        <Modal
          visible={showDateRangeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDateRangeModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDateRangeModal(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              
              {DATE_RANGES.map(range => (
                <TouchableOpacity
                  key={range.value}
                  style={[
                    styles.dateRangeOption,
                    dateRange === range.value && styles.dateRangeOptionActive
                  ]}
                  onPress={() => handleDateRangeSelect(range.value)}
                >
                  <Text 
                    style={[
                      styles.dateRangeOptionText,
                      dateRange === range.value && styles.dateRangeOptionTextActive
                    ]}
                  >
                    {range.label}
                  </Text>
                  {dateRange === range.value && (
                    <Check size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              
              {dateRange === 'custom' && (
                <View style={styles.customDateContainer}>
                  <View style={styles.customDateField}>
                    <Text style={styles.customDateLabel}>Start Date</Text>
                    <TextInput
                      style={styles.customDateInput}
                      value={customDateRange.start}
                      onChangeText={text => setCustomDateRange({...customDateRange, start: text})}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={styles.customDateField}>
                    <Text style={styles.customDateLabel}>End Date</Text>
                    <TextInput
                      style={styles.customDateInput}
                      value={customDateRange.end}
                      onChangeText={text => setCustomDateRange({...customDateRange, end: text})}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowDateRangeModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };
  
  // Render filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter Expenses</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterModalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              {EXPENSE_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category}
                  style={styles.filterOption}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View style={styles.filterCheckbox}>
                    {selectedCategory === category && (
                      <View style={styles.filterCheckboxInner} />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Method</Text>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity
                  key={method}
                  style={styles.filterOption}
                  onPress={() => setSelectedPaymentMethod(method)}
                >
                  <View style={styles.filterCheckbox}>
                    {selectedPaymentMethod === method && (
                      <View style={styles.filterCheckboxInner} />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Search</Text>
              <View style={styles.searchContainer}>
                <Search size={18} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search expenses..."
                />
                {searchText ? (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <X size={18} color="#999" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.filterModalFooter}>
            <TouchableOpacity 
              style={styles.filterClearButton}
              onPress={() => {
                setSelectedCategory('All Categories');
                setSelectedPaymentMethod('All Methods');
                setSearchText('');
              }}
            >
              <Text style={styles.filterClearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterApplyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.filterApplyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render export modal
  const renderExportModal = () => {
    return (
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isExporting && setShowExportModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isExporting && setShowExportModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Export Report</Text>
            
            {!isExporting && !showExportSuccess ? (
              <>
                <Text style={styles.exportDescription}>
                  Choose a format to export your expense report
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.exportOption,
                    exportFormat === 'pdf' && styles.exportOptionActive
                  ]}
                  onPress={() => setExportFormat('pdf')}
                >
                  <FileText size={20} color={exportFormat === 'pdf' ? Colors.primary : '#666'} />
                  <Text 
                    style={[
                      styles.exportOptionText,
                      exportFormat === 'pdf' && styles.exportOptionTextActive
                    ]}
                  >
                    PDF Document
                  </Text>
                  {exportFormat === 'pdf' && (
                    <Check size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.exportOption,
                    exportFormat === 'excel' && styles.exportOptionActive
                  ]}
                  onPress={() => setExportFormat('excel')}
                >
                  <FileText size={20} color={exportFormat === 'excel' ? Colors.primary : '#666'} />
                  <Text 
                    style={[
                      styles.exportOptionText,
                      exportFormat === 'excel' && styles.exportOptionTextActive
                    ]}
                  >
                    Excel Spreadsheet
                  </Text>
                  {exportFormat === 'excel' && (
                    <Check size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.exportOption,
                    exportFormat === 'csv' && styles.exportOptionActive
                  ]}
                  onPress={() => setExportFormat('csv')}
                >
                  <FileText size={20} color={exportFormat === 'csv' ? Colors.primary : '#666'} />
                  <Text 
                    style={[
                      styles.exportOptionText,
                      exportFormat === 'csv' && styles.exportOptionTextActive
                    ]}
                  >
                    CSV File
                  </Text>
                  {exportFormat === 'csv' && (
                    <Check size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
                
                <View style={styles.exportOptions}>
                  <Text style={styles.exportOptionsTitle}>Export Options</Text>
                  
                  <View style={styles.exportOptionCheckbox}>
                    <View style={[styles.checkbox, styles.checkboxChecked]}>
                      <Check size={12} color="#fff" />
                    </View>
                    <Text style={styles.exportOptionLabel}>Include summary statistics</Text>
                  </View>
                  
                  <View style={styles.exportOptionCheckbox}>
                    <View style={[styles.checkbox, styles.checkboxChecked]}>
                      <Check size={12} color="#fff" />
                    </View>
                    <Text style={styles.exportOptionLabel}>Include category breakdown</Text>
                  </View>
                  
                  <View style={styles.exportOptionCheckbox}>
                    <View style={[styles.checkbox, styles.checkboxChecked]}>
                      <Check size={12} color="#fff" />
                    </View>
                    <Text style={styles.exportOptionLabel}>Include transaction details</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={startExport}
                >
                  <Text style={styles.exportButtonText}>Export Now</Text>
                </TouchableOpacity>
              </>
            ) : isExporting ? (
              <View style={styles.exportProgressContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.exportProgressText}>
                  Exporting your report...
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${exportProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.exportProgressPercentage}>
                  {exportProgress}%
                </Text>
              </View>
            ) : (
              <View style={styles.exportSuccessContainer}>
                <View style={styles.exportSuccessIcon}>
                  <Check size={32} color="#fff" />
                </View>
                <Text style={styles.exportSuccessText}>
                  Export Completed Successfully!
                </Text>
                <Text style={styles.exportSuccessDescription}>
                  Your report has been exported as a {exportFormat.toUpperCase()} file.
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  // Render summary view
  const renderSummaryView = () => {
    return (
      <>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Expense Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Total Expenses</Text>
              <Text style={styles.summaryItemValue}>
                {formatCurrency(summaryStats.totalExpense)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Transactions</Text>
              <Text style={styles.summaryItemValue}>
                {summaryStats.transactionCount}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Avg. Daily Expense</Text>
              <Text style={styles.summaryItemValue}>
                {formatCurrency(summaryStats.avgExpensePerDay)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Highest Expense Day</Text>
              <Text style={styles.summaryItemValue}>
                {formatCurrency(summaryStats.highestExpenseDay.amount)}
              </Text>
              <Text style={styles.summaryItemSubtext}>
                {formatDateShort(summaryStats.highestExpenseDay.date)}
              </Text>
            </View>
          </View>
          
          <View style={styles.budgetContainer}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(summaryStats.budget)}
              </Text>
            </View>
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Actual Expenses</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(summaryStats.totalExpense)}
              </Text>
            </View>
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Variance</Text>
              <Text style={[
                styles.budgetAmount,
                { color: summaryStats.budgetVariance >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {formatCurrency(summaryStats.budgetVariance)}
              </Text>
            </View>
            
            <View style={styles.budgetProgressContainer}>
              <View style={styles.budgetProgressBar}>
                <View 
                  style={[
                    styles.budgetProgress, 
                    { 
                      width: `${Math.min(100, (summaryStats.totalExpense / summaryStats.budget) * 100)}%`,
                      backgroundColor: summaryStats.totalExpense > summaryStats.budget ? '#F44336' : '#4CAF50'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.budgetProgressText}>
                {Math.round((summaryStats.totalExpense / summaryStats.budget) * 100)}% of budget used
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.categoryContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            <TouchableOpacity 
              style={styles.viewToggleButton}
              onPress={() => setViewMode('detailed')}
            >
              <Eye size={16} color="#666" />
              <Text style={styles.viewToggleText}>View Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tableHeader}>
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: 2 }]}
              onPress={() => handleSortToggle('category')}
            >
              <Text style={styles.tableHeaderText}>Category</Text>
              {sortField === 'category' && (
                sortDirection === 'asc' ? 
                <ArrowUp size={14} color="#666" /> : 
                <ArrowDown size={14} color="#666" />
              )}
            </TouchableOpacity>
            <View style={[styles.tableHeaderCell, { flex: 1 }]}>
              <Text style={styles.tableHeaderText}>Count</Text>
            </View>
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: 1.5 }]}
              onPress={() => handleSortToggle('amount')}
            >
              <Text style={styles.tableHeaderText}>Amount</Text>
              {sortField === 'amount' && (
                sortDirection === 'asc' ? 
                <ArrowUp size={14} color="#666" /> : 
                <ArrowDown size={14} color="#666" />
              )}
            </TouchableOpacity>
            <View style={[styles.tableHeaderCell, { flex: 1 }]}>
              <Text style={styles.tableHeaderText}>%</Text>
            </View>
          </View>
          
          {Object.entries(categoryBreakdown).length > 0 ? (
            <FlatList
              data={Object.entries(categoryBreakdown)}
              keyExtractor={([category]) => category}
              renderItem={({ item: [category, data] }) => (
                <View style={styles.categoryRow}>
                  <Text style={[styles.categoryCell, { flex: 2 }]}>{category}</Text>
                  <Text style={[styles.categoryCell, { flex: 1 }]}>{data.count}</Text>
                  <Text style={[styles.categoryCell, { flex: 1.5 }]}>
                    {formatCurrency(data.amount)}
                  </Text>
                  <Text style={[styles.categoryCell, { flex: 1 }]}>
                    {data.percentage.toFixed(1)}%
                  </Text>
                </View>
              )}
              ListFooterComponent={() => (
                <View style={styles.categoryTotalRow}>
                  <Text style={[styles.categoryTotalCell, { flex: 2 }]}>Total</Text>
                  <Text style={[styles.categoryTotalCell, { flex: 1 }]}>
                    {filteredExpenses.length}
                  </Text>
                  <Text style={[styles.categoryTotalCell, { flex: 1.5 }]}>
                    {formatCurrency(summaryStats.totalExpense)}
                  </Text>
                  <Text style={[styles.categoryTotalCell, { flex: 1 }]}>100%</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expense data available</Text>
            </View>
          )}
        </View>
      </>
    );
  };
  
  // Render detailed view
  const renderDetailedView = () => {
    return (
      <View style={styles.detailedContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Transactions</Text>
          <TouchableOpacity 
            style={styles.viewToggleButton}
            onPress={() => setViewMode('summary')}
          >
            <EyeOff size={16} color="#666" />
            <Text style={styles.viewToggleText}>View Summary</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tableControls}>
          <View style={styles.tableInfo}>
            <Text style={styles.tableInfoText}>
              Showing {filteredExpenses.length} of {allExpenses.length} expenses
            </Text>
          </View>
          
          <View style={styles.tableActions}>
            {selectMode ? (
              <>
                <TouchableOpacity 
                  style={styles.tableActionButton}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.tableActionText}>
                    {selectedItems.length === filteredExpenses.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tableActionButton, styles.tableActionButtonDanger]}
                  onPress={handleDeleteSelected}
                  disabled={selectedItems.length === 0}
                >
                  <Trash2 size={16} color={selectedItems.length === 0 ? '#999' : '#fff'} />
                  <Text style={[
                    styles.tableActionText, 
                    styles.tableActionTextDanger,
                    selectedItems.length === 0 && { color: '#999' }
                  ]}>
                    Delete
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.tableActionButton}
                  onPress={() => setSelectMode(false)}
                >
                  <X size={16} color="#666" />
                  <Text style={styles.tableActionText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.tableActionButton}
                  onPress={() => setSelectMode(true)}
                >
                  <CheckSquare size={16} color="#666" />
                  <Text style={styles.tableActionText}>Select</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.tableActionButton}
                  onPress={handleRefresh}
                >
                  <RefreshCw size={16} color="#666" />
                  <Text style={styles.tableActionText}>Refresh</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <ScrollView horizontal style={styles.tableScrollContainer}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              {selectMode && (
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, { width: 50 }]}
                  onPress={handleSelectAll}
                >
                  {selectedItems.length === filteredExpenses.length ? (
                    <CheckSquare size={18} color={Colors.primary} />
                  ) : (
                    <Square size={18} color="#666" />
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.tableHeaderCell, { width: 100 }]}
                onPress={() => handleSortToggle('date')}
              >
                <Text style={styles.tableHeaderText}>Date</Text>
                {sortField === 'date' && (
                  sortDirection === 'asc' ? 
                  <ArrowUp size={14} color="#666" /> : 
                  <ArrowDown size={14} color="#666" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tableHeaderCell, { width: 120 }]}
                onPress={() => handleSortToggle('category')}
              >
                <Text style={styles.tableHeaderText}>Category</Text>
                {sortField === 'category' && (
                  sortDirection === 'asc' ? 
                  <ArrowUp size={14} color="#666" /> : 
                  <ArrowDown size={14} color="#666" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tableHeaderCell, { width: 150 }]}
                onPress={() => handleSortToggle('vendor')}
              >
                <Text style={styles.tableHeaderText}>Vendor</Text>
                {sortField === 'vendor' && (
                  sortDirection === 'asc' ? 
                  <ArrowUp size={14} color="#666" /> : 
                  <ArrowDown size={14} color="#666" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tableHeaderCell, { width: 200 }]}
                onPress={() => handleSortToggle('description')}
              >
                <Text style={styles.tableHeaderText}>Description</Text>
                {sortField === 'description' && (
                  sortDirection === 'asc' ? 
                  <ArrowUp size={14} color="#666" /> : 
                  <ArrowDown size={14} color="#666" />
                )}
              </TouchableOpacity>
              
              <View style={[styles.tableHeaderCell, { width: 120 }]}>
                <Text style={styles.tableHeaderText}>Payment</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.tableHeaderCell, { width: 120 }]}
                onPress={() => handleSortToggle('amount')}
              >
                <Text style={styles.tableHeaderText}>Amount</Text>
                {sortField === 'amount' && (
                  sortDirection === 'asc' ? 
                  <ArrowUp size={14} color="#666" /> : 
                  <ArrowDown size={14} color="#666" />
                )}
              </TouchableOpacity>
            </View>
            
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense, index) => (
                <TouchableOpacity 
                  key={expense.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowEven,
                    selectedItems.includes(expense.id) && styles.tableRowSelected
                  ]}
                  onPress={() => selectMode ? handleSelectItem(expense.id) : router.push(`/expenses/${expense.id}`)}
                  onLongPress={() => {
                    if (!selectMode) {
                      setSelectMode(true);
                      handleSelectItem(expense.id);
                    }
                  }}
                >
                  {selectMode && (
                    <View style={[styles.tableCell, { width: 50 }]}>
                      {selectedItems.includes(expense.id) ? (
                        <CheckSquare size={18} color={Colors.primary} />
                      ) : (
                        <Square size={18} color="#666" />
                      )}
                    </View>
                  )}
                  
                  <Text style={[styles.tableCell, { width: 100 }]}>
                    {formatDateShort(expense.date)}
                  </Text>
                  
                  <Text style={[styles.tableCell, { width: 120 }]}>
                    {expense.category}
                  </Text>
                  
                  <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={1}>
                    {expense.vendor || 'N/A'}
                  </Text>
                  
                  <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={1}>
                    {expense.description}
                  </Text>
                  
                  <Text style={[styles.tableCell, { width: 120 }]}>
                    {expense.paymentMethod || 'N/A'}
                  </Text>
                  
                  <Text style={[styles.tableCell, { width: 120, color: '#F44336', fontWeight: '500' }]}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyTableContainer}>
                <Text style={styles.emptyTableText}>No expense transactions found</Text>
                <Text style={styles.emptyTableSubtext}>Try changing your filters or date range</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.actionBar}>
        {renderDateRangeSelector()}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleExport}
          >
            <Download size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Printer size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Mail size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={18} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading expense data...</Text>
        </View>
      ) : filteredExpenses.length === 0 && !searchText && selectedCategory === 'All Categories' && selectedPaymentMethod === 'All Methods' ? (
        <EmptyState
          title="No Expense Data"
          description="You haven't recorded any expenses for the selected period. Add expenses to see them in this report."
          icon="bar-chart"
          actionLabel="Add Expense"
          onAction={() => router.push('/expenses/new')}
        />
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {viewMode === 'summary' ? renderSummaryView() : renderDetailedView()}
        </ScrollView>
      )}
      
      {renderFilterModal()}
      {renderExportModal()}
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeButton: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dateRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateRangeOptionActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  dateRangeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dateRangeOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  customDateContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  customDateField: {
    marginBottom: 12,
  },
  customDateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  customDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  summaryItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  summaryItemSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  budgetContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#555',
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  budgetProgressContainer: {
    marginTop: 12,
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: '#f1f3f5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgress: {
    height: '100%',
  },
  budgetProgressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  categoryContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryCell: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  categoryTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  categoryTotalCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  detailedContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tableControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableInfo: {
    flex: 1,
  },
  tableInfoText: {
    fontSize: 14,
    color: '#666',
  },
  tableActions: {
    flexDirection: 'row',
  },
  tableActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#f1f3f5',
    marginLeft: 8,
  },
  tableActionButtonDanger: {
    backgroundColor: '#F44336',
  },
  tableActionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tableActionTextDanger: {
    color: 'white',
  },
  tableScrollContainer: {
    marginBottom: 16,
  },
  tableContainer: {
    minWidth: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowEven: {
    backgroundColor: '#f9f9f9',
  },
  tableRowSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  emptyTableContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyTableSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 60,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterModalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCheckboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  filterClearButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  filterClearButtonText: {
    fontSize: 16,
    color: '#666',
  },
  filterApplyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  filterApplyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  exportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  exportOptionActive: {
    backgroundColor: `${Colors.primary}15`,
    borderColor: Colors.primary,
  },
  exportOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  exportOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  exportOptions: {
    marginTop: 16,
    marginBottom: 16,
  },
  exportOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exportOptionCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  exportOptionLabel: {
    fontSize: 14,
    color: '#333',
  },
  exportButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  exportProgressContainer: {
    alignItems: 'center',
    padding: 16,
  },
  exportProgressText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#f1f3f5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  exportProgressPercentage: {
    fontSize: 14,
    color: '#666',
  },
  exportSuccessContainer: {
    alignItems: 'center',
    padding: 16,
  },
  exportSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportSuccessText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  exportSuccessDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});