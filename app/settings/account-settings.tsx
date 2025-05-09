import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  User as UserIcon, 
  Lock, 
  Bell
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { User, getUser, updateUser, updatePassword } from '@/utils/userStorageUtils';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userData = await getUser();
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
      setPhone(userData.phone || '');
      setNotificationsEnabled(userData.notificationsEnabled);
      setEmailNotifications(userData.emailNotifications);
      setPushNotifications(userData.pushNotifications);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validate password if attempting to change it
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setPasswordError('Current password is required');
        isValid = false;
      } else if (!newPassword) {
        setPasswordError('New password is required');
        isValid = false;
      } else if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        isValid = false;
      } else if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        isValid = false;
      } else {
        setPasswordError('');
      }
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Update user info
      const updatedUser = await updateUser({
        name,
        email,
        phone,
        notificationsEnabled,
        emailNotifications,
        pushNotifications
      });
      
      setUser(updatedUser);

      // Handle password update if needed
      if (currentPassword && newPassword) {
        const passwordUpdateSuccess = await updatePassword(currentPassword, newPassword);
        
        if (passwordUpdateSuccess) {
          // Clear password fields after successful update
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          Alert.alert('Error', 'Current password is incorrect');
          setIsSaving(false);
          return;
        }
      }

      Alert.alert('Success', 'Account settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save account settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Account Settings",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={20} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      <StatusBar barStyle="dark-content" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading account settings...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <UserIcon size={18} color="#666" />
                <Text style={styles.label}>Full Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                editable={!isSaving}
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Mail size={18} color="#666" />
                <Text style={styles.label}>Email Address</Text>
              </View>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSaving}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Phone size={18} color="#666" />
                <Text style={styles.label}>Phone Number (Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                editable={!isSaving}
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Password Management</Text>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Lock size={18} color="#666" />
                <Text style={styles.label}>Current Password</Text>
              </View>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                editable={!isSaving}
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Lock size={18} color="#666" />
                <Text style={styles.label}>New Password</Text>
              </View>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                editable={!isSaving}
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Lock size={18} color="#666" />
                <Text style={styles.label}>Confirm New Password</Text>
              </View>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                editable={!isSaving}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>
            
            <Text style={styles.passwordHint}>
              Password must be at least 6 characters.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
            
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabelContainer}>
                <Bell size={18} color="#666" />
                <Text style={styles.toggleLabel}>Enable Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d1d1', true: Colors.primaryLight }}
                thumbColor={notificationsEnabled ? Colors.primary : '#f4f3f4'}
                disabled={isSaving}
              />
            </View>
            
            {notificationsEnabled && (
              <>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleSubLabel}>Email Notifications</Text>
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: '#d1d1d1', true: Colors.primaryLight }}
                    thumbColor={emailNotifications ? Colors.primary : '#f4f3f4'}
                    disabled={isSaving}
                  />
                </View>
                
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleSubLabel}>Push Notifications</Text>
                  <Switch
                    value={pushNotifications}
                    onValueChange={setPushNotifications}
                    trackColor={{ false: '#d1d1d1', true: Colors.primaryLight }}
                    thumbColor={pushNotifications ? Colors.primary : '#f4f3f4'}
                    disabled={isSaving}
                  />
                </View>
              </>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  passwordHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  toggleSubLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 24,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  disabledButton: {
    opacity: 0.7,
  }
}); 