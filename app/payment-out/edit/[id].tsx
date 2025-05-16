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
  CreditCard
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getVendorsData } from '@/mocks/vendorsData';
import { paymentOutData } from '@/mocks/paymentOutData';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Payment methods
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash' },
  { id: 'bank_transfer', name: 'Bank Transfer' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'check', name: 'Check' },
  { id: 'online_payment', name: 'Online Payment' },
];

// Types
interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

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
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Form data
  const [formData, setFormData] = useState<PaymentOutFormData>({
    id: '',
    vendorId: '',
    vendorName: '',
    amount: '',
    paymentDate: new Date(),
    paymentMethod: '',
    paymentMethodName: '',
    referenceNumber: '',
    notes: '',
    status: ''
  });
  
  // Bottom sheet states
  const [vendorSheetVisible, setVendorSheetVisible] = useState(false);
  const [methodSheetVisible, setMethodSheetVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Search state
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>(getVendorsData());
  
  // Fetch payment data
  useEffect(() => {
    const fetchPayment = () => {
      setInitialLoading(true);
      setTimeout(() => {
        const paymentRecord = paymentOutData.find(p => p.id === id);
        if (paymentRecord) {
          // Get the vendor name
          const vendor = getVendorsData().find(v => v.id === paymentRecord.vendorId);
          const vendorName = vendor ? vendor.name : '';
          
          // Get payment method name
          const method = PAYMENT_METHODS.find(m => m.id === paymentRecord.paymentMethod);
          const methodName = method ? method.name : '';
          
          setFormData({
            id: paymentRecord.id,
            vendorId: paymentRecord.vendorId,
            vendorName: vendorName,
            amount: paymentRecord.amount.toString(),
            paymentDate: new Date(paymentRecord.paymentDate),
            paymentMethod: paymentRecord.paymentMethod,
            paymentMethodName: methodName,
            referenceNumber: paymentRecord.referenceNumber,
            notes: paymentRecord.notes || '',
            status: paymentRecord.status
          });
        } else {
          Alert.alert('Error', 'Payment not found');
          router.back();
        }
        setInitialLoading(false);
      }, 500);
    };
    
    fetchPayment();
  }, [id]);
  
  // Filter vendors based on search query
  useEffect(() => {
    if (vendorSearchQuery.trim() === '') {
      setFilteredVendors(getVendorsData());
    } else {
      const query = vendorSearchQuery.toLowerCase();
      const filtered = getVendorsData().filter(
        (vendor: Vendor) => 
          vendor.name.toLowerCase().includes(query) ||
          vendor.email.toLowerCase().includes(query)
      );
      setFilteredVendors(filtered);
    }
  }, [vendorSearchQuery]);
  
  // Handle vendor selection
  const handleVendorSelect = (vendor: Vendor) => {
    setFormData({
      ...formData,
      vendorId: vendor.id,
      vendorName: vendor.name,
    });
    setVendorSheetVisible(false);
  };
  
  // Handle payment method selection
  const handlePaymentMethodSelect = (method: { id: string; name: string }) => {
    setFormData({
      ...formData,
      paymentMethod: method.id,
      paymentMethodName: method.name,
    });
    setMethodSheetVisible(false);
  };
  
  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        paymentDate: selectedDate,
      });
    }
  };
  
  // Handle form change
  const handleChange = (name: keyof PaymentOutFormData, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle form submission
  const handleSave = () => {
    // Validate form
    if (!formData.vendorId) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!formData.paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }
    
    if (!formData.referenceNumber) {
      Alert.alert('Error', 'Please enter a reference number');
      return;
    }
    
    // Save payment
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success',
        'Payment has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1000);
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Payment</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Payment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Status</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(formData.status).bg }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(formData.status).text }
            ]}>
              {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
            </Text>
          </View>
        </View>
        
        {/* Vendor Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setVendorSheetVisible(true)}
          >
            {!formData.vendorId ? (
              <View style={styles.selectPlaceholder}>
                <User size={20} color={Colors.text.secondary} />
                <Text style={styles.selectPlaceholderText}>Select Vendor</Text>
              </View>
            ) : (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>{formData.vendorName}</Text>
              </View>
            )}
            <ChevronRight size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.card}>
            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="numeric"
                  value={formData.amount}
                  onChangeText={(value) => handleChange('amount', value)}
                />
              </View>
            </View>
            
            {/* Payment Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={Colors.text.secondary} />
                <Text style={styles.datePickerText}>
                  {formData.paymentDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setMethodSheetVisible(true)}
              >
                {!formData.paymentMethod ? (
                  <View style={styles.selectPlaceholder}>
                    <CreditCard size={20} color={Colors.text.secondary} />
                    <Text style={styles.selectPlaceholderText}>Select Payment Method</Text>
                  </View>
                ) : (
                  <View style={styles.selectedItem}>
                    <Text style={styles.selectedItemText}>{formData.paymentMethodName}</Text>
                  </View>
                )}
                <ChevronRight size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            {/* Reference Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reference Number</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter reference number"
                  placeholderTextColor={Colors.text.tertiary}
                  value={formData.referenceNumber}
                  onChangeText={(value) => handleChange('referenceNumber', value)}
                />
              </View>
            </View>
          </View>
        </View>
        
        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter additional notes..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.notes}
              onChangeText={(value) => handleChange('notes', value)}
            />
          </View>
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Update Payment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Vendor Selection Sheet */}
      <Modal
        visible={vendorSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVendorSheetVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vendor</Text>
              <TouchableOpacity
                onPress={() => setVendorSheetVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.text.secondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search vendors..."
                placeholderTextColor={Colors.text.tertiary}
                value={vendorSearchQuery}
                onChangeText={setVendorSearchQuery}
              />
              {vendorSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setVendorSearchQuery('')}>
                  <X size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredVendors}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.vendorItem}
                  onPress={() => handleVendorSelect(item)}
                >
                  <View>
                    <Text style={styles.vendorName}>{item.name}</Text>
                    <Text style={styles.vendorEmail}>{item.email}</Text>
                  </View>
                  {formData.vendorId === item.id && (
                    <View style={styles.selectedVendorIndicator} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>No vendors found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      
      {/* Payment Method Selection Sheet */}
      <Modal
        visible={methodSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMethodSheetVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity
                onPress={() => setMethodSheetVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={PAYMENT_METHODS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.vendorItem}
                  onPress={() => handlePaymentMethodSelect(item)}
                >
                  <Text style={styles.vendorName}>{item.name}</Text>
                  {formData.paymentMethod === item.id && (
                    <View style={styles.selectedVendorIndicator} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.paymentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

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
  headerButton: {
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text.primary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
  },
  selectPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectPlaceholderText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  selectedItem: {
    flex: 1,
  },
  selectedItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  notesInput: {
    height: 100,
    fontSize: 16,
    color: Colors.text.primary,
    padding: 0,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: Colors.text.primary,
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  vendorEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  selectedVendorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 