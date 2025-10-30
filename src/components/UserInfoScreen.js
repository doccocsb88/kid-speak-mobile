// src/components/UserInfoScreen.js
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

function UserInfoScreen({ onUserInfoSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: ''
  });
  const [errors, setErrors] = useState({});

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

  const handleSubmit = () => {
    if (validateForm()) {
      onUserInfoSubmit({
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender
      });
    }
  };

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
            <Text style={styles.labelIcon}>🎂</Text> How old are you?
          </Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => {
                Alert.alert(
                  'Select your age',
                  '',
                  [
                    { text: '6 years old', onPress: () => handleInputChange('age', '6') },
                    { text: '7 years old', onPress: () => handleInputChange('age', '7') },
                    { text: '8 years old', onPress: () => handleInputChange('age', '8') },
                    { text: '9 years old', onPress: () => handleInputChange('age', '9') },
                    { text: '10 years old', onPress: () => handleInputChange('age', '10') },
                    { text: '11 years old', onPress: () => handleInputChange('age', '11') },
                  ]
                );
              }}
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
          <Text style={styles.buttonIcon}>🚀</Text>
          <Text style={styles.submitButtonText}>Start Learning!</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>💡 Don't worry! This information helps me teach you better.</Text>
      </View>
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
});

export default UserInfoScreen;
