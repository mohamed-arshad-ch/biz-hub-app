import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Download, Printer, Share2, Filter, ChevronLeft, DollarSign } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { getLedgerEntriesByAccount } from '@/db/ledger';
import { getAllAccountGroups } from '@/db/account-group';
import type { AccountGroup } from '@/db/schema';

interface BalanceSheetData {
  assets: {
    category: string;
    items: { name: string; amount: number }[];
  }[];
  liabilities: {
    category: string;
    items: { name: string; amount: number }[];
  }[];
  equity: { name: string; amount: number }[];
}

export default function BalanceSheetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData>({
    assets: [],
    liabilities: [],
    equity: []
  });

  useEffect(() => {
    if (user) {
      loadBalanceSheetData();
    }
  }, [user, dateRange]);

  const loadBalanceSheetData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all ledger entries
      const entries = await getLedgerEntriesByAccount(user.id, 0);
      
      // Get account groups
      const accountGroups = await getAllAccountGroups(user.id);
      
      // Initialize balance sheet data structure
      const data: BalanceSheetData = {
        assets: [],
        liabilities: [],
        equity: []
      };
      
      // Group entries by account type
      const groupedEntries = accountGroups.reduce((acc: BalanceSheetData, group: AccountGroup) => {
        const groupEntries = entries.filter(entry => entry.accountId === group.id);
        const total = groupEntries.reduce((sum, entry) => {
          if (entry.entryType === 'debit') {
            return sum + entry.amount;
          } else {
            return sum - entry.amount;
          }
        }, 0);
        
        const item = {
          name: group.name,
          amount: total
        };
        
        switch (group.type) {
          case 'asset':
            const assetCategory = acc.assets.find((cat: { category: string }) => cat.category === 'Current Assets');
            if (assetCategory) {
              assetCategory.items.push(item);
            } else {
              acc.assets.push({
                category: 'Current Assets',
                items: [item]
              });
            }
            break;
          case 'liability':
            const liabilityCategory = acc.liabilities.find((cat: { category: string }) => cat.category === 'Current Liabilities');
            if (liabilityCategory) {
              liabilityCategory.items.push(item);
            } else {
              acc.liabilities.push({
                category: 'Current Liabilities',
                items: [item]
              });
            }
            break;
          case 'equity':
            acc.equity.push(item);
            break;
        }
        
        return acc;
      }, data);
      
      setBalanceSheetData(groupedEntries);
    } catch (error) {
      console.error('Error loading balance sheet data:', error);
      Alert.alert('Error', 'Failed to load balance sheet data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalAssets = balanceSheetData.assets.reduce((sum, category) => 
    sum + category.items.reduce((catSum, item) => catSum + item.amount, 0), 0);
  
  const totalLiabilities = balanceSheetData.liabilities.reduce((sum, category) => 
    sum + category.items.reduce((catSum, item) => catSum + item.amount, 0), 0);
  
  const totalEquity = balanceSheetData.equity.reduce((sum, item) => sum + item.amount, 0);

  const dateRangeOptions = ['This Month', 'This Quarter', 'This Year', 'Custom'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading balance sheet data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Balance Sheet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.actionBar}>
        <View style={styles.dateSelector}>
          <Calendar size={18} color="#555" />
          <TouchableOpacity style={styles.dateRangeButton}>
            <Text style={styles.dateRangeText}>{dateRange}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Download size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Printer size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Filter size={18} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Balance Sheet Summary</Text>
          </View>
          <Text style={styles.summaryPeriod}>As of {new Date().toLocaleDateString()}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Assets</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              ${totalAssets.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Liabilities</Text>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              ${totalLiabilities.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Equity</Text>
            <Text style={[styles.summaryValue, { color: '#2196F3' }]}>
              ${totalEquity.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Net Worth</Text>
            <Text style={[styles.summaryValueBold, { color: Colors.primary }]}>
              ${(totalAssets - totalLiabilities).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Assets</Text>
          
          {balanceSheetData.assets.map((category, index) => (
            <View key={index} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              
              {category.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={[
                    styles.itemAmount, 
                    item.amount < 0 && styles.negativeAmount
                  ]}>
                    ${Math.abs(item.amount).toLocaleString()}
                    {item.amount < 0 && ' (-)'}
                  </Text>
                </View>
              ))}
              
              <View style={styles.categoryTotal}>
                <Text style={styles.categoryTotalLabel}>Total {category.category}</Text>
                <Text style={styles.categoryTotalValue}>
                  ${category.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
          
          <View style={styles.sectionTotal}>
            <Text style={styles.sectionTotalLabel}>Total Assets</Text>
            <Text style={[styles.sectionTotalValue, { color: '#4CAF50' }]}>
              ${totalAssets.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Liabilities</Text>
          
          {balanceSheetData.liabilities.map((category, index) => (
            <View key={index} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              
              {category.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemAmount}>
                    ${item.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
              
              <View style={styles.categoryTotal}>
                <Text style={styles.categoryTotalLabel}>Total {category.category}</Text>
                <Text style={styles.categoryTotalValue}>
                  ${category.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
          
          <View style={styles.sectionTotal}>
            <Text style={styles.sectionTotalLabel}>Total Liabilities</Text>
            <Text style={[styles.sectionTotalValue, { color: '#F44336' }]}>
              ${totalLiabilities.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Equity</Text>
          
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>Owner's Equity</Text>
            
            {balanceSheetData.equity.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemAmount}>
                  ${item.amount.toLocaleString()}
                </Text>
              </View>
            ))}
            
            <View style={styles.categoryTotal}>
              <Text style={styles.categoryTotalLabel}>Total Equity</Text>
              <Text style={styles.categoryTotalValue}>
                ${totalEquity.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.sectionTotal}>
            <Text style={styles.sectionTotalLabel}>Total Equity</Text>
            <Text style={[styles.sectionTotalValue, { color: '#2196F3' }]}>
              ${totalEquity.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.finalSummary}>
          <Text style={styles.finalSummaryLabel}>
            Total Liabilities and Equity
          </Text>
          <Text style={styles.finalSummaryValue}>
            ${(totalLiabilities + totalEquity).toLocaleString()}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.dateRangeSelector}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
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
  },
  dateRangeText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
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
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  summaryPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#555',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  negativeAmount: {
    color: '#F44336',
  },
  categoryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  categoryTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  categoryTotalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sectionTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  sectionTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f1f3f5',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  finalSummaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  finalSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateRangeSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateRangeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  dateRangeOptionActive: {
    backgroundColor: Colors.primary,
  },
  dateRangeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  dateRangeOptionTextActive: {
    color: 'white',
  },
});