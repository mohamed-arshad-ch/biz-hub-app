import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform, Modal, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, User, Calendar, CreditCard, Hash, FileText, ChevronDown, Check, DollarSign, X, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PaymentInFormData } from '@/types/payment-in';
import { getCustomersData } from '@/mocks/customersData';
import { Customer } from '@/types/customer';
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

export default function NewPaymentInScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<PaymentInFormData>({
    customerId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    referenceNumber: '',
    notes: '',
    status: 'pending'
  });
  
  // Bottom sheet visibility states
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  
  // Search functionality for customers
  const [customers] = useState<Customer[]>(getCustomersData());
  const [customerSearch, setCustomerSearch] = useState('');
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSave = () => {
    // Validate form data
    if (!formData.customerId || !formData.amount || !formData.paymentMethod) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Here you would typically save the data to your backend
    Alert.alert(
      'Success',
      'Payment saved successfully',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };
  
  const selectCustomer = (customer: Customer) => {
    setFormData({ ...formData, customerId: customer.id });
    setShowCustomerSheet(false);
    setCustomerSearch('');
  };
  
  const selectPaymentMethod = (method: string) => {
    setFormData({ ...formData, paymentMethod: method });
    setShowPaymentMethodSheet(false);
  };
  
  const selectStatus = (status: string) => {
    setFormData({ ...formData, status: status as PaymentInFormData['status'] });
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
      <Text style={styles.sheetItemText}>{item.name}</Text>
      {formData.customerId === item.id && (
        <Check size={18} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Payment</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                !formData.customerId && styles.placeholderText
              ]}>
                {customers.find(c => c.id === formData.customerId)?.name || 'Select customer'}
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
                value={formData.amount > 0 ? formData.amount.toString() : ''}
                onChangeText={(value) => setFormData({ ...formData, amount: parseFloat(value) || 0 })}
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
                value={formData.paymentDate}
                onChangeText={(value) => setFormData({ ...formData, paymentDate: value })}
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
                !formData.paymentMethod && styles.placeholderText
              ]}>
                {formData.paymentMethod || 'Select payment method'}
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
                value={formData.referenceNumber}
                onChangeText={(value) => setFormData({ ...formData, referenceNumber: value })}
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
                backgroundColor: getStatusColor(formData.status).bg
              }]}>
                <Text style={[styles.statusIndicatorText, { 
                  color: getStatusColor(formData.status).text
                }]}>
                  {STATUS_OPTIONS.find(option => option.value === formData.status)?.label}
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
                value={formData.notes}
                onChangeText={(value) => setFormData({ ...formData, notes: value })}
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
            
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              renderItem={renderCustomerItem}
              contentContainerStyle={styles.bottomSheetContent}
            />
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
                  {formData.paymentMethod === method && (
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
                  {formData.status === option.value && (
                    <Check size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
}); 