import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, FileText, Calendar, Hash, Package, DollarSign, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { createPaymentOut } from '@/db/payment-out';
import * as dbVendor from '@/db/vendor';
import * as dbInvoice from '@/db/purchase-invoice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewPaymentOutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [paymentData, setPaymentData] = useState({
    paymentNumber: '',
    vendorId: 0,
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

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const vends = await dbVendor.getAllVendors();
        setVendors(vends);
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
    if (!selectedVendor || !user) return;
    const fetchInvoices = async () => {
      try {
        const invs = await dbInvoice.getPurchaseInvoices(user.id);
        setInvoices(invs.filter(inv => inv.vendorId === selectedVendor.id && inv.status === 'unpaid'));
      } catch (error) {
        console.error('Error fetching invoices:', error);
        Alert.alert('Error', 'Failed to load invoices');
      }
    };
    fetchInvoices();
  }, [selectedVendor, user]);

  const handleSave = async () => {
    if (!user) return;
    if (!paymentData.paymentNumber || !paymentData.vendorId || !paymentData.paymentMethod || !paymentData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one invoice');
      return;
    }

    try {
      setSaving(true);
      await createPaymentOut({
        userId: user.id,
        vendorId: paymentData.vendorId,
        paymentNumber: paymentData.paymentNumber,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        status: paymentData.status,
        items: items.map(item => ({
          invoiceId: item.invoiceId,
          amount: item.amount
        }))
      });
      Alert.alert('Success', 'Payment created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'Failed to create payment');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedInvoice) return;
    const newItem = {
      invoiceId: selectedInvoice.id,
      amount: selectedInvoice.total,
      notes: '',
    };
    setItems([...items, newItem]);
    setPaymentData({
      ...paymentData,
      amount: paymentData.amount + selectedInvoice.total,
    });
    setSelectedInvoice(null);
    setShowInvoiceModal(false);
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    setItems(items.filter((_, i) => i !== index));
    setPaymentData({
      ...paymentData,
      amount: paymentData.amount - item.amount,
    });
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

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Payment</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Vendor</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowVendorModal(true)}
          >
            <FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>{selectedVendor?.name || 'Select Vendor'}</Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Payment Number</Text>
          <View style={styles.input}>
            <Hash size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={paymentData.paymentNumber}
              onChangeText={(text) => setPaymentData({ ...paymentData, paymentNumber: text })}
              placeholder="Enter payment number"
            />
          </View>

          <Text style={styles.label}>Status</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowStatusModal(true)}
          >
            <FileText size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.inputText}>{paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1)}</Text>
            <ChevronDown size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Payment Date</Text>
          <View style={styles.input}>
            <Calendar size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={paymentData.paymentDate}
              onChangeText={(text) => setPaymentData({ ...paymentData, paymentDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.input}>
            <DollarSign size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={paymentData.paymentMethod}
              onChangeText={(text) => setPaymentData({ ...paymentData, paymentMethod: text })}
              placeholder="Enter payment method"
            />
          </View>

          <Text style={styles.label}>Reference Number</Text>
          <View style={styles.input}>
            <Hash size={16} color={Colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={paymentData.referenceNumber}
              onChangeText={(text) => setPaymentData({ ...paymentData, referenceNumber: text })}
              placeholder="Enter reference number"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invoices</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowInvoiceModal(true)}
              disabled={!selectedVendor}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Invoice</Text>
            </TouchableOpacity>
          </View>

          {items.length > 0 ? items.map((item, index) => {
            const invoice = invoices.find(inv => inv.id === item.invoiceId);
            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Package size={16} color={Colors.text.secondary} />
                    <Text style={styles.itemName}>Invoice #{invoice?.invoiceNumber}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <X size={16} color={Colors.negative} />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.itemTotal}>
                    <Text style={styles.itemLabel}>Amount</Text>
                    <Text style={styles.itemTotalText}>${(item.amount / 100).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            );
          }) : (
            <Text style={styles.emptyText}>No invoices added</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={paymentData.notes}
            onChangeText={(text) => setPaymentData({ ...paymentData, notes: text })}
            placeholder="Add notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Total Amount</Text>
            <Text style={styles.totalRowValue}>${(paymentData.amount / 100).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Vendor Selection Modal */}
      <Modal
        visible={showVendorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVendorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vendor</Text>
              <TouchableOpacity onPress={() => setShowVendorModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {vendors.map((vendor) => (
                <TouchableOpacity 
                  key={vendor.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedVendor(vendor);
                    setPaymentData({ ...paymentData, vendorId: vendor.id });
                    setShowVendorModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{vendor.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Invoice Selection Modal */}
      <Modal
        visible={showInvoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Invoice</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {invoices.map((invoice) => (
                <TouchableOpacity 
                  key={invoice.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedInvoice(invoice);
                    handleAddItem();
                  }}
                >
                  <Text style={styles.modalItemText}>#{invoice.invoiceNumber}</Text>
                  <Text style={styles.modalItemSubtext}>${(invoice.total / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {['pending', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity 
                  key={status}
                  style={styles.modalItem}
                  onPress={() => {
                    setPaymentData({ ...paymentData, status });
                    setShowStatusModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.background.default,
    fontSize: 16,
    fontWeight: '500',
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
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    padding: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  removeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    textAlignVertical: 'top',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
}); 