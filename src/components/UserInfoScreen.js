// src/components/UserInfoScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { markUserInfoCompleted, getUserData } from '../utils/onboardingStorage';

function UserInfoScreen({ onUserInfoSubmit, isFromSettings = false }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAgePickerVisible, setAgePickerVisible] = useState(false);

  // Load saved user data on mount
  useEffect(() => {
    const loadSavedUserData = async () => {
      try {
        const savedData = await getUserData();
        if (savedData) {
          setFormData({
            name: savedData.name || '',
            age: savedData.age ? String(savedData.age) : '',
            gender: savedData.gender || ''
          });
        }
      } catch (error) {
        console.log('Error loading saved user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedUserData();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.age) {
      newErrors.age = 'Please select your age';
    } else {
      const age = parseInt(formData.age);
      if (age < 6 || age > 11) {
        newErrors.age = 'Age must be between 6 and 11';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const userData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender
      };

      // Save user data to local storage
      try {
        await markUserInfoCompleted(userData);
        console.log('✅ User info saved to local storage:', userData);
      } catch (error) {
        console.error('❌ Error saving user info to local storage:', error);
        // Still proceed with the callback even if storage fails
      }

      // Call the callback to proceed with app flow
      onUserInfoSubmit(userData);
    }
  };

  const ageOptions = ['6', '7', '8', '9', '10', '11'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>👋 Welcome to SpeakFun AI!</Text>
        <Text style={styles.subtitle}>Let's get to know you better before we start learning English together!</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Text style={styles.labelIcon}>👤</Text> What's your name?
          </Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter your name"
            maxLength={20}
          />
          {errors.name && <Text style={styles.errorMessage}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Text style={styles.labelIcon}>🎂 How old are you?</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setAgePickerVisible(true)}
            >
              <Text style={styles.pickerText}>
                {formData.age ? `${formData.age} years old` : 'Select your age'}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.age && <Text style={styles.errorMessage}>{errors.age}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Text style={styles.labelIcon}>👦👧</Text> Are you a boy or a girl?
          </Text>
          <View style={styles.genderOptions}>
            <TouchableOpacity
              style={[styles.genderOption, formData.gender === 'boy' && styles.genderOptionSelected]}
              onPress={() => handleInputChange('gender', 'boy')}
            >
              <Text style={styles.genderIcon}>👦</Text>
              <Text style={styles.genderText}>Boy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderOption, formData.gender === 'girl' && styles.genderOptionSelected]}
              onPress={() => handleInputChange('gender', 'girl')}
            >
              <Text style={styles.genderIcon}>👧</Text>
              <Text style={styles.genderText}>Girl</Text>
            </TouchableOpacity>
          </View>
          {errors.gender && <Text style={styles.errorMessage}>{errors.gender}</Text>}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          {!isFromSettings && <Text style={styles.buttonIcon}>🚀</Text>}
          <Text style={styles.submitButtonText}>
            {isFromSettings ? 'Update' : 'Start Learning!'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>💡 Don't worry! This information helps me teach you better.</Text>
      </View>

      {/* Age Selection Modal */}
      <Modal
        visible={isAgePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAgePickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setAgePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select your age</Text>
            <View style={styles.modalOptionsContainer}>
              {ageOptions.map((age) => (
                <TouchableOpacity
                  key={age}
                  style={[
                    styles.modalOption,
                    formData.age === age && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    handleInputChange('age', age);
                    setAgePickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    formData.age === age && styles.modalOptionTextSelected
                  ]}>{age} years old</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setAgePickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  labelIcon: {
    fontSize: 18,
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
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  genderOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dddddd',
    backgroundColor: '#ffffff',
    minWidth: 100,
  },
  genderOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  genderIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOptionsContainer: {
    marginBottom: 10,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  modalOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default UserInfoScreen;
