// src/services/nativeIapService.js
// Native IAP Service - Uses custom native modules (no third-party dependencies)

import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { KSPurchaseManager } = NativeModules;

// Product IDs
export const SUBSCRIPTION_IDS = [
  'com.kidspeak.mobile.weeklytrial1',
  'com.kidspeak.mobile.weekly1',
  'com.kidspeak.mobile.monthly1',
];

class NativeIAPService {
  constructor() {
    this.isInitialized = false;
    this.products = [];
  }

  /**
   * Initialize IAP - Connects to App Store / Google Play
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[Native IAP] Already initialized');
      return true;
    }

    if (!KSPurchaseManager) {
      console.error('[Native IAP] KSPurchaseManager native module not found');
      throw new Error('Native IAP module not available');
    }

    try {
      console.log('[Native IAP] Initializing...');
      
      // Initialize native module
      const products = await KSPurchaseManager.initialize();
      this.products = products;
      this.isInitialized = true;
      
      console.log('[Native IAP] Initialized successfully with', products.length, 'products');
      return true;
    } catch (error) {
      console.error('[Native IAP] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Get available products
   */
  async getProducts() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.products;
  }

  /**
   * Purchase a subscription
   * @param {string} productId - The product ID to purchase
   */
  async purchaseSubscription(productId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[Native IAP] Purchasing:', productId);
      
      // Call native purchase
      const purchase = await KSPurchaseManager.purchaseProduct(productId);
      
      console.log('[Native IAP] Purchase successful:', purchase);
      
      // Save subscription locally
      await this.saveSubscriptionLocally(purchase);
      
      return purchase;
    } catch (error) {
      console.error('[Native IAP] Purchase error:', error);
      
      // Handle specific error codes
      if (error.code === 'USER_CANCELLED') {
        throw new Error('You canceled the transaction');
      } else if (error.code === 'PRODUCT_NOT_FOUND') {
        throw new Error('Subscription is not available');
      } else {
        throw new Error('Unable to complete the transaction. Please try again later');
      }
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[Native IAP] Restoring purchases...');
      
      const result = await KSPurchaseManager.restorePurchases();
      
      console.log('[Native IAP] Restore result:', result);
      
      if (result.purchases && result.purchases.length > 0) {
        // Save all restored purchases locally
        for (const purchase of result.purchases) {
          await this.saveSubscriptionLocally(purchase);
        }
        
        return {
          success: true,
          count: result.count,
          message: `Restored ${result.count} subscriptions`,
        };
      } else {
        return {
          success: false,
          message: 'No previous purchases found',
        };
      }
    } catch (error) {
      console.error('[Native IAP] Restore error:', error);
      return {
        success: false,
        message: 'Unable to restore purchases. Please try again later',
      };
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const result = await KSPurchaseManager.checkActiveSubscription();
      console.log('[Native IAP] Active subscription check:', result);
      
      return result.hasActive;
    } catch (error) {
      console.error('[Native IAP] Check subscription error:', error);
      
      // Fallback to local storage check
      const savedSubscription = await AsyncStorage.getItem('active_subscription');
      return !!savedSubscription;
    }
  }

  /**
   * Get current subscription info
   */
  async getCurrentSubscription() {
    try {
      const savedSubscription = await AsyncStorage.getItem('active_subscription');
      
      if (savedSubscription) {
        return JSON.parse(savedSubscription);
      }

      return null;
    } catch (error) {
      console.error('[Native IAP] Error getting current subscription:', error);
      return null;
    }
  }

  /**
   * Save subscription locally
   */
  async saveSubscriptionLocally(purchase) {
    try {
      const subscriptionData = {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        purchaseDate: purchase.purchaseDate,
        expirationDate: purchase.expirationDate,
        platform: Platform.OS,
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        'active_subscription',
        JSON.stringify(subscriptionData)
      );

      console.log('[Native IAP] Subscription saved locally');
      return true;
    } catch (error) {
      console.error('[Native IAP] Error saving subscription locally:', error);
      return false;
    }
  }

  /**
   * Cleanup (if needed)
   */
  cleanup() {
    this.isInitialized = false;
    this.products = [];
    console.log('[Native IAP] Cleaned up');
  }
}

// Export singleton instance
export default new NativeIAPService();

