import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Calendar, 
  ChevronDown,
  Camera,
  X,
  Tag,
  DollarSign,
  CreditCard,
  FileText
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import BottomSheetSelector, { BottomSheetSelectorRef } from "@/components/BottomSheetSelector";
import CategorySelector, { Category } from "@/components/CategorySelector";
import PaymentMethodSelector, { defaultPaymentMethods } from "@/components/PaymentMethodSelector";

import Colors from "@/constants/colors";
import { getExpenseById } from "@/mocks/expensesData";
import { formatCurrency } from "@/utils/formatters";
import { ExpenseRecord } from "@/types/expenses";
import { getExpenseCategories } from "@/utils/categoryStorageUtils";
import { ExpenseCategory } from "@/types/category";

export default function EditExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [expense, setExpense] = useState<Partial<ExpenseRecord>>({
    date: new Date(),
    amount: 0,
    description: "",
    category: "Office Supplies",
    paymentMethod: "Cash",
  });
  
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [isReimbursable, setIsReimbursable] = useState(false);
  
  const categoryBottomSheetRef = useRef<BottomSheetSelectorRef>(null);
  const paymentMethodBottomSheetRef = useRef<BottomSheetSelectorRef>(null);

  // Load expense categories from AsyncStorage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getExpenseCategories();
        setExpenseCategories(categories);
      } catch (error) {
        console.error('Error loading expense categories:', error);
      }
    };
    
    loadCategories();
  }, []);

  useEffect(() => {
    if (id) {
      // Load expense data
      setTimeout(() => {
        const fetchedExpense = getExpenseById(id);
        if (fetchedExpense) {
          setExpense(fetchedExpense);
          // Set switches based on expense data
          setIsTaxDeductible(!!fetchedExpense.taxDeductible);
          setIsReimbursable(!!fetchedExpense.reimbursable);
          
          // Find the corresponding category object
          const categoryObj = expenseCategories.find(cat => cat.name === fetchedExpense.category);
          if (categoryObj) {
            setSelectedCategory(categoryObj);
          }
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, expenseCategories]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpense({ ...expense, date: selectedDate });
    }
  };

  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters except decimal point
    const cleanedText = text.replace(/[^0-9.]/g, "");
    
    // Ensure only one decimal point
    const parts = cleanedText.split(".");
    const formattedText = parts.length > 1 
      ? `${parts[0]}.${parts.slice(1).join("")}`
      : cleanedText;
    
    // Convert to number
    const amount = parseFloat(formattedText) || 0;
    setExpense({ ...expense, amount });
  };

  const openCategorySelector = () => {
    categoryBottomSheetRef.current?.open();
  };

  const openPaymentMethodSelector = () => {
    paymentMethodBottomSheetRef.current?.open();
  };

  const handleCategorySelect = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setExpense({ ...expense, category: category.name });
    categoryBottomSheetRef.current?.close();
  };

  const handlePaymentMethodSelect = (method: string) => {
    setExpense({ ...expense, paymentMethod: method });
    paymentMethodBottomSheetRef.current?.close();
  };

  const handleSave = () => {
    // Validate required fields
    if (!expense.description) {
      Alert.alert("Error", "Please enter a description");
      return;
    }
    
    if (!expense.amount || expense.amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    
    if (!expense.category) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    
    // Update logic would go here
    
    // Show success message
    Alert.alert(
      "Success",
      "Expense updated successfully",
      [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        {
          text: "Continue Editing",
          style: "cancel"
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back()
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Edit Expense",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleCancel}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView style={styles.container}>
          <View style={styles.editingBanner}>
            <Text style={styles.editingText}>You are editing this expense</Text>
          </View>
          
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {/* Description */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <FileText size={16} color="#666" />
                <Text style={styles.inputLabel}>Description *</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter expense description"
                value={expense.description}
                onChangeText={(text) => setExpense({ ...expense, description: text })}
              />
            </View>
            
            {/* Amount */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <DollarSign size={16} color="#666" />
                <Text style={styles.inputLabel}>Amount *</Text>
              </View>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={expense.amount ? expense.amount.toString() : ""}
                  onChangeText={handleAmountChange}
                />
              </View>
            </View>
            
            {/* Category */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Tag size={16} color="#666" />
                <Text style={styles.inputLabel}>Category *</Text>
              </View>
              <TouchableOpacity 
                style={styles.selectorInput}
                onPress={openCategorySelector}
              >
                {selectedCategory ? (
                  <View style={styles.selectedCategoryContainer}>
                    <View style={[styles.categoryColorDot, { backgroundColor: selectedCategory.color }]} />
                    <Text style={styles.inputText}>{selectedCategory.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select category</Text>
                )}
                <ChevronDown size={20} color="#999" />
              </TouchableOpacity>
            </View>
            
            {/* Date */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Calendar size={16} color="#666" />
                <Text style={styles.inputLabel}>Date *</Text>
              </View>
              <TouchableOpacity 
                style={styles.selectorInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {expense.date ? new Date(expense.date).toLocaleDateString() : "Select date"}
                </Text>
                <ChevronDown size={20} color="#999" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={expense.date ? new Date(expense.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            
            {/* Payment Method */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <CreditCard size={16} color="#666" />
                <Text style={styles.inputLabel}>Payment Method</Text>
              </View>
              <TouchableOpacity 
                style={styles.selectorInput}
                onPress={openPaymentMethodSelector}
              >
                <Text style={expense.paymentMethod ? styles.inputText : styles.placeholderText}>
                  {expense.paymentMethod || "Select payment method"}
                </Text>
                <ChevronDown size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            {/* Vendor */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Vendor/Payee</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter vendor name"
                value={expense.vendor || ""}
                onChangeText={(text) => setExpense({ ...expense, vendor: text })}
              />
            </View>
            
            {/* Reference Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reference/Receipt #</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter reference number"
                value={expense.reference || ""}
                onChangeText={(text) => setExpense({ ...expense, reference: text })}
              />
            </View>
            
            {/* Tax Deductible */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Tax Deductible</Text>
                <Text style={styles.switchDescription}>Mark this expense as tax deductible</Text>
              </View>
              <Switch
                value={isTaxDeductible}
                onValueChange={setIsTaxDeductible}
                trackColor={{ false: "#e0e0e0", true: `${Colors.primary}80` }}
                thumbColor={isTaxDeductible ? Colors.primary : "#f4f3f4"}
              />
            </View>
            
            {/* Reimbursable */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Reimbursable</Text>
                <Text style={styles.switchDescription}>Mark this expense as reimbursable</Text>
              </View>
              <Switch
                value={isReimbursable}
                onValueChange={setIsReimbursable}
                trackColor={{ false: "#e0e0e0", true: `${Colors.primary}80` }}
                thumbColor={isReimbursable ? Colors.primary : "#f4f3f4"}
              />
            </View>
          </View>
          
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Notes & Attachments</Text>
            
            {/* Notes */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add notes about this expense"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={expense.notes || ""}
                onChangeText={(text) => setExpense({ ...expense, notes: text })}
              />
            </View>
            
            {/* Receipt */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Receipt</Text>
              {expense.receipt ? (
                <View style={styles.receiptContainer}>
                  <Text style={styles.receiptText}>Receipt attached</Text>
                  <TouchableOpacity
                    style={styles.removeReceiptButton}
                    onPress={() => setExpense({ ...expense, receipt: undefined })}
                  >
                    <X size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.attachReceiptButton}>
                  <Camera size={20} color={Colors.primary} />
                  <Text style={styles.attachReceiptText}>Attach Receipt</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Update Expense</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Bottom Sheet for Category Selection */}
        <BottomSheetSelector ref={categoryBottomSheetRef}>
          <CategorySelector
            categories={expenseCategories as Category[]}
            onSelectCategory={(category: Category) => handleCategorySelect(category as ExpenseCategory)}
            type="expense"
          />
        </BottomSheetSelector>

        {/* Bottom Sheet for Payment Method Selection */}
        <BottomSheetSelector ref={paymentMethodBottomSheetRef} height={400}>
          <PaymentMethodSelector
            selectedMethod={expense.paymentMethod || ""}
            onSelectPaymentMethod={handlePaymentMethodSelect}
          />
        </BottomSheetSelector>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editingBanner: {
    backgroundColor: "#fef3c7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 4,
  },
  editingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#92400e",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    color: "#444",
    fontWeight: "500",
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
  },
  currencySymbol: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#444",
  },
  switchDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  receiptContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  receiptText: {
    fontSize: 16,
    color: "#333",
  },
  removeReceiptButton: {
    padding: 4,
  },
  attachReceiptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 14,
  },
  attachReceiptText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 14,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  selectorInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedCategoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  inputText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
  },
});