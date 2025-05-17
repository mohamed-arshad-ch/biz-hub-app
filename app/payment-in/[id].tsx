import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Share as RNShare, SafeAreaView as RNSafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit, Trash2, Calendar, CreditCard, User, Hash, Tag, Clock, Printer, FileText, DollarSign, Package, Share2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentIn } from '@/types/payment-in';
import { paymentInData } from '@/mocks/paymentInData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getPaymentInById, deletePaymentIn } from '@/db/payment-in';
import * as dbCustomer from '@/db/customer';
import * as dbInvoice from '@/db/sales-invoice';
import { formatCurrency } from '@/utils/currency';

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
  
  const handleShareReceipt = async () => {
    try {
      const message = `Payment Receipt: #${payment.paymentNumber}\nAmount: ${formatCurrency(payment.amount)}\nDate: ${payment.paymentDate}\nMethod: ${payment.paymentMethod}`;
      await RNShare.share({
        message,
      });
    } catch (error) {
      console.log('Error sharing receipt:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print', `Printing payment #${payment.paymentNumber}`);
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return null;
  }

  const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handlePrint}
          >
            <Printer size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push(`/payment-in/edit/${payment.id}`)}
          >
            <Edit size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Payment Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.paymentNumber}>#{payment.paymentNumber}</Text>
              <Text style={styles.paymentDate}>{formattedDate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status).bg }]}>
              <Text style={[styles.statusText, { color: getStatusColor(payment.status).text }]}>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryAmountContainer}>
            <Text style={styles.amountLabel}>Payment Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(payment.amount)}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Customer</Text>
          {customer && (
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.email && <Text style={styles.customerDetail}>{customer.email}</Text>}
              {customer.phone && <Text style={styles.customerDetail}>{customer.phone}</Text>}
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Calendar size={16} color={Colors.text.secondary} />
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <CreditCard size={16} color={Colors.text.secondary} />
              <Text style={styles.detailLabel}>Method</Text>
            </View>
            <Text style={styles.detailValue}>{payment.paymentMethod}</Text>
          </View>
          
          {payment.referenceNumber && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Hash size={16} color={Colors.text.secondary} />
                <Text style={styles.detailLabel}>Reference</Text>
              </View>
              <Text style={styles.detailValue}>{payment.referenceNumber}</Text>
            </View>
          )}
        </View>

        {/* Invoices */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Invoices Paid</Text>
          {payment.items.map((item: any, index: number) => {
            const invoice = invoices.find(inv => inv.id === item.invoiceId);
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.invoiceItem}
                onPress={() => router.push(`/sales-invoice/${item.invoiceId}`)}
              >
                <View style={styles.invoiceInfo}>
                  <View style={styles.invoiceHeader}>
                    <Text style={styles.invoiceNumber}>
                      Invoice #{invoice?.invoiceNumber || item.invoiceId}
                    </Text>
                    {invoice?.status && (
                      <View style={[styles.smallStatusBadge, { 
                        backgroundColor: invoice.status === 'paid' 
                          ? 'rgba(76, 175, 80, 0.1)' 
                          : 'rgba(251, 188, 4, 0.1)' 
                      }]}>
                        <Text style={[styles.smallStatusText, { 
                          color: invoice.status === 'paid' 
                            ? Colors.status.completed 
                            : Colors.status.pending 
                        }]}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {invoice?.date && (
                    <Text style={styles.invoiceDate}>
                      {new Date(invoice.date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Text style={styles.invoiceAmount}>{formatCurrency(item.amount)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        {payment.notes && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}
        
        {/* Space for footer */}
        <View style={{ height: 80 }} />
      </ScrollView>
      
      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={handleShareReceipt}
        >
          <Share2 size={20} color={Colors.primary} />
          <Text style={styles.footerButtonText}>Share Receipt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.deleteButton]} 
          onPress={handleDelete}
        >
          <Trash2 size={20} color={Colors.negative} />
          <Text style={[styles.footerButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
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
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.default,
    zIndex: 10,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryAmountContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: Colors.background.default,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  customerInfo: {
    gap: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  smallStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  smallStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  invoiceDate: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  notesText: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.default,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  deleteButtonText: {
    color: Colors.negative,
  },
}); 