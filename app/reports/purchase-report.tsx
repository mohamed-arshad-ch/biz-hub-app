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
  Alert,
  ViewStyle,
  TextStyle
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { formatCurrency, formatDate, formatDateShort, formatPercentage, formatNumber } from '@/utils/formatters';
import { useAuthStore } from '@/store/auth';
import { getPurchaseReportData, getPurchaseSummaryStats, getPurchasesByVendor, getPurchasesByProduct, getPurchasesByDateRange } from '@/db/purchase-invoice';

const { width } = Dimensions.get('window');

// Constants
const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
};

const VIEW_MODES = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  VENDOR: 'vendor',
  PRODUCT: 'product',
  DATE_RANGE: 'date_range'
};

const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
};

const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
};

// Types
interface PurchaseReportRecord {
  id: number;
  invoiceNumber: string;
  date: string;
  vendorId: number;
  vendorName: string | null;
  total: number;
  status: string | null;
  notes: string | null;
  createdAt: string | null;
}

interface VendorSummary {
  vendorId: number;
  vendorName: string | null;
  totalPurchases: number;
  totalAmount: number;
  averageAmount: number;
}

interface ProductSummary {
  productId: number;
  productName: string | null;
  quantitySold: number;
  totalAmount: number;
  averageAmount: number;
}

interface DateRangeSummary {
  date: string;
  totalPurchases: number;
  totalAmount: number;
  averageAmount: number;
}

export default function PurchaseReportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTIONS.DESC);
  const [hideZeroValues, setHideZeroValues] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // State for purchase data
  const [purchaseData, setPurchaseData] = useState<PurchaseReportRecord[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [vendorSummary, setVendorSummary] = useState<VendorSummary[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary[]>([]);
  const [dateRangeSummary, setDateRangeSummary] = useState<DateRangeSummary[]>([]);

  // Load purchase data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Get date range
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Fetch all required data
        const [purchases, stats, vendors, products, dateData] = await Promise.all([
          getPurchaseReportData(user.id, startDate, endDate),
          getPurchaseSummaryStats(user.id, startDate, endDate),
          getPurchasesByVendor(user.id, startDate, endDate),
          getPurchasesByProduct(user.id, startDate, endDate),
          getPurchasesByDateRange(user.id, startDate, endDate)
        ]);

        // Transform the data to match our interfaces
        const transformedPurchases = purchases.map(p => ({
          ...p,
          vendorName: p.vendorName || '',
          status: p.status || '',
          notes: p.notes || '',
          createdAt: p.createdAt || ''
        }));

        const transformedVendors = vendors.map(v => ({
          ...v,
          vendorName: v.vendorName || '',
          totalPurchases: Number(v.totalPurchases) || 0,
          totalAmount: Number(v.totalAmount) || 0,
          averageAmount: Number(v.averageAmount) || 0
        }));

        const transformedProducts = products.map(p => ({
          ...p,
          productName: p.productName || '',
          quantitySold: Number(p.quantitySold) || 0,
          totalAmount: Number(p.totalAmount) || 0,
          averageAmount: Number(p.averageAmount) || 0
        }));

        const transformedDateData = dateData.map(d => ({
          ...d,
          totalPurchases: Number(d.totalPurchases) || 0,
          totalAmount: Number(d.totalAmount) || 0,
          averageAmount: Number(d.averageAmount) || 0
        }));

        setPurchaseData(transformedPurchases);
        setSummaryStats(stats[0]);
        setVendorSummary(transformedVendors);
        setProductSummary(transformedProducts);
        setDateRangeSummary(transformedDateData);

        // Extract unique filter options
        const uniqueVendors = [...new Set(purchases.map(purchase => purchase.vendorName).filter(Boolean))] as string[];
        const uniqueStatuses = [...new Set(purchases.map(purchase => purchase.status).filter(Boolean))] as string[];
        
        setSelectedVendors(uniqueVendors);
        setSelectedStatuses(uniqueStatuses);
      } catch (error) {
        console.error('Error loading purchase data:', error);
        Alert.alert('Error', 'Failed to load purchase data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Filter purchases based on date range and other filters
  const filteredPurchases = purchaseData.filter(purchase => {
    // Date range filter
    const purchaseDate = new Date(purchase.date);
    const startDate = new Date(customDateRange.from);
    const endDate = new Date(customDateRange.to);
    endDate.setHours(23, 59, 59, 999);

    if (purchaseDate < startDate || purchaseDate > endDate) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        purchase.invoiceNumber.toLowerCase().includes(query) ||
        purchase.vendorName?.toLowerCase().includes(query) ||
        purchase.status?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Vendor filter
    if (selectedVendors.length > 0 && !selectedVendors.includes(purchase.vendorName || '')) {
      return false;
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(purchase.status || '')) {
      return false;
    }

    // Zero values filter
    if (hideZeroValues && purchase.total === 0) {
      return false;
    }

    return true;
  });

  // Sort purchases
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'invoiceNumber':
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
        break;
      case 'vendor':
        comparison = (a.vendorName || '').localeCompare(b.vendorName || '');
        break;
      case 'amount':
        comparison = a.total - b.total;
        break;
      case 'status':
        comparison = a.status?.localeCompare(b.status || '') || 0;
        break;
      default:
        comparison = 0;
    }
    return sortDirection === SORT_DIRECTIONS.ASC ? comparison : -comparison;
  });

  // Paginate purchases
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPurchases = sortedPurchases.slice(startIndex, startIndex + pageSize);

  // Handle sort change
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC);
    } else {
      setSortField(field);
      setSortDirection(SORT_DIRECTIONS.ASC);
    }
  };

  // Handle vendor selection
  const handleVendorSelect = (vendor: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendor) 
        ? prev.filter(v => v !== vendor)
        : [...prev, vendor]
    );
  };

  // Handle status selection
  const handleStatusSelect = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Handle item selection
  const handleItemSelect = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id.toString()) 
        ? prev.filter(item => item !== id.toString())
        : [...prev, id.toString()]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === paginatedPurchases.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedPurchases.map(purchase => purchase.id.toString()));
    }
  };

  // Handle export
  const handleExport = async (format: string) => {
    setIsExporting(true);
    setExportProgress(0);
    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setExportProgress(i);
      }
      // TODO: Implement actual export functionality
      Alert.alert('Success', `Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportOptions(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let backgroundColor = '#ccc';
    let textColor = '#fff';

    switch (status) {
      case 'paid':
        backgroundColor = '#4CAF50';
        break;
      case 'unpaid':
        backgroundColor = '#F44336';
        break;
      case 'partial':
        backgroundColor = '#FF9800';
        break;
      case 'overdue':
        backgroundColor = '#9C27B0';
        break;
      default:
        backgroundColor = '#9E9E9E';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>
          {status?.charAt(0).toUpperCase() + status?.slice(1) || ''}
        </Text>
      </View>
    );
  };

  // Render summary view
  const renderSummaryView = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Purchases</Text>
        <Text style={styles.summaryValue}>{summaryStats?.totalPurchases || 0}</Text>
        <Text style={styles.summarySubtext}>
          {formatCurrency(summaryStats?.totalAmount || 0)}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Average Purchase</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summaryStats?.averageAmount || 0)}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Paid Amount</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summaryStats?.totalPaid || 0)}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Unpaid Amount</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(summaryStats?.totalUnpaid || 0)}
        </Text>
      </View>
    </View>
  );

  // Render vendor summary view
  const renderVendorSummaryView = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Vendor</Text>
        <Text style={styles.tableHeaderCell}>Purchases</Text>
        <Text style={styles.tableHeaderCell}>Total Amount</Text>
        <Text style={styles.tableHeaderCell}>Average</Text>
      </View>
      {vendorSummary.map((vendor, index) => (
        <View key={vendor.vendorId} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
          <Text style={[styles.tableCell, { flex: 2 }]}>{vendor.vendorName}</Text>
          <Text style={styles.tableCell}>{vendor.totalPurchases}</Text>
          <Text style={styles.tableCell}>{formatCurrency(vendor.totalAmount)}</Text>
          <Text style={styles.tableCell}>{formatCurrency(vendor.averageAmount)}</Text>
        </View>
      ))}
    </View>
  );

  // Render product summary view
  const renderProductSummaryView = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Product</Text>
        <Text style={styles.tableHeaderCell}>Quantity</Text>
        <Text style={styles.tableHeaderCell}>Total Amount</Text>
        <Text style={styles.tableHeaderCell}>Average</Text>
      </View>
      {productSummary.map((product, index) => (
        <View key={product.productId} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
          <Text style={[styles.tableCell, { flex: 2 }]}>{product.productName}</Text>
          <Text style={styles.tableCell}>{formatNumber(product.quantitySold)}</Text>
          <Text style={styles.tableCell}>{formatCurrency(product.totalAmount)}</Text>
          <Text style={styles.tableCell}>{formatCurrency(product.averageAmount)}</Text>
        </View>
      ))}
    </View>
  );

  // Render date range summary view
  const renderDateRangeSummaryView = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
        <Text style={styles.tableHeaderCell}>Purchases</Text>
        <Text style={styles.tableHeaderCell}>Total Amount</Text>
        <Text style={styles.tableHeaderCell}>Average</Text>
      </View>
      {dateRangeSummary.map((date, index) => (
        <View key={date.date} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
          <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(date.date)}</Text>
          <Text style={styles.tableCell}>{date.totalPurchases}</Text>
          <Text style={styles.tableCell}>{formatCurrency(date.totalAmount)}</Text>
          <Text style={styles.tableCell}>{formatCurrency(date.averageAmount)}</Text>
        </View>
      ))}
    </View>
  );

  // Render detailed view
  const renderDetailedView = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        {selectMode ? (
          <TouchableOpacity 
            style={styles.checkboxCell} 
            onPress={handleSelectAll}
          >
            {selectedItems.length === paginatedPurchases.length ? (
              <CheckSquare size={20} color={Colors.primary} />
            ) : (
              <Square size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity 
          style={styles.tableHeaderCell} 
          onPress={() => handleSort('date')}
        >
          <Text style={styles.tableHeaderText}>Date</Text>
          {sortField === 'date' && (
            sortDirection === SORT_DIRECTIONS.ASC ? 
              <ArrowUp size={16} color={Colors.primary} /> : 
              <ArrowDown size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tableHeaderCell} 
          onPress={() => handleSort('invoiceNumber')}
        >
          <Text style={styles.tableHeaderText}>Invoice #</Text>
          {sortField === 'invoiceNumber' && (
            sortDirection === SORT_DIRECTIONS.ASC ? 
              <ArrowUp size={16} color={Colors.primary} /> : 
              <ArrowDown size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tableHeaderCell} 
          onPress={() => handleSort('vendor')}
        >
          <Text style={styles.tableHeaderText}>Vendor</Text>
          {sortField === 'vendor' && (
            sortDirection === SORT_DIRECTIONS.ASC ? 
              <ArrowUp size={16} color={Colors.primary} /> : 
              <ArrowDown size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tableHeaderCell} 
          onPress={() => handleSort('amount')}
        >
          <Text style={styles.tableHeaderText}>Amount</Text>
          {sortField === 'amount' && (
            sortDirection === SORT_DIRECTIONS.ASC ? 
              <ArrowUp size={16} color={Colors.primary} /> : 
              <ArrowDown size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tableHeaderCell} 
          onPress={() => handleSort('status')}
        >
          <Text style={styles.tableHeaderText}>Status</Text>
          {sortField === 'status' && (
            sortDirection === SORT_DIRECTIONS.ASC ? 
              <ArrowUp size={16} color={Colors.primary} /> : 
              <ArrowDown size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>
      {paginatedPurchases.map((purchase, index) => (
        <TouchableOpacity
          key={purchase.id}
          style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}
          onPress={() => {
            if (selectMode) {
              handleItemSelect(purchase.id);
            } else {
              router.push(`/purchase-invoice/${purchase.id}`);
            }
          }}
        >
          {selectMode && (
            <View style={styles.checkboxCell}>
              {selectedItems.includes(purchase.id.toString()) ? (
                <CheckSquare size={20} color={Colors.primary} />
              ) : (
                <Square size={20} color={Colors.primary} />
              )}
            </View>
          )}
          <Text style={styles.tableCell}>{formatDateShort(purchase.date)}</Text>
          <Text style={styles.tableCell}>{purchase.invoiceNumber}</Text>
          <Text style={styles.tableCell}>{purchase.vendorName}</Text>
          <Text style={styles.tableCell}>{formatCurrency(purchase.total)}</Text>
          <View style={styles.tableCell}>
            {renderStatusBadge(purchase.status || '')}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Purchase Report</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowExportOptions(true)}
          >
            <Download size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.text} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search purchases..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === VIEW_MODES.SUMMARY && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode(VIEW_MODES.SUMMARY)}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === VIEW_MODES.SUMMARY && styles.viewModeTextActive
              ]}>Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === VIEW_MODES.DETAILED && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode(VIEW_MODES.DETAILED)}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === VIEW_MODES.DETAILED && styles.viewModeTextActive
              ]}>Detailed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === VIEW_MODES.VENDOR && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode(VIEW_MODES.VENDOR)}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === VIEW_MODES.VENDOR && styles.viewModeTextActive
              ]}>By Vendor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === VIEW_MODES.PRODUCT && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode(VIEW_MODES.PRODUCT)}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === VIEW_MODES.PRODUCT && styles.viewModeTextActive
              ]}>By Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === VIEW_MODES.DATE_RANGE && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode(VIEW_MODES.DATE_RANGE)}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === VIEW_MODES.DATE_RANGE && styles.viewModeTextActive
              ]}>By Date</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Vendors</Text>
              <View style={styles.filterOptions}>
                {Array.from(new Set(purchaseData.map(purchase => purchase.vendorName))).map(vendor => (
                  <TouchableOpacity
                    key={vendor}
                    style={[
                      styles.filterOption,
                      selectedVendors.includes(vendor) && styles.filterOptionSelected
                    ]}
                    onPress={() => handleVendorSelect(vendor)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedVendors.includes(vendor) && styles.filterOptionTextSelected
                    ]}>{vendor}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {Array.from(new Set(purchaseData.map(purchase => purchase.status))).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      selectedStatuses.includes(status) && styles.filterOptionSelected
                    ]}
                    onPress={() => handleStatusSelect(status)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedStatuses.includes(status) && styles.filterOptionTextSelected
                    ]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Options</Text>
              <View style={styles.filterOptions}>
                <View style={styles.filterOption}>
                  <Switch
                    value={hideZeroValues}
                    onValueChange={setHideZeroValues}
                    trackColor={{ false: '#767577', true: Colors.primary }}
                    thumbColor={hideZeroValues ? '#fff' : '#f4f3f4'}
                  />
                  <Text style={styles.filterOptionText}>Hide Zero Values</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.dataContainer}>
            {viewMode === VIEW_MODES.SUMMARY && renderSummaryView()}
            {viewMode === VIEW_MODES.DETAILED && renderDetailedView()}
            {viewMode === VIEW_MODES.VENDOR && renderVendorSummaryView()}
            {viewMode === VIEW_MODES.PRODUCT && renderProductSummaryView()}
            {viewMode === VIEW_MODES.DATE_RANGE && renderDateRangeSummaryView()}
          </ScrollView>
        )}
      </View>

      {showExportOptions && (
        <View style={styles.exportModal}>
          <View style={styles.exportModalContent}>
            <Text style={styles.exportModalTitle}>Export Report</Text>
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport(EXPORT_FORMATS.PDF)}
              >
                <FileText size={24} color={Colors.primary} />
                <Text style={styles.exportOptionText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport(EXPORT_FORMATS.EXCEL)}
              >
                <FileText size={24} color={Colors.primary} />
                <Text style={styles.exportOptionText}>Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport(EXPORT_FORMATS.CSV)}
              >
                <FileText size={24} color={Colors.primary} />
                <Text style={styles.exportOptionText}>CSV</Text>
              </TouchableOpacity>
            </View>
            {isExporting && (
              <View style={styles.exportProgress}>
                <Text style={styles.exportProgressText}>
                  Exporting... {exportProgress}%
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { width: `${exportProgress}%` }
                    ]} 
                  />
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.exportModalClose}
              onPress={() => setShowExportOptions(false)}
            >
              <Text style={styles.exportModalCloseText}>Close</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  toolbar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    color: Colors.text,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  viewModeText: {
    color: Colors.text,
  },
  viewModeTextActive: {
    color: '#fff',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primary,
  },
  filterOptionText: {
    color: Colors.text,
    marginLeft: 8,
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataContainer: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    margin: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summarySubtext: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
  },
  tableContainer: {
    flex: 1,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 4,
  } as TextStyle,
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableRowEven: {
    backgroundColor: Colors.card,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  } as TextStyle,
  checkboxCell: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  exportModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportModalContent: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  exportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  exportOption: {
    alignItems: 'center',
  },
  exportOptionText: {
    marginTop: 8,
    color: Colors.text,
  },
  exportProgress: {
    marginBottom: 24,
  },
  exportProgressText: {
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  exportModalClose: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  exportModalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});