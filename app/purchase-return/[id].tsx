import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Edit, Trash2, FileText, Calendar, Hash, Package, DollarSign } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { getPurchaseReturnById, deletePurchaseReturn } from '@/db/purchase-return';
import * as dbInvoice from '@/db/purchase-invoice';

export default function PurchaseReturnDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [returnData, setReturnData] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReturn = async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const ret = await getPurchaseReturnById(Number(id), user.id);
      if (!ret) throw new Error('Return not found');
      setReturnData(ret);
      if (ret?.invoiceId) {
        const inv = await dbInvoice.getPurchaseInvoiceById(ret.invoiceId, user.id);
        setInvoice(inv);
      }
    } catch (error) {
      console.error('Error fetching return:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchReturn();
    }, [id, user])
  );

  const handleDelete = async () => {
    if (!user || !id) return;
    Alert.alert('Delete Return', 'Are you sure you want to delete this return?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deletePurchaseReturn(Number(id), user.id);
          Alert.alert('Deleted', 'Return deleted successfully');
          router.replace('/purchase-return/purchase-return');
        } catch (e) {
          Alert.alert('Error', 'Failed to delete return');
        }
      }}
    ]);
  };

  if (loading || !returnData) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Return #{returnData.returnNumber}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push(`/purchase-return/edit/${id}`)}
          >
            <Edit size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={Colors.negative} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Invoice</Text>
          <View style={styles.row}>
            <FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.value}>#{invoice?.invoiceNumber || 'N/A'}</Text>
          </View>
          <Text style={styles.label}>Return Number</Text>
          <View style={styles.row}>
            <Hash size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.value}>{returnData.returnNumber}</Text>
          </View>
          <Text style={styles.label}>Status</Text>
          <View style={styles.row}>
            <FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={[styles.value, { textTransform: 'capitalize' }]}>{returnData.status}</Text>
          </View>
          <Text style={styles.label}>Return Date</Text>
          <View style={styles.row}>
            <Calendar size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.value}>{returnData.returnDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {returnData.items && returnData.items.length > 0 ? returnData.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.itemName}>{item.productName || `Product #${item.productId}`}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemPrice}>${(item.unitPrice / 100).toFixed(2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTotal}>${(item.total / 100).toFixed(2)}</Text>
              </View>
            </View>
          )) : <Text style={styles.value}>No items</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{returnData.notes || '-'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${(returnData.subtotal / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${(returnData.tax / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Total</Text>
            <Text style={styles.totalRowValue}>${(returnData.total / 100).toFixed(2)}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemName: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  itemQty: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: 8,
    paddingTop: 16,
  },
  totalRowLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalRowValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
}); 