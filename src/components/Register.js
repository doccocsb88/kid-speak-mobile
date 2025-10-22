// src/components/Register.js
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

const Register = ({ onSwitchToLogin }) => {
  const { register, loginAsGuest, error, clearError, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    languagePreference: 'vi',
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
      errors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (formData.username && formData.username.length < 2) {
      errors.username = 'Tên người dùng phải có ít nhất 2 ký tự';
    } else if (formData.username && !/^[a-zA-ZÀ-ỹ0-9\s_]+$/.test(formData.username)) {
      errors.username = 'Tên người dùng chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch dưới';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        languagePreference: formData.languagePreference,
      };
      
      await register(userData);
    } catch (error) {
      console.error('Registration error:', error);
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
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu học tập!</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên người dùng (tùy chọn)</Text>
            <TextInput
              style={[styles.input, validationErrors.username && styles.inputError]}
              value={formData.username}
              onChangeText={(value) => handleChange('username', value)}
              placeholder="Nhập tên người dùng của bạn"
              editable={!isLoading}
            />
            {validationErrors.username && (
              <Text style={styles.errorMessage}>{validationErrors.username}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, validationErrors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="Nhập email của bạn"
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
              placeholder="Nhập mật khẩu của bạn"
              secureTextEntry
              editable={!isLoading}
            />
            {validationErrors.password && (
              <Text style={styles.errorMessage}>{validationErrors.password}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <TextInput
              style={[styles.input, validationErrors.confirmPassword && styles.inputError]}
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
              editable={!isLoading}
            />
            {validationErrors.confirmPassword && (
              <Text style={styles.errorMessage}>{validationErrors.confirmPassword}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngôn ngữ ưa thích</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Chọn ngôn ngữ',
                    '',
                    [
                      { text: 'Tiếng Việt', onPress: () => handleChange('languagePreference', 'vi') },
                      { text: 'English', onPress: () => handleChange('languagePreference', 'en') },
                    ]
                  );
                }}
                disabled={isLoading}
              >
                <Text style={styles.pickerText}>
                  {formData.languagePreference === 'vi' ? 'Tiếng Việt' : 'English'}
                </Text>
              </TouchableOpacity>
            </View>
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
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.authFooter}>
          <Text style={styles.footerText}>
            Đã có tài khoản?{' '}
            <Text 
              style={styles.linkButton}
              onPress={onSwitchToLogin}
            >
              Đăng nhập ngay
            </Text>
          </Text>
          
          <View style={styles.divider}>
            <Text style={styles.dividerText}>hoặc</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.authButton, styles.secondaryButton]}
            onPress={handleGuestMode}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>
              Tiếp tục với tài khoản khách
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    padding: 12,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333333',
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
  authFooter: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
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

export default Register;
