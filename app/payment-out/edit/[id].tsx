import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  X, 
  ChevronDown,
  ChevronRight, 
  Calendar,
  Search,
  User,
  CreditCard,
  Plus,
  Package
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAllVendors } from '@/db/vendor';
import { Vendor } from '@/db/schema';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { getPaymentOutById, updatePaymentOut, PaymentOut, PaymentOutItem } from '@/db/payment-out';
import * as dbInvoice from '@/db/purchase-invoice';
import * as dbVendor from '@/db/vendor';

// Payment methods
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash' },
  { id: 'bank_transfer', name: 'Bank Transfer' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'check', name: 'Check' },
  { id: 'online_payment', name: 'Online Payment' },
];

// Types
interface PaymentOutFormData {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: string;
  paymentDate: Date;
  paymentMethod: string;
  paymentMethodName: string;
  referenceNumber: string;
  notes: string;
  status: string;
}

export default function EditPaymentOutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payment, setPayment] = useState<(PaymentOut & { items: PaymentOutItem[] }) | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    paymentNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    notes: '',
    status: 'pending',
    amount: 0,
    items: [] as { invoiceId: number; amount: number }[],
  });

  useEffect(() => {
    if (!user || !id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const paymentData = await getPaymentOutById(parseInt(id as string), user.id);
        if (!paymentData) {
          Alert.alert('Error', 'Payment not found');
          router.back();
          return;
        }
        setPayment(paymentData);

        // Set initial form data
        setPaymentData({
          paymentNumber: paymentData.paymentNumber,
          paymentDate: paymentData.paymentDate,
          paymentMethod: paymentData.paymentMethod,
          referenceNumber: paymentData.referenceNumber || '',
          notes: paymentData.notes || '',
          status: paymentData.status,
          amount: paymentData.amount,
          items: paymentData.items.map(item => ({
            invoiceId: item.invoiceId,
            amount: item.amount,
          })),
        });

        // Fetch vendor data
        const vendorData = await dbVendor.getVendorById(paymentData.vendorId);
        if (vendorData) {
          setSelectedVendor(vendorData);
        }

        // Fetch all vendors
        const allVendors = await dbVendor.getAllVendors();
        setVendors(allVendors);

        // Fetch invoice data for each item
        const invoicePromises = paymentData.items.map((item: any) => 
          dbInvoice.getPurchaseInvoiceById(item.invoiceId, user.id)
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

  const handleSave = async () => {
    if (!user || !payment || !selectedVendor) return;

    try {
      setSaving(true);
      await updatePaymentOut(payment.id, user.id, {
        vendorId: selectedVendor.id,
        paymentNumber: paymentData.paymentNumber,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        status: paymentData.status,
        items: paymentData.items,
      });
      Alert.alert('Success', 'Payment updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Error', 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInvoice = () => {
    if (!selectedInvoice) return;
    setPaymentData(prev => ({
      ...prev,
      items: [...prev.items, {
        invoiceId: selectedInvoice.id,
        amount: selectedInvoice.amount,
      }],
      amount: prev.amount + selectedInvoice.amount,
    }));
    setSelectedInvoice(null);
    setShowInvoiceModal(false);
  };

  const handleRemoveInvoice = (index: number) => {
    setPaymentData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      amount: prev.amount - prev.items[index].amount,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPaymentData(prev => ({
        ...prev,
        paymentDate: selectedDate.toISOString().split('T')[0],
      }));
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
        <Text style={styles.title}>Edit Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <TouchableOpacity
            style={styles.vendorSelector}
            onPress={() => setShowVendorModal(true)}
          >
            <View style={styles.vendorInfo}>
              <User size={20} color={Colors.text.secondary} />
              <Text style={styles.vendorName}>
                {selectedVendor ? selectedVendor.name : 'Select Vendor'}
              </Text>
            </View>
            <ArrowLeft size={20} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Number</Text>
            <TextInput
              style={styles.input}
              value={paymentData.paymentNumber}
              onChangeText={(text) => setPaymentData(prev => ({ ...prev, paymentNumber: text }))}
              placeholder="Enter payment number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={Colors.text.secondary} />
              <Text style={styles.dateText}>{paymentData.paymentDate}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethodSelector}>
              {['bank_transfer', 'cash', 'check', 'credit_card'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    paymentData.paymentMethod === method && styles.paymentMethodButtonActive,
                  ]}
                  onPress={() => setPaymentData(prev => ({ ...prev, paymentMethod: method }))}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentData.paymentMethod === method && styles.paymentMethodTextActive,
                    ]}
                  >
                    {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reference Number</Text>
            <TextInput
              style={styles.input}
              value={paymentData.referenceNumber}
              onChangeText={(text) => setPaymentData(prev => ({ ...prev, referenceNumber: text }))}
              placeholder="Enter reference number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={paymentData.notes}
              onChangeText={(text) => setPaymentData(prev => ({ ...prev, notes: text }))}
              placeholder="Enter notes"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusSelector}>
              {['pending', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    paymentData.status === status && styles.statusButtonActive,
                  ]}
                  onPress={() => setPaymentData(prev => ({ ...prev, status }))}
                >
                  <Text
                    style={[
                      styles.statusText,
                      paymentData.status === status && styles.statusTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invoices</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowInvoiceModal(true)}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Invoice</Text>
            </TouchableOpacity>
          </View>

          {paymentData.items.map((item, index) => {
            const invoice = invoices.find(inv => inv.id === item.invoiceId);
            return (
              <View key={index} style={styles.invoiceItem}>
                <View style={styles.invoiceInfo}>
                  <Package size={20} color={Colors.text.secondary} />
                  <View style={styles.invoiceDetails}>
                    <Text style={styles.invoiceNumber}>Invoice #{invoice?.invoiceNumber}</Text>
                    <Text style={styles.invoiceAmount}>${(item.amount / 100).toFixed(2)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveInvoice(index)}
                >
                  <X size={20} color={Colors.negative} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>${(paymentData.amount / 100).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(paymentData.paymentDate)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Vendor Selection Modal */}
      {showVendorModal && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Vendor</Text>
            <ScrollView style={styles.modalList}>
              {vendors.map((vendor) => (
                <TouchableOpacity
                  key={vendor.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedVendor(vendor);
                    setShowVendorModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{vendor.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowVendorModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Invoice Selection Modal */}
      {showInvoiceModal && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Invoice</Text>
            <ScrollView style={styles.modalList}>
              {invoices.map((invoice) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedInvoice(invoice);
                    handleAddInvoice();
                  }}
                >
                  <Text style={styles.modalItemText}>Invoice #{invoice.invoiceNumber}</Text>
                  <Text style={styles.modalItemAmount}>${(invoice.amount / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInvoiceModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    color: Colors.text.primary,
    marginBottom: 16,
  },
  vendorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorName: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  paymentMethodButtonActive: {
    backgroundColor: Colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  statusButtonActive: {
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: Colors.primary,
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  invoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceDetails: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  invoiceAmount: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  removeButton: {
    padding: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.default,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.secondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalItemAmount: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 