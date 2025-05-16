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
  Switch,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Tag,
  DollarSign,
  CreditCard,
  Hash,
  FileText,
  Check,
  ChevronRight,
  X,
  ChevronDown,
  User,
  Camera
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getExpenseCategories } from "@/mocks/categoryData";
import { ExpenseCategory } from "@/types/category";
import { getExpenseById } from "@/mocks/expensesData";
import { ExpenseRecord } from "@/types/expenses";

// Mock expense categories if the utility function doesn't work
const mockExpenseCategories = [
  { id: '1', name: 'Food', description: 'Meals and groceries', color: '#4CAF50' },
  { id: '2', name: 'Transportation', description: 'Public transit and rideshares', color: '#2196F3' },
  { id: '3', name: 'Utilities', description: 'Bills and subscriptions', color: '#FBBC04' },
  { id: '4', name: 'Entertainment', description: 'Movies, games, and leisure', color: '#9C27B0' },
  { id: '5', name: 'Other', description: 'Miscellaneous expenses', color: '#757575' }
];

// Mock payment methods
const paymentMethods = [
  { id: '1', name: 'Cash' },
  { id: '2', name: 'Credit Card' },
  { id: '3', name: 'Debit Card' },
  { id: '4', name: 'Bank Transfer' },
  { id: '5', name: 'Digital Wallet' }
];

export default function NewExpenseScreen() {
  const router = useRouter();
  const { duplicate } = useLocalSearchParams<{ duplicate?: string }>();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [date, setDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [isReimbursable, setIsReimbursable] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(!!duplicate);
  
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    category?: string;
  }>({});

  // Load expense categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getExpenseCategories();
        if (categories && categories.length > 0) {
          setExpenseCategories(categories);
        } else {
          setExpenseCategories(mockExpenseCategories);
        }
      } catch (error) {
        console.error('Error loading expense categories:', error);
        setExpenseCategories(mockExpenseCategories);
      }
    };
    
    loadCategories();
  }, []);

  // Load expense data for duplication
  useEffect(() => {
    if (duplicate) {
      setTimeout(() => {
        const expenseToClone = getExpenseById(duplicate);
        if (expenseToClone) {
          setDescription(`Copy of ${expenseToClone.description}`);
          setAmount(expenseToClone.amount.toString());
          setDate(new Date());
          setPaymentMethod(expenseToClone.paymentMethod || '');
          setVendor(expenseToClone.vendor || '');
          setNotes(expenseToClone.notes || '');
          setIsTaxDeductible(expenseToClone.taxDeductible || false);
          setIsReimbursable(expenseToClone.reimbursable || false);

          // Find the category object that matches the category name
          const foundCategory = mockExpenseCategories.find(cat => cat.name === expenseToClone.category);
          if (foundCategory) {
            setCategory(foundCategory);
          }
        }
        setLoading(false);
      }, 500);
    }
  }, [duplicate]);

  const validateForm = () => {
    const newErrors: {
      description?: string;
      amount?: string;
      category?: string;
    } = {};
    
    if (!description.trim()) {
      newErrors.description = "Description is required";
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
    
    // In a real app, you would call an API to save the expense record
    Alert.alert(
      "Success",
      "Expense record saved successfully",
      [
        {
          text: "Add Another",
          onPress: () => {
            setDescription('');
            setAmount('');
            setCategory(null);
            setDate(new Date());
            setPaymentMethod('');
            setVendor('');
            setNotes('');
            setIsTaxDeductible(false);
            setIsReimbursable(false);
            setErrors({});
          }
        },
        {
          text: "Done",
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

  const handleCategorySelect = (selectedCategory: ExpenseCategory) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    setShowPaymentMethodModal(false);
  };

  const getCategoryColor = (categoryId: string) => {
    const foundCategory = expenseCategories.find(cat => cat.id === categoryId);
    return foundCategory ? foundCategory.color : '#757575';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
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
          <Text style={styles.title}>New Expense</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Expense Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Information</Text>
            <View style={styles.card}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, errors.description ? {borderColor: '#FF3B30'} : null]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter expense description"
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
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
                <Text style={styles.fieldLabel}>Vendor</Text>
                <TextInput
                  style={styles.input}
                  value={vendor}
                  onChangeText={setVendor}
                  placeholder="Enter vendor name (optional)"
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

              <View style={styles.divider} />

              <View style={styles.switchField}>
                <Text style={styles.fieldLabel}>Tax Deductible</Text>
                <Switch
                  value={isTaxDeductible}
                  onValueChange={setIsTaxDeductible}
                  trackColor={{ false: Colors.border.light, true: Colors.primary + '80' }}
                  thumbColor={isTaxDeductible ? Colors.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchField}>
                <Text style={styles.fieldLabel}>Reimbursable</Text>
                <Switch
                  value={isReimbursable}
                  onValueChange={setIsReimbursable}
                  trackColor={{ false: Colors.border.light, true: Colors.primary + '80' }}
                  thumbColor={isReimbursable ? Colors.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.formField}>
                <Text style={styles.fieldLabel}>Receipt</Text>
                <View style={styles.uploadButton}>
                  <Camera size={20} color={Colors.primary} />
                  <Text style={styles.uploadButtonText}>Capture Receipt</Text>
                </View>
              </TouchableOpacity>
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
                data={expenseCategories}
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
  switchField: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 8,
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