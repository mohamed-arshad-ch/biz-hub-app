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
  Check,
  Tag,
  DollarSign,
  CreditCard,
  FileText,
  User
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import Colors from "@/constants/colors";
import { getExpenseById } from "@/mocks/expensesData";
import { formatCurrency } from "@/utils/formatters";
import { ExpenseRecord } from "@/types/expenses";
import { getExpenseCategories } from "@/utils/categoryStorageUtils";
import { ExpenseCategory } from "@/types/category";
import BottomSheetSelector, { BottomSheetSelectorRef } from "@/components/BottomSheetSelector";
import CategorySelector from "@/components/CategorySelector";
import PaymentMethodSelector, { defaultPaymentMethods } from "@/components/PaymentMethodSelector";

export default function AddExpenseScreen() {
  const router = useRouter();
  const { duplicate } = useLocalSearchParams<{ duplicate?: string }>();
  
  const [isLoading, setIsLoading] = useState(!!duplicate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [expense, setExpense] = useState<Partial<ExpenseRecord>>({
    date: new Date(),
    amount: 0,
    description: "",
    category: "",
    paymentMethod: "",
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
    if (duplicate) {
      // Load expense data for duplication
      setTimeout(() => {
        const expenseToClone = getExpenseById(duplicate);
        if (expenseToClone) {
          // Create a new object without the id
          const { id, ...expenseData } = expenseToClone;
          setExpense({
            ...expenseData,
            date: new Date(), // Set current date
            description: `Copy of ${expenseData.description}`,
          });
          
          // Find the category object that matches the category name
          const category = expenseCategories.find(cat => cat.name === expenseData.category);
          if (category) {
            setSelectedCategory(category);
          }
        }
        setIsLoading(false);
      }, 500);
    }
  }, [duplicate, expenseCategories]);

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
    
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    
    // Save logic would go here
    
    // Show success message
    Alert.alert(
      "Success",
      "Expense saved successfully",
      [
        {
          text: "Add Another",
          onPress: () => {
            // Reset form
            setExpense({
              date: new Date(),
              amount: 0,
              description: "",
              category: "",
              paymentMethod: "",
            });
            setSelectedCategory(null);
            setIsTaxDeductible(false);
            setIsReimbursable(false);
          }
        },
        {
          text: "Done",
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
          title: "Add Expense",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
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
                  keyboardType="numeric"
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
                <Text style={styles.inputLabel}>Date</Text>
              </View>
              <TouchableOpacity
                style={styles.selectorInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {expense.date?.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
                <ChevronDown size={20} color="#999" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={expense.date || new Date()}
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
            
            {/* Tax Deductible Switch */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Tax Deductible</Text>
                <Text style={styles.switchHint}>Expense can be deducted from taxes</Text>
              </View>
              <Switch
                value={isTaxDeductible}
                onValueChange={setIsTaxDeductible}
                trackColor={{ false: "#e0e0e0", true: `${Colors.primary}80` }}
                thumbColor={isTaxDeductible ? Colors.primary : "#f4f4f4"}
              />
            </View>
            
            {/* Reimbursable Switch */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Reimbursable</Text>
                <Text style={styles.switchHint}>Expense can be reimbursed</Text>
              </View>
              <Switch
                value={isReimbursable}
                onValueChange={setIsReimbursable}
                trackColor={{ false: "#e0e0e0", true: `${Colors.primary}80` }}
                thumbColor={isReimbursable ? Colors.primary : "#f4f4f4"}
              />
            </View>
            
            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Check size={20} color="#fff" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Save Expense</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Bottom Sheet for Category Selection */}
        <BottomSheetSelector ref={categoryBottomSheetRef}>
          <CategorySelector
            categories={expenseCategories}
            onSelectCategory={handleCategorySelect}
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
    backgroundColor: "#f8f9fa",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  currencySymbol: {
    fontSize: 16,
    color: "#333",
    paddingLeft: 12,
    fontWeight: "500",
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  selectorInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 12,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: "#9e9e9e",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  switchHint: {
    fontSize: 13,
    color: "#888",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});