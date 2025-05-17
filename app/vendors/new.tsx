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
import { Stack, useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  X,
  Save,
  Plus,
  Phone,
  Mail,
  Globe,
  MapPin,
  Tag,
  Clock,
  CreditCard,
  Building2,
  FileText,
  AlertCircle
} from "lucide-react-native";
import { SafeAreaView as SafeAreaViewSafeAreaContext } from 'react-native-safe-area-context';

import Colors from "@/constants/colors";
import { validateEmail, validatePhone } from "@/utils/validation";
import SnackBar from "@/components/SnackBar";
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import * as dbVendor from '@/db/vendor';

export default function AddVendorScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  
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

  useEffect(() => {
    const fetchUser = async () => {
      const user = await db.select().from(schema.users).limit(1).get();
      if (user && user.id) setUserId(user.id);
    };
    fetchUser();
  }, []);
  
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
    if (formData.creditLimit && isNaN(Number(formData.creditLimit))) {
      newErrors.creditLimit = "Credit limit must be a number";
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

    if (!userId) {
      setSnackbarMessage("No user found. Please log in again.");
      setSnackbarVisible(true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create new vendor object with form data
      const newVendor = {
        name: formData.name.trim(),
        company: formData.company.trim() || formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        website: formData.website.trim() || null,
        notes: formData.notes.trim() || null,
        category: formData.category.trim() || null,
        tags: formData.tags.join(','),
        paymentTerms: formData.paymentTerms.trim() || null,
        status: formData.status,
        userId,
      };
      
      // Save to database
      const savedVendor = await dbVendor.addVendor(newVendor);
      
      if (savedVendor) {
        setSnackbarMessage("Vendor added successfully");
        setSnackbarVisible(true);
        
        // Navigate back to vendors list after a short delay
        setTimeout(() => {
          router.replace("/vendors");
        }, 1500);
      } else {
        throw new Error("Failed to save vendor");
      }
    } catch (error) {
      console.error("Error adding vendor:", error);
      setSnackbarMessage("Failed to add vendor");
      setSnackbarVisible(true);
    } finally {
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

  return (
    <SafeAreaViewSafeAreaContext style={styles.container} edges={['top']}>
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
          <Text style={styles.title}>Add Vendor</Text>
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
    </SafeAreaViewSafeAreaContext>
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
});