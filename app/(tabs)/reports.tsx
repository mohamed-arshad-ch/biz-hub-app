import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  ShoppingBag, 
  BarChart2,
  ChevronRight
} from 'lucide-react-native';

import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 48 = padding (16) * 2 + gap between cards (16)

type ReportCardProps = {
  title: string;
  icon: React.ReactNode;
  description: string;
  onPress: () => void;
};

const ReportCard = ({ title, icon, description, onPress }: ReportCardProps) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.cardContent}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  </TouchableOpacity>
);

export default function ReportsScreen() {
  const router = useRouter();

  const navigateToReport = (reportType: string) => {
    switch(reportType.toLowerCase()) {
      case 'ledger':
        router.push("/reports/ledger-report");
        break;
      case 'income':
        router.push("/reports/income-report");
        break;
      case 'expense':
        router.push("/reports/expense-report");
        break;
      case 'sales':
        router.push("/reports/sales-report");
        break;
      case 'purchase':
        router.push("/reports/purchase-report");
        break;
      case 'balance':
        router.push("/reports/balance-report");
        break;
      default:
        router.push("/reports");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>
            Generate and view detailed business reports
          </Text>
        </View>
        
        <View style={styles.grid}>
          <ReportCard 
            title="Ledger Report" 
            icon={<BookOpen size={22} color={Colors.primary} />} 
            description="View combined transactions ledger" 
            onPress={() => navigateToReport('Ledger')}
          />
          
          <ReportCard 
            title="Income Report" 
            icon={<TrendingUp size={22} color={Colors.primary} />} 
            description="Analyze income sources and trends"
            onPress={() => navigateToReport('Income')}
          />
          
          <ReportCard 
            title="Expense Report" 
            icon={<TrendingDown size={22} color={Colors.primary} />} 
            description="Track and categorize expenses"
            onPress={() => navigateToReport('Expense')}
          />
          
          <ReportCard 
            title="Sales Report" 
            icon={<ShoppingCart size={22} color={Colors.primary} />} 
            description="Monitor sales performance metrics"
            onPress={() => navigateToReport('Sales')}
          />
          
          <ReportCard 
            title="Purchase Report" 
            icon={<ShoppingBag size={22} color={Colors.primary} />} 
            description="Analyze vendor purchases"
            onPress={() => navigateToReport('Purchase')}
          />
          
          <ReportCard 
            title="Balance Sheet" 
            icon={<BarChart2 size={22} color={Colors.primary} />} 
            description="Financial position overview"
            onPress={() => navigateToReport('Balance')}
          />
        </View>

        <TouchableOpacity style={styles.customReportButton} activeOpacity={0.8}>
          <Text style={styles.customReportText}>Create Custom Report</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#777',
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    height: 150,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`, // Light green border
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}10`, // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: '#777',
    lineHeight: 16,
  },
  customReportButton: {
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
  customReportText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
});