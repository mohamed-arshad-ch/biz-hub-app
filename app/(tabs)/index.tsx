import React, { useCallback, useState, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { 
  ChevronRight, 
  TrendingUp, 
  ShoppingCart, 
  Settings,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from "lucide-react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from "@/constants/colors";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/utils/formatters";
import { getMetricsData, getRecentTransactions } from "@/mocks/dashboardData";

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 48 = padding (16) * 2 + gap between cards (16)

// Standard Metric Card component with thin border
const StandardMetricCard = ({ title, value, icon }) => {
  const IconComponent = icon;
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconContainer}>
        <IconComponent size={22} color={Colors.primary} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
};

// Transaction Item with clean design
const TransactionItem = ({ transaction, onPress }) => {
  const isIncome = transaction.type === 'income';
  
  // Format the date if it's a Date object
  const formattedDate = transaction.date instanceof Date 
    ? transaction.date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }) 
    : transaction.date;
    
  return (
    <TouchableOpacity onPress={onPress} style={styles.transactionItem} activeOpacity={0.8}>
      <View style={[styles.transactionIconContainer, {
        backgroundColor: isIncome ? 'rgba(52, 168, 83, 0.08)' : 'rgba(234, 67, 53, 0.08)'
      }]}>
        {isIncome ? (
          <ArrowUpRight size={18} color="#34a853" />
        ) : (
          <ArrowDownRight size={18} color="#ea4335" />
        )}
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{transaction.title}</Text>
        <Text style={styles.transactionDate}>{formattedDate}</Text>
      </View>
      <Text style={[styles.transactionAmount, {
        color: isIncome ? '#34a853' : '#ea4335'
      }]}>
        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
};

// Time period tabs for metrics
const TimeTab = ({ title, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.timeTab, active && styles.activeTimeTab]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.timeTabText, active && styles.activeTimeTabText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// FAB Menu Item
const FabMenuItem = ({ icon, label, backgroundColor, onPress }) => {
  const IconComponent = icon;
  return (
    <TouchableOpacity 
      style={[styles.fabMenuItem, { backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.fabMenuItemIcon}>
        <IconComponent size={20} color="#fff" />
      </View>
      <Text style={styles.fabMenuItemLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(getMetricsData());
  const [transactions, setTransactions] = useState(getRecentTransactions(5));
  const [activeTab, setActiveTab] = useState('today');
  const [fabOpen, setFabOpen] = useState(false);
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  const toggleFab = () => {
    if (fabOpen) {
      // Close the FAB menu
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setFabOpen(false), 200);
    } else {
      // Open the FAB menu
      setFabOpen(true);
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setMetrics(getMetricsData());
      setTransactions(getRecentTransactions(5));
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleViewAllTransactions = () => {
    router.push("/transaction/transactions");
  };

  const handleTransactionPress = (id: string) => {
    router.push(`/transaction/${id}`);
  };
  
  const navigateToSettings = () => {
    router.push("/settings");
  };
  
  const handleActionPress = (action) => {
    toggleFab();
    // Navigate to appropriate screen based on action
    switch(action) {
      case 'add-sales':
        router.push("/sales/new");
        break;
      case 'add-purchase':
        router.push("/purchases/new");
        break;
      case 'add-income':
        router.push("/income/new");
        break;
      case 'add-expense':
        router.push("/expenses/new");
        break;
    }
  };
  
  // Display metrics based on selected time period
  const getMetricsForActiveTab = () => {
    switch(activeTab) {
      case 'today':
        return {
          sales: metrics.todaySales,
          purchase: metrics.todayPurchase,
          income: metrics.todaySales * 1.1, // Simplified examples
          expense: metrics.todayPurchase * 0.9
        };
      case 'weekly':
        return {
          sales: metrics.monthSales * 0.25,
          purchase: metrics.monthPurchase * 0.25,
          income: metrics.monthSales * 0.27,
          expense: metrics.monthPurchase * 0.22
        };
      case 'monthly':
        return {
          sales: metrics.monthSales,
          purchase: metrics.monthPurchase,
          income: metrics.totalSales * 0.08,
          expense: metrics.totalPurchase * 0.08
        };
      default:
        return {
          sales: metrics.todaySales,
          purchase: metrics.todayPurchase,
          income: metrics.todaySales * 1.1,
          expense: metrics.todayPurchase * 0.9
        };
    }
  };
  
  const currentMetrics = getMetricsForActiveTab();

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom 
      }
    ]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with settings icon */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Hello, <Text style={styles.userName}>{user?.name || "User"}</Text>
          </Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={navigateToSettings}
          activeOpacity={0.8}
        >
          <Settings size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Time Period Tabs */}
        <View style={styles.tabContainer}>
          <TimeTab 
            title="Today" 
            active={activeTab === 'today'} 
            onPress={() => setActiveTab('today')}
          />
          <TimeTab 
            title="Weekly" 
            active={activeTab === 'weekly'} 
            onPress={() => setActiveTab('weekly')}
          />
          <TimeTab 
            title="Monthly" 
            active={activeTab === 'monthly'} 
            onPress={() => setActiveTab('monthly')}
          />
        </View>

        {/* Metrics Section - First Row: Sales & Purchase */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <StandardMetricCard 
              title="Sales"
              value={formatCurrency(currentMetrics.sales)}
              icon={TrendingUp}
            />
            <StandardMetricCard 
              title="Purchase"
              value={formatCurrency(currentMetrics.purchase)}
              icon={ShoppingCart}
            />
          </View>
          
          {/* Second Row: Income & Expense */}
          <View style={styles.metricsRow}>
            <StandardMetricCard 
              title="Total Income"
              value={formatCurrency(currentMetrics.income)}
              icon={ArrowUpRight}
            />
            <StandardMetricCard 
              title="Total Expense"
              value={formatCurrency(currentMetrics.expense)}
              icon={ArrowDownRight}
            />
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={handleViewAllTransactions}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <TransactionItem 
                key={transaction.id}
                transaction={transaction}
                onPress={() => handleTransactionPress(transaction.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent transactions</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.viewAllTransactionsButton} activeOpacity={0.8}>
          <Text style={styles.viewAllTransactionsText}>View Complete Transaction History</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleFab}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>
      
      {/* FAB Menu */}
      {fabOpen && (
        <TouchableWithoutFeedback onPress={toggleFab}>
          <Animated.View 
            style={[
              styles.fabBackdrop,
              {
                opacity: backdropOpacity,
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.fabMenu,
                {
                  transform: [{ scale: scaleAnimation }],
                  bottom: 80 + insets.bottom,
                }
              ]}
            >
              <FabMenuItem 
                icon={ArrowUpRight}
                label="Add Sale"
                backgroundColor={Colors.primary}
                onPress={() => handleActionPress('add-sales')}
              />
              <FabMenuItem 
                icon={ShoppingCart}
                label="Add Purchase"
                backgroundColor={Colors.primary}
                onPress={() => handleActionPress('add-purchase')}
              />
              <FabMenuItem 
                icon={TrendingUp}
                label="Add Income"
                backgroundColor={Colors.primary}
                onPress={() => handleActionPress('add-income')}
              />
              <FabMenuItem 
                icon={ArrowDownRight}
                label="Add Expense"
                backgroundColor={Colors.primary}
                onPress={() => handleActionPress('add-expense')}
              />
            </Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  userName: {
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
    lineHeight: 18,
  },
  settingsButton: {
    height: 40,
    width: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`, // Light green border
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`, // Light green border
    marginBottom: 16,
    overflow: 'hidden',
  },
  timeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimeTab: {
    backgroundColor: Colors.primary,
  },
  timeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTimeTabText: {
    color: '#fff',
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: cardWidth,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: `${Colors.primary}20`, // Light green border
    overflow: 'hidden',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}10`, // Light green background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 4,
    fontWeight: '500',
  },
  transactionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`, // Light green border
    overflow: 'hidden',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#777',
    lineHeight: 16,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#777',
    fontSize: 15,
  },
  viewAllTransactionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`, // Light green border
    marginTop: 8,
  },
  viewAllTransactionsText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  fabBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  fabMenu: {
    position: 'absolute',
    right: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  fabMenuItemIcon: {
    marginRight: 12,
  },
  fabMenuItemLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});