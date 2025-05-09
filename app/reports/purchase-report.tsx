import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Platform,
  Switch,
  Dimensions,
  Alert
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
  FileText,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Save,
  Clock
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { formatCurrency, formatDate, formatDateShort, formatPercentage, formatNumber } from '@/utils/formatters';
import { getPurchasesData } from '@/mocks/purchasesData';
import { PurchaseRecord, PurchaseStatus } from '@/types/purchases';

const { width } = Dimensions.get('window');

// Define date range options
const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
];

// Define view modes
const VIEW_MODES = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
};

// Define sort directions
const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
  NONE: 'none',
};

// Define export formats
const EXPORT_FORMATS = [
  { label: 'PDF', value: 'pdf', icon: FileText },
  { label: 'Excel', value: 'excel', icon: FileText },
  { label: 'CSV', value: 'csv', icon: FileText },
];

export default function PurchaseReportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDateRange, setCustomDateRange] = useState({ 
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date() 
  });
  const [showDateRangeSelector, setShowDateRangeSelector] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODES.SUMMARY);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<PurchaseStatus[]>([]);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTIONS.DESC);
  const [hideZeroValues, setHideZeroValues] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // Get purchase data
  const allPurchases = getPurchasesData();
  
  // Filter purchases based on date range and other filters
  const filteredPurchases = allPurchases.filter(purchase => {
    // Date range filter
    const purchaseDate = new Date(purchase.date);
    let inDateRange = true;
    
    if (dateRange === 'today') {
      const today = new Date();
      inDateRange = purchaseDate.toDateString() === today.toDateString();
    } else if (dateRange === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      inDateRange = purchaseDate.toDateString() === yesterday.toDateString();
    } else if (dateRange === 'this_week') {
      const today = new Date();
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      inDateRange = purchaseDate >= firstDayOfWeek && purchaseDate <= today;
    } else if (dateRange === 'this_month') {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      inDateRange = purchaseDate >= firstDayOfMonth && purchaseDate <= today;
    } else if (dateRange === 'this_quarter') {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3);
      const firstDayOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      inDateRange = purchaseDate >= firstDayOfQuarter && purchaseDate <= today;
    } else if (dateRange === 'this_year') {
      const today = new Date();
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      inDateRange = purchaseDate >= firstDayOfYear && purchaseDate <= today;
    } else if (dateRange === 'custom') {
      inDateRange = purchaseDate >= customDateRange.from && purchaseDate <= customDateRange.to;
    }
    
    // Vendor filter
    const vendorMatch = selectedVendors.length === 0 || selectedVendors.includes(purchase.vendor);
    
    // Payment method filter
    const paymentMethodMatch = selectedPaymentMethods.length === 0 || 
      (purchase.paymentMethod && selectedPaymentMethods.includes(purchase.paymentMethod));
    
    // Status filter
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(purchase.status);
    
    // Search query filter
    const searchMatch = searchQuery === '' || 
      purchase.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (purchase.notes && purchase.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return inDateRange && vendorMatch && paymentMethodMatch && statusMatch && searchMatch;
  });
  
  // Sort purchases
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === SORT_DIRECTIONS.ASC 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortField === 'amount') {
      return sortDirection === SORT_DIRECTIONS.ASC 
        ? a.amount - b.amount
        : b.amount - a.amount;
    } else if (sortField === 'vendor') {
      return sortDirection === SORT_DIRECTIONS.ASC 
        ? a.vendor.localeCompare(b.vendor)
        : b.vendor.localeCompare(a.vendor);
    } else if (sortField === 'poNumber') {
      return sortDirection === SORT_DIRECTIONS.ASC 
        ? a.poNumber.localeCompare(b.poNumber)
        : b.poNumber.localeCompare(a.poNumber);
    } else if (sortField === 'status') {
      return sortDirection === SORT_DIRECTIONS.ASC 
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });
  
  // Paginate purchases
  const paginatedPurchases = sortedPurchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedPurchases.length / pageSize);
  
  // Calculate summary statistics
  const totalPurchaseAmount = filteredPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalTransactions = filteredPurchases.length;
  const averagePurchaseValue = totalTransactions > 0 ? totalPurchaseAmount / totalTransactions : 0;
  
  // Calculate previous period data for comparison
  const getPreviousPeriodData = () => {
    let previousFrom, previousTo;
    
    if (dateRange === 'today') {
      previousFrom = new Date();
      previousFrom.setDate(previousFrom.getDate() - 1);
      previousTo = new Date(previousFrom);
    } else if (dateRange === 'yesterday') {
      previousFrom = new Date();
      previousFrom.setDate(previousFrom.getDate() - 2);
      previousTo = new Date(previousFrom);
    } else if (dateRange === 'this_week') {
      const today = new Date();
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      
      previousFrom = new Date(firstDayOfWeek);
      previousFrom.setDate(previousFrom.getDate() - 7);
      previousTo = new Date(firstDayOfWeek);
      previousTo.setDate(previousTo.getDate() - 1);
    } else if (dateRange === 'this_month') {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      previousFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      previousTo = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (dateRange === 'this_quarter') {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3);
      const firstDayOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      
      previousFrom = new Date(today.getFullYear(), (quarter - 1) * 3, 1);
      previousTo = new Date(today.getFullYear(), quarter * 3, 0);
    } else if (dateRange === 'this_year') {
      const today = new Date();
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      
      previousFrom = new Date(today.getFullYear() - 1, 0, 1);
      previousTo = new Date(today.getFullYear() - 1, 11, 31);
    } else if (dateRange === 'custom') {
      const daysDiff = Math.round((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      previousFrom = new Date(customDateRange.from);
      previousFrom.setDate(previousFrom.getDate() - daysDiff - 1);
      previousTo = new Date(customDateRange.from);
      previousTo.setDate(previousTo.getDate() - 1);
    }
    
    return allPurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= previousFrom && purchaseDate <= previousTo;
    });
  };
  
  const previousPeriodPurchases = getPreviousPeriodData();
  const previousPeriodAmount = previousPeriodPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const amountChange = totalPurchaseAmount - previousPeriodAmount;
  const percentageChange = previousPeriodAmount !== 0 
    ? (amountChange / previousPeriodAmount) * 100 
    : 0;
  
  // Calculate purchases by vendor
  const purchasesByVendor = filteredPurchases.reduce((acc, purchase) => {
    if (!acc[purchase.vendor]) {
      acc[purchase.vendor] = {
        transactions: 0,
        amount: 0,
      };
    }
    acc[purchase.vendor].transactions += 1;
    acc[purchase.vendor].amount += purchase.amount;
    return acc;
  }, {} as Record<string, { transactions: number; amount: number }>);
  
  // Calculate purchases by product
  const purchasesByProduct = filteredPurchases.reduce((acc, purchase) => {
    if (purchase.items) {
      purchase.items.forEach(item => {
        if (!acc[item.name]) {
          acc[item.name] = {
            quantity: 0,
            amount: 0,
          };
        }
        acc[item.name].quantity += item.quantity;
        acc[item.name].amount += item.total;
      });
    }
    return acc;
  }, {} as Record<string, { quantity: number; amount: number }>);
  
  // Get unique vendors
  const uniqueVendors = Array.from(new Set(allPurchases.map(purchase => purchase.vendor)));
  
  // Get unique payment methods
  const uniquePaymentMethods = Array.from(
    new Set(allPurchases.filter(p => p.paymentMethod).map(p => p.paymentMethod as string))
  );
  
  // Get unique statuses
  const uniqueStatuses = Array.from(new Set(allPurchases.map(purchase => purchase.status)));
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      if (sortDirection === SORT_DIRECTIONS.ASC) {
        setSortDirection(SORT_DIRECTIONS.DESC);
      } else if (sortDirection === SORT_DIRECTIONS.DESC) {
        setSortDirection(SORT_DIRECTIONS.NONE);
        setSortField('date'); // Default sort
      } else {
        setSortDirection(SORT_DIRECTIONS.ASC);
      }
    } else {
      setSortField(field);
      setSortDirection(SORT_DIRECTIONS.ASC);
    }
  };
  
  // Handle export
  const handleExport = (format: string) => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setShowExportOptions(false);
          
          // Show success notification
          Alert.alert(
            "Export Complete",
            `Purchase report has been exported as ${format.toUpperCase()}`,
            [
              { text: "Open File", onPress: () => console.log("Open file") },
              { text: "OK" }
            ]
          );
          
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  // Handle refresh data
  const handleRefreshData = () => {
    setLoading(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === paginatedPurchases.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedPurchases.map(purchase => purchase.id));
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
  
  // Handle batch action
  const handleBatchAction = (action: string) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} ${selectedItems.length} selected purchases?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            // Simulate action
            setTimeout(() => {
              setSelectedItems([]);
              setSelectMode(false);
              Alert.alert("Success", `${selectedItems.length} purchases have been ${action}d`);
            }, 1000);
          }
        }
      ]
    );
  };
  
  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    if (sortDirection === SORT_DIRECTIONS.ASC) {
      return <ArrowUp size={14} color={Colors.primary} />;
    } else if (sortDirection === SORT_DIRECTIONS.DESC) {
      return <ArrowDown size={14} color={Colors.primary} />;
    }
    
    return null;
  };
  
  // Render status badge
  const renderStatusBadge = (status: PurchaseStatus) => {
    let backgroundColor = '#ccc';
    let textColor = '#fff';
    
    switch (status) {
      case 'paid':
        backgroundColor = '#34a853';
        break;
      case 'pending':
        backgroundColor = '#fbbc04';
        textColor = '#000';
        break;
      case 'overdue':
        backgroundColor = '#ea4335';
        break;
      case 'cancelled':
        backgroundColor = '#9aa0a6';
        break;
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };
  
  // Render date range label
  const renderDateRangeLabel = () => {
    if (dateRange === 'today') {
      return 'Today';
    } else if (dateRange === 'yesterday') {
      return 'Yesterday';
    } else if (dateRange === 'this_week') {
      return 'This Week';
    } else if (dateRange === 'this_month') {
      return 'This Month';
    } else if (dateRange === 'this_quarter') {
      return 'This Quarter';
    } else if (dateRange === 'this_year') {
      return 'This Year';
    } else if (dateRange === 'custom') {
      return `${formatDateShort(customDateRange.from)} - ${formatDateShort(customDateRange.to)}`;
    }
    
    return 'Select Date Range';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.actionBar}>
        <View style={styles.dateSelector}>
          <Calendar size={18} color="#555" />
          <TouchableOpacity 
            style={styles.dateRangeButton}
            onPress={() => setShowDateRangeSelector(!showDateRangeSelector)}
          >
            <Text style={styles.dateRangeText}>{renderDateRangeLabel()}</Text>
            {showDateRangeSelector ? 
              <ChevronUp size={16} color={Colors.primary} /> : 
              <ChevronDown size={16} color={Colors.primary} />
            }
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowExportOptions(!showExportOptions)}
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
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
      
      {showDateRangeSelector && (
        <View style={styles.dateRangeSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DATE_RANGES.map((range) => (
              <TouchableOpacity 
                key={range.value}
                style={[
                  styles.dateRangeOption,
                  dateRange === range.value && styles.dateRangeOptionActive
                ]}
                onPress={() => {
                  setDateRange(range.value);
                  if (range.value !== 'custom') {
                    setShowDateRangeSelector(false);
                  }
                }}
              >
                <Text 
                  style={[
                    styles.dateRangeOptionText,
                    dateRange === range.value && styles.dateRangeOptionTextActive
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {dateRange === 'custom' && (
            <View style={styles.customDateRange}>
              <View style={styles.customDateInput}>
                <Text style={styles.customDateLabel}>From:</Text>
                <TouchableOpacity style={styles.customDateButton}>
                  <Text style={styles.customDateButtonText}>
                    {formatDateShort(customDateRange.from)}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.customDateInput}>
                <Text style={styles.customDateLabel}>To:</Text>
                <TouchableOpacity style={styles.customDateButton}>
                  <Text style={styles.customDateButtonText}>
                    {formatDateShort(customDateRange.to)}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowDateRangeSelector(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      {showExportOptions && (
        <View style={styles.exportOptions}>
          {isExporting ? (
            <View style={styles.exportProgress}>
              <Text style={styles.exportProgressText}>Exporting...</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${exportProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.exportProgressPercentage}>{exportProgress}%</Text>
            </View>
          ) : (
            <>
              <Text style={styles.exportTitle}>Export as:</Text>
              <View style={styles.exportFormats}>
                {EXPORT_FORMATS.map((format) => (
                  <TouchableOpacity 
                    key={format.value}
                    style={styles.exportFormat}
                    onPress={() => handleExport(format.value)}
                  >
                    <format.icon size={18} color={Colors.primary} />
                    <Text style={styles.exportFormatText}>{format.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.exportOptions}>
                <View style={styles.exportOption}>
                  <Text style={styles.exportOptionText}>Include details</Text>
                  <Switch 
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: '#ccc', true: `${Colors.primary}50` }}
                    thumbColor={true ? Colors.primary : '#f4f3f4'}
                  />
                </View>
                <View style={styles.exportOption}>
                  <Text style={styles.exportOptionText}>Current view only</Text>
                  <Switch 
                    value={false}
                    onValueChange={() => {}}
                    trackColor={{ false: '#ccc', true: `${Colors.primary}50` }}
                    thumbColor={false ? Colors.primary : '#f4f3f4'}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      )}
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedVendors([]);
                setSelectedPaymentMethods([]);
                setSelectedStatuses([]);
                setSearchQuery('');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filtersScrollView}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Vendor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {uniqueVendors.map((vendor) => (
                  <TouchableOpacity 
                    key={vendor}
                    style={[
                      styles.filterChip,
                      selectedVendors.includes(vendor) && styles.filterChipActive
                    ]}
                    onPress={() => {
                      if (selectedVendors.includes(vendor)) {
                        setSelectedVendors(selectedVendors.filter(v => v !== vendor));
                      } else {
                        setSelectedVendors([...selectedVendors, vendor]);
                      }
                    }}
                  >
                    <Text 
                      style={[
                        styles.filterChipText,
                        selectedVendors.includes(vendor) && styles.filterChipTextActive
                      ]}
                    >
                      {vendor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {uniquePaymentMethods.map((method) => (
                  <TouchableOpacity 
                    key={method}
                    style={[
                      styles.filterChip,
                      selectedPaymentMethods.includes(method) && styles.filterChipActive
                    ]}
                    onPress={() => {
                      if (selectedPaymentMethods.includes(method)) {
                        setSelectedPaymentMethods(selectedPaymentMethods.filter(m => m !== method));
                      } else {
                        setSelectedPaymentMethods([...selectedPaymentMethods, method]);
                      }
                    }}
                  >
                    <Text 
                      style={[
                        styles.filterChipText,
                        selectedPaymentMethods.includes(method) && styles.filterChipTextActive
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {uniqueStatuses.map((status) => (
                  <TouchableOpacity 
                    key={status}
                    style={[
                      styles.filterChip,
                      selectedStatuses.includes(status) && styles.filterChipActive
                    ]}
                    onPress={() => {
                      if (selectedStatuses.includes(status)) {
                        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                      } else {
                        setSelectedStatuses([...selectedStatuses, status]);
                      }
                    }}
                  >
                    <Text 
                      style={[
                        styles.filterChipText,
                        selectedStatuses.includes(status) && styles.filterChipTextActive
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Search</Text>
              <View style={styles.searchInputContainer}>
                <Search size={18} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by vendor, PO number, or notes"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity 
                    style={styles.clearSearchButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <X size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.applyFiltersButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyFiltersText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.viewToggle}>
        <TouchableOpacity 
          style={[
            styles.viewToggleButton,
            viewMode === VIEW_MODES.SUMMARY && styles.viewToggleButtonActive
          ]}
          onPress={() => setViewMode(VIEW_MODES.SUMMARY)}
        >
          <Text 
            style={[
              styles.viewToggleText,
              viewMode === VIEW_MODES.SUMMARY && styles.viewToggleTextActive
            ]}
          >
            Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.viewToggleButton,
            viewMode === VIEW_MODES.DETAILED && styles.viewToggleButtonActive
          ]}
          onPress={() => setViewMode(VIEW_MODES.DETAILED)}
        >
          <Text 
            style={[
              styles.viewToggleText,
              viewMode === VIEW_MODES.DETAILED && styles.viewToggleTextActive
            ]}
          >
            Detailed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading purchase data...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Purchase Summary</Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleRefreshData}
                >
                  <RefreshCw size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Total Purchases</Text>
                  <Text style={styles.summaryCardAmount}>{formatCurrency(totalPurchaseAmount)}</Text>
                  <View style={styles.summaryCardChange}>
                    <Text 
                      style={[
                        styles.summaryCardChangeText,
                        { color: percentageChange >= 0 ? '#34a853' : '#ea4335' }
                      ]}
                    >
                      {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
                    </Text>
                    <Text style={styles.summaryCardPeriod}>vs previous period</Text>
                  </View>
                </View>
                
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Transactions</Text>
                  <Text style={styles.summaryCardAmount}>{formatNumber(totalTransactions)}</Text>
                  <View style={styles.summaryCardChange}>
                    <Text style={styles.summaryCardPeriod}>
                      {renderDateRangeLabel()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Average Purchase</Text>
                  <Text style={styles.summaryCardAmount}>{formatCurrency(averagePurchaseValue)}</Text>
                  <View style={styles.summaryCardChange}>
                    <Text style={styles.summaryCardPeriod}>per transaction</Text>
                  </View>
                </View>
                
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Vendors</Text>
                  <Text style={styles.summaryCardAmount}>{Object.keys(purchasesByVendor).length}</Text>
                  <View style={styles.summaryCardChange}>
                    <Text style={styles.summaryCardPeriod}>
                      unique vendors
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {viewMode === VIEW_MODES.SUMMARY ? (
              <>
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Purchases by Vendor</Text>
                    <TouchableOpacity style={styles.sectionAction}>
                      <Text style={styles.sectionActionText}>View All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <TouchableOpacity 
                        style={[styles.tableHeaderCell, { flex: 2 }]}
                        onPress={() => handleSortChange('vendor')}
                      >
                        <Text style={styles.tableHeaderText}>Vendor</Text>
                        {renderSortIndicator('vendor')}
                      </TouchableOpacity>
                      <View style={[styles.tableHeaderCell, { flex: 1, justifyContent: 'center' }]}>
                        <Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>Transactions</Text>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 1.5, justifyContent: 'flex-end' }]}>
                        <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Amount</Text>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 1, justifyContent: 'flex-end' }]}>
                        <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>% of Total</Text>
                      </View>
                    </View>
                    
                    {Object.entries(purchasesByVendor)
                      .sort((a, b) => b[1].amount - a[1].amount)
                      .map(([vendor, data], index) => (
                        <View key={vendor} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{vendor}</Text>
                          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                            {data.transactions}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '500' }]}>
                            {formatCurrency(data.amount)}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                            {((data.amount / totalPurchaseAmount) * 100).toFixed(1)}%
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
                
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Purchases by Product</Text>
                    <TouchableOpacity style={styles.sectionAction}>
                      <Text style={styles.sectionActionText}>View All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                      <View style={[styles.tableHeaderCell, { flex: 2 }]}>
                        <Text style={styles.tableHeaderText}>Product</Text>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 1, justifyContent: 'center' }]}>
                        <Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>Quantity</Text>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 1.5, justifyContent: 'flex-end' }]}>
                        <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Amount</Text>
                      </View>
                      <View style={[styles.tableHeaderCell, { flex: 1, justifyContent: 'flex-end' }]}>
                        <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>% of Total</Text>
                      </View>
                    </View>
                    
                    {Object.entries(purchasesByProduct)
                      .sort((a, b) => b[1].amount - a[1].amount)
                      .map(([product, data], index) => (
                        <View key={product} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{product}</Text>
                          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                            {data.quantity}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '500' }]}>
                            {formatCurrency(data.amount)}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                            {((data.amount / totalPurchaseAmount) * 100).toFixed(1)}%
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.detailedContainer}>
                <View style={styles.detailedHeader}>
                  <View style={styles.detailedHeaderLeft}>
                    <Text style={styles.detailedTitle}>Purchase Transactions</Text>
                    <Text style={styles.detailedSubtitle}>
                      Showing {paginatedPurchases.length} of {filteredPurchases.length} transactions
                    </Text>
                  </View>
                  
                  <View style={styles.detailedHeaderRight}>
                    {selectMode ? (
                      <View style={styles.batchActionsContainer}>
                        <Text style={styles.selectedCountText}>
                          {selectedItems.length} selected
                        </Text>
                        <TouchableOpacity 
                          style={styles.batchActionButton}
                          onPress={() => handleBatchAction('export')}
                        >
                          <Text style={styles.batchActionText}>Export</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.batchActionButton, { backgroundColor: '#ea4335' }]}
                          onPress={() => setSelectMode(false)}
                        >
                          <Text style={[styles.batchActionText, { color: '#fff' }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.selectModeButton}
                        onPress={() => setSelectMode(true)}
                      >
                        <Text style={styles.selectModeText}>Select</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <ScrollView horizontal style={styles.tableScrollContainer}>
                  <View style={styles.detailedTable}>
                    <View style={styles.detailedTableHeader}>
                      {selectMode && (
                        <TouchableOpacity 
                          style={styles.checkboxHeaderCell}
                          onPress={handleSelectAll}
                        >
                          {selectedItems.length === paginatedPurchases.length ? (
                            <CheckSquare size={18} color={Colors.primary} />
                          ) : (
                            <Square size={18} color="#555" />
                          )}
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={[styles.detailedHeaderCell, { width: 100 }]}
                        onPress={() => handleSortChange('date')}
                      >
                        <Text style={styles.detailedHeaderText}>Date</Text>
                        {renderSortIndicator('date')}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.detailedHeaderCell, { width: 120 }]}
                        onPress={() => handleSortChange('poNumber')}
                      >
                        <Text style={styles.detailedHeaderText}>PO Number</Text>
                        {renderSortIndicator('poNumber')}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.detailedHeaderCell, { width: 150 }]}
                        onPress={() => handleSortChange('vendor')}
                      >
                        <Text style={styles.detailedHeaderText}>Vendor</Text>
                        {renderSortIndicator('vendor')}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.detailedHeaderCell, { width: 100 }]}
                        onPress={() => handleSortChange('status')}
                      >
                        <Text style={styles.detailedHeaderText}>Status</Text>
                        {renderSortIndicator('status')}
                      </TouchableOpacity>
                      
                      <View style={[styles.detailedHeaderCell, { width: 120 }]}>
                        <Text style={styles.detailedHeaderText}>Payment Method</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={[styles.detailedHeaderCell, { width: 120 }]}
                        onPress={() => handleSortChange('amount')}
                      >
                        <Text style={[styles.detailedHeaderText, { textAlign: 'right' }]}>Amount</Text>
                        {renderSortIndicator('amount')}
                      </TouchableOpacity>
                    </View>
                    
                    {paginatedPurchases.map((purchase, index) => (
                      <TouchableOpacity 
                        key={purchase.id}
                        style={[
                          styles.detailedTableRow,
                          index % 2 === 1 && styles.alternateRow,
                          selectedItems.includes(purchase.id) && styles.selectedRow
                        ]}
                        onPress={() => {
                          if (selectMode) {
                            handleSelectItem(purchase.id);
                          } else {
                            router.push(`/purchases/${purchase.id}`);
                          }
                        }}
                      >
                        {selectMode && (
                          <TouchableOpacity 
                            style={styles.checkboxCell}
                            onPress={() => handleSelectItem(purchase.id)}
                          >
                            {selectedItems.includes(purchase.id) ? (
                              <CheckSquare size={18} color={Colors.primary} />
                            ) : (
                              <Square size={18} color="#555" />
                            )}
                          </TouchableOpacity>
                        )}
                        
                        <View style={[styles.detailedCell, { width: 100 }]}>
                          <Text style={styles.detailedCellText}>
                            {formatDateShort(purchase.date)}
                          </Text>
                        </View>
                        
                        <View style={[styles.detailedCell, { width: 120 }]}>
                          <Text style={styles.detailedCellText}>
                            {purchase.poNumber}
                          </Text>
                        </View>
                        
                        <View style={[styles.detailedCell, { width: 150 }]}>
                          <Text style={styles.detailedCellText} numberOfLines={1}>
                            {purchase.vendor}
                          </Text>
                        </View>
                        
                        <View style={[styles.detailedCell, { width: 100 }]}>
                          {renderStatusBadge(purchase.status)}
                        </View>
                        
                        <View style={[styles.detailedCell, { width: 120 }]}>
                          <Text style={styles.detailedCellText}>
                            {purchase.paymentMethod || 'N/A'}
                          </Text>
                        </View>
                        
                        <View style={[styles.detailedCell, { width: 120 }]}>
                          <Text style={[styles.detailedCellText, styles.amountText]}>
                            {formatCurrency(purchase.amount)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                
                {totalPages > 1 && (
                  <View style={styles.pagination}>
                    <View style={styles.paginationInfo}>
                      <Text style={styles.paginationText}>
                        Page {currentPage} of {totalPages}
                      </Text>
                    </View>
                    
                    <View style={styles.paginationControls}>
                      <TouchableOpacity 
                        style={[
                          styles.paginationButton,
                          currentPage === 1 && styles.paginationButtonDisabled
                        ]}
                        onPress={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <Text 
                          style={[
                            styles.paginationButtonText,
                            currentPage === 1 && styles.paginationButtonTextDisabled
                          ]}
                        >
                          First
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.paginationButton,
                          currentPage === 1 && styles.paginationButtonDisabled
                        ]}
                        onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <Text 
                          style={[
                            styles.paginationButtonText,
                            currentPage === 1 && styles.paginationButtonTextDisabled
                          ]}
                        >
                          Prev
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.paginationButton,
                          currentPage === totalPages && styles.paginationButtonDisabled
                        ]}
                        onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <Text 
                          style={[
                            styles.paginationButtonText,
                            currentPage === totalPages && styles.paginationButtonTextDisabled
                          ]}
                        >
                          Next
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.paginationButton,
                          currentPage === totalPages && styles.paginationButtonDisabled
                        ]}
                        onPress={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <Text 
                          style={[
                            styles.paginationButtonText,
                            currentPage === totalPages && styles.paginationButtonTextDisabled
                          ]}
                        >
                          Last
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.pageSizeSelector}>
                      <Text style={styles.pageSizeLabel}>Show:</Text>
                      {[10, 25, 50, 100].map(size => (
                        <TouchableOpacity 
                          key={size}
                          style={[
                            styles.pageSizeButton,
                            pageSize === size && styles.pageSizeButtonActive
                          ]}
                          onPress={() => {
                            setPageSize(size);
                            setCurrentPage(1);
                          }}
                        >
                          <Text 
                            style={[
                              styles.pageSizeButtonText,
                              pageSize === size && styles.pageSizeButtonTextActive
                            ]}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <TouchableOpacity style={styles.footerButton}>
            <Save size={16} color="#555" />
            <Text style={styles.footerButtonText}>Save Report</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerRight}>
          <TouchableOpacity style={styles.footerButton}>
            <Clock size={16} color="#555" />
            <Text style={styles.footerButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
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
  dateRangeSelector: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateRangeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f1f3f5',
  },
  dateRangeOptionActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  dateRangeOptionText: {
    fontSize: 13,
    color: '#555',
  },
  dateRangeOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  customDateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  customDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  customDateLabel: {
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
  customDateButton: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  customDateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  applyButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  exportOptions: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  exportFormats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exportFormat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 12,
    marginBottom: 12,
  },
  exportFormatText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exportOptionText: {
    fontSize: 14,
    color: '#555',
  },
  exportProgress: {
    alignItems: 'center',
  },
  exportProgressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
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
    color: '#333',
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  clearFiltersButton: {
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    color: Colors.primary,
  },
  filtersScrollView: {
    maxHeight: 300,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  applyFiltersButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  applyFiltersText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  viewToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  viewToggleText: {
    fontSize: 14,
    color: '#555',
  },
  viewToggleTextActive: {
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
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 12,
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  summaryCard: {
    width: (width - 64) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryCardTitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  summaryCardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryCardChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCardChangeText: {
    fontSize: 13,
    marginRight: 4,
  },
  summaryCardPeriod: {
    fontSize: 12,
    color: '#777',
  },
  sectionContainer: {
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
  sectionAction: {
    padding: 4,
  },
  sectionActionText: {
    fontSize: 14,
    color: Colors.primary,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  detailedContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailedHeaderLeft: {},
  detailedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailedSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  detailedHeaderRight: {},
  selectModeButton: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  selectModeText: {
    fontSize: 14,
    color: '#555',
  },
  batchActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
  batchActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  batchActionText: {
    fontSize: 14,
    color: 'white',
  },
  tableScrollContainer: {
    marginBottom: 16,
  },
  detailedTable: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailedTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkboxHeaderCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailedHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 4,
  },
  detailedTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alternateRow: {
    backgroundColor: '#f8f9fa',
  },
  selectedRow: {
    backgroundColor: `${Colors.primary}10`,
  },
  checkboxCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailedCell: {
    justifyContent: 'center',
  },
  detailedCellText: {
    fontSize: 14,
    color: '#333',
  },
  amountText: {
    fontWeight: '500',
    textAlign: 'right',
    color: '#FF9800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  paginationInfo: {
    marginBottom: 8,
  },
  paginationText: {
    fontSize: 14,
    color: '#555',
  },
  paginationControls: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  paginationButtonDisabled: {
    borderColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  paginationButtonText: {
    fontSize: 14,
    color: Colors.primary,
  },
  paginationButtonTextDisabled: {
    color: '#aaa',
  },
  pageSizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pageSizeLabel: {
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
  pageSizeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  pageSizeButtonActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  pageSizeButtonText: {
    fontSize: 14,
    color: '#555',
  },
  pageSizeButtonTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerLeft: {},
  footerRight: {},
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
});