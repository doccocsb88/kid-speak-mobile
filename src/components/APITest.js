// src/components/APITest.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import authService from '../services/authService';

const APITest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testAPI = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Profile endpoint (should return 401)
      addResult('Profile Test', 'Testing...', 'Checking auth profile endpoint...');
      try {
        await authService.getProfile();
        addResult('Profile Test', 'SUCCESS', 'Profile endpoint accessible');
      } catch (error) {
        if (error.message.includes('Token không được cung cấp')) {
          addResult('Profile Test', 'SUCCESS', 'Profile endpoint working (401 as expected)');
        } else {
          addResult('Profile Test', 'ERROR', error.message);
        }
      }

      // Test 2: Login with invalid credentials
      addResult('Login Test', 'Testing...', 'Testing login with invalid credentials...');
      try {
        await authService.login('test@test.com', 'wrongpassword');
        addResult('Login Test', 'ERROR', 'Login should have failed');
      } catch (error) {
        if (error.message.includes('Email hoặc mật khẩu không đúng')) {
          addResult('Login Test', 'SUCCESS', 'Login endpoint working (401 as expected)');
        } else {
          addResult('Login Test', 'ERROR', error.message);
        }
      }

      // Test 3: Register with invalid data
      addResult('Register Test', 'Testing...', 'Testing register endpoint...');
      try {
        await authService.register({
          email: 'invalid-email',
          password: '123',
          username: 'test'
        });
        addResult('Register Test', 'ERROR', 'Register should have failed');
      } catch (error) {
        addResult('Register Test', 'SUCCESS', `Register endpoint working: ${error.message}`);
      }

    } catch (error) {
      addResult('General Error', 'ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Connection Test</Text>
        <Text style={styles.subtitle}>Test API endpoints from React Native</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={testAPI}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test API Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet</Text>
        ) : (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.testName}>{result.test}</Text>
                <Text style={[
                  styles.status, 
                  result.status === 'SUCCESS' ? styles.success : 
                  result.status === 'ERROR' ? styles.error : styles.testing
                ]}>
                  {result.status}
                </Text>
              </View>
              <Text style={styles.message}>{result.message}</Text>
              <Text style={styles.timestamp}>{result.timestamp}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
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
  resultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  noResults: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  testing: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});

export default APITest;
