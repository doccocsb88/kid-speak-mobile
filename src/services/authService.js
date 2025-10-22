// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');
      this.user = userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  // Helper method to make API calls
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    // Log API call for debugging
    console.log('API Call:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      
      // Log response for debugging
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.message || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', {
        url,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await this.apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success) {
        this.setAuthData(response.data.user, response.data.token);
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await this.apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        this.setAuthData(response.data.user, response.data.token);
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  // Logout user
  async logout() {
    try {
      await this.apiCall('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.apiCall('/auth/profile');
      if (response.success) {
        this.user = response.data.user;
        await AsyncStorage.setItem('user', JSON.stringify(this.user));
      }
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get profile');
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await this.apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (response.success) {
        this.user = response.data.user;
        await AsyncStorage.setItem('user', JSON.stringify(this.user));
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await this.apiCall('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update preferences');
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.apiCall('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Set authentication data
  async setAuthData(user, token) {
    this.user = user;
    this.token = token;
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  }

  // Clear authentication data
  async clearAuthData() {
    this.user = null;
    this.token = null;
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Validate token
  async validateToken() {
    if (!this.token) {
      return false;
    }

    try {
      await this.getProfile();
      return true;
    } catch (error) {
      this.clearAuthData();
      return false;
    }
  }

  // Chat API methods
  async startChatSession(topic, difficultyLevel = 'beginner') {
    try {
      const response = await this.apiCall('/chat/start-session', {
        method: 'POST',
        body: JSON.stringify({ topic, difficultyLevel }),
      });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to start chat session');
    }
  }

  async sendMessage(message, provider = 'openai', topic, sessionId) {
    try {
      const response = await this.apiCall('/chat/send-message', {
        method: 'POST',
        body: JSON.stringify({
          message,
          provider,
          topic,
          sessionId,
        }),
      });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to send message');
    }
  }

  async getChatSessions(limit = 20, offset = 0) {
    try {
      const response = await this.apiCall(`/chat/sessions?limit=${limit}&offset=${offset}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get chat sessions');
    }
  }

  async getChatMessages(sessionId, limit = 50) {
    try {
      const response = await this.apiCall(`/chat/sessions/${sessionId}/messages?limit=${limit}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get chat messages');
    }
  }

  async endChatSession(sessionId, satisfaction) {
    try {
      const response = await this.apiCall(`/chat/sessions/${sessionId}/end`, {
        method: 'POST',
        body: JSON.stringify({ satisfaction }),
      });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to end chat session');
    }
  }

  // Guest mode methods (no authentication required)
  async sendMessageAsGuest(message, provider = 'openai', topic) {
    try {
      const response = await this.apiCall('/chat/send-message', {
        method: 'POST',
        body: JSON.stringify({
          message,
          provider,
          topic,
        }),
      });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to send message');
    }
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
