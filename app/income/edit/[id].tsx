import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
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
import BottomSheetSelector, { BottomSheetSelectorRef } from "@/components/BottomSheetSelector";
import CategorySelector, { Category } from "@/components/CategorySelector";
import PaymentMethodSelector, { defaultPaymentMethods } from "@/components/PaymentMethodSelector";
import { getIncomeCategories } from "@/utils/categoryStorageUtils";
import { IncomeCategory } from "@/types/category";

import Colors from "@/constants/colors";
import { getIncomeById } from "@/mocks/incomeData";
import { IncomeRecord } from "@/types/income";

export default function EditIncomeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPaymentMethodPicker, setShowPaymentMethodPicker] = useState(false);
  
  const [errors, setErrors] = useState<{
    source?: string;
    amount?: string;
    category?: string;
  }>({});

  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IncomeCategory | null>(null);
  
  const categoryBottomSheetRef = useRef<BottomSheetSelectorRef>(null);
  const paymentMethodBottomSheetRef = useRef<BottomSheetSelectorRef>(null);

  const paymentMethods = [
    "Cash",
    "Credit Card",
    "Debit Card",
    "Bank Transfer",
    "Check",
    "PayPal",
    "Venmo",
    "Other"
  ];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getIncomeCategories();
        setIncomeCategories(categories);
      } catch (error) {
        console.error('Error loading income categories:', error);
      }
    };
    
    loadCategories();
  }, []);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const incomeData = getIncomeById(id);
        if (incomeData) {
          setSource(incomeData.source);
          setAmount(incomeData.amount.toString());
          setCategory(incomeData.category);
          setDate(new Date(incomeData.date));
          setPaymentMethod(incomeData.paymentMethod || "");
          setReference(incomeData.reference || "");
          setNotes(incomeData.notes || "");

          // Find the corresponding category object
          const categoryObj = incomeCategories.find(cat => cat.name === incomeData.category);
          if (categoryObj) {
            setSelectedCategory(categoryObj);
          }
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, incomeCategories]);

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
    
    if (!category.trim()) {
      newErrors.category = "Category is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = () => {
    if (!validateForm()) {
      return;
    }
    
    // In a real app, you would call an API to update the income record
    // For now, just show a success message and navigate back
    
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

  const openCategorySelector = () => {
    categoryBottomSheetRef.current?.open();
  };

  const openPaymentMethodSelector = () => {
    paymentMethodBottomSheetRef.current?.open();
  };

  const handleCategorySelect = (selectedCat: IncomeCategory) => {
    setSelectedCategory(selectedCat);
    setCategory(selectedCat.name);
    categoryBottomSheetRef.current?.close();
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    paymentMethodBottomSheetRef.current?.close();
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
          title: "Edit Income",
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
                {selectedCategory ? (
                  <View style={styles.selectedCategoryContainer}>
                    <View 
                      style={[
                        styles.categoryColorDot, 
                        { backgroundColor: selectedCategory.color }
                      ]} 
                    />
                    <Text style={styles.inputText}>{selectedCategory.name}</Text>
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
                  {date.toLocaleDateString()}
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
                <Text style={styles.label}>Reference (Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter reference number"
                value={reference}
                onChangeText={setReference}
              />
            </View>
            
            {/* Notes Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <FileText size={16} color="#666" />
                <Text style={styles.label}>Notes (Optional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes or description"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdate}
            >
              <Text style={styles.saveButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheetSelector ref={categoryBottomSheetRef}>
        <CategorySelector
          categories={incomeCategories as Category[]}
          onSelectCategory={(category: Category) => handleCategorySelect(category as IncomeCategory)}
          type="income"
        />
      </BottomSheetSelector>

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    padding: 16,
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
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ea4335",
  },
  errorText: {
    color: "#ea4335",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerInput: {
    justifyContent: "center",
  },
  inputText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    fontSize: 16,
    color: "#aaa",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
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
});