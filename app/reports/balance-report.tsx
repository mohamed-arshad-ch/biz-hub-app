import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Download, Printer, Share2, Filter, ChevronLeft, DollarSign } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export default function BalanceSheetScreen() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');
  
  // Mock data for balance sheet
  const assets = [
    { category: 'Current Assets', items: [
      { name: 'Cash and Cash Equivalents', amount: 25000 },
      { name: 'Accounts Receivable', amount: 18500 },
      { name: 'Inventory', amount: 32000 },
      { name: 'Prepaid Expenses', amount: 3500 },
    ]},
    { category: 'Fixed Assets', items: [
      { name: 'Property and Equipment', amount: 85000 },
      { name: 'Less: Accumulated Depreciation', amount: -15000 },
      { name: 'Intangible Assets', amount: 12000 },
    ]},
    { category: 'Other Assets', items: [
      { name: 'Long-term Investments', amount: 20000 },
      { name: 'Deposits', amount: 5000 },
    ]},
  ];

  const liabilities = [
    { category: 'Current Liabilities', items: [
      { name: 'Accounts Payable', amount: 12500 },
      { name: 'Short-term Loans', amount: 15000 },
      { name: 'Accrued Expenses', amount: 4500 },
      { name: 'Taxes Payable', amount: 7500 },
    ]},
    { category: 'Long-term Liabilities', items: [
      { name: 'Long-term Loans', amount: 45000 },
      { name: 'Deferred Tax Liabilities', amount: 3000 },
    ]},
  ];

  const equity = [
    { name: 'Owner\'s Capital', amount: 50000 },
    { name: 'Retained Earnings', amount: 48500 },
  ];

  // Calculate totals
  const totalAssets = assets.reduce((sum, category) => 
    sum + category.items.reduce((catSum, item) => catSum + item.amount, 0), 0);
  
  const totalLiabilities = liabilities.reduce((sum, category) => 
    sum + category.items.reduce((catSum, item) => catSum + item.amount, 0), 0);
  
  const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

  const dateRangeOptions = ['This Month', 'This Quarter', 'This Year', 'Custom'];

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
          <Text style={styles.summaryPeriod}>As of June 30, 2023</Text>
          
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
          
          {assets.map((category, index) => (
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
          
          {liabilities.map((category, index) => (
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
            
            {equity.map((item, itemIndex) => (
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
    color: Colors.primary,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
});