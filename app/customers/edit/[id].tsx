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
  ActivityIndicator,
  StatusBar,
  Switch,
  SafeAreaView
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  X,
  Save,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
  FileText,
  Tag,
  CreditCard,
  Clock
} from "lucide-react-native";
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as dbCustomer from '@/db/customer';
import * as schema from '@/db/schema';

import Colors from "@/constants/colors";
import { validateEmail, validatePhone } from "@/utils/validation";
import SnackBar from "@/components/SnackBar";
import { Customer } from "@/types/customer";

// Extended Customer type that includes the type property
interface CustomerWithType extends Customer {
  type: 'Business' | 'Individual';
}

// Mock customers data for demonstration
const mockCustomers: { [key: string]: CustomerWithType } = {
  '1': {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, Suite 100',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94107',
    country: 'USA',
    company: 'Acme Corporation',
    notes: 'Key client for enterprise solutions',
    outstandingBalance: 2450.75,
    totalPurchases: 15780.50,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-05-10'),
    category: 'Enterprise',
    tags: ['vip', 'tech', 'enterprise'],
    contactPerson: 'John Doe',
    taxId: 'TX-123456789',
    paymentTerms: 'Net 30',
    creditLimit: 10000,
    status: 'active',
    type: 'Business',
  },
  '2': {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 987-6543',
    address: '456 Main St, Apt 4B',
    city: 'Boston',
    state: 'MA',
    zipCode: '02110',
    country: 'USA',
    company: '',
    notes: 'Prefers email communication',
    outstandingBalance: 350.50,
    totalPurchases: 1250.00,
    createdAt: new Date('2023-04-10'),
    updatedAt: new Date('2023-05-01'),
    category: 'Individual',
    tags: ['retail'],
    contactPerson: '',
    taxId: '',
    paymentTerms: 'Net 15',
    creditLimit: 1000,
    status: 'active',
    type: 'Individual',
  },
  '3': {
    id: '3',
    name: 'Global Services LLC',
    email: 'info@globalservices.co',
    phone: '+1 (555) 567-8901',
    address: '789 Corporate Pkwy',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60611',
    country: 'USA',
    company: 'Global Services LLC',
    notes: 'Multinational client with offices worldwide',
    outstandingBalance: 0,
    totalPurchases: 32540.75,
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-04-28'),
    category: 'Enterprise',
    tags: ['corporate', 'international'],
    contactPerson: 'Robert Johnson',
    taxId: 'TX-987654321',
    paymentTerms: 'Net 45',
    creditLimit: 50000,
    status: 'active',
    type: 'Business',
  },
  '4': {
    id: '4',
    name: 'Michael Williams',
    email: 'michael.williams@example.com',
    phone: '+1 (555) 234-5678',
    address: '567 Main St, Apt 4B',
    city: 'Boston',
    state: 'MA',
    zipCode: '02110',
    country: 'USA',
    company: '',
    notes: 'Prefers communication via email',
    outstandingBalance: 350.50,
    totalPurchases: 1250.00,
    createdAt: new Date('2023-04-10'),
    updatedAt: new Date('2023-05-01'),
    category: 'Individual',
    tags: ['retail'],
    contactPerson: '',
    taxId: '',
    paymentTerms: 'Net 15',
    creditLimit: 0,
    status: 'active',
    type: 'Individual',
  },
  '5': {
    id: '5',
    name: 'Emma Brown',
    email: 'emma.brown@example.com',
    phone: '+1 (555) 345-6789',
    address: '890 Oak Ave',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    country: 'USA',
    company: '',
    notes: 'Regular client for consulting services',
    outstandingBalance: 0,
    totalPurchases: 4325.50,
    createdAt: new Date('2023-03-25'),
    updatedAt: new Date('2023-04-15'),
    category: 'Individual',
    tags: ['consulting', 'regular'],
    contactPerson: '',
    taxId: '',
    paymentTerms: 'Net 15',
    creditLimit: 2000,
    status: 'inactive',
    type: 'Individual',
  }
};

type CustomerType = 'Individual' | 'Business';

// Extend the form data type to include 'type'
interface CustomerFormData extends Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> {
  type: CustomerType;
}

export default function EditCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
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
  
  // Form data with updated type
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    company: "",
    type: "Individual", // Default value
    status: "active",
    category: "",
    notes: "",
    tags: [],
    outstandingBalance: 0,
    totalPurchases: 0,
    paymentTerms: "",
    creditLimit: 0,
    contactPerson: "",
    taxId: "",
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
      setError('Customer ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const dbCustomerData = await dbCustomer.getCustomerById(Number(id));
      
      if (dbCustomerData) {
        // Set form data from customer
        setFormData({
          name: dbCustomerData.name,
          email: dbCustomerData.email || "",
          phone: dbCustomerData.phone || "",
          address: dbCustomerData.address || "",
          city: dbCustomerData.city || "",
          state: dbCustomerData.state || "",
          zipCode: dbCustomerData.zipCode || "",
          country: dbCustomerData.country || "",
          company: dbCustomerData.company || "",
          type: dbCustomerData.company ? "Business" : "Individual",
          status: (dbCustomerData.status as 'active' | 'inactive' | 'blocked') || "active",
          category: dbCustomerData.category || "",
          notes: dbCustomerData.notes || "",
          tags: dbCustomerData.tags ? dbCustomerData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          outstandingBalance: dbCustomerData.outstandingBalance || 0,
          totalPurchases: dbCustomerData.totalPurchases || 0,
          paymentTerms: dbCustomerData.paymentTerms || "",
          creditLimit: dbCustomerData.creditLimit || 0,
          contactPerson: dbCustomerData.contactPerson || "",
          taxId: dbCustomerData.taxId || "",
        });
        setError(null);
      } else {
        setError('Customer not found');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      setError('Failed to load customer data');
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
      setSnackbarMessage("Please fix the errors in the form");
      setShowSnackbar(true);
      return;
    }
    
    if (!id) {
      setError('Customer ID is required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create updated customer object with proper data mapping
      const updatedCustomer = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        company: formData.company,
        notes: formData.notes,
        outstandingBalance: formData.outstandingBalance,
        totalPurchases: formData.totalPurchases,
        category: formData.category,
        tags: (formData.tags || []).join(','), // Convert array to comma-separated string
        contactPerson: formData.contactPerson,
        taxId: formData.taxId,
        paymentTerms: formData.paymentTerms,
        creditLimit: formData.creditLimit,
        status: formData.status,
      };

      // Update customer in database with proper ID parameter
      await dbCustomer.updateCustomer(Number(id), updatedCustomer);
      
      setIsSaving(false);
      setSnackbarMessage("Customer updated successfully");
      setShowSnackbar(true);
      
      // Navigate back after a delay
      setTimeout(() => {
        router.replace(`/customers/${id}`);
      }, 1500);
      
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
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading customer data...</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Customer</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {isSaving ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Updating customer...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
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
            
            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <View style={styles.inputWithIcon}>
                  <Phone size={20} color={Colors.text.secondary} />
                  <TextInput
                    style={[
                      styles.iconInput,
                      errors.phone ? styles.inputError : null,
                    ]}
                    value={formData.phone}
                    onChangeText={(text) => handleInputChange("phone", text)}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWithIcon}>
                  <Mail size={20} color={Colors.text.secondary} />
                  <TextInput
                    style={[
                      styles.iconInput,
                      errors.email ? styles.inputError : null,
                    ]}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange("email", text)}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <View style={styles.inputWithIcon}>
                  <MapPin size={20} color={Colors.text.secondary} />
                  <TextInput
                    style={styles.iconInput}
                    value={formData.address}
                    onChangeText={(text) => handleInputChange("address", text)}
                    placeholder="Enter street address"
                  />
                </View>
              </View>
              
              <View style={styles.rowInputs}>
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
              
              <View style={styles.rowInputs}>
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
            
            {/* Financial Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financial Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Credit Limit</Text>
                <View style={styles.inputWithIcon}>
                  <CreditCard size={20} color={Colors.text.secondary} />
                  <TextInput
                    style={styles.iconInput}
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
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Terms</Text>
                <View style={styles.inputWithIcon}>
                  <Clock size={20} color={Colors.text.secondary} />
                  <TextInput
                    style={styles.iconInput}
                    value={formData.paymentTerms}
                    onChangeText={(text) => 
                      handleInputChange('paymentTerms', text)
                    }
                    placeholder="Enter payment terms (e.g., Net 30)"
                  />
                </View>
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
            
            {/* Additional Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              
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
            
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
        
        <SnackBar
          visible={showSnackbar}
          message={snackbarMessage}
          onDismiss={() => setShowSnackbar(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.primary + '80',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.default,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background.default,
  },
  iconInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  inputError: {
    borderColor: Colors.negative || '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: Colors.negative,
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.default,
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
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: Colors.primary + '20', // 20% opacity
  },
  statusOptionText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusOptionTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 