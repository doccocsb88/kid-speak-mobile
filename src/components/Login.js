// src/components/Login.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const Login = ({ onSwitchToRegister }) => {
  const { login, loginAsGuest, error, clearError, isLoading } = useAuth();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGuestMode = async () => {
    try {
      await loginAsGuest();
      // The AuthContext will handle setting the user and isAuthenticated state
      // This will automatically redirect to the main app
    } catch (error) {
      console.error('Guest login error:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.authCard}>
        <View style={styles.authHeader}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, validationErrors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            {validationErrors.email && (
              <Text style={styles.errorMessage}>{validationErrors.email}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={[styles.input, validationErrors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              placeholder="Enter your password"
              secureTextEntry
              editable={!isLoading}
            />
            {validationErrors.password && (
              <Text style={styles.errorMessage}>{validationErrors.password}</Text>
            )}
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.authButton, styles.primaryButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.authFooter}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text 
              style={styles.linkButton}
              onPress={onSwitchToRegister}
            >
              Sign up now
            </Text>
          </Text>
          
          <View style={styles.divider}>
            <Text style={styles.dividerText}>or</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.authButton, styles.secondaryButton]}
            onPress={handleGuestMode}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>
              Continue as Guest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.authButton, styles.testButton]}
            onPress={() => navigation.navigate('APITest')}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>
              Test API Connection
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorMessage: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  authButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#FF9500',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  authFooter: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  linkButton: {
    color: '#007AFF',
    fontWeight: '600',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerText: {
    fontSize: 14,
    color: '#999999',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
});

export default Login;
