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
  ActivityIndicator,
  StatusBar
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Camera,
  Plus,
  X,
  Save,
  Phone,
  Mail,
  Globe,
  MapPin,
  Tag,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Info,
  Building2,
  AlertCircle
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { validateEmail, validatePhone } from "@/utils/validation";
import SnackBar from "@/components/SnackBar";
import { Vendor } from "@/types/vendor";

// Mock vendors data for demonstration
const mockVendors: { [key: string]: Vendor } = {
  '1': {
    id: '1',
    name: 'TechSuppliers Inc.',
    company: 'TechSuppliers Inc.',
    email: 'john@techsuppliers.com',
    phone: '+1 (555) 123-4567',
    address: '123 Supplier St, San Francisco, CA 94107',
    website: 'https://techsuppliers.com',
    notes: 'Primary supplier for electronics and technology products',
    status: 'active',
    paymentTerms: 'Net 30',
    taxIdentifier: 'TX-12345678',
    outstandingBalance: 5200.50,
    totalPurchases: 42800.75,
    category: 'Electronics',
    tags: ['technology', 'electronics', 'computers'],
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-05-15'),
    creditLimit: 20000
  },
  '2': {
    id: '2',
    name: 'FurniturePlus',
    company: 'FurniturePlus',
    email: 'sarah@furnitureplus.com',
    phone: '+1 (555) 987-6543',
    address: '456 Furniture Ave, Chicago, IL 60611',
    website: 'https://furnitureplus.com',
    notes: 'Office furniture and accessories supplier',
    status: 'active',
    paymentTerms: 'Net 45',
    taxIdentifier: 'TX-87654321',
    outstandingBalance: 0,
    totalPurchases: 18900.25,
    category: 'Furniture',
    tags: ['furniture', 'office', 'chairs'],
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-06-01'),
    creditLimit: 15000
  },
  '3': {
    id: '3',
    name: 'Global Shipping Services',
    company: 'Global Shipping Services',
    email: 'michael@globalshipping.com',
    phone: '+1 (555) 567-8901',
    address: '789 Logistics Pkwy, Miami, FL 33101',
    website: 'https://globalshipping.com',
    notes: 'International shipping and logistics provider',
    status: 'inactive',
    paymentTerms: 'Net 15',
    taxIdentifier: 'TX-23456789',
    outstandingBalance: 1250.00,
    totalPurchases: 35600.50,
    category: 'Logistics',
    tags: ['shipping', 'logistics', 'international'],
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-04-10'),
    creditLimit: 10000
  },
  '4': {
    id: '4',
    name: 'Office Supplies Direct',
    company: 'Office Supplies Direct',
    email: 'jennifer@officesupplies.com',
    phone: '+1 (555) 234-5678',
    address: '101 Office Park, Boston, MA 02110',
    website: 'https://officesuppliesdirect.com',
    notes: 'Bulk supplier for office consumables and supplies',
    status: 'active',
    paymentTerms: 'Net 30',
    taxIdentifier: 'TX-34567890',
    outstandingBalance: 750.25,
    totalPurchases: 12500.75,
    category: 'Office Supplies',
    tags: ['office', 'supplies', 'paper'],
    createdAt: new Date('2023-01-25'),
    updatedAt: new Date('2023-05-05'),
    creditLimit: 5000
  },
  '5': {
    id: '5',
    name: 'Digital Marketing Solutions',
    company: 'Digital Marketing Solutions',
    email: 'robert@digitalmarketing.com',
    phone: '+1 (555) 345-6789',
    address: '222 Digital Dr, Seattle, WA 98101',
    website: 'https://digitalmarketingsolutions.com',
    notes: 'Marketing services and software provider',
    status: 'active',
    paymentTerms: 'Net 15',
    taxIdentifier: 'TX-45678901',
    outstandingBalance: 3200.00,
    totalPurchases: 28750.50,
    category: 'Services',
    tags: ['marketing', 'digital', 'software'],
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-06-10'),
    creditLimit: 8000
  }
};

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
    contact: false,
    financial: false,
    additional: false,
  });
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    category: "",
    status: "active" as "active" | "inactive" | "blocked",
    phone: "",
    email: "",
    website: "",
    address: "",
    paymentTerms: "",
    creditLimit: "",
    tags: [] as string[],
    notes: "",
  });
  
  // New tag input
  const [newTag, setNewTag] = useState("");
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Load vendor data
  useEffect(() => {
    loadVendorData();
  }, [id]);
  
  const loadVendorData = async () => {
    if (!id) {
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      // Use mock data instead of AsyncStorage
      if (mockVendors[id]) {
        const vendor = mockVendors[id];
        
        // Populate form fields with vendor data
        setFormData({
          name: vendor.name,
          company: vendor.company || "",
          category: vendor.category || "",
          status: vendor.status,
          phone: vendor.phone || "",
          email: vendor.email || "",
          website: vendor.website || "",
          address: vendor.address || "",
          paymentTerms: vendor.paymentTerms || "",
          creditLimit: vendor.creditLimit ? vendor.creditLimit.toString() : "",
          tags: vendor.tags ? vendor.tags.join(", ").split(",").map(tag => tag.trim()) : [],
          notes: vendor.notes || "",
        });
        setError(null);
      } else {
        console.error("Vendor not found");
        setSnackbarMessage("Failed to load vendor data");
        setSnackbarVisible(true);
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (error) {
      console.error("Error loading vendor:", error);
      setSnackbarMessage("Failed to load vendor data");
      setSnackbarVisible(true);
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
  
  const addTag = () => {
    if (!newTag.trim()) return;
    
    // Don't add duplicate tags
    if (formData.tags.includes(newTag.trim())) {
      setNewTag("");
      return;
    }
    
    setFormData({
      ...formData,
      tags: [...formData.tags, newTag.trim()],
    });
    setNewTag("");
  };
  
  const removeTag = (index: number) => {
    const updatedTags = [...formData.tags];
    updatedTags.splice(index, 1);
    setFormData({
      ...formData,
      tags: updatedTags,
    });
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Vendor name is required";
    }
    
    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (formData.website.trim() && !formData.website.match(/^(http|https):\/\/[a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}(\/.*)?$/)) {
      newErrors.website = "Please enter a valid website URL";
    }
    
    if (formData.creditLimit.trim() && isNaN(parseFloat(formData.creditLimit))) {
      newErrors.creditLimit = "Credit limit must be a valid number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbarMessage("Please fix the errors before saving");
      setSnackbarVisible(true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create updated vendor object
      const updatedVendor: Vendor = {
        ...mockVendors[id], // Start with existing vendor data
        name: formData.name.trim(),
        company: formData.company.trim() || formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        website: formData.website.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        category: formData.category.trim() || undefined,
        tags: formData.tags.map(tag => tag.trim()),
        paymentTerms: formData.paymentTerms.trim() || undefined,
        creditLimit: formData.creditLimit.trim() ? parseFloat(formData.creditLimit) : undefined,
        status: formData.status === "active" ? "active" : "inactive",
        updatedAt: new Date()
      };
      
      // Simulate updating the vendor in storage
      setTimeout(() => {
        // In a real implementation, would update AsyncStorage
        // For now, just update our local mock data
        mockVendors[id] = updatedVendor;
        
        setIsSaving(false);
        setSnackbarMessage("Vendor updated successfully");
        setSnackbarVisible(true);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.replace(`/vendors/${id}`);
        }, 1000);
      }, 800);
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
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading vendor data...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
        <Info size={48} color={Colors.negative} />
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.default} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Vendor</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("basic")}
          >
            <Text style={styles.sectionTitle}>Basic Information</Text>
            {expandedSections.basic ? (
              <ChevronUp size={20} color={Colors.text.primary} />
            ) : (
              <ChevronDown size={20} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
          
          {expandedSections.basic && (
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Vendor Name *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  placeholder="Enter vendor name"
                  placeholderTextColor="#9aa0a6"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput
                  style={[styles.input, errors.company && styles.inputError]}
                  value={formData.company}
                  onChangeText={(text) => handleInputChange("company", text)}
                  placeholder="Enter company name"
                  placeholderTextColor="#9aa0a6"
                />
                {errors.company && <Text style={styles.errorText}>{errors.company}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  onChangeText={(text) => handleInputChange("category", text)}
                  placeholder="Enter vendor category"
                  placeholderTextColor="#9aa0a6"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusOptions}>
                  {["active", "inactive", "blocked"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        formData.status === status && styles.statusOptionSelected
                      ]}
                      onPress={() => handleInputChange("status", status)}
                    >
                      <View style={[
                        styles.statusDot, 
                        { backgroundColor: 
                          status === 'active' ? Colors.status.active :
                          status === 'inactive' ? Colors.status.inactive :
                          Colors.status.blocked
                        }
                      ]} />
                      <Text style={[
                        styles.statusText,
                        formData.status === status && styles.statusTextSelected
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* Contact Information Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("contact")}
          >
            <Text style={styles.sectionTitle}>Contact Information</Text>
            {expandedSections.contact ? (
              <ChevronUp size={20} color={Colors.text.primary} />
            ) : (
              <ChevronDown size={20} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
          
          {expandedSections.contact && (
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <View style={styles.inputWithIcon}>
                  <Phone size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputWithIconField, errors.phone && styles.inputError]}
                    value={formData.phone}
                    onChangeText={(text) => handleInputChange("phone", text)}
                    placeholder="Enter phone number"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWithIcon}>
                  <Mail size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputWithIconField, errors.email && styles.inputError]}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange("email", text)}
                    placeholder="Enter email address"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Website</Text>
                <View style={styles.inputWithIcon}>
                  <Globe size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIconField}
                    value={formData.website}
                    onChangeText={(text) => handleInputChange("website", text)}
                    placeholder="Enter website"
                    placeholderTextColor="#9aa0a6"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <View style={styles.inputWithIcon}>
                  <MapPin size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputWithIconField, styles.textArea]}
                    value={formData.address}
                    onChangeText={(text) => handleInputChange("address", text)}
                    placeholder="Enter address"
                    placeholderTextColor="#9aa0a6"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* Financial Information Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("financial")}
          >
            <Text style={styles.sectionTitle}>Financial Information</Text>
            {expandedSections.financial ? (
              <ChevronUp size={20} color={Colors.text.primary} />
            ) : (
              <ChevronDown size={20} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
          
          {expandedSections.financial && (
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Terms</Text>
                <View style={styles.inputWithIcon}>
                  <Clock size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIconField}
                    value={formData.paymentTerms}
                    onChangeText={(text) => handleInputChange("paymentTerms", text)}
                    placeholder="e.g. Net 30"
                    placeholderTextColor="#9aa0a6"
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Credit Limit</Text>
                <View style={styles.inputWithIcon}>
                  <CreditCard size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputWithIconField, errors.creditLimit && styles.inputError]}
                    value={formData.creditLimit}
                    onChangeText={(text) => handleInputChange("creditLimit", text)}
                    placeholder="0.00"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="numeric"
                  />
                </View>
                {errors.creditLimit && <Text style={styles.errorText}>{errors.creditLimit}</Text>}
              </View>
            </View>
          )}
        </View>
        
        {/* Additional Information Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("additional")}
          >
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {expandedSections.additional ? (
              <ChevronUp size={20} color={Colors.text.primary} />
            ) : (
              <ChevronDown size={20} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
          
          {expandedSections.additional && (
            <View style={styles.sectionContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {formData.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity
                        style={styles.tagDeleteButton}
                        onPress={() => removeTag(index)}
                      >
                        <X size={14} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                <View style={styles.tagInput}>
                  <TextInput
                    style={styles.tagInputField}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add a tag"
                    placeholderTextColor="#9aa0a6"
                    onSubmitEditing={addTag}
                  />
                  <TouchableOpacity 
                    style={[styles.addTagButton, !newTag.trim() && styles.disabledButton]} 
                    onPress={addTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => handleInputChange("notes", text)}
                  placeholder="Add notes about the vendor"
                  placeholderTextColor="#9aa0a6"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <SnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
  },
  saveButtonDisabled: {
    backgroundColor: `${Colors.primary}80`,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: Colors.background.default,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  sectionContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.default,
  },
  inputError: {
    borderColor: Colors.negative,
  },
  errorText: {
    color: Colors.negative,
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    backgroundColor: Colors.background.default,
  },
  inputIcon: {
    marginLeft: 16,
  },
  inputWithIconField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  statusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  statusOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 6,
  },
  tagDeleteButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.default,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: `${Colors.primary}80`,
  },
  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.default,
  },
  errorMessage: {
    fontSize: 18,
    color: Colors.negative,
    marginVertical: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});