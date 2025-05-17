import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Edit, Trash2, User, Calendar, Hash, FileText, Package, DollarSign } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { getPurchaseInvoiceById, deletePurchaseInvoice } from '@/db/purchase-invoice';
import * as dbVendor from '@/db/vendor';

export default function PurchaseInvoiceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [invoice, setInvoice] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const inv = await getPurchaseInvoiceById(Number(id), user.id);
      if (!inv) throw new Error('Invoice not found');
      setInvoice(inv);
      if (inv?.vendorId) {
        const vend = await dbVendor.getVendorById(inv.vendorId);
        setVendor(vend);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchInvoice();
    }, [id, user])
  );

  const handleDelete = async () => {
    if (!user || !id) return;
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deletePurchaseInvoice(Number(id), user.id);
          Alert.alert('Deleted', 'Invoice deleted successfully');
          router.replace('/purchase-invoice/purchase-invoice');
        } catch (e) {
          Alert.alert('Error', 'Failed to delete invoice');
        }
      }}
    ]);
  };

  if (loading || !invoice) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Invoice #{invoice.invoiceNumber}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push(`/purchase-invoice/edit/${id}`)}
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
          <Text style={styles.label}>Vendor</Text>
          <View style={styles.row}><User size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.value}>{vendor?.name || 'N/A'}</Text>
          </View>
          <Text style={styles.label}>Invoice Number</Text>
          <View style={styles.row}><Hash size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          <Text style={styles.label}>Status</Text>
          <View style={styles.row}><FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={[styles.value, { textTransform: 'capitalize' }]}>{invoice.status}</Text>
          </View>
          <Text style={styles.label}>Invoice Date</Text>
          <View style={styles.row}><Calendar size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.value}>{invoice.invoiceDate}</Text>
          </View>
          <Text style={styles.label}>Due Date</Text>
          <View style={styles.row}><Calendar size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.value}>{invoice.dueDate}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {invoice.items && invoice.items.length > 0 ? invoice.items.map((item: any, idx: number) => (
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
          <Text style={styles.value}>{invoice.notes || '-'}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${(invoice.subtotal / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${(invoice.tax / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Total</Text>
            <Text style={styles.totalRowValue}>${(invoice.total / 100).toFixed(2)}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 16,
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingVertical: 8,
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
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalRowLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  totalRowValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
}); 