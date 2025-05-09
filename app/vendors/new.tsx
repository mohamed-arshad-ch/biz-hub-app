import React, { useState } from "react";
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
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  X,
  Save,
  Camera
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { validateEmail, validatePhone } from "@/utils/validation";
import { addVendor } from "@/utils/asyncStorageUtils";
import SnackBar from "@/components/SnackBar";
import { Vendor } from "@/types/vendor";

export default function NewVendorScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  // Form sections expanded state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: false,
    financial: false,
    product: false,
    additional: false,
  });
  
  // Form data
  const [formData, setFormData] = useState<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    notes: "",
    outstandingBalance: 0,
    totalPurchases: 0,
    status: "active",
    creditLimit: 0,
    paymentTerms: "Net 30",
    category: "",
    tags: [],
    contactPerson: "",
    taxId: "",
    website: "",
    bankDetails: "",
    productCategories: []
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
    
    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.company.trim()) {
      newErrors.company = "Company name is required";
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    // Financial information validation
    if (formData.creditLimit && isNaN(Number(formData.creditLimit))) {
      newErrors.creditLimit = "Credit limit must be a number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      // Form has validation errors
      setSnackbarMessage("Please fix the errors before saving");
      setSnackbarVisible(true);
      
      // Expand sections with errors
      const errorFields = Object.keys(errors);
      const newExpandedSections = { ...expandedSections };
      
      if (errorFields.some(field => ["name", "company", "category"].includes(field))) {
        newExpandedSections.basic = true;
      }
      
      if (errorFields.some(field => ["contactPerson", "phone", "email", "address"].includes(field))) {
        newExpandedSections.contact = true;
      }
      
      if (errorFields.some(field => ["paymentTerms", "creditLimit", "outstandingBalance"].includes(field))) {
        newExpandedSections.financial = true;
      }
      
      setExpandedSections(newExpandedSections);
      return;
    }

    setIsLoading(true);
    try {
      // Create new vendor
      await addVendor(formData);
      
      // Success
      setSnackbarMessage("Vendor created successfully");
      setSnackbarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.replace("/vendors");
      }, 1000);
    } catch (error) {
      console.error("Error creating vendor:", error);
      setSnackbarMessage("Failed to create vendor");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        {
          text: "Continue Editing",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  // Determine the border bottom width for section headers
  const getBorderBottomWidth = (section: keyof typeof expandedSections): number => {
    return expandedSections[section] ? 1 : 0;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Vendor",
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
          <Text style={{ marginTop: 16, color: '#666' }}>
            Creating vendor...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView style={styles.scrollView}>
            {/* Basic Information Section */}
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
                    <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      value={formData.name}
                      onChangeText={(text) => handleInputChange("name", text)}
                      placeholder="Enter vendor name"
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>{errors.name}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Company <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors.company && styles.inputError]}
                      value={formData.company}
                      onChangeText={(text) => handleInputChange("company", text)}
                      placeholder="Enter company name"
                    />
                    {errors.company && (
                      <Text style={styles.errorText}>{errors.company}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Category</Text>
                    <TextInput
                      style={[styles.input, errors.category && styles.inputError]}
                      value={formData.category}
                      onChangeText={(text) => handleInputChange("category", text)}
                      placeholder="Enter vendor category"
                    />
                    {errors.category && (
                      <Text style={styles.errorText}>{errors.category}</Text>
                    )}
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
                </View>
              )}
            </View>
            
            {/* Contact Information Section */}
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
                    <Text style={styles.label}>Contact Person</Text>
                    <TextInput
                      style={[styles.input, errors.contactPerson && styles.inputError]}
                      value={formData.contactPerson}
                      onChangeText={(text) => handleInputChange("contactPerson", text)}
                      placeholder="Enter contact person name"
                    />
                    {errors.contactPerson && (
                      <Text style={styles.errorText}>{errors.contactPerson}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={[styles.input, errors.phone && styles.inputError]}
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
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
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
                    <Text style={styles.label}>Website</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.website}
                      onChangeText={(text) => handleInputChange("website", text)}
                      placeholder="Enter website URL"
                      keyboardType="url"
                      autoCapitalize="none"
                    />
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
                      <Text style={styles.label}>ZIP/Postal Code</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.zipCode}
                        onChangeText={(text) => handleInputChange("zipCode", text)}
                        placeholder="ZIP Code"
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
                </View>
              )}
            </View>
            
            {/* Financial Information Section */}
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
                    <Text style={styles.label}>Payment Terms</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.paymentTerms}
                      onChangeText={(text) => handleInputChange("paymentTerms", text)}
                      placeholder="Select payment terms"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Credit Limit</Text>
                    <TextInput
                      style={[styles.input, errors.creditLimit && styles.inputError]}
                      value={formData.creditLimit ? formData.creditLimit.toString() : ""}
                      onChangeText={(text) => handleInputChange("creditLimit", Number(text) || 0)}
                      placeholder="Enter credit limit"
                      keyboardType="numeric"
                    />
                    {errors.creditLimit && (
                      <Text style={styles.errorText}>{errors.creditLimit}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Opening Balance</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.outstandingBalance ? formData.outstandingBalance.toString() : ""}
                      onChangeText={(text) => handleInputChange("outstandingBalance", Number(text) || 0)}
                      placeholder="Enter opening balance"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tax/VAT ID</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.taxId}
                      onChangeText={(text) => handleInputChange("taxId", text)}
                      placeholder="Enter tax or VAT ID"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Bank Account Details</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.bankDetails}
                      onChangeText={(text) => handleInputChange("bankDetails", text)}
                      placeholder="Enter bank account details"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              )}
            </View>
            
            {/* Product/Service Information Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.sectionHeader,
                  { borderBottomWidth: getBorderBottomWidth("product") }
                ]}
                onPress={() => toggleSection("product")}
              >
                <Text style={styles.sectionTitle}>Product/Service Information</Text>
                {expandedSections.product ? (
                  <ChevronUp size={20} color="#333" />
                ) : (
                  <ChevronDown size={20} color="#333" />
                )}
              </TouchableOpacity>
              
              {expandedSections.product && (
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Products/Services Provided</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.productCategories ? formData.productCategories.join(", ") : ""}
                      onChangeText={(text) => handleInputChange("productCategories", text.split(", ").map(item => item.trim()))}
                      placeholder="Enter products or services separated by commas"
                    />
                  </View>
                </View>
              )}
            </View>
            
            {/* Additional Information Section */}
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
                    <Text style={styles.label}>Tags/Labels</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.tags ? formData.tags.join(", ") : ""}
                      onChangeText={(text) => handleInputChange("tags", text.split(", ").map(item => item.trim()))}
                      placeholder="Enter tags separated by commas"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes/Remarks</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.notes}
                      onChangeText={(text) => handleInputChange("notes", text)}
                      placeholder="Enter any additional notes"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
          
          <SnackBar
            visible={snackbarVisible}
            message={snackbarMessage}
            onDismiss={() => setSnackbarVisible(false)}
          />
        </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
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
  required: {
    color: "#ea4335",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ea4335",
  },
  errorText: {
    color: "#ea4335",
    fontSize: 14,
    marginTop: 4,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusOption: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  statusOptionTextActive: {
    color: "#fff",
  },
  textArea: {
    minHeight: 100,
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
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});