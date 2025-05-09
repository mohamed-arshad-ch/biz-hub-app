import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Camera,
  Plus,
  X,
  ChevronRight,
  Save
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { validateEmail, validatePhone } from "@/utils/validation";
import SnackBar from "@/components/SnackBar";
import { Customer } from "@/types/customer";
import { addCustomer } from "@/utils/asyncStorageUtils";

export default function NewCustomerScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  // Form sections expanded state
  const [sections, setSections] = useState({
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
  
  const toggleSection = (section: keyof typeof sections) => {
    setSections({
      ...sections,
      [section]: !sections[section],
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
    
    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
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
      // Form has validation errors
      setSnackbarMessage("Please fix the errors before saving");
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      // Create new customer
      await addCustomer(formData);
      
      // Success
      setSnackbarMessage("Customer created successfully");
      setSnackbarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.replace("/customers");
      }, 1000);
    } catch (error) {
      console.error("Error creating customer:", error);
      setSnackbarMessage("Failed to create customer");
      setSnackbarVisible(true);
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard changes?",
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
  const getBorderBottomWidth = (sectionKey: keyof typeof sections) => {
    return !sections[sectionKey] ? 0 : 1;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Customer",
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.headerButton}
              >
                <X size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveButton}
                disabled={isLoading}
              >
                <Save size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 16, color: "#666" }}>
            Creating customer...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.container}>
            {/* Basic Information */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.sectionHeader,
                  { borderBottomWidth: getBorderBottomWidth("basic") },
                ]}
                onPress={() => toggleSection("basic")}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Basic Information</Text>
                {sections.basic ? (
                  <ChevronDown size={20} color="#666" />
                ) : (
                  <ChevronRight size={20} color="#666" />
                )}
              </TouchableOpacity>
              
              {sections.basic && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Name *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.name ? styles.inputError : null,
                      ]}
                      placeholder="Enter customer name"
                      value={formData.name}
                      onChangeText={(text) => handleInputChange("name", text)}
                    />
                    {errors.name ? (
                      <Text style={styles.errorText}>{errors.name}</Text>
                    ) : null}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Company</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter company name (optional)"
                      value={formData.company}
                      onChangeText={(text) => handleInputChange("company", text)}
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
                      placeholder="Enter category (optional)"
                      value={formData.category}
                      onChangeText={(text) => handleInputChange("category", text)}
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
                  { borderBottomWidth: getBorderBottomWidth("contact") },
                ]}
                onPress={() => toggleSection("contact")}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Contact Information</Text>
                {sections.contact ? (
                  <ChevronDown size={20} color="#666" />
                ) : (
                  <ChevronRight size={20} color="#666" />
                )}
              </TouchableOpacity>
              
              {sections.contact && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.phone ? styles.inputError : null,
                      ]}
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChangeText={(text) => handleInputChange("phone", text)}
                      keyboardType="phone-pad"
                    />
                    {errors.phone ? (
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    ) : null}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.email ? styles.inputError : null,
                      ]}
                      placeholder="Enter email address"
                      value={formData.email}
                      onChangeText={(text) => handleInputChange("email", text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {errors.email ? (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    ) : null}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter street address"
                      value={formData.address}
                      onChangeText={(text) => handleInputChange("address", text)}
                    />
                  </View>
                  
                  <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>City</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="City"
                        value={formData.city}
                        onChangeText={(text) => handleInputChange("city", text)}
                      />
                    </View>
                    
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>State/Province</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="State"
                        value={formData.state}
                        onChangeText={(text) => handleInputChange("state", text)}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Zip/Postal Code</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Zip code"
                        value={formData.zipCode}
                        onChangeText={(text) => handleInputChange("zipCode", text)}
                      />
                    </View>
                    
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Country</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Country"
                        value={formData.country}
                        onChangeText={(text) => handleInputChange("country", text)}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Contact Person</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter contact person name"
                      value={formData.contactPerson || ""}
                      onChangeText={(text) => handleInputChange("contactPerson", text)}
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
                  { borderBottomWidth: getBorderBottomWidth("financial") },
                ]}
                onPress={() => toggleSection("financial")}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Financial Information</Text>
                {sections.financial ? (
                  <ChevronDown size={20} color="#666" />
                ) : (
                  <ChevronRight size={20} color="#666" />
                )}
              </TouchableOpacity>
              
              {sections.financial && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Credit Limit</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter credit limit"
                      value={formData.creditLimit?.toString() || "0"}
                      onChangeText={(text) =>
                        handleInputChange("creditLimit", Number(text) || 0)
                      }
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Payment Terms</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter payment terms (e.g., Net 30)"
                      value={formData.paymentTerms}
                      onChangeText={(text) =>
                        handleInputChange("paymentTerms", text)
                      }
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tax ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter tax ID"
                      value={formData.taxId || ""}
                      onChangeText={(text) => handleInputChange("taxId", text)}
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
                  { borderBottomWidth: getBorderBottomWidth("additional") },
                ]}
                onPress={() => toggleSection("additional")}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Additional Information</Text>
                {sections.additional ? (
                  <ChevronDown size={20} color="#666" />
                ) : (
                  <ChevronRight size={20} color="#666" />
                )}
              </TouchableOpacity>
              
              {sections.additional && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter notes about this customer"
                      value={formData.notes}
                      onChangeText={(text) => handleInputChange("notes", text)}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tags (comma separated)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., vip, retail, new"
                      value={formData.tags?.join(", ") || ""}
                      onChangeText={(text) =>
                        handleInputChange(
                          "tags",
                          text.split(",").map((tag) => tag.trim())
                        )
                      }
                    />
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      
      {/* Snackbar */}
      {snackbarVisible && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
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
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sectionContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#c62828",
  },
  errorText: {
    color: "#c62828",
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statusOptionActive: {
    backgroundColor: Colors.primary + "20", // 20% opacity
  },
  statusOptionText: {
    fontSize: 14,
    color: "#666",
  },
  statusOptionTextActive: {
    color: Colors.primary,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSpacer: {
    height: 100,
  },
  snackbar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(50, 50, 50, 0.9)",
    borderRadius: 4,
    padding: 16,
    elevation: 4,
  },
  snackbarText: {
    color: "#fff",
    textAlign: "center",
  },
}); 