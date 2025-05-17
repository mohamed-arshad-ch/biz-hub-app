import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { getAllPurchaseReturns } from '@/db/purchase-return';
import { formatCurrency } from '@/utils/format';

interface PurchaseReturn {
  id: number;
  userId: number;
  returnNumber: string;
  invoiceId: number;
  returnDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | null;
  subtotal: number;
  tax: number | null;
  total: number;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function PurchaseReturnScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReturns = async () => {
    if (!user) return;
    try {
      const data = await getAllPurchaseReturns(user.id);
      setReturns(data);
    } catch (error) {
      console.error('Error fetching purchase returns:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReturns();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'draft':
        return Colors.warning;
      case 'pending':
        return Colors.info;
      case 'approved':
        return Colors.primary;
      case 'rejected':
        return Colors.negative;
      case 'completed':
        return Colors.primary;
      default:
        return Colors.text.secondary;
    }
  };

  const renderItem = ({ item }: { item: PurchaseReturn }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => router.push(`/purchase-return/${item.id}`)}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.returnNumber}>{item.returnNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.date}>{item.returnDate}</Text>
        <Text style={styles.total}>{formatCurrency(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Returns</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {/* TODO: Implement search */}}
          >
            <Search size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/purchase-return/new')}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={returns}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No purchase returns found</Text>
          </View>
        }
      />
    </SafeAreaView>
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
    backgroundColor: Colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  returnNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 