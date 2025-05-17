import React, { useCallback, useState, useRef, useEffect } from "react";
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
  DollarSign,
  LucideIcon
} from "lucide-react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../db';
import { transactions, ledger } from '../../db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { useAuthStore } from '@/store/auth';

import Colors from "@/constants/colors";
import { formatCurrency } from "@/utils/currency";
import { getMetricsData, getRecentTransactions } from "@/mocks/dashboardData";

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 48 = padding (16) * 2 + gap between cards (16)

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

// Standard Metric Card component with thin border
const StandardMetricCard = ({ title, value, icon }: MetricCardProps) => {
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

interface TransactionItemProps {
  transaction: {
    id: number;
    type: 'income' | 'expense';
    title: string;
    amount: number;
    date: string;
  };
  onPress: () => void;
}

// Transaction Item with clean design
const TransactionItem = ({ transaction, onPress }: TransactionItemProps) => {
  const isIncome = transaction.type === 'income';
  
  // Format the date string
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
    
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

interface TimeTabProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

// Time period tabs for metrics
const TimeTab = ({ title, active, onPress }: TimeTabProps) => (
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

interface FabMenuItemProps {
  icon: LucideIcon;
  label: string;
  backgroundColor: string;
  onPress: () => void;
}

// FAB Menu Item
const FabMenuItem = ({ icon, label, backgroundColor, onPress }: FabMenuItemProps) => {
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

interface Transaction {
  id: number;
  transactionType: string;
  amount: number;
  date: string;
  description: string | null;
  status: string | null;
  paymentMethod: string | null;
}

// Helper function to get transaction type label
const getTransactionTypeLabel = (type: string): string => {
  switch (type) {
    case 'payment_in':
      return 'Payment In';
    case 'payment_out':
      return 'Payment Out';
    case 'sales_invoice':
      return 'Sales Invoice';
    case 'sales_order':
      return 'Sales Order';
    case 'sales_return':
      return 'Sales Return';
    case 'purchase_invoice':
      return 'Purchase Invoice';
    case 'purchase_order':
      return 'Purchase Order';
    case 'purchase_return':
      return 'Purchase Return';
    case 'income':
      return 'Income';
    case 'expense':
      return 'Expense';
    default:
      return type;
  }
};

interface Metrics {
  sales: number;
  purchase: number;
  income: number;
  expense: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    sales: 0,
    purchase: 0,
    income: 0,
    expense: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('today');
  const [fabOpen, setFabOpen] = useState(false);
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      if (!user) return;

      const result = await db
        .select({
          id: transactions.id,
          transactionType: transactions.transactionType,
          amount: transactions.amount,
          date: transactions.date,
          description: transactions.description,
          status: transactions.status,
          paymentMethod: transactions.paymentMethod,
        })
        .from(transactions)
        .where(eq(transactions.userId, user.id))
        .orderBy(desc(transactions.date))
        .limit(5);

      setRecentTransactions(result);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
    }
  };

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

  const getDateRange = (period: 'today' | 'weekly' | 'monthly') => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  const calculateMetrics = async (period: 'today' | 'weekly' | 'monthly'): Promise<Metrics> => {
    try {
      if (!user) {
        return {
          sales: 0,
          purchase: 0,
          income: 0,
          expense: 0
        };
      }

      const { start, end } = getDateRange(period);

      // Get all ledger entries for the period
      const entries = await db
        .select()
        .from(ledger)
        .where(
          and(
            eq(ledger.userId, user.id),
            gte(ledger.date, start),
            lte(ledger.date, end)
          )
        );

      // Calculate metrics
      const metrics: Metrics = {
        sales: 0,
        purchase: 0,
        income: 0,
        expense: 0
      };

      entries.forEach(entry => {
        const amount = entry.amount;
        switch (entry.referenceType) {
          case 'sales_invoice':
            metrics.sales += amount;
            break;
          case 'purchase_invoice':
            metrics.purchase += amount;
            break;
          case 'income':
            metrics.income += amount;
            break;
          case 'expense':
            metrics.expense += amount;
            break;
        }
      });

      return metrics;
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        sales: 0,
        purchase: 0,
        income: 0,
        expense: 0
      };
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [activeTab]);

  const loadMetrics = async () => {
    try {
      const metrics = await calculateMetrics(activeTab as 'today' | 'weekly' | 'monthly');
      setMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Refresh both metrics and transactions
    Promise.all([
      loadMetrics(),
      loadRecentTransactions()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [activeTab]);

  const handleViewAllTransactions = () => {
    router.push("/reports/transaction-report");
  };

  const handleTransactionPress = (id: number) => {
    router.push(`/transaction/${id}`);
  };
  
  const navigateToSettings = () => {
    router.push("/settings");
  };
  
  const handleActionPress = (action: 'add-sales' | 'add-purchase' | 'add-income' | 'add-expense') => {
    toggleFab();
    // Navigate to appropriate screen based on action
    switch(action) {
      case 'add-sales':
        router.push("/sales-invoice/new" as any);
        break;
      case 'add-purchase':
        router.push("/purchase-invoice/new" as any);
        break;
      case 'add-income':
        router.push("/income/new" as any);
        break;
      case 'add-expense':
        router.push("/expense/new" as any);
        break;
    }
  };
  
  const currentMetrics = metrics;

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
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user?.name || 'User'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={navigateToSettings}
          activeOpacity={0.7}
        >
          <Settings size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
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

        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity 
              onPress={handleViewAllTransactions}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>No recent transactions</Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={{
                  id: transaction.id,
                  type: transaction.amount >= 0 ? 'income' : 'expense',
                  title: transaction.description || getTransactionTypeLabel(transaction.transactionType),
                  amount: Math.abs(transaction.amount),
                  date: transaction.date,
                }}
                onPress={() => handleTransactionPress(transaction.id)}
              />
            ))
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.default,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
    lineHeight: 18,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#1A1A1A',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 4,
  },
  emptyTransactions: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
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