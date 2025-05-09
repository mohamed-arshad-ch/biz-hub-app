import React, { useState, useEffect } from "react";
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
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Camera,
  Plus,
  X,
  Save
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { validateEmail, validatePhone } from "@/utils/validation";
import { getVendorById, updateVendor } from "@/utils/asyncStorageUtils";
import SnackBar from "@/components/SnackBar";
import { Vendor } from "@/types/vendor";

export default function EditVendorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Form sections expanded state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: true,
    financial: false,
    product: false,
    additional: false,
  });
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    category: "",
    contactPerson: "",
    status: "active" as "active" | "inactive" | "blocked",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    paymentTerms: "",
    creditLimit: "",
    outstandingBalance: "",
    taxId: "",
    bankDetails: "",
    productCategories: [] as string[],
    tags: [] as string[],
    notes: "",
    deliveryTime: "",
    minimumOrder: ""
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Load vendor data
  useEffect(() => {
    if (id) {
      loadVendorData();
    }
  }, [id]);
  
  const loadVendorData = async () => {
    if (!id) {
      setError("Vendor ID is required");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const vendorData = await getVendorById(id);
      
      if (!vendorData) {
        setError("Vendor not found");
      } else {
        // Transform vendor data to form data
        setFormData({
          name: vendorData.name || "",
          company: vendorData.company || "",
          category: vendorData.category || "",
          contactPerson: vendorData.contactPerson || "",
          status: vendorData.status,
          phone: vendorData.phone || "",
          email: vendorData.email || "",
          website: vendorData.website || "",
          address: vendorData.address || "",
          city: vendorData.city || "",
          state: vendorData.state || "",
          zipCode: vendorData.zipCode || "",
          country: vendorData.country || "",
          paymentTerms: vendorData.paymentTerms || "",
          creditLimit: vendorData.creditLimit ? vendorData.creditLimit.toString() : "",
          outstandingBalance: vendorData.outstandingBalance ? vendorData.outstandingBalance.toString() : "",
          taxId: vendorData.taxId || "",
          bankDetails: vendorData.bankDetails || "",
          productCategories: vendorData.productCategories || [],
          tags: vendorData.tags || [],
          notes: vendorData.notes || "",
          deliveryTime: "",
          minimumOrder: ""
        });
        setError(null);
      }
    } catch (error) {
      console.error("Error loading vendor:", error);
      setError("Failed to load vendor data");
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
    
    if (!formData.company.trim()) {
      newErrors.company = "Company name is required";
    }
    
    // Contact information validation
    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    // Financial information validation
    if (formData.outstandingBalance && isNaN(Number(formData.outstandingBalance))) {
      newErrors.outstandingBalance = "Outstanding balance must be a number";
    }
    
    if (formData.creditLimit && isNaN(Number(formData.creditLimit))) {
      newErrors.creditLimit = "Credit limit must be a number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      // Show error message
      setSnackbarMessage("Please fix the errors before saving");
      setSnackbarVisible(true);
      return;
    }

    if (!id) {
      setSnackbarMessage("Invalid vendor ID");
      setSnackbarVisible(true);
      return;
    }

    setIsSaving(true);
    try {
      // Transform form data back to vendor data
      const vendorData: Partial<Vendor> = {
        name: formData.name,
        company: formData.company,
        category: formData.category,
        contactPerson: formData.contactPerson,
        status: formData.status,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        paymentTerms: formData.paymentTerms,
        creditLimit: formData.creditLimit ? Number(formData.creditLimit) : undefined,
        outstandingBalance: formData.outstandingBalance ? Number(formData.outstandingBalance) : 0,
        taxId: formData.taxId,
        bankDetails: formData.bankDetails,
        productCategories: formData.productCategories,
        tags: formData.tags,
        notes: formData.notes,
      };
      
      await updateVendor(id, vendorData);
      
      setSnackbarMessage("Vendor updated successfully");
      setSnackbarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.replace(`/vendors/${id}`);
      }, 1000);
    } catch (error) {
      console.error("Error updating vendor:", error);
      setSnackbarMessage("Failed to update vendor");
      setSnackbarVisible(true);
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
        <Text style={{ marginTop: 16, color: '#666' }}>Loading vendor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error}</Text>
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
          title: "Edit Vendor",
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
            Updating vendor...
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          <ScrollView>
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
                    <Text style={styles.label}>Name *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.name ? styles.inputError : null,
                      ]}
                      value={formData.name}
                      onChangeText={(text) => handleInputChange("name", text)}
                      placeholder="Enter vendor name"
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>{errors.name}</Text>
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Company *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.company ? styles.inputError : null,
                      ]}
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
                      style={styles.input}
                      value={formData.category}
                      onChangeText={(text) => handleInputChange("category", text)}
                      placeholder="Enter vendor category"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Contact Person</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.contactPerson}
                      onChangeText={(text) => handleInputChange("contactPerson", text)}
                      placeholder="Enter contact person name"
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
                    <Text style={styles.label}>Phone Number *</Text>
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
                    <Text style={styles.label}>Email Address</Text>
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
                      style={[
                        styles.input,
                        errors.creditLimit ? styles.inputError : null,
                      ]}
                      value={formData.creditLimit}
                      onChangeText={(text) => handleInputChange("creditLimit", text)}
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
                      style={[
                        styles.input,
                        errors.outstandingBalance ? styles.inputError : null,
                      ]}
                      value={formData.outstandingBalance}
                      onChangeText={(text) => handleInputChange("outstandingBalance", text)}
                      placeholder="Enter opening balance"
                      keyboardType="numeric"
                    />
                    {errors.outstandingBalance && (
                      <Text style={styles.errorText}>{errors.outstandingBalance}</Text>
                    )}
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
                      value={formData.productCategories.join(", ")}
                      onChangeText={(text) => handleInputChange("productCategories", text.split(", ").map(item => item.trim()))}
                      placeholder="Enter products or services separated by commas"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Default Delivery Time</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.deliveryTime}
                      onChangeText={(text) => handleInputChange("deliveryTime", text)}
                      placeholder="Enter delivery time (e.g., 3-5 days)"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Minimum Order Quantity/Value</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.minimumOrder}
                      onChangeText={(text) => handleInputChange("minimumOrder", text)}
                      placeholder="Enter minimum order"
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
                      value={formData.tags.join(", ")}
                      onChangeText={(text) => handleInputChange("tags", text.split(", ").map(item => item.trim()))}
                      placeholder="Enter tags separated by commas"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes/Remarks</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                      ]}
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
        </View>
      )}
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorMessage: {
    color: '#ea4335',
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ea4335',
  },
  errorText: {
    color: '#ea4335',
    fontSize: 14,
    marginTop: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusOption: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusOptionTextActive: {
    color: '#fff',
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