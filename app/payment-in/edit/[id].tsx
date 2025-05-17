import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, TextInput, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Calendar, CreditCard, Hash, FileText, ChevronDown, Check, DollarSign, X, Search, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { getPaymentInById, updatePaymentIn } from '@/db/payment-in';
import * as dbCustomer from '@/db/customer';
import * as dbInvoice from '@/db/sales-invoice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Check',
  'PayPal',
  'Other'
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  status: 'active' | 'inactive' | 'blocked' | null;
  userId: number;
  createdAt: string | null;
  updatedAt: string | null;
  totalPurchases: number | null;
  company?: string | null;
}

interface PaymentInFormData {
  paymentNumber: string;
  customerId: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
  amount: number;
  notes: string;
  items: {
    invoiceId: number;
    amount: number;
    notes?: string;
  }[];
}

export default function EditPaymentInScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [paymentData, setPaymentData] = useState<PaymentInFormData>({
    paymentNumber: '',
    customerId: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    referenceNumber: '',
    status: 'pending',
    amount: 0,
    notes: '',
    items: [],
  });
  
  // Bottom sheet visibility states
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  
  // Customer data state
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
    (customer.phone && customer.phone.includes(customerSearch))
  );

  // Load customers when bottom sheet is opened
  useEffect(() => {
    if (showCustomerSheet) {
      loadCustomers();
    }
  }, [showCustomerSheet]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const dbCustomers = await dbCustomer.getAllCustomers();
      setCustomers(dbCustomers as Customer[]);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

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
        setPaymentData({
          paymentNumber: paymentData.paymentNumber,
          customerId: paymentData.customerId,
          paymentDate: paymentData.paymentDate,
          paymentMethod: paymentData.paymentMethod,
          referenceNumber: paymentData.referenceNumber || '',
          status: paymentData.status as 'pending' | 'completed' | 'cancelled',
          amount: paymentData.amount,
          notes: paymentData.notes || '',
          items: paymentData.items.map(item => ({
            invoiceId: item.invoiceId,
            amount: item.amount,
            notes: item.notes || undefined
          })),
        });

        // Fetch customer data
        const customerData = await dbCustomer.getCustomerById(paymentData.customerId);
        if (customerData) {
          setSelectedCustomer(customerData as Customer);
        }

        // Fetch all customers
        const custs = await dbCustomer.getAllCustomers();
        setCustomers(custs as Customer[]);

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

  useEffect(() => {
    if (!paymentData.customerId || !user) return;
    const fetchInvoices = async () => {
      try {
        const invs = await dbInvoice.getSalesInvoices(user.id);
        setPaymentData(prev => ({
          ...prev,
          items: prev.items.map((item: any) => ({
            ...item,
            invoice: invs.find(inv => inv.id === item.invoiceId)
          }))
        }));
      } catch (error) {
        console.error('Error fetching invoices:', error);
        Alert.alert('Error', 'Failed to load invoices');
      }
    };
    fetchInvoices();
  }, [paymentData.customerId, user]);

  const handleSave = async () => {
    if (!user || !id) return;
    if (!paymentData.customerId || !paymentData.amount || !paymentData.paymentMethod) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (paymentData.items.length === 0) {
      Alert.alert('Error', 'Please add at least one invoice');
      return;
    }

    try {
      setSaving(true);
      await updatePaymentIn(parseInt(id as string), user.id, paymentData, paymentData.items);
      Alert.alert('Success', 'Payment updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Error', 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };
  
  const selectCustomer = (customer: Customer) => {
    setPaymentData(prev => ({
      ...prev,
      customerId: customer.id
    }));
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };
  
  const selectPaymentMethod = (method: string) => {
    setPaymentData({ ...paymentData, paymentMethod: method });
    setShowPaymentMethodSheet(false);
  };
  
  const selectStatus = (status: string) => {
    setPaymentData({ ...paymentData, status: status as PaymentInFormData['status'] });
    setShowStatusSheet(false);
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
  
  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => selectCustomer(item)}
    >
      <View style={styles.customerItemContent}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.company && (
          <Text style={styles.customerCompany}>{item.company}</Text>
        )}
      </View>
      {paymentData.customerId === item.id && (
        <Check size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Payment</Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <User size={16} color={Colors.primary} style={styles.labelIcon} />
                <Text style={styles.label}>Customer <Text style={{ color: Colors.primary }}>*</Text></Text>
              </View>
              <TouchableOpacity 
                style={styles.selectContainer}
                onPress={() => setShowCustomerSheet(true)}
              >
                <Text style={[
                  styles.selectText, 
                  !paymentData.customerId && styles.placeholderText
                ]}>
                  {customers.find(c => c.id === paymentData.customerId)?.name || 'Select customer'}
                </Text>
                <ChevronDown size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <DollarSign size={16} color={Colors.primary} style={styles.labelIcon} />
                <Text style={styles.label}>Amount <Text style={{ color: Colors.primary }}>*</Text></Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={paymentData.amount > 0 ? paymentData.amount.toString() : ''}
                  onChangeText={(value) => setPaymentData({ ...paymentData, amount: parseFloat(value) || 0 })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Calendar size={16} color={Colors.primary} style={styles.labelIcon} />
                <Text style={styles.label}>Payment Date <Text style={{ color: Colors.primary }}>*</Text></Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={paymentData.paymentDate}
                  onChangeText={(value) => setPaymentData({ ...paymentData, paymentDate: value })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <CreditCard size={16} color={Colors.primary} style={styles.labelIcon} />
                <Text style={styles.label}>Payment Method <Text style={{ color: Colors.primary }}>*</Text></Text>
              </View>
              <TouchableOpacity 
                style={styles.selectContainer}
                onPress={() => setShowPaymentMethodSheet(true)}
              >
                <Text style={[
                  styles.selectText, 
                  !paymentData.paymentMethod && styles.placeholderText
                ]}>
                  {paymentData.paymentMethod || 'Select payment method'}
                </Text>
                <ChevronDown size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Hash size={16} color={Colors.primary} style={styles.labelIcon} />
                <Text style={styles.label}>Reference Number</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter reference number"
                  value={paymentData.referenceNumber}
                  onChangeText={(value) => setPaymentData({ ...paymentData, referenceNumber: value })}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Status</Text>
              </View>
              <TouchableOpacity 
                style={styles.selectContainer}
                onPress={() => setShowStatusSheet(true)}
              >
                <View style={[styles.statusIndicator, { 
                  backgroundColor: getStatusColor(paymentData.status).bg
                }]}>
                  <Text style={[styles.statusIndicatorText, { 
                    color: getStatusColor(paymentData.status).text
                  }]}>
                    {STATUS_OPTIONS.find(option => option.value === paymentData.status)?.label}
                  </Text>
                </View>
                <ChevronDown size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <FileText size={16} color={Colors.primary} style={styles.labelIcon} />
                <Text style={styles.label}>Notes</Text>
              </View>
              <View style={styles.textareaContainer}>
                <TextInput
                  style={styles.textarea}
                  placeholder="Add notes or details about this payment"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={paymentData.notes}
                  onChangeText={(value) => setPaymentData({ ...paymentData, notes: value })}
                />
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Customer selection bottom sheet */}
        <Modal
          visible={showCustomerSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowCustomerSheet(false);
            setCustomerSearch('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Select Customer</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowCustomerSheet(false);
                    setCustomerSearch('');
                  }}
                >
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <Search size={20} color={Colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                />
                {customerSearch ? (
                  <TouchableOpacity onPress={() => setCustomerSearch('')}>
                    <X size={18} color={Colors.text.secondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              
              {loadingCustomers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderCustomerItem}
                  contentContainerStyle={styles.bottomSheetContent}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No customers found</Text>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
        
        {/* Payment method selection bottom sheet */}
        <Modal
          visible={showPaymentMethodSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPaymentMethodSheet(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Select Payment Method</Text>
                <TouchableOpacity onPress={() => setShowPaymentMethodSheet(false)}>
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.bottomSheetContent}>
                {PAYMENT_METHODS.map(method => (
                  <TouchableOpacity
                    key={method}
                    style={styles.sheetItem}
                    onPress={() => selectPaymentMethod(method)}
                  >
                    <Text style={styles.sheetItemText}>{method}</Text>
                    {paymentData.paymentMethod === method && (
                      <Check size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        {/* Status selection bottom sheet */}
        <Modal
          visible={showStatusSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStatusSheet(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Select Status</Text>
                <TouchableOpacity onPress={() => setShowStatusSheet(false)}>
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.bottomSheetContent}>
                {STATUS_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.sheetItem}
                    onPress={() => selectStatus(option.value)}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View style={[styles.statusDot, { 
                        backgroundColor: getStatusColor(option.value).text
                      }]} />
                      <Text style={styles.sheetItemText}>{option.label}</Text>
                    </View>
                    {paymentData.status === option.value && (
                      <Check size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  labelIcon: {
    marginRight: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: Colors.text.primary,
    height: '100%',
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    padding: 8,
    height: 120,
  },
  textarea: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    textAlignVertical: 'top',
  },
  statusIndicator: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  statusIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Bottom sheet styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '80%',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bottomSheetContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  sheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sheetItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
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
  customerItemContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  customerCompany: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 