import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  ActivityIndicator,
  Platform,
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
  Search,
  ChevronDown,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  FileText,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { formatCurrency, formatDate, formatDateShort, formatNumber, formatPercentage } from '@/utils/formatters';
import EmptyState from '@/components/EmptyState';
import { getSalesReportData, getSalesSummaryStats, getSalesByCustomer, getSalesByProduct, getSalesByDateRange } from '@/db/sales-invoice';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

// Extended type for sales report data
interface SaleReportRecord {
  id: number;
  date: string;
  invoiceNumber: string;
  customer: string | null;
  customerId: number;
  amount: number;
  subtotal: number;
  taxAmount: number | null;
  status: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Customer summary type
interface CustomerSummary {
  customerId: number;
  customerName: string | null;
  transactionCount: number;
  totalAmount: number;
  averageAmount: number;
}

// Product summary type
interface ProductSummary {
  productId: number;
  productName: string | null;
  quantitySold: number;
  totalAmount: number;
  costOfGoodsSold: number;
}

export default function SalesReportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('This Month');
  const [isDateRangeSelectorVisible, setIsDateRangeSelectorVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    customers: [] as string[],
    status: [] as string[],
  });
  
  // Sales data state
  const [salesData, setSalesData] = useState<SaleReportRecord[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<SaleReportRecord[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary[]>([]);
  const [dateRangeSummary, setDateRangeSummary] = useState<any[]>([]);
  
  // Load sales data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Get date range
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Fetch all required data
        const [salesData, stats, customers, products, dateData] = await Promise.all([
          getSalesReportData(user.id, startDate, endDate),
          getSalesSummaryStats(user.id, startDate, endDate),
          getSalesByCustomer(user.id, startDate, endDate),
          getSalesByProduct(user.id, startDate, endDate),
          getSalesByDateRange(user.id, startDate, endDate)
        ]);

        setSalesData(salesData);
        setFilteredSalesData(salesData);
        setSummaryStats(stats[0]);
        setCustomerSummary(customers);
        setProductSummary(products);
        setDateRangeSummary(dateData);

        // Extract unique filter options
        const uniqueCustomers = [...new Set(salesData.map(sale => sale.customer).filter(Boolean))] as string[];
        const uniqueStatus = [...new Set(salesData.map(sale => sale.status).filter(Boolean))] as string[];
        
        setFilterOptions({
          customers: uniqueCustomers,
          status: uniqueStatus,
        });
      } catch (error) {
        console.error('Error loading sales data:', error);
        Alert.alert('Error', 'Failed to load sales data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);
  
  // Apply search filter
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredSalesData(salesData);
      return;
    }
    
    const searchLower = searchText.toLowerCase();
    const filtered = salesData.filter(sale => 
      sale.customer?.toLowerCase().includes(searchLower) ||
      sale.invoiceNumber.toLowerCase().includes(searchLower) ||
      (sale.notes && sale.notes.toLowerCase().includes(searchLower))
    );
    
    setFilteredSalesData(filtered);
  }, [searchText, salesData]);
  
  // Apply sorting
  useEffect(() => {
    const sortedData = [...filteredSalesData].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'invoiceNumber':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'customer':
          comparison = (a.customer || '').localeCompare(b.customer || '');
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredSalesData(sortedData);
  }, [sortColumn, sortDirection]);

  // Calculate summary statistics
  const totalSalesAmount = summaryStats?.totalAmount || 0;
  const totalTransactions = summaryStats?.count || 0;
  const averageSaleValue = summaryStats?.average || 0;
  const totalTaxCollected = summaryStats?.totalTax || 0;
  const totalSubtotal = summaryStats?.totalSubtotal || 0;
  
  // Previous period comparison (mock data - assuming 5% growth)
  const previousPeriodAmount = totalSalesAmount * 0.95;
  const amountChange = totalSalesAmount - previousPeriodAmount;
  const percentageChange = previousPeriodAmount > 0 ? (amountChange / previousPeriodAmount) * 100 : 0;
  
  // Calculate gross profit (assuming 30% margin for mock data)
  const costOfGoodsSold = totalSalesAmount * 0.7;
  const grossProfit = totalSalesAmount - costOfGoodsSold;
  const grossProfitMargin = totalSalesAmount > 0 ? (grossProfit / totalSalesAmount) * 100 : 0;
  
  // Calculate sales by customer
  const salesByCustomer: CustomerSummary[] = customerSummary.map(summary => ({
    ...summary,
    averageAmount: summary.totalAmount / summary.transactionCount,
  }));
  
  // Calculate sales by product
  const salesByProduct: ProductSummary[] = productSummary.map(product => ({
    ...product,
    costOfGoodsSold: product.costOfGoodsSold || 0,
  }));
  
  // Date range options
  const dateRangeOptions = ['Today', 'Yesterday', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom'];
  
  // Handle sort change
  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Handle item selection
  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredSalesData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredSalesData.map(sale => sale.id.toString()));
    }
  };
  
  // Handle export
  const handleExport = (format: string) => {
    setExportFormat(format);
    setIsExporting(true);
    setShowExportOptions(false);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        "Export Complete",
        `Sales report has been exported as ${format.toUpperCase()}.`,
        [{ text: "OK" }]
      );
      setExportFormat(null);
    }, 2000);
  };
  
  // Handle filter toggle
  const handleFilterToggle = (filterType: string) => {
    if (activeFilter === filterType) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filterType);
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp size={16} color="#555" /> 
      : <ArrowDown size={16} color="#555" />;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales Report</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading sales data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render empty state
  if (filteredSalesData.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales Report</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sales..."
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <X size={18} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <EmptyState
          title="No Sales Found"
          description={searchText ? "No sales match your search criteria. Try adjusting your filters or search terms." : "There are no sales records in the selected date range."}
          icon="shopping-cart"
          actionLabel="Create New Sale"
          onAction={() => router.push('/sales-invoice/new' as any)}
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.actionBar}>
        <View style={styles.dateSelector}>
          <Calendar size={18} color="#555" />
          <TouchableOpacity 
            style={styles.dateRangeButton}
            onPress={() => setIsDateRangeSelectorVisible(!isDateRangeSelectorVisible)}
          >
            <Text style={styles.dateRangeText}>{dateRange}</Text>
            <ChevronDown size={16} color={Colors.primary} />
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
            onPress={() => handleFilterToggle('main')}
          >
            <Filter size={18} color={activeFilter === 'main' ? Colors.primary : "#555"} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Export Options Dropdown */}
      {showExportOptions && (
        <View style={styles.exportOptionsContainer}>
          <TouchableOpacity 
            style={styles.exportOption}
            onPress={() => handleExport('pdf')}
          >
            <FileText size={18} color="#555" />
            <Text style={styles.exportOptionText}>Export as PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.exportOption}
            onPress={() => handleExport('excel')}
          >
            <FileText size={18} color="#555" />
            <Text style={styles.exportOptionText}>Export as Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.exportOption}
            onPress={() => handleExport('csv')}
          >
            <FileText size={18} color="#555" />
            <Text style={styles.exportOptionText}>Export as CSV</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Date Range Selector */}
      {isDateRangeSelectorVisible && (
        <View style={styles.dateRangeSelector}>
          {dateRangeOptions.map((option) => (
            <TouchableOpacity 
              key={option}
              style={[
                styles.dateRangeOption,
                dateRange === option && styles.dateRangeOptionActive
              ]}
              onPress={() => {
                setDateRange(option);
                setIsDateRangeSelectorVisible(false);
              }}
            >
              <Text 
                style={[
                  styles.dateRangeOptionText,
                  dateRange === option && styles.dateRangeOptionTextActive
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Main Filter Options */}
      {activeFilter === 'main' && (
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter Sales</Text>
            <TouchableOpacity onPress={() => setActiveFilter(null)}>
              <X size={20} color="#555" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.filterOption}
            onPress={() => handleFilterToggle('customer')}
          >
            <Text style={styles.filterOptionText}>Customer</Text>
            <ChevronDown size={16} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterOption}
            onPress={() => handleFilterToggle('status')}
          >
            <Text style={styles.filterOptionText}>Payment Status</Text>
            <ChevronDown size={16} color="#555" />
          </TouchableOpacity>
          
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.filterClearButton}>
              <Text style={styles.filterClearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterApplyButton}
              onPress={() => setActiveFilter(null)}
            >
              <Text style={styles.filterApplyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sales..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={18} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton,
              viewMode === 'summary' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('summary')}
          >
            <Text 
              style={[
                styles.viewToggleText,
                viewMode === 'summary' && styles.viewToggleTextActive
              ]}
            >
              Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton,
              viewMode === 'detailed' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('detailed')}
          >
            <Text 
              style={[
                styles.viewToggleText,
                viewMode === 'detailed' && styles.viewToggleTextActive
              ]}
            >
              Detailed
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Export Progress Indicator */}
      {isExporting && (
        <View style={styles.exportingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.exportingText}>
            Exporting as {exportFormat?.toUpperCase()}...
          </Text>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        {/* Summary Statistics Section */}
        <View style={styles.summaryStatsContainer}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatLabel}>Total Sales</Text>
            <Text style={styles.summaryStatValue}>{formatCurrency(totalSalesAmount)}</Text>
            <View style={styles.comparisonContainer}>
              <Text 
                style={[
                  styles.comparisonText,
                  percentageChange >= 0 ? styles.positiveChange : styles.negativeChange
                ]}
              >
                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
              </Text>
              <Text style={styles.comparisonPeriod}>vs previous period</Text>
            </View>
          </View>
          
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatLabel}>Transactions</Text>
            <Text style={styles.summaryStatValue}>{formatNumber(totalTransactions)}</Text>
            <Text style={styles.summaryStatSubtext}>
              Avg: {formatCurrency(averageSaleValue)}
            </Text>
          </View>
          
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatLabel}>Tax Collected</Text>
            <Text style={styles.summaryStatValue}>{formatCurrency(totalTaxCollected)}</Text>
            <Text style={styles.summaryStatSubtext}>
              {((totalTaxCollected / totalSalesAmount) * 100).toFixed(1)}% of sales
            </Text>
          </View>
          
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatLabel}>Gross Profit</Text>
            <Text style={styles.summaryStatValue}>{formatCurrency(grossProfit)}</Text>
            <Text style={styles.summaryStatSubtext}>
              Margin: {grossProfitMargin.toFixed(1)}%
            </Text>
          </View>
        </View>
        
        {viewMode === 'summary' ? (
          <>
            {/* Sales by Customer Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>Sales by Customer</Text>
                <TouchableOpacity style={styles.refreshButton}>
                  <RefreshCw size={16} color="#555" />
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableHeader}>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 180 }]}
                      onPress={() => handleSortChange('customer')}
                    >
                      <Text style={styles.tableHeaderText}>Customer</Text>
                      {renderSortIndicator('customer')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('transactionCount')}
                    >
                      <Text style={styles.tableHeaderText}>Transactions</Text>
                      {renderSortIndicator('transactionCount')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('totalAmount')}
                    >
                      <Text style={styles.tableHeaderText}>Total Amount</Text>
                      {renderSortIndicator('totalAmount')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('averageAmount')}
                    >
                      <Text style={styles.tableHeaderText}>Avg. Value</Text>
                      {renderSortIndicator('averageAmount')}
                    </TouchableOpacity>
                  </View>
                  
                  {salesByCustomer.map((customerSummary, index) => (
                    <View 
                      key={customerSummary.customerId}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 && styles.tableRowAlternate
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>
                        {customerSummary.customerName || 'Unknown Customer'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {customerSummary.transactionCount}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(customerSummary.totalAmount)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(customerSummary.averageAmount)}
                      </Text>
                    </View>
                  ))}
                  
                  <View style={styles.tableTotalRow}>
                    <Text style={[styles.tableTotalCell, { width: 180 }]}>
                      Total ({customerSummary.length} customers)
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      {totalTransactions}
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      {formatCurrency(totalSalesAmount)}
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      100%
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      {formatCurrency(averageSaleValue)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
            
            {/* Sales by Product Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>Sales by Product</Text>
                <TouchableOpacity style={styles.refreshButton}>
                  <RefreshCw size={16} color="#555" />
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableHeader}>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 180 }]}
                      onPress={() => handleSortChange('product')}
                    >
                      <Text style={styles.tableHeaderText}>Product</Text>
                      {renderSortIndicator('product')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('quantitySold')}
                    >
                      <Text style={styles.tableHeaderText}>Quantity</Text>
                      {renderSortIndicator('quantitySold')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('totalAmount')}
                    >
                      <Text style={styles.tableHeaderText}>Total Amount</Text>
                      {renderSortIndicator('totalAmount')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('costOfGoodsSold')}
                    >
                      <Text style={styles.tableHeaderText}>Cost of Goods Sold</Text>
                      {renderSortIndicator('costOfGoodsSold')}
                    </TouchableOpacity>
                  </View>
                  
                  {salesByProduct.map((productSummary, index) => (
                    <View 
                      key={productSummary.productId}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 && styles.tableRowAlternate
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>
                        {productSummary.productName || 'Unknown Product'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {formatNumber(productSummary.quantitySold)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(productSummary.totalAmount)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(productSummary.costOfGoodsSold)}
                      </Text>
                    </View>
                  ))}
                  
                  <View style={styles.tableTotalRow}>
                    <Text style={[styles.tableTotalCell, { width: 180 }]}>
                      Total ({salesByProduct.length} products)
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      {salesByProduct.reduce((sum, product) => sum + product.quantitySold, 0)}
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      {formatCurrency(totalSalesAmount)}
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      {formatCurrency(costOfGoodsSold)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </>
        ) : (
          <>
            {/* Detailed Sales Transactions Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>Sales Transactions</Text>
                <View style={styles.tableActions}>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => setIsSelectMode(!isSelectMode)}
                  >
                    <Text style={styles.selectButtonText}>
                      {isSelectMode ? 'Cancel' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.refreshButton}>
                    <RefreshCw size={16} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {isSelectMode && (
                <View style={styles.batchActionBar}>
                  <TouchableOpacity 
                    style={styles.selectAllButton}
                    onPress={handleSelectAll}
                  >
                    {selectedItems.length === filteredSalesData.length ? (
                      <CheckSquare size={18} color={Colors.primary} />
                    ) : (
                      <Square size={18} color="#555" />
                    )}
                    <Text style={styles.selectAllText}>
                      {selectedItems.length === filteredSalesData.length 
                        ? 'Deselect All' 
                        : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.selectedCountText}>
                    {selectedItems.length} selected
                  </Text>
                  
                  <View style={styles.batchActions}>
                    <TouchableOpacity 
                      style={[
                        styles.batchActionButton,
                        selectedItems.length === 0 && styles.batchActionButtonDisabled
                      ]}
                      disabled={selectedItems.length === 0}
                    >
                      <Download size={16} color={selectedItems.length === 0 ? "#999" : "#555"} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.batchActionButton,
                        selectedItems.length === 0 && styles.batchActionButtonDisabled
                      ]}
                      disabled={selectedItems.length === 0}
                    >
                      <Printer size={16} color={selectedItems.length === 0 ? "#999" : "#555"} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.batchActionButton,
                        selectedItems.length === 0 && styles.batchActionButtonDisabled
                      ]}
                      disabled={selectedItems.length === 0}
                    >
                      <Mail size={16} color={selectedItems.length === 0 ? "#999" : "#555"} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableHeaderRow}>
                    {isSelectMode && (
                      <View style={[styles.tableHeaderCell, { width: 50 }]}>
                        <Text style={styles.tableHeaderText}></Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('date')}
                    >
                      <Text style={styles.tableHeaderText}>Date</Text>
                      {renderSortIndicator('date')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('invoiceNumber')}
                    >
                      <Text style={styles.tableHeaderText}>Invoice #</Text>
                      {renderSortIndicator('invoiceNumber')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 180 }]}
                      onPress={() => handleSortChange('customer')}
                    >
                      <Text style={styles.tableHeaderText}>Customer</Text>
                      {renderSortIndicator('customer')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('status')}
                    >
                      <Text style={styles.tableHeaderText}>Status</Text>
                      {renderSortIndicator('status')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('amount')}
                    >
                      <Text style={styles.tableHeaderText}>Total</Text>
                      {renderSortIndicator('amount')}
                    </TouchableOpacity>
                  </View>
                  
                  {filteredSalesData.map((sale, index) => (
                    <TouchableOpacity
                      key={sale.id}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 && styles.tableRowAlternate,
                        selectedItems.includes(sale.id.toString()) && styles.tableRowSelected
                      ]}
                      onPress={() => {
                        if (isSelectMode) {
                          toggleItemSelection(sale.id.toString());
                        } else {
                          router.push(`/sales-invoice/${sale.id}` as any);
                        }
                      }}
                      onLongPress={() => {
                        if (!isSelectMode) {
                          setIsSelectMode(true);
                          toggleItemSelection(sale.id.toString());
                        }
                      }}
                    >
                      {isSelectMode && (
                        <View style={[styles.tableCell, { width: 50 }]}>
                          {selectedItems.includes(sale.id.toString()) ? (
                            <CheckSquare size={18} color={Colors.primary} />
                          ) : (
                            <Square size={18} color="#555" />
                          )}
                        </View>
                      )}
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {formatDateShort(sale.date)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {sale.invoiceNumber}
                      </Text>
                      <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>
                        {customerSummary.find(c => c.customerId === sale.customerId)?.customerName || 'Unknown Customer'}
                      </Text>
                      <View style={[styles.tableCell, { width: 100 }]}>
                        <View style={[
                          styles.statusBadge,
                          sale.status === 'paid' && styles.statusPaid,
                          sale.status === 'pending' && styles.statusPending,
                          sale.status === 'overdue' && styles.statusOverdue,
                          sale.status === 'cancelled' && styles.statusCancelled,
                        ]}>
                          <Text style={styles.statusText}>
                            {sale.status || 'Unknown'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCell, { width: 120, fontWeight: '500', color: '#2196F3' }]}>
                        {formatCurrency(sale.amount)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  <View style={styles.tableTotalRow}>
                    <Text style={[
                      styles.tableTotalCell, 
                      { width: isSelectMode ? 50 + 100 : 100 }
                    ]}>
                      Total
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      {filteredSalesData.length} invoices
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 180 }]}>
                      {customerSummary.length} customers
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      {formatCurrency(totalSalesAmount)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.paginationContainer}>
                <Text style={styles.paginationInfo}>
                  Showing {filteredSalesData.length} of {salesData.length} entries
                </Text>
                <View style={styles.paginationControls}>
                  <TouchableOpacity style={styles.paginationButton}>
                    <Text style={styles.paginationButtonText}>Previous</Text>
                  </TouchableOpacity>
                  <View style={styles.paginationPageButton}>
                    <Text style={styles.paginationPageButtonText}>1</Text>
                  </View>
                  <TouchableOpacity style={styles.paginationButton}>
                    <Text style={styles.paginationButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.newButton}
        onPress={() => router.push('/sales-invoice/new' as any)}
      >
        <Text style={styles.newButtonText}>New Sale</Text>
      </TouchableOpacity>
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
  dateRangeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
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
  exportOptionsContainer: {
    position: 'absolute',
    top: 110,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  exportOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  filterClearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  filterClearButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterApplyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  filterApplyButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 0,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginLeft: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  viewToggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  viewToggleText: {
    fontSize: 13,
    color: '#555',
  },
  viewToggleTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  exportingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
  },
  exportingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
  },
  summaryStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  summaryStatCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryStatSubtext: {
    fontSize: 12,
    color: '#888',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  positiveChange: {
    color: '#4caf50',
  },
  negativeChange: {
    color: '#f44336',
  },
  comparisonPeriod: {
    fontSize: 12,
    color: '#888',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tableActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButton: {
    marginRight: 12,
  },
  selectButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 4,
  },
  batchActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#555',
  },
  batchActions: {
    flexDirection: 'row',
  },
  batchActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  batchActionButtonDisabled: {
    opacity: 0.5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlternate: {
    backgroundColor: '#f8f9fa',
  },
  tableRowSelected: {
    backgroundColor: '#e3f2fd',
  },
  tableCell: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tableTotalCell: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPaid: {
    backgroundColor: '#e8f5e9',
  },
  statusPending: {
    backgroundColor: '#fff8e1',
  },
  statusOverdue: {
    backgroundColor: '#ffebee',
  },
  statusCancelled: {
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#555',
  },
  paginationPageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationPageButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  newButton: {
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  newButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});