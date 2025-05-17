import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
  FileText,
  Tag,
  CreditCard,
  Clock,
  ChevronRight,
  X,
  Check
} from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as dbCustomer from '@/db/customer';
import * as schema from '@/db/schema';

import Colors from '@/constants/colors';
import { Customer } from '@/types/customer';
import SnackBar from '@/components/SnackBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
type CustomerType = 'Individual' | 'Business';

export default function AddCustomerScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    contactPerson: '',
    category: '',
    status: 'active',
    notes: '',
    creditLimit: 0,
    paymentTerms: '',
    taxId: '',
    tags: [] as string[],
  });
  const [userId, setUserId] = useState<number | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  useEffect(() => {
    const fetchUser = async () => {
      const user = await db.select().from(schema.users).limit(1).get();
      if (user && user.id) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error for this field if it exists
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Email validation
    if (formData.email && !formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (formData.phone && !formData.phone.match(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validate()) {
      setSnackbarMessage('Please correct the errors before saving');
      setShowSnackbar(true);
      return;
    }
    if (!userId) {
      setSnackbarMessage('No user found. Please log in again.');
      setShowSnackbar(true);
      return;
    }
    try {
      setIsSaving(true);
      
      // Prepare customer data for DB
      const customerData = {
        userId,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        contactPerson: formData.contactPerson,
        category: formData.category,
        status: formData.status,
        notes: formData.notes,
        creditLimit: formData.creditLimit,
        paymentTerms: formData.paymentTerms,
        taxId: formData.taxId,
        tags: formData.tags.join(','),
        outstandingBalance: 0,
        totalPurchases: 0,
      };
      
      await dbCustomer.addCustomer(customerData);
      
      setSnackbarMessage('Customer added successfully');
      setShowSnackbar(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error saving customer:', error);
      setSnackbarMessage('Failed to save customer. Please try again.');
      setShowSnackbar(true);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    if (formData.name || formData.email || formData.phone) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          { 
            text: "Discard", 
            style: "destructive",
            onPress: () => router.back() 
          }
        ]
      );
    } else {
      router.back();
    }
  };
  
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
          <Text style={styles.title}>Add Customer</Text>
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
                  value={formData.creditLimit.toString()}
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
                value={formData.tags.join(', ')}
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
    backgroundColor: Colors.background.secondary,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
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
    borderColor: Colors.negative,
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
    backgroundColor: Colors.background.tertiary,
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
  bottomSpacer: {
    height: 40,
  },
}); 