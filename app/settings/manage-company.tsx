import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Building2, Check } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import * as schema from '@/db/schema';
import { Company, NewCompany } from '@/db/schema';
import { eq } from 'drizzle-orm';

import Colors from '@/constants/colors';

// Define a safe company type for our form
interface CompanyForm {
  id?: number;
  name: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  industry: string;
}

// Initial empty company state
const initialCompany: CompanyForm = {
  name: '',
  logo: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  industry: '',
};

export default function ManageCompanyScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [company, setCompany] = useState<CompanyForm>(initialCompany);
  const [userId, setUserId] = useState<number | null>(null);
  const [isNewCompany, setIsNewCompany] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // First get the user ID
        const userData = await db.select().from(schema.users).limit(1).get();
        if (!userData) {
          Alert.alert('Error', 'No user found');
          router.replace('/login');
          return;
        }
        
        setUserId(userData.id);
        
        // Try to load company data for this user
        const companyData = await db.select()
          .from(schema.companies)
          .where(eq(schema.companies.userId, userData.id))
          .get();
        
        if (companyData) {
          // Transform database Company to our safe CompanyForm type
          const safeCompany: CompanyForm = {
            id: companyData.id,
            name: companyData.name || '',
            logo: companyData.logo || '',
            address: companyData.address || '',
            city: companyData.city || '',
            state: companyData.state || '',
            zipCode: companyData.zipCode || '',
            country: companyData.country || '',
            phone: companyData.phone || '',
            email: companyData.email || '',
            website: companyData.website || '',
            taxId: companyData.taxId || '',
            industry: companyData.industry || '',
          };
          setCompany(safeCompany);
          setIsNewCompany(false);
        } else {
          // No company exists for this user, will create a new one
          setIsNewCompany(true);
        }
      } catch (error) {
        console.error('Failed to load company data:', error);
        Alert.alert('Error', 'Failed to load company data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSave = async () => {
    if (!company.name) {
      Alert.alert('Validation Error', 'Company name is required');
      return;
    }
    
    if (!userId) {
      Alert.alert('Error', 'User information is missing');
      return;
    }

    setIsSaving(true);
    
    try {
      if (isNewCompany) {
        // Create new company
        const newCompanyData: NewCompany = {
          name: company.name,
          userId: userId,
          logo: company.logo || null,
          address: company.address || null,
          city: company.city || null,
          state: company.state || null,
          zipCode: company.zipCode || null,
          country: company.country || null,
          phone: company.phone || null,
          email: company.email || null,
          website: company.website || null,
          taxId: company.taxId || null,
          industry: company.industry || null,
        };
        
        await db.insert(schema.companies).values(newCompanyData).run();
        Alert.alert('Success', 'Company created successfully');
      } else if (company.id) {
        // Update existing company - exclude id and userId from update
        const { id, ...updateData } = company;
        const companyUpdate: Partial<NewCompany> = {
          name: updateData.name,
          logo: updateData.logo || null,
          address: updateData.address || null,
          city: updateData.city || null,
          state: updateData.state || null,
          zipCode: updateData.zipCode || null,
          country: updateData.country || null,
          phone: updateData.phone || null,
          email: updateData.email || null,
          website: updateData.website || null,
          taxId: updateData.taxId || null,
          industry: updateData.industry || null,
        };
        
        await db.update(schema.companies)
          .set(companyUpdate)
          .where(eq(schema.companies.id, id))
          .run();
        
        Alert.alert('Success', 'Company updated successfully');
      }
      
      router.back();
    } catch (error) {
      console.error('Failed to save company:', error);
      Alert.alert('Error', 'Failed to save company information');
    } finally {
      setIsSaving(false);
    }
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCompany({ ...company, logo: result.assets[0].uri });
    }
  };

  // Field input component
  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    keyboardType = 'default',
    multiline = false 
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
    multiline?: boolean;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          multiline && { height: 80, textAlignVertical: 'top', paddingTop: 12 }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading company information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isNewCompany ? 'Add Company' : 'Edit Company'}
          </Text>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Check size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Company Logo */}
          <View style={styles.logoSection}>
            <TouchableOpacity 
              style={styles.logoContainer}
              onPress={pickLogo}
              activeOpacity={0.8}
            >
              {company.logo ? (
                <Image source={{ uri: company.logo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Building2 size={40} color={Colors.text.secondary} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.logoHint}>Tap to upload company logo</Text>
          </View>

          {/* Company Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            
            <InputField
              label="Company Name"
              value={company.name}
              onChangeText={(text) => setCompany({ ...company, name: text })}
              placeholder="Enter company name"
            />
            
            <InputField
              label="Industry"
              value={company.industry}
              onChangeText={(text) => setCompany({ ...company, industry: text })}
              placeholder="Enter industry"
            />
            
            <InputField
              label="Tax ID / Registration Number"
              value={company.taxId}
              onChangeText={(text) => setCompany({ ...company, taxId: text })}
              placeholder="Enter tax ID"
            />
          </View>

          {/* Contact Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <InputField
              label="Email"
              value={company.email}
              onChangeText={(text) => setCompany({ ...company, email: text })}
              placeholder="Enter company email"
              keyboardType="email-address"
            />
            
            <InputField
              label="Phone"
              value={company.phone}
              onChangeText={(text) => setCompany({ ...company, phone: text })}
              placeholder="Enter company phone"
              keyboardType="phone-pad"
            />
            
            <InputField
              label="Website"
              value={company.website}
              onChangeText={(text) => setCompany({ ...company, website: text })}
              placeholder="Enter website URL"
              keyboardType="url"
            />
          </View>

          {/* Address */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Address</Text>
            
            <InputField
              label="Street Address"
              value={company.address}
              onChangeText={(text) => setCompany({ ...company, address: text })}
              placeholder="Enter street address"
              multiline
            />
            
            <InputField
              label="City"
              value={company.city}
              onChangeText={(text) => setCompany({ ...company, city: text })}
              placeholder="Enter city"
            />
            
            <View style={styles.rowFields}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>State/Province</Text>
                <TextInput
                  style={styles.input}
                  value={company.state}
                  onChangeText={(text) => setCompany({ ...company, state: text })}
                  placeholder="Enter state"
                  placeholderTextColor={Colors.text.secondary}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Zip/Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={company.zipCode}
                  onChangeText={(text) => setCompany({ ...company, zipCode: text })}
                  placeholder="Enter zip code"
                  placeholderTextColor={Colors.text.secondary}
                />
              </View>
            </View>
            
            <InputField
              label="Country"
              value={company.country}
              onChangeText={(text) => setCompany({ ...company, country: text })}
              placeholder="Enter country"
            />
          </View>
          
          {/* Extra space at the bottom for keyboard */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  logoHint: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: Colors.background.default,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}); 