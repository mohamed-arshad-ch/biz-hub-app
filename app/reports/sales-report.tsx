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

import Colors from '@/constants/colors';
import { formatCurrency, formatDate, formatDateShort, formatNumber, formatPercentage } from '@/utils/formatters';
import { getSalesData } from '@/mocks/salesData';
import { SaleRecord, SaleItem } from '@/types/sales';
import EmptyState from '@/components/EmptyState';

const { width } = Dimensions.get('window');

// Extended type for sales report data
interface SaleReportRecord extends SaleRecord {
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
}

// Customer summary type
interface CustomerSummary {
  customer: string;
  transactionCount: number;
  totalAmount: number;
  percentageOfTotal: number;
  averageTransactionValue: number;
  previousPeriodAmount?: number;
}

// Product summary type
interface ProductSummary {
  product: string;
  quantitySold: number;
  totalAmount: number;
  percentageOfTotal: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  profitMargin?: number;
}

export default function SalesReportScreen() {
  const router = useRouter();
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
    paymentMethods: [] as string[],
    paymentStatus: [] as string[],
  });
  
  // Mock data for sales entries
  const [salesData, setSalesData] = useState<SaleReportRecord[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<SaleReportRecord[]>([]);
  
  // Load sales data
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = getSalesData().map(sale => ({
        ...sale,
        subtotal: sale.amount * 0.9, // Assuming 10% tax for mock data
        taxAmount: sale.amount * 0.1,
        discountAmount: sale.amount * 0.05, // 5% discount for demonstration
      }));
      setSalesData(data);
      setFilteredSalesData(data);
      
      // Extract unique filter options
      const customers = [...new Set(data.map(sale => sale.customer))];
      const paymentMethods = [...new Set(data.map(sale => sale.paymentMethod || 'Unknown'))];
      const paymentStatus = [...new Set(data.map(sale => sale.status))];
      
      setFilterOptions({
        customers,
        paymentMethods,
        paymentStatus,
      });
      
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Apply search filter
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredSalesData(salesData);
      return;
    }
    
    const searchLower = searchText.toLowerCase();
    const filtered = salesData.filter(sale => 
      sale.customer.toLowerCase().includes(searchLower) ||
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
          comparison = a.customer.localeCompare(b.customer);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredSalesData(sortedData);
  }, [sortColumn, sortDirection]);
  
  // Calculate summary statistics
  const totalSalesAmount = filteredSalesData.reduce((sum, sale) => sum + sale.amount, 0);
  const totalTransactions = filteredSalesData.length;
  const averageSaleValue = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;
  const totalTaxCollected = filteredSalesData.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);
  
  // Previous period comparison (mock data - assuming 5% growth)
  const previousPeriodAmount = totalSalesAmount * 0.95;
  const amountChange = totalSalesAmount - previousPeriodAmount;
  const percentageChange = previousPeriodAmount > 0 ? (amountChange / previousPeriodAmount) * 100 : 0;
  
  // Calculate gross profit (assuming 30% margin for mock data)
  const costOfGoodsSold = totalSalesAmount * 0.7;
  const grossProfit = totalSalesAmount - costOfGoodsSold;
  const grossProfitMargin = totalSalesAmount > 0 ? (grossProfit / totalSalesAmount) * 100 : 0;
  
  // Calculate sales by customer
  const salesByCustomer: CustomerSummary[] = Object.values(
    filteredSalesData.reduce((acc, sale) => {
      if (!acc[sale.customer]) {
        acc[sale.customer] = {
          customer: sale.customer,
          transactionCount: 0,
          totalAmount: 0,
          percentageOfTotal: 0,
          averageTransactionValue: 0,
          previousPeriodAmount: 0, // Mock data
        };
      }
      
      acc[sale.customer].transactionCount += 1;
      acc[sale.customer].totalAmount += sale.amount;
      
      return acc;
    }, {} as Record<string, CustomerSummary>)
  ).map(summary => ({
    ...summary,
    percentageOfTotal: totalSalesAmount > 0 ? (summary.totalAmount / totalSalesAmount) * 100 : 0,
    averageTransactionValue: summary.transactionCount > 0 ? summary.totalAmount / summary.transactionCount : 0,
    previousPeriodAmount: summary.totalAmount * 0.95, // Mock data - assuming 5% growth
  })).sort((a, b) => b.totalAmount - a.totalAmount);
  
  // Calculate sales by product (mock data since we don't have product-level data in the original sales records)
  const mockProducts = [
    { name: "Product A", quantity: 42, amount: totalSalesAmount * 0.3 },
    { name: "Product B", quantity: 28, amount: totalSalesAmount * 0.25 },
    { name: "Product C", quantity: 35, amount: totalSalesAmount * 0.2 },
    { name: "Product D", quantity: 15, amount: totalSalesAmount * 0.15 },
    { name: "Product E", quantity: 10, amount: totalSalesAmount * 0.1 },
  ];
  
  const salesByProduct: ProductSummary[] = mockProducts.map(product => ({
    product: product.name,
    quantitySold: product.quantity,
    totalAmount: product.amount,
    percentageOfTotal: totalSalesAmount > 0 ? (product.amount / totalSalesAmount) * 100 : 0,
    costOfGoodsSold: product.amount * 0.7, // Assuming 30% margin
    grossProfit: product.amount * 0.3,
    profitMargin: 30, // 30% margin
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
      setSelectedItems(filteredSalesData.map(sale => sale.id));
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
          onAction={() => router.push('/sales/new')}
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
            onPress={() => handleFilterToggle('paymentMethod')}
          >
            <Text style={styles.filterOptionText}>Payment Method</Text>
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
                  <View style={styles.tableHeaderRow}>
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
                      <Text style={styles.tableHeaderText}>Total</Text>
                      {renderSortIndicator('totalAmount')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('percentageOfTotal')}
                    >
                      <Text style={styles.tableHeaderText}>% of Total</Text>
                      {renderSortIndicator('percentageOfTotal')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('averageTransactionValue')}
                    >
                      <Text style={styles.tableHeaderText}>Avg. Value</Text>
                      {renderSortIndicator('averageTransactionValue')}
                    </TouchableOpacity>
                  </View>
                  
                  {salesByCustomer.map((customerSummary, index) => (
                    <View 
                      key={customerSummary.customer}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 && styles.tableRowAlternate
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>
                        {customerSummary.customer}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {customerSummary.transactionCount}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(customerSummary.totalAmount)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {customerSummary.percentageOfTotal.toFixed(1)}%
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(customerSummary.averageTransactionValue)}
                      </Text>
                    </View>
                  ))}
                  
                  <View style={styles.tableTotalRow}>
                    <Text style={[styles.tableTotalCell, { width: 180 }]}>
                      Total ({salesByCustomer.length} customers)
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
                  <View style={styles.tableHeaderRow}>
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
                      <Text style={styles.tableHeaderText}>Total</Text>
                      {renderSortIndicator('totalAmount')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('percentageOfTotal')}
                    >
                      <Text style={styles.tableHeaderText}>% of Total</Text>
                      {renderSortIndicator('percentageOfTotal')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 120 }]}
                      onPress={() => handleSortChange('grossProfit')}
                    >
                      <Text style={styles.tableHeaderText}>Profit</Text>
                      {renderSortIndicator('grossProfit')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('profitMargin')}
                    >
                      <Text style={styles.tableHeaderText}>Margin</Text>
                      {renderSortIndicator('profitMargin')}
                    </TouchableOpacity>
                  </View>
                  
                  {salesByProduct.map((productSummary, index) => (
                    <View 
                      key={productSummary.product}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 && styles.tableRowAlternate
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>
                        {productSummary.product}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {productSummary.quantitySold}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(productSummary.totalAmount)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {productSummary.percentageOfTotal.toFixed(1)}%
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {formatCurrency(productSummary.grossProfit || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {productSummary.profitMargin?.toFixed(1)}%
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
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      100%
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      {formatCurrency(grossProfit)}
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      {grossProfitMargin.toFixed(1)}%
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
                      onPress={() => handleSortChange('paymentMethod')}
                    >
                      <Text style={styles.tableHeaderText}>Payment</Text>
                      {renderSortIndicator('paymentMethod')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('subtotal')}
                    >
                      <Text style={styles.tableHeaderText}>Subtotal</Text>
                      {renderSortIndicator('subtotal')}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tableHeaderCell, { width: 100 }]}
                      onPress={() => handleSortChange('taxAmount')}
                    >
                      <Text style={styles.tableHeaderText}>Tax</Text>
                      {renderSortIndicator('taxAmount')}
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
                        selectedItems.includes(sale.id) && styles.tableRowSelected
                      ]}
                      onPress={() => {
                        if (isSelectMode) {
                          toggleItemSelection(sale.id);
                        } else {
                          router.push(`/sales/${sale.id}`);
                        }
                      }}
                      onLongPress={() => {
                        if (!isSelectMode) {
                          setIsSelectMode(true);
                          toggleItemSelection(sale.id);
                        }
                      }}
                    >
                      {isSelectMode && (
                        <View style={[styles.tableCell, { width: 50 }]}>
                          {selectedItems.includes(sale.id) ? (
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
                        {sale.customer}
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
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {sale.paymentMethod || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {formatCurrency(sale.subtotal || 0)}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {formatCurrency(sale.taxAmount || 0)}
                      </Text>
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
                      {salesByCustomer.length} customers
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 120 }]}>
                      
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      {formatCurrency(filteredSalesData.reduce((sum, sale) => sum + (sale.subtotal || 0), 0))}
                    </Text>
                    <Text style={[styles.tableTotalCell, { width: 100 }]}>
                      {formatCurrency(filteredSalesData.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0))}
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
});