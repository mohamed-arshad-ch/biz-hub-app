import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator, Alert, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, FileText, Calendar, Hash, Package, DollarSign, ChevronDown, Check, CreditCard, User, Printer, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { createPaymentIn } from '@/db/payment-in';
import * as dbCustomer from '@/db/customer';
import * as dbInvoice from '@/db/sales-invoice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@/utils/currency';
import DateTimePicker from '@react-native-community/datetimepicker';

// Available payment methods
const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Check',
  'PayPal',
  'Venmo',
  'Zelle',
  'Other'
];

export default function NewPaymentInScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  
  // Bottom sheet states
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState(false);
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  
  // Search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [hasInvoices, setHasInvoices] = useState(true);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [paymentData, setPaymentData] = useState({
    paymentNumber: generatePaymentNumber(),
    customerId: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    referenceNumber: '',
    status: 'pending',
    amount: 0,
    notes: '',
  });

  const [items, setItems] = useState<{
    invoiceId: number;
    amount: number;
    notes?: string;
  }[]>([]);

  // Generate a payment number with prefix "PAY-" and random number
  function generatePaymentNumber() {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `PAY-${year}${month}${randomNum}`;
  }

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const custs = await dbCustomer.getAllCustomers();
        setCustomers(custs);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!selectedCustomer || !user) return;
    const fetchInvoices = async () => {
      try {
        const invs = await dbInvoice.getSalesInvoices(user.id);
        const customerInvoices = invs.filter(inv => inv.customerId === selectedCustomer.id && inv.status === 'unpaid');
        setAvailableInvoices(customerInvoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        Alert.alert('Error', 'Failed to load invoices');
      }
    };
    fetchInvoices();
  }, [selectedCustomer, user]);

  const handleSave = async () => {
    if (!user) return;
    if (!paymentData.customerId || !paymentData.paymentMethod || paymentData.amount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // If using invoices, check that at least one is added
    if (hasInvoices && items.length === 0) {
      Alert.alert('Error', 'Please add at least one invoice');
      return;
    }

    try {
      setSaving(true);
      await createPaymentIn(user.id, paymentData, hasInvoices ? items : []);
      Alert.alert('Success', 'Payment created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'Failed to create payment');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Printing payment receipt...');
    // Logic to print would go here
  };

  const handleAddInvoice = (invoice: any) => {
    if (!invoice) return;
    
    // Check if invoice is already added
    if (items.some(item => item.invoiceId === invoice.id)) {
      Alert.alert('Error', 'This invoice is already added');
      return;
    }
    
    const newItem = {
      invoiceId: invoice.id,
      amount: invoice.total,
      notes: '',
    };
    
    setItems([...items, newItem]);
    
    // Recalculate total amount
    const newTotal = items.reduce((sum, item) => sum + item.amount, 0) + invoice.total;
    setPaymentData({
      ...paymentData,
      amount: newTotal,
    });
    
    setShowInvoiceSheet(false);
    setInvoiceSearch('');
  };

  const handleRemoveInvoice = (index: number) => {
    const item = items[index];
    setItems(items.filter((_, i) => i !== index));
    
    // Recalculate total amount
    setPaymentData({
      ...paymentData,
      amount: paymentData.amount - item.amount,
    });
  };
  
  const handleInvoiceAmountChange = (index: number, amount: number) => {
    const updatedItems = [...items];
    const prevAmount = updatedItems[index].amount;
    updatedItems[index].amount = amount;
    setItems(updatedItems);
    
    // Update total payment amount
    setPaymentData({
      ...paymentData,
      amount: paymentData.amount - prevAmount + amount,
    });
  };

  // Get currency symbol from formatCurrency utility
  const getCurrencySymbol = () => {
    // Extract just the symbol from a formatted amount
    const formatted = formatCurrency(0);
    // The symbol is typically at the beginning or end
    const symbol = formatted.replace(/[\d,.]/g, '').trim();
    return symbol;
  };

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setPaymentData({ ...paymentData, customerId: customer.id });
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };

  const selectPaymentMethod = (method: string) => {
    setPaymentData({ ...paymentData, paymentMethod: method });
    setShowPaymentMethodSheet(false);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setPaymentData({ ...paymentData, paymentDate: formattedDate });
    }
  };

  const renderCustomerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => selectCustomer(item)}
    >
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.company && <Text style={styles.customerCompany}>{item.company}</Text>}
      </View>
      {paymentData.customerId === item.id && <Check size={20} color={Colors.primary} />}
    </TouchableOpacity>
  );

  const renderInvoiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => handleAddInvoice(item)}
    >
      <View style={styles.invoiceInfo}>
        <Text style={styles.invoiceNumber}>Invoice #{item.invoiceNumber}</Text>
        <Text style={styles.invoiceDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.invoiceAmount}>{formatCurrency(item.total)}</Text>
    </TouchableOpacity>
  );

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
    (customer.phone && customer.phone.includes(customerSearch))
  );

  // Filter invoices based on search
  const filteredInvoices = availableInvoices.filter(invoice => 
    `#${invoice.invoiceNumber}`.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>New Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Information</Text>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <User size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Customer<Text style={styles.required}>*</Text></Text>
              </View>
              <TouchableOpacity 
                style={styles.selectControl}
                onPress={() => setShowCustomerSheet(true)}
              >
                <Text style={selectedCustomer ? styles.selectText : styles.placeholderText}>
                  {selectedCustomer ? selectedCustomer.name : 'Select a customer'}
                </Text>
                <ChevronDown size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Hash size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Payment Number</Text>
              </View>
              <View style={styles.inputControl}>
                <TextInput
                  style={styles.input}
                  value={paymentData.paymentNumber}
                  onChangeText={(text) => setPaymentData({...paymentData, paymentNumber: text})}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Calendar size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Payment Date<Text style={styles.required}>*</Text></Text>
              </View>
              <TouchableOpacity 
                style={styles.selectControl}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.selectText}>
                  {new Date(paymentData.paymentDate).toLocaleDateString()}
                </Text>
                <Calendar size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(paymentData.paymentDate)}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <CreditCard size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Payment Method<Text style={styles.required}>*</Text></Text>
              </View>
              <TouchableOpacity 
                style={styles.selectControl}
                onPress={() => setShowPaymentMethodSheet(true)}
              >
                <Text style={paymentData.paymentMethod ? styles.selectText : styles.placeholderText}>
                  {paymentData.paymentMethod || 'Select payment method'}
                </Text>
                <ChevronDown size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Hash size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Reference Number</Text>
              </View>
              <View style={styles.inputControl}>
                <TextInput
                  style={styles.input}
                  value={paymentData.referenceNumber}
                  onChangeText={(text) => setPaymentData({...paymentData, referenceNumber: text})}
                  placeholder="Optional reference number"
                />
              </View>
            </View>
          </View>

          {/* Payment Amount */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Details</Text>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <FileText size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Has Invoices?</Text>
              </View>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, hasInvoices && styles.toggleOptionActive]}
                  onPress={() => setHasInvoices(true)}
                >
                  <Text style={[styles.toggleText, hasInvoices && styles.toggleTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, !hasInvoices && styles.toggleOptionActive]}
                  onPress={() => setHasInvoices(false)}
                >
                  <Text style={[styles.toggleText, !hasInvoices && styles.toggleTextActive]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!hasInvoices && (
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Text style={[styles.currencySymbol, {marginRight: 8}]}>{getCurrencySymbol()}</Text>
                  <Text style={styles.label}>Payment Amount<Text style={styles.required}>*</Text></Text>
                </View>
                <View style={styles.inputControl}>
                  <TextInput
                    style={styles.input}
                    value={paymentData.amount ? paymentData.amount.toString() : ''}
                    onChangeText={(text) => {
                      const amount = parseFloat(text) || 0;
                      setPaymentData({...paymentData, amount});
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              </View>
            )}

            {hasInvoices && (
              <>
                <View style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <FileText size={16} color={Colors.text.secondary} />
                    <Text style={styles.label}>Invoices<Text style={styles.required}>*</Text></Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.addButton, !selectedCustomer && styles.disabledButton]}
                    onPress={() => {
                      if (selectedCustomer) {
                        setShowInvoiceSheet(true);
                      } else {
                        Alert.alert('Error', 'Please select a customer first');
                      }
                    }}
                    disabled={!selectedCustomer}
                  >
                    <Plus size={16} color={Colors.primary} />
                    <Text style={styles.addButtonText}>Add Invoice</Text>
                  </TouchableOpacity>
                </View>

                {items.length > 0 ? (
                  <View style={styles.invoiceList}>
                    {items.map((item, index) => {
                      const invoice = availableInvoices.find(inv => inv.id === item.invoiceId);
                      const totalDue = invoice?.total || 0;
                      const paymentAmount = item.amount || 0;
                      const balanceAmount = Math.max(0, totalDue - paymentAmount);
                      
                      return (
                        <View key={index} style={styles.invoiceCard}>
                          <View style={styles.invoiceCardHeader}>
                            <Text style={styles.invoiceCardTitle}>
                              Invoice #{invoice?.invoiceNumber || item.invoiceId}
                            </Text>
                            <TouchableOpacity
                              style={styles.invoiceCardRemove}
                              onPress={() => handleRemoveInvoice(index)}
                            >
                              <X size={16} color={Colors.negative} />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.invoiceCardContent}>
                            <Text style={styles.invoiceCardLabel}>Total Due:</Text>
                            <Text style={styles.invoiceCardAmount}>
                              {formatCurrency(totalDue)}
                            </Text>
                          </View>
                          <View style={styles.invoiceAmountContainer}>
                            <Text style={styles.invoiceCardLabel}>Payment Amount:</Text>
                            <View style={styles.invoiceAmountInput}>
                              <TextInput
                                style={styles.amountInput}
                                value={item.amount.toString()}
                                onChangeText={(text) => {
                                  const amount = parseFloat(text) || 0;
                                  handleInvoiceAmountChange(index, amount);
                                }}
                                keyboardType="numeric"
                                placeholder="0.00"
                              />
                            </View>
                          </View>
                          <View style={styles.invoiceCardContent}>
                            <Text style={styles.invoiceCardLabel}>Balance:</Text>
                            <Text style={[styles.invoiceCardAmount, balanceAmount > 0 ? styles.balanceAmount : styles.fullyPaidAmount]}>
                              {formatCurrency(balanceAmount)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyInvoices}>
                    <Text style={styles.emptyText}>No invoices added yet</Text>
                  </View>
                )}

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Payment Amount:</Text>
                  <Text style={styles.totalAmount}>{formatCurrency(paymentData.amount)}</Text>
                </View>
              </>
            )}
          </View>

          {/* Notes Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Information</Text>
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <FileText size={16} color={Colors.text.secondary} />
                <Text style={styles.label}>Notes</Text>
              </View>
              <View style={styles.textareaControl}>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={4}
                  value={paymentData.notes}
                  onChangeText={(text) => setPaymentData({...paymentData, notes: text})}
                  placeholder="Add any notes about this payment"
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Space for footer */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.printButton]}
            onPress={handlePrint}
          >
            <Printer size={20} color={Colors.primary} />
            <Text style={styles.printButtonText}>Print</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Payment'}</Text>
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>

      {/* Customer Selection Bottom Sheet */}
      <Modal
        visible={showCustomerSheet}
        animationType="slide"
        transparent
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
            
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCustomerItem}
              contentContainerStyle={styles.bottomSheetContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No customers found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Payment Method Selection Bottom Sheet */}
      <Modal
        visible={showPaymentMethodSheet}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowPaymentMethodSheet(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentMethodSheet(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={PAYMENT_METHODS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => selectPaymentMethod(item)}
                >
                  <Text style={styles.sheetItemText}>{item}</Text>
                  {paymentData.paymentMethod === item && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.bottomSheetContent}
            />
          </View>
        </View>
      </Modal>

      {/* Invoice Selection Bottom Sheet */}
      <Modal
        visible={showInvoiceSheet}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowInvoiceSheet(false);
          setInvoiceSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Invoice</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowInvoiceSheet(false);
                  setInvoiceSearch('');
                }}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search invoices..."
                value={invoiceSearch}
                onChangeText={setInvoiceSearch}
              />
              {invoiceSearch ? (
                <TouchableOpacity onPress={() => setInvoiceSearch('')}>
                  <X size={18} color={Colors.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <FlatList
              data={filteredInvoices}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderInvoiceItem}
              contentContainerStyle={styles.bottomSheetContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No unpaid invoices found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
  },
  scrollContent: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  required: {
    color: Colors.negative,
  },
  inputControl: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.background.secondary,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  textareaControl: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  textarea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  toggleOptionActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  toggleText: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  toggleTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  invoiceList: {
    marginBottom: 16,
  },
  invoiceCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceCardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  invoiceCardRemove: {
    padding: 4,
  },
  invoiceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceCardLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  invoiceCardAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  invoiceAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  invoiceAmountInput: {
    width: '50%',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 6,
    backgroundColor: Colors.background.default,
  },
  amountInput: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  emptyInvoices: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.default,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printButton: {
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
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
  customerInfo: {
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
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  balanceAmount: {
    color: Colors.status.pending,
  },
  fullyPaidAmount: {
    color: Colors.status.completed,
  },
}); 