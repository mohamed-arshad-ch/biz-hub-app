import React, { useState, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  DollarSign, 
  User, 
  CreditCard, 
  Hash, 
  FileText,
  Check
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import Colors from "@/constants/colors";
import { getIncomeCategories } from "@/utils/categoryStorageUtils";
import { IncomeCategory } from "@/types/category";
import BottomSheetSelector, { BottomSheetSelectorRef } from "@/components/BottomSheetSelector";
import CategorySelector from "@/components/CategorySelector";
import PaymentMethodSelector, { defaultPaymentMethods } from "@/components/PaymentMethodSelector";

export default function AddIncomeScreen() {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<IncomeCategory | null>(null);
  const [date, setDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const categoryBottomSheetRef = useRef<BottomSheetSelectorRef>(null);
  const paymentMethodBottomSheetRef = useRef<BottomSheetSelectorRef>(null);
  
  const [errors, setErrors] = useState<{
    source?: string;
    amount?: string;
    category?: string;
  }>({});

  // Load income categories from AsyncStorage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getIncomeCategories();
        setIncomeCategories(categories);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading income categories:', error);
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, []);

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
    // For now, just show a success message and navigate back
    
    Alert.alert(
      "Success",
      "Income record saved successfully",
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

  const openCategorySelector = () => {
    categoryBottomSheetRef.current?.open();
  };

  const openPaymentMethodSelector = () => {
    paymentMethodBottomSheetRef.current?.open();
  };

  const handleCategorySelect = (selectedCategory: IncomeCategory) => {
    setCategory(selectedCategory);
    categoryBottomSheetRef.current?.close();
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    paymentMethodBottomSheetRef.current?.close();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Add Income",
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
          <View style={styles.formContainer}>
            {/* Source Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <User size={16} color="#666" />
                <Text style={styles.label}>Source</Text>
              </View>
              <TextInput
                style={[styles.input, errors.source ? styles.inputError : null]}
                placeholder="Enter source or payer name"
                value={source}
                onChangeText={setSource}
              />
              {errors.source ? (
                <Text style={styles.errorText}>{errors.source}</Text>
              ) : null}
            </View>
            
            {/* Amount Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <DollarSign size={16} color="#666" />
                <Text style={styles.label}>Amount</Text>
              </View>
              <TextInput
                style={[styles.input, errors.amount ? styles.inputError : null]}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              {errors.amount ? (
                <Text style={styles.errorText}>{errors.amount}</Text>
              ) : null}
            </View>
            
            {/* Category Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Tag size={16} color="#666" />
                <Text style={styles.label}>Category</Text>
              </View>
              <TouchableOpacity
                style={[styles.input, styles.pickerInput, errors.category ? styles.inputError : null]}
                onPress={openCategorySelector}
              >
                {category ? (
                  <View style={styles.selectedCategoryContainer}>
                    <View 
                      style={[
                        styles.categoryColorDot, 
                        { backgroundColor: category.color }
                      ]} 
                    />
                    <Text style={styles.inputText}>{category.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>
                    Select a category
                  </Text>
                )}
              </TouchableOpacity>
              {errors.category ? (
                <Text style={styles.errorText}>{errors.category}</Text>
              ) : null}
            </View>
            
            {/* Date Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Calendar size={16} color="#666" />
                <Text style={styles.label}>Date</Text>
              </View>
              <TouchableOpacity
                style={[styles.input, styles.pickerInput]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            
            {/* Payment Method Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <CreditCard size={16} color="#666" />
                <Text style={styles.label}>Payment Method</Text>
              </View>
              <TouchableOpacity
                style={[styles.input, styles.pickerInput]}
                onPress={openPaymentMethodSelector}
              >
                <Text style={paymentMethod ? styles.inputText : styles.placeholderText}>
                  {paymentMethod || "Select payment method"}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Reference Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Hash size={16} color="#666" />
                <Text style={styles.label}>Reference</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Invoice number or reference"
                value={reference}
                onChangeText={setReference}
              />
            </View>
            
            {/* Notes Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <FileText size={16} color="#666" />
                <Text style={styles.label}>Notes</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Check size={20} color="#fff" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Save Income</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Sheet for Category Selection */}
      <BottomSheetSelector ref={categoryBottomSheetRef}>
        <CategorySelector
          categories={incomeCategories}
          onSelectCategory={handleCategorySelect}
          type="income"
        />
      </BottomSheetSelector>

      {/* Bottom Sheet for Payment Method Selection */}
      <BottomSheetSelector ref={paymentMethodBottomSheetRef} height={400}>
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onSelectPaymentMethod={handlePaymentMethodSelect}
        />
      </BottomSheetSelector>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerButton: {
    padding: 8,
  },
  formContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: "#333333",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#f44336",
  },
  errorText: {
    color: "#f44336",
    marginTop: 4,
    fontSize: 12,
  },
  pickerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontSize: 16,
    color: "#333333",
  },
  placeholderText: {
    fontSize: 16,
    color: "#9e9e9e",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerContainer: {
    marginTop: 4,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333333",
  },
});