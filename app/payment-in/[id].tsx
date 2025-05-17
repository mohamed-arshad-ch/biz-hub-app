import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Share as RNShare } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit, Trash2, Calendar, CreditCard, User, Hash, Tag, Clock, Printer, FileText, DollarSign, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentIn } from '@/types/payment-in';
import { paymentInData } from '@/mocks/paymentInData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getPaymentInById, deletePaymentIn } from '@/db/payment-in';
import * as dbCustomer from '@/db/customer';
import * as dbInvoice from '@/db/sales-invoice';

export default function PaymentInDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const paymentData = await getPaymentInById(parseInt(id as string), user.id);
        if (!paymentData) {
          Alert.alert('Error', 'Payment not found');
          router.back();
          return;
        }
        setPayment(paymentData);

        // Fetch customer data
        const customerData = await dbCustomer.getCustomerById(paymentData.customerId);
        setCustomer(customerData);

        // Fetch invoice data for each item
        const invoicePromises = paymentData.items.map((item: any) => 
          dbInvoice.getSalesInvoiceById(item.invoiceId, user.id)
        );
        const invoiceData = await Promise.all(invoicePromises);
        setInvoices(invoiceData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, id]);

  const handleDelete = async () => {
    if (!user || !payment) return;
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaymentIn(payment.id, user.id);
              Alert.alert('Success', 'Payment deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting payment:', error);
              Alert.alert('Error', 'Failed to delete payment');
            }
          },
        },
      ]
    );
  };
  
  const handlePrint = () => {
    Alert.alert('Print', 'Printing payment receipt...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(76, 175, 80, 0.1)', text: Colors.status.completed };
      case 'pending':
        return { bg: 'rgba(251, 188, 4, 0.1)', text: Colors.status.pending };
      case 'cancelled':
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.status.cancelled };
      default:
        return { bg: 'rgba(209, 209, 214, 0.1)', text: Colors.text.secondary };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment #{payment.paymentNumber}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push(`/payment-in/edit/${payment.id}`)}
          >
            <Edit size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={Colors.negative} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <FileText size={16} color={Colors.text.secondary} />
              <Text style={styles.infoLabelText}>Customer</Text>
            </View>
            <Text style={styles.infoValue}>{customer?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Calendar size={16} color={Colors.text.secondary} />
              <Text style={styles.infoLabelText}>Payment Date</Text>
            </View>
            <Text style={styles.infoValue}>{payment.paymentDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <DollarSign size={16} color={Colors.text.secondary} />
              <Text style={styles.infoLabelText}>Payment Method</Text>
            </View>
            <Text style={styles.infoValue}>{payment.paymentMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Hash size={16} color={Colors.text.secondary} />
              <Text style={styles.infoLabelText}>Reference Number</Text>
            </View>
            <Text style={styles.infoValue}>{payment.referenceNumber || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <FileText size={16} color={Colors.text.secondary} />
              <Text style={styles.infoLabelText}>Status</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status).bg }]}>
              <Text style={[styles.statusText, { color: getStatusColor(payment.status).text }]}>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoices</Text>
          {payment.items.map((item: any, index: number) => {
            const invoice = invoices.find(inv => inv.id === item.invoiceId);
            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Package size={16} color={Colors.text.secondary} />
                    <Text style={styles.itemName}>Invoice #{invoice?.invoiceNumber}</Text>
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.itemTotal}>
                    <Text style={styles.itemLabel}>Amount</Text>
                    <Text style={styles.itemTotalText}>${(item.amount / 100).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {payment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Total Amount</Text>
            <Text style={styles.totalRowValue}>${(payment.amount / 100).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    gap: 8,
  },
  headerButton: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabelText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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