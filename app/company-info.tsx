import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export default function CompanyInfo() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Use SQLite context directly
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite, { schema });

  // Get the current user
  useEffect(() => {
    const getUserFromEmail = async () => {
      try {
        // Get the email from the search params or use a global state
        const email = params.email as string;
        
        if (email) {
          // Get user by email
          const user = await db.select()
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .get();
          
          if (user) {
            setUserId(user.id);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getUserFromEmail();
  }, [params]);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Company name is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userId) {
      setError('User information is missing. Please try logging in again.');
      return;
    }

    setLoading(true);
    try {
      // Insert new company directly to database
      const result = await db.insert(schema.companies)
        .values({
          userId: userId,
          name,
          phone,
          email,
          website,
          address,
          city,
          state,
          zipCode,
          country,
          taxId,
          industry,
        })
        .returning()
        .get();
      
      if (result) {
        // Navigation to tabs
        router.replace('/(tabs)');
      } else {
        setError('Failed to save company information. Please try again.');
      }
    } catch (error) {
      console.error('Save company error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Company Information</Text>
          <Text style={styles.subtitle}>
            Let's set up your business profile
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="business" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Company Name *"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Business Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="web" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Website"
              value={website}
              onChangeText={setWebsite}
              keyboardType="url"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Address</Text>

          <View style={styles.inputContainer}>
            <Entypo name="address" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Street Address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <MaterialIcons name="location-city" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="State/Province"
                value={state}
                onChangeText={setState}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <MaterialIcons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Postal/ZIP Code"
                value={zipCode}
                onChangeText={setZipCode}
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Entypo name="globe" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Country"
                value={country}
                onChangeText={setCountry}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Additional Information</Text>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="id-card" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tax ID / VAT Number"
              value={taxId}
              onChangeText={setTaxId}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="category" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Industry"
              value={industry}
              onChangeText={setIndustry}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save & Continue</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => {
              router.replace('/(tabs)');
            }}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  form: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
}); 