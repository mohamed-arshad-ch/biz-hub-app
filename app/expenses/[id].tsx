import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Pencil, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getExpenseById } from '@/db/expense';
import { getExpenseCategoryById } from '@/db/expense-category';
import { formatCurrency } from '@/utils/format';

export default function ExpenseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const [expense, setExpense] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      loadExpense();
    }
  }, [user, id]);

  const loadExpense = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const exp = await getExpenseById(Number(id), user.id);
      setExpense(exp);
      if (exp) {
        const cat = await getExpenseCategoryById(exp.categoryId, user.id);
        setCategory(cat);
      }
    } catch (error) {
      console.error('Error loading expense:', error);
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.status_pending;
      case 'paid':
        return styles.status_paid;
      case 'cancelled':
        return styles.status_cancelled;
      default:
        return styles.status_default;
    }
  };

  if (isLoading || !expense) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}> 
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Expense Details</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/expenses/edit/${expense.id}`)}>
          <Pencil size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{expense.description || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date(expense.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: category?.color || Colors.primary }]} />
              <Text style={styles.value}>{category?.name || '-'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{expense.paymentMethod || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference Number</Text>
            <Text style={styles.value}>{expense.referenceNumber || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.status, getStatusStyle(expense.status)]}>{expense.status || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Created At</Text>
            <Text style={styles.value}>{expense.createdAt ? new Date(expense.createdAt).toLocaleString() : '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Updated At</Text>
            <Text style={styles.value}>{expense.updatedAt ? new Date(expense.updatedAt).toLocaleString() : '-'}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.default,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: Colors.text.secondary,
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: Colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    flex: 2,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 2,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'right',
  },
  status_pending: {
    backgroundColor: '#f6c34333',
    color: '#b8860b',
  },
  status_paid: {
    backgroundColor: '#4caf5033',
    color: '#388e3c',
  },
  status_cancelled: {
    backgroundColor: '#e74c3c33',
    color: '#c0392b',
  },
  status_default: {
    backgroundColor: '#e0e0e0',
    color: '#757575',
  },
});