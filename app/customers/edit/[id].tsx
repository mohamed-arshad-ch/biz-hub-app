import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  X,
  Save
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { validateEmail, validatePhone } from "@/utils/validation";
import { getCustomerById, updateCustomer } from "@/utils/asyncStorageUtils";
import SnackBar from "@/components/SnackBar";
import { Customer } from "@/types/customer";

export default function EditCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Form sections expanded state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: false,
    financial: false,
    additional: false,
  });
  
  // Form data
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    company: "",
    notes: "",
    outstandingBalance: 0,
    totalPurchases: 0,
    status: "active",
    creditLimit: 0,
    paymentTerms: "Net 30",
    category: "",
    tags: [],
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Load customer data
  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);
  
  const loadCustomerData = async () => {
    if (!id) {
      setError("Customer ID is required");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const customerData = await getCustomerById(id);
      
      if (!customerData) {
        setError("Customer not found");
      } else {
        setFormData({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address || '',
          city: customerData.city || '',
          state: customerData.state || '',
          zipCode: customerData.zipCode || '',
          country: customerData.country || '',
          company: customerData.company || '',
          notes: customerData.notes || '',
          outstandingBalance: customerData.outstandingBalance,
          totalPurchases: customerData.totalPurchases,
          status: customerData.status,
          creditLimit: customerData.creditLimit || 0,
          paymentTerms: customerData.paymentTerms || 'Net 30',
          category: customerData.category || '',
          tags: customerData.tags || [],
          contactPerson: customerData.contactPerson || '',
          taxId: customerData.taxId || '',
          lastPurchaseDate: customerData.lastPurchaseDate,
        });
        setError(null);
      }
    } catch (error) {
      console.error("Error loading customer:", error);
      setError("Failed to load customer data");
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic information validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    // Contact information validation
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbarMessage("Please fix the errors before saving");
      setShowSnackbar(true);
      return;
    }

    if (!id) {
      setSnackbarMessage("Invalid customer ID");
      setShowSnackbar(true);
      return;
    }

    setIsSaving(true);
    try {
      await updateCustomer(id, formData);
      
      setSnackbarMessage("Customer updated successfully");
      setShowSnackbar(true);
      
      setTimeout(() => {
        router.replace(`/customers/${id}`);
      }, 1000);
    } catch (error) {
      console.error("Error updating customer:", error);
      setSnackbarMessage("Failed to update customer");
      setShowSnackbar(true);
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => router.back(),
        },
      ]
    );
  };

  // Determine the border bottom width for section headers
  const getBorderBottomWidth = (section: keyof typeof expandedSections): number => {
    return expandedSections[section] ? 1 : 0;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading customer...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Customer",
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.headerButton}
              >
                <X size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveButtonContainer}
                disabled={isSaving}
              >
                <Save size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      {isSaving ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 16, color: '#666' }}>
            Updating customer...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView style={styles.container}>
            {/* Basic Information */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.sectionHeader,
                  { borderBottomWidth: getBorderBottomWidth("basic") }
                ]}
                onPress={() => toggleSection("basic")}
              >
                <Text style={styles.sectionTitle}>Basic Information</Text>
                {expandedSections.basic ? (
                  <ChevronUp size={20} color="#333" />
                ) : (
                  <ChevronDown size={20} color="#333" />
                )}
              </TouchableOpacity>
              
              {expandedSections.basic && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Name *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.name ? styles.inputError : null,
                      ]}
                      value={formData.name}
                      onChangeText={(text) => handleInputChange("name", text)}
                      placeholder="Enter customer name"
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>{errors.name}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Company</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.company}
                      onChangeText={(text) => handleInputChange("company", text)}
                      placeholder="Enter company name"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Status</Text>
                    <View style={styles.statusContainer}>
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          formData.status === "active" ? styles.statusOptionActive : null,
                        ]}
                        onPress={() => handleInputChange("status", "active")}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            formData.status === "active" ? styles.statusOptionTextActive : null,
                          ]}
                        >
                          Active
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          formData.status === "inactive" ? styles.statusOptionActive : null,
                        ]}
                        onPress={() => handleInputChange("status", "inactive")}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            formData.status === "inactive" ? styles.statusOptionTextActive : null,
                          ]}
                        >
                          Inactive
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          formData.status === "blocked" ? styles.statusOptionActive : null,
                        ]}
                        onPress={() => handleInputChange("status", "blocked")}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            formData.status === "blocked" ? styles.statusOptionTextActive : null,
                          ]}
                        >
                          Blocked
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Category</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.category}
                      onChangeText={(text) => handleInputChange("category", text)}
                      placeholder="Enter category (optional)"
                    />
                  </View>
                </View>
              )}
            </View>
            
            {/* Contact Information */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.sectionHeader,
                  { borderBottomWidth: getBorderBottomWidth("contact") }
                ]}
                onPress={() => toggleSection("contact")}
              >
                <Text style={styles.sectionTitle}>Contact Information</Text>
                {expandedSections.contact ? (
                  <ChevronUp size={20} color="#333" />
                ) : (
                  <ChevronDown size={20} color="#333" />
                )}
              </TouchableOpacity>
              
              {expandedSections.contact && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.phone ? styles.inputError : null,
                      ]}
                      value={formData.phone}
                      onChangeText={(text) => handleInputChange("phone", text)}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                    />
                    {errors.phone && (
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.email ? styles.inputError : null,
                      ]}
                      value={formData.email}
                      onChangeText={(text) => handleInputChange("email", text)}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.address}
                      onChangeText={(text) => handleInputChange("address", text)}
                      placeholder="Enter street address"
                    />
                  </View>
                  
                  <View style={styles.rowContainer}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>City</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.city}
                        onChangeText={(text) => handleInputChange("city", text)}
                        placeholder="City"
                      />
                    </View>
                    
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>State/Province</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.state}
                        onChangeText={(text) => handleInputChange("state", text)}
                        placeholder="State"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.rowContainer}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Zip/Postal Code</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.zipCode}
                        onChangeText={(text) => handleInputChange("zipCode", text)}
                        placeholder="Zip code"
                      />
                    </View>
                    
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Country</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.country}
                        onChangeText={(text) => handleInputChange("country", text)}
                        placeholder="Country"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Contact Person</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.contactPerson || ""}
                      onChangeText={(text) => handleInputChange("contactPerson", text)}
                      placeholder="Enter contact person name"
                    />
                  </View>
                </View>
              )}
            </View>
            
            {/* Financial Information */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.sectionHeader,
                  { borderBottomWidth: getBorderBottomWidth("financial") }
                ]}
                onPress={() => toggleSection("financial")}
              >
                <Text style={styles.sectionTitle}>Financial Information</Text>
                {expandedSections.financial ? (
                  <ChevronUp size={20} color="#333" />
                ) : (
                  <ChevronDown size={20} color="#333" />
                )}
              </TouchableOpacity>
              
              {expandedSections.financial && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Outstanding Balance</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.outstandingBalance.toString()}
                      onChangeText={(text) => 
                        handleInputChange('outstandingBalance', 
                          isNaN(Number(text)) ? 0 : Number(text)
                        )
                      }
                      placeholder="Enter outstanding balance"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Credit Limit</Text>
                    <TextInput
                      style={styles.input}
                      value={(formData.creditLimit || 0).toString()}
                      onChangeText={(text) => 
                        handleInputChange('creditLimit', 
                          isNaN(Number(text)) ? 0 : Number(text)
                        )
                      }
                      placeholder="Enter credit limit"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Payment Terms</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.paymentTerms}
                      onChangeText={(text) => 
                        handleInputChange('paymentTerms', text)
                      }
                      placeholder="Enter payment terms (e.g., Net 30)"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tax ID</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.taxId || ""}
                      onChangeText={(text) => handleInputChange("taxId", text)}
                      placeholder="Enter tax ID"
                    />
                  </View>
                </View>
              )}
            </View>
            
            {/* Additional Information */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.sectionHeader,
                  { borderBottomWidth: getBorderBottomWidth("additional") }
                ]}
                onPress={() => toggleSection("additional")}
              >
                <Text style={styles.sectionTitle}>Additional Information</Text>
                {expandedSections.additional ? (
                  <ChevronUp size={20} color="#333" />
                ) : (
                  <ChevronDown size={20} color="#333" />
                )}
              </TouchableOpacity>
              
              {expandedSections.additional && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                      style={styles.textArea}
                      value={formData.notes}
                      onChangeText={(text) => handleInputChange("notes", text)}
                      placeholder="Additional notes about this customer"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tags</Text>
                    <TextInput
                      style={styles.input}
                      value={(formData.tags || []).join(', ')}
                      onChangeText={(text) => {
                        const tagsArray = text.split(',').map(tag => tag.trim());
                        handleInputChange('tags', tagsArray);
                      }}
                      placeholder="Comma separated tags"
                    />
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      
      <SnackBar
        visible={showSnackbar}
        message={snackbarMessage}
        onDismiss={() => setShowSnackbar(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: '#c62828',
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: Colors.primary + '20', // 20% opacity
  },
  statusOptionText: {
    fontSize: 14,
    color: '#666',
  },
  statusOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  headerButton: {
    padding: 8,
  },
  saveButtonContainer: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#c62828',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  }
}); 