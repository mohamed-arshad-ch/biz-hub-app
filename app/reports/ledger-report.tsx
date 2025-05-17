import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Calendar, 
  Download, 
  Printer, 
  Share2, 
  Filter, 
  ChevronLeft,
  Mail,
  ChevronDown,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Save,
  FileText,
  Info
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { formatCurrency, formatDate, formatDateShort } from '@/utils/formatters';
import { useAuthStore } from '@/store/auth';
import { getLedgerEntriesByAccount } from '@/db/ledger';
import type { Ledger } from '@/db/schema';
import EmptyState from '@/components/EmptyState';

const windowWidth = Dimensions.get('window').width;
const isMobile = windowWidth < 768;

interface LedgerEntry extends Ledger {
  balance: number;
  type: string;
  account: string;
  reference: string;
  description: string;
  reconciled: boolean;
  createdBy: string;
  createdAt: string;
  modifiedBy?: string;
  modifiedDate?: string;
  accountName?: string;
  accountType?: string;
}

export default function LedgerReportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const scrollViewRef = useRef(null);
  
  // State variables
  const [dateRange, setDateRange] = useState('This Month');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    transactionType: 'All',
    account: 'All',
    minAmount: '',
    maxAmount: '',
    onlyReconciled: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntry | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Summary calculations
  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalDebits: 0,
    totalCredits: 0,
    closingBalance: 0,
    netChange: 0
  });

  // Load data
  useEffect(() => {
    loadLedgerEntries();
  }, [dateRange]);

  const loadLedgerEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get all ledger entries for the user
      const entries = await getLedgerEntriesByAccount(user.id, 0); // 0 means all accounts
      
      // Sort entries by date first to ensure correct balance calculation
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Transform entries to include balance and additional fields
      const transformedEntries = sortedEntries.map((entry, index) => {
        const balance = sortedEntries
          .slice(0, index + 1)
          .reduce((acc, curr) => {
            if (curr.entryType === 'debit') {
              return acc + curr.amount;
            } else {
              return acc - curr.amount;
            }
          }, 0);

        return {
          ...entry,
          balance,
          type: entry.referenceType,
          account: entry.accountName || `Account #${entry.accountId}`,
          reference: `${entry.referenceType} #${entry.referenceId}`,
          description: entry.description || '',
          reconciled: false,
          createdBy: 'System',
          createdAt: entry.createdAt || new Date().toISOString(),
          modifiedBy: undefined,
          modifiedDate: undefined,
          accountName: entry.accountName || undefined,
          accountType: entry.accountType || undefined
        };
      });

      setLedgerEntries(transformedEntries);
      setFilteredEntries(transformedEntries);
      
      // Calculate summary
      const totalDebits = transformedEntries.reduce((sum, entry) => 
        entry.entryType === 'debit' ? sum + entry.amount : sum, 0);
      const totalCredits = transformedEntries.reduce((sum, entry) => 
        entry.entryType === 'credit' ? sum + entry.amount : sum, 0);
      const openingBalance = transformedEntries.length > 0 ? 
        transformedEntries[0].balance - (transformedEntries[0].entryType === 'debit' ? 
          transformedEntries[0].amount : -transformedEntries[0].amount) : 0;
      const closingBalance = transformedEntries.length > 0 ? 
        transformedEntries[transformedEntries.length - 1].balance : 0;
      
      setSummary({
        openingBalance,
        totalDebits,
        totalCredits,
        closingBalance,
        netChange: closingBalance - openingBalance
      });
    } catch (error) {
      console.error('Error loading ledger entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    if (ledgerEntries.length === 0) return;
    
    let filtered = [...ledgerEntries];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.description.toLowerCase().includes(query) || 
        entry.reference.toLowerCase().includes(query) ||
        entry.account.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    if (filters.transactionType !== 'All') {
      filtered = filtered.filter(entry => entry.type === filters.transactionType);
    }
    
    if (filters.account !== 'All') {
      filtered = filtered.filter(entry => entry.account === filters.account);
    }
    
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      filtered = filtered.filter(entry => entry.amount >= min);
    }
    
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      filtered = filtered.filter(entry => entry.amount <= max);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof LedgerEntry];
      const bValue = b[sortConfig.key as keyof LedgerEntry];
      
      if (typeof aValue === 'string') {
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue as string);
        } else {
          return (bValue as string).localeCompare(aValue);
        }
      } else {
        if (sortConfig.direction === 'asc') {
          return (aValue as number) - (bValue as number);
        } else {
          return (bValue as number) - (aValue as number);
        }
      }
    });
    
    setFilteredEntries(filtered);
    setCurrentPage(1);
  }, [searchQuery, filters, sortConfig, ledgerEntries]);

  // Handle sort
  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} color="#555" /> 
      : <ArrowDown size={14} color="#555" />;
  };

  // Handle export
  const handleExport = (format: string) => {
    setExportLoading(true);
    setShowExportOptions(false);
    
    // Simulate export process
    setTimeout(() => {
      setExportLoading(false);
      alert(`Report exported as ${format.toUpperCase()} successfully!`);
    }, 2000);
  };

  // Handle print
  const handlePrint = () => {
    alert("Print functionality would be implemented here");
  };

  // Handle email
  const handleEmail = () => {
    alert("Email functionality would be implemented here");
  };

  // Apply date range
  const applyDateRange = () => {
    if (dateRange === 'Custom') {
      // Validate custom date range
      if (!customDateRange.from || !customDateRange.to) {
        alert("Please select both start and end dates");
        return;
      }
    }
    
    setShowDatePicker(false);
    loadLedgerEntries();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      transactionType: 'All',
      account: 'All',
      minAmount: '',
      maxAmount: '',
      onlyReconciled: false
    });
    setSearchQuery('');
    setShowFilters(false);
  };

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Transaction types for filter
  const transactionTypes = ['All', 'payment_in', 'sales_invoice', 'sales_return', 'payment_out', 'purchase_invoice', 'purchase_return', 'income', 'expense'];
  
  // Accounts for filter (mock data for now)
  const accounts = ['All', 'Bank/Cash', 'Accounts Receivable', 'Sales Revenue', 'Sales Returns', 'Accounts Payable', 'Purchases', 'Purchase Returns'];

  // Date range options
  const dateRangeOptions = ['Today', 'Yesterday', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom'];

  // Render transaction detail modal
  const renderTransactionDetail = () => {
    if (!selectedTransaction) return null;
    
    return (
      <Modal
        visible={showTransactionDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransactionDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setShowTransactionDetail(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedTransaction.date)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.reference}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.type}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.account}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Debit:</Text>
                <Text style={[styles.detailValue, selectedTransaction.entryType === 'debit' && styles.debitText]}>
                  {formatCurrency(selectedTransaction.amount)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Credit:</Text>
                <Text style={[styles.detailValue, selectedTransaction.entryType === 'credit' && styles.creditText]}>
                  {formatCurrency(selectedTransaction.amount)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Balance:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedTransaction.balance)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reconciled:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.reconciled ? 'Yes' : 'No'}</Text>
              </View>
              
              <View style={styles.detailDivider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created By:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.createdBy}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created Date:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedTransaction.createdAt)}</Text>
              </View>
              
              {selectedTransaction.modifiedBy && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Modified By:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.modifiedBy}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Modified Date:</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransaction.modifiedDate ? formatDate(selectedTransaction.modifiedDate) : 'N/A'}
                    </Text>
                  </View>
                </>
              )}
              
              <View style={styles.detailDivider} />
              
              <View style={styles.detailActions}>
                <TouchableOpacity 
                  style={styles.detailActionButton}
                  onPress={() => {
                    setShowTransactionDetail(false);
                    // Navigate to original transaction
                    router.push(`/transaction/${selectedTransaction.id}`);
                  }}
                >
                  <Info size={18} color={Colors.primary} />
                  <Text style={styles.detailActionText}>View Original Transaction</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.detailActionButton}
                  onPress={() => {
                    setShowTransactionDetail(false);
                    // Navigate to edit transaction
                    router.push(`/transaction/edit/${selectedTransaction.id}`);
                  }}
                >
                  <FileText size={18} color={Colors.primary} />
                  <Text style={styles.detailActionText}>Edit Transaction</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render date picker modal
  const renderDatePicker = () => {
    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.datePickerModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateRangeOptions}>
              {dateRangeOptions.map((option) => (
                <TouchableOpacity 
                  key={option}
                  style={[
                    styles.dateRangeOption,
                    dateRange === option && styles.dateRangeOptionActive
                  ]}
                  onPress={() => setDateRange(option)}
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
            
            {dateRange === 'Custom' && (
              <View style={styles.customDateContainer}>
                <View style={styles.customDateField}>
                  <Text style={styles.customDateLabel}>From:</Text>
                  <TextInput
                    style={styles.customDateInput}
                    placeholder="YYYY-MM-DD"
                    value={customDateRange.from}
                    onChangeText={(text) => setCustomDateRange({...customDateRange, from: text})}
                  />
                </View>
                
                <View style={styles.customDateField}>
                  <Text style={styles.customDateLabel}>To:</Text>
                  <TextInput
                    style={styles.customDateInput}
                    placeholder="YYYY-MM-DD"
                    value={customDateRange.to}
                    onChangeText={(text) => setCustomDateRange({...customDateRange, to: text})}
                  />
                </View>
              </View>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={applyDateRange}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.filterModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Transaction Type:</Text>
                <View style={styles.filterOptions}>
                  {transactionTypes.map((type) => (
                    <TouchableOpacity 
                      key={type}
                      style={[
                        styles.filterOption,
                        filters.transactionType === type && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters({...filters, transactionType: type})}
                    >
                      <Text 
                        style={[
                          styles.filterOptionText,
                          filters.transactionType === type && styles.filterOptionTextActive
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Account:</Text>
                <View style={styles.filterOptions}>
                  {accounts.map((account) => (
                    <TouchableOpacity 
                      key={account}
                      style={[
                        styles.filterOption,
                        filters.account === account && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters({...filters, account: account})}
                    >
                      <Text 
                        style={[
                          styles.filterOptionText,
                          filters.account === account && styles.filterOptionTextActive
                        ]}
                      >
                        {account}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Amount Range:</Text>
                <View style={styles.amountRangeContainer}>
                  <View style={styles.amountField}>
                    <Text style={styles.amountLabel}>Min:</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={filters.minAmount}
                      onChangeText={(text) => setFilters({...filters, minAmount: text})}
                    />
                  </View>
                  
                  <View style={styles.amountField}>
                    <Text style={styles.amountLabel}>Max:</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={filters.maxAmount}
                      onChangeText={(text) => setFilters({...filters, maxAmount: text})}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  style={styles.reconciledToggle}
                  onPress={() => setFilters({...filters, onlyReconciled: !filters.onlyReconciled})}
                >
                  <View style={[
                    styles.checkbox,
                    filters.onlyReconciled && styles.checkboxChecked
                  ]}>
                    {filters.onlyReconciled && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.reconciledText}>Show only reconciled transactions</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render export options modal
  const renderExportOptions = () => {
    return (
      <Modal
        visible={showExportOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExportOptions(false)}
      >
        <TouchableOpacity 
          style={styles.exportOverlay}
          activeOpacity={1}
          onPress={() => setShowExportOptions(false)}
        >
          <View style={styles.exportOptionsContainer}>
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={() => handleExport('pdf')}
            >
              <FileText size={20} color="#E44D26" />
              <Text style={styles.exportOptionText}>Export as PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={() => handleExport('excel')}
            >
              <FileText size={20} color="#1D6F42" />
              <Text style={styles.exportOptionText}>Export as Excel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={() => handleExport('csv')}
            >
              <FileText size={20} color="#333333" />
              <Text style={styles.exportOptionText}>Export as CSV</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ledger Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={18} color="#555" />
          <Text style={styles.dateRangeText}>{dateRange}</Text>
          <ChevronDown size={16} color="#555" />
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowExportOptions(true)}
          >
            <Download size={18} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePrint}
          >
            <Printer size={18} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEmail}
          >
            <Mail size={18} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={18} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Opening Balance</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.openingBalance)}</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Debits</Text>
          <Text style={[styles.summaryValue, styles.debitText]}>{formatCurrency(summary.totalDebits)}</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Credits</Text>
          <Text style={[styles.summaryValue, styles.creditText]}>{formatCurrency(summary.totalCredits)}</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Closing Balance</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.closingBalance)}</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net Change</Text>
          <Text style={[
            styles.summaryValue, 
            summary.netChange > 0 ? styles.creditText : styles.debitText
          ]}>
            {formatCurrency(Math.abs(summary.netChange))}
            {summary.netChange > 0 ? ' ↑' : ' ↓'}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {(filters.transactionType !== 'All' || 
          filters.account !== 'All' || 
          filters.minAmount || 
          filters.maxAmount || 
          filters.onlyReconciled) && (
          <TouchableOpacity 
            style={styles.activeFiltersButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.activeFiltersText}>Filters Active</Text>
            <X size={14} color={Colors.primary} onPress={resetFilters} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading ledger data...</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title="No Transactions Found"
          description="There are no transactions matching your search criteria. Try adjusting your filters or date range."
          icon="bar-chart"
        />
      ) : (
        <>
          <View style={styles.tableHeader}>
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: 0.8 }]}
              onPress={() => handleSort('date')}
            >
              <Text style={styles.tableHeaderText}>Date</Text>
              {getSortIcon('date')}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: 1 }]}
              onPress={() => handleSort('reference')}
            >
              <Text style={styles.tableHeaderText}>Reference</Text>
              {getSortIcon('reference')}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: 0.8 }]}
              onPress={() => handleSort('type')}
            >
              <Text style={styles.tableHeaderText}>Type</Text>
              {getSortIcon('type')}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: isMobile ? 0 : 1 }]}
              onPress={() => handleSort('account')}
            >
              <Text style={styles.tableHeaderText}>Account</Text>
              {getSortIcon('account')}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: isMobile ? 0 : 1.5 }]}
              onPress={() => handleSort('description')}
            >
              <Text style={styles.tableHeaderText}>Description</Text>
              {getSortIcon('description')}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: 0.8, alignItems: 'flex-end' }]}
              onPress={() => handleSort('amount')}
            >
              <Text style={styles.tableHeaderText}>Amount</Text>
              {getSortIcon('amount')}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tableHeaderCell, { flex: 0.8, alignItems: 'flex-end' }]}
              onPress={() => handleSort('balance')}
            >
              <Text style={styles.tableHeaderText}>Balance</Text>
              {getSortIcon('balance')}
            </TouchableOpacity>
          </View>

          {isMobile ? (
            <FlatList
              data={paginatedEntries}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.mobileTableRow}
                  onPress={() => {
                    setSelectedTransaction(item);
                    setShowTransactionDetail(true);
                  }}
                >
                  <View style={styles.mobileRowHeader}>
                    <Text style={styles.mobileRowDate}>{formatDateShort(item.date)}</Text>
                    <Text style={styles.mobileRowReference}>{item.reference}</Text>
                    <Text style={[
                      styles.mobileRowType,
                      { color: getTypeColor(item.type) }
                    ]}>
                      {item.type}
                    </Text>
                  </View>
                  
                  <Text style={styles.mobileRowDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                  
                  <View style={styles.mobileRowFooter}>
                    {item.entryType === 'debit' && (
                      <Text style={styles.mobileRowDebit}>
                        Dr: {formatCurrency(item.amount)}
                      </Text>
                    )}
                    
                    {item.entryType === 'credit' && (
                      <Text style={styles.mobileRowCredit}>
                        Cr: {formatCurrency(item.amount)}
                      </Text>
                    )}
                    
                    <Text style={styles.mobileRowBalance}>
                      Bal: {formatCurrency(item.balance)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.mobileTableContainer}
            />
          ) : (
            <ScrollView 
              style={styles.tableContainer}
              horizontal={isMobile}
              ref={scrollViewRef}
            >
              <FlatList
                data={paginatedEntries}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                      item.reconciled && styles.tableRowReconciled
                    ]}
                    onPress={() => {
                      setSelectedTransaction(item);
                      setShowTransactionDetail(true);
                    }}
                  >
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>
                      {formatDateShort(item.date)}
                    </Text>
                    
                    <Text style={[styles.tableCell, { flex: 1 }]}>
                      {item.reference}
                    </Text>
                    
                    <Text style={[
                      styles.tableCell, 
                      { flex: 0.8, color: getTypeColor(item.type) }
                    ]}>
                      {item.type}
                    </Text>
                    
                    <Text style={[styles.tableCell, { flex: 1 }]}>
                      {item.account}
                    </Text>
                    
                    <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                    
                    <Text style={[
                      styles.tableCell, 
                      { flex: 0.8, textAlign: 'right', color: item.entryType === 'debit' ? '#F44336' : '#999' }
                    ]}>
                      {item.entryType === 'debit' ? formatCurrency(item.amount) : '-'}
                    </Text>
                    
                    <Text style={[
                      styles.tableCell, 
                      { flex: 0.8, textAlign: 'right', color: item.entryType === 'credit' ? '#4CAF50' : '#999' }
                    ]}>
                      {item.entryType === 'credit' ? formatCurrency(item.amount) : '-'}
                    </Text>
                    
                    <Text style={[
                      styles.tableCell, 
                      { flex: 0.8, textAlign: 'right', fontWeight: '500' }
                    ]}>
                      {formatCurrency(item.balance)}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ width: '100%' }}
              />
            </ScrollView>
          )}

          <View style={styles.paginationContainer}>
            <View style={styles.paginationControls}>
              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <Text style={[
                  styles.paginationButtonText,
                  currentPage === 1 && styles.paginationButtonTextDisabled
                ]}>
                  First
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} color={currentPage === 1 ? "#ccc" : "#555"} />
              </TouchableOpacity>
              
              <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>
                  Page {currentPage} of {totalPages}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} color={currentPage === totalPages ? "#ccc" : "#555"} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <Text style={[
                  styles.paginationButtonText,
                  currentPage === totalPages && styles.paginationButtonTextDisabled
                ]}>
                  Last
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pageSizeSelector}>
              <Text style={styles.pageSizeLabel}>Rows per page:</Text>
              {[10, 25, 50, 100].map((size) => (
                <TouchableOpacity 
                  key={size}
                  style={[
                    styles.pageSizeOption,
                    pageSize === size && styles.pageSizeOptionActive
                  ]}
                  onPress={() => setPageSize(size)}
                >
                  <Text style={[
                    styles.pageSizeOptionText,
                    pageSize === size && styles.pageSizeOptionTextActive
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Modals */}
      {renderDatePicker()}
      {renderFilterModal()}
      {renderTransactionDetail()}
      {renderExportOptions()}
      
      {/* Export loading indicator */}
      {exportLoading && (
        <View style={styles.exportLoadingOverlay}>
          <View style={styles.exportLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.exportLoadingText}>Exporting report...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper function to get color based on transaction type
const getTypeColor = (type: string) => {
  switch (type) {
    case 'sales_invoice':
      return '#4CAF50';
    case 'purchase_invoice':
      return '#F44336';
    case 'income':
      return '#2196F3';
    case 'expense':
      return '#FF9800';
    case 'payment_in':
      return '#9C27B0';
    case 'payment_out':
      return '#607D8B';
    default:
      return '#333';
  }
};

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
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dateRangeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginHorizontal: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  summaryContainer: {
    flexDirection: 'row',
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
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  debitText: {
    color: '#F44336',
  },
  creditText: {
    color: '#4CAF50',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  activeFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f3f5',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowEven: {
    backgroundColor: 'white',
  },
  tableRowOdd: {
    backgroundColor: '#f9f9f9',
  },
  tableRowReconciled: {
    backgroundColor: '#f0f7ff',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  mobileTableContainer: {
    backgroundColor: 'white',
  },
  mobileTableRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mobileRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mobileRowDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  mobileRowReference: {
    fontSize: 14,
    color: '#555',
  },
  mobileRowType: {
    fontSize: 14,
    fontWeight: '500',
  },
  mobileRowDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  mobileRowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mobileRowDebit: {
    fontSize: 14,
    color: '#F44336',
  },
  mobileRowCredit: {
    fontSize: 14,
    color: '#4CAF50',
  },
  mobileRowBalance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    padding: 8,
    borderRadius: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#555',
  },
  paginationButtonTextDisabled: {
    color: '#ccc',
  },
  paginationInfo: {
    paddingHorizontal: 12,
  },
  paginationText: {
    fontSize: 14,
    color: '#555',
  },
  pageSizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageSizeLabel: {
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
  pageSizeOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  pageSizeOptionActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  pageSizeOptionText: {
    fontSize: 14,
    color: '#555',
  },
  pageSizeOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerModal: {
    maxHeight: 500,
  },
  filterModal: {
    maxHeight: 600,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#555',
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#555',
  },
  dateRangeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
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
    fontSize: 14,
    color: '#555',
  },
  dateRangeOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  customDateContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  customDateField: {
    marginBottom: 12,
  },
  customDateLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  customDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  filterBody: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f1f3f5',
  },
  filterOptionActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#555',
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  amountRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountField: {
    flex: 1,
    marginRight: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  reconciledToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
  },
  reconciledText: {
    fontSize: 14,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  detailActions: {
    marginTop: 16,
  },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailActionText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary,
  },
  exportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportOptionsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '80%',
    maxWidth: 300,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exportOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  exportLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  exportLoadingContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exportLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
});