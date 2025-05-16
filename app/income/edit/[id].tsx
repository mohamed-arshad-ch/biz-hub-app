import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Tag,
  DollarSign,
  User,
  CreditCard,
  Hash,
  FileText,
  Check,
  ChevronRight,
  X,
  ChevronDown
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getIncomeCategories } from "@/mocks/categoryData";
import { IncomeCategory } from "@/types/category";
import { getIncomeById } from "@/mocks/incomeData";

// Mock income categories if the utility function doesn't work
const mockIncomeCategories = [
  { id: '1', name: 'Salary', description: 'Regular employment income', color: '#4CAF50' },
  { id: '2', name: 'Investment', description: 'Returns from investments', color: '#2196F3' },
  { id: '3', name: 'Business', description: 'Income from business operations', color: '#FBBC04' },
  { id: '4', name: 'Freelance', description: 'Income from freelance work', color: '#9C27B0' },
  { id: '5', name: 'Other', description: 'Miscellaneous income', color: '#757575' }
];

// Mock payment methods
const paymentMethods = [
  { id: '1', name: 'Cash' },
  { id: '2', name: 'Bank Transfer' },
  { id: '3', name: 'Credit Card' },
  { id: '4', name: 'Digital Wallet' },
  { id: '5', name: 'Check' }
];

export default function EditIncomeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory | null>(null);
  const [date, setDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  
  const [errors, setErrors] = useState<{
    source?: string;
    amount?: string;
    category?: string;
  }>({});

  // Load income categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getIncomeCategories();
        if (categories && categories.length > 0) {
          setIncomeCategories(categories);
        } else {
          setIncomeCategories(mockIncomeCategories);
        }
      } catch (error) {
        console.error('Error loading income categories:', error);
        setIncomeCategories(mockIncomeCategories);
      }
    };
    
    loadCategories();
  }, []);

  // Load income data
  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const incomeData = getIncomeById(id);
        if (incomeData) {
          setSource(incomeData.source);
          setAmount(incomeData.amount.toString());
          setDate(new Date(incomeData.date));
          setPaymentMethod(incomeData.paymentMethod || '');
          setReference(incomeData.reference || '');
          setNotes(incomeData.notes || '');

          // Find and set the category object
          const foundCategory = mockIncomeCategories.find(cat => cat.name === incomeData.category);
          if (foundCategory) {
            setCategory(foundCategory);
          }
        }
        setLoading(false);
      }, 500);
    }
  }, [id]);

  const validateForm = () => {
    const newErrors: {
      source?: string;
      amount?: string;
      category?: string;
    } = {};
    
    if (!source.trim()) {
      newErrors.source = "Source is required";
    }
    
    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }
    
    if (!category) {
      newErrors.category = "Category is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    // In a real app, you would call an API to save the income record
    Alert.alert(
      "Success",
      "Income record updated successfully",
      [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleCategorySelect = (selectedCategory: IncomeCategory) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    setShowPaymentMethodModal(false);
  };

  const getCategoryColor = (categoryId: string) => {
    const foundCategory = incomeCategories.find(cat => cat.id === categoryId);
    return foundCategory ? foundCategory.color : '#757575';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading income details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Income</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Income Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Information</Text>
            <View style={styles.card}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Source</Text>
                <TextInput
                  style={[styles.input, errors.source ? {borderColor: '#FF3B30'} : null]}
                  value={source}
                  onChangeText={setSource}
                  placeholder="Enter income source"
                />
                {errors.source && <Text style={styles.errorText}>{errors.source}</Text>}
              </View>

              <View style={styles.divider} />

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={[styles.input, errors.amount ? {borderColor: '#FF3B30'} : null]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
                {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
              </View>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.formField}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={styles.fieldLabel}>Category</Text>
                {category ? (
                  <View style={styles.selectedItem}>
                    <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                    <Text style={styles.fieldValue}>{category.name}</Text>
                    <ChevronRight size={20} color={Colors.text.secondary} />
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholder}>Select Category</Text>
                    <ChevronRight size={20} color={Colors.text.secondary} />
                  </View>
                )}
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.formField}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.fieldLabel}>Date</Text>
                <View style={styles.selectedItem}>
                  <Text style={styles.fieldValue}>
                    {date.toLocaleDateString()}
                  </Text>
                  <Calendar size={20} color={Colors.text.secondary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.card}>
              <TouchableOpacity 
                style={styles.formField}
                onPress={() => setShowPaymentMethodModal(true)}
              >
                <Text style={styles.fieldLabel}>Payment Method</Text>
                {paymentMethod ? (
                  <View style={styles.selectedItem}>
                    <Text style={styles.fieldValue}>{paymentMethod}</Text>
                    <ChevronRight size={20} color={Colors.text.secondary} />
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholder}>Select Payment Method</Text>
                    <ChevronRight size={20} color={Colors.text.secondary} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Reference Number</Text>
                <TextInput
                  style={styles.input}
                  value={reference}
                  onChangeText={setReference}
                  placeholder="Enter reference number (optional)"
                />
              </View>
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.card}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes (optional)"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={incomeCategories}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleCategorySelect(item)}
                  >
                    <View style={styles.categoryItemContent}>
                      <View style={[styles.categoryColorDot, { backgroundColor: item.color }]} />
                      <Text style={styles.categoryItemText}>{item.name}</Text>
                    </View>
                    {category?.id === item.id && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              />
            </View>
          </View>
        </Modal>

        {/* Payment Method Selection Modal */}
        <Modal
          visible={showPaymentMethodModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPaymentMethodModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                <TouchableOpacity
                  onPress={() => setShowPaymentMethodModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={paymentMethods}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handlePaymentMethodSelect(item.name)}
                  >
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    {paymentMethod === item.name && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              />
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: 'hidden',
  },
  formField: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: {
    fontSize: 16,
    color: Colors.text.tertiary,
    flex: 1,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.default,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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
  modalList: {
    paddingHorizontal: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
  }
});