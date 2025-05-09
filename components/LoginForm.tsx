import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/colors';
import PasswordInput from '@/components/PasswordInput';
import CheckBox from '@/components/CheckBox';
import { useAuthStore } from '@/stores/auth-store';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const success = await login(email, password, rememberMe);
      if (success) {
        router.replace('/(tabs)');
      } else {
        setGeneralError('Invalid email or password');
      }
    } catch (error) {
      setGeneralError('An error occurred. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Reset Password",
      "Password reset functionality will be available soon.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      {generalError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{generalError}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Mail size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          autoCorrect={false}
        />
      </View>
      {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

      <PasswordInput
        value={password}
        onChangeText={setPassword}
        error={passwordError}
      />

      <View style={styles.rememberContainer}>
        <CheckBox
          checked={rememberMe}
          onToggle={() => setRememberMe(!rememberMe)}
          label="Remember me"
        />
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.loginButtonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.testCredentials}>
        <Text style={styles.testCredentialsTitle}>Test Credentials:</Text>
        <Text style={styles.testCredentialsText}>Username: mac@admin.com</Text>
        <Text style={styles.testCredentialsText}>Password: Mcodev@123</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  fieldError: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testCredentials: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  testCredentialsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  testCredentialsText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
});