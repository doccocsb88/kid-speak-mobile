// src/services/UserManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import nativeIapService from './nativeIapService';

const STORAGE_KEYS = {
  premiumUser: 'ks_premium_user',
  dailyCount: 'ks_daily_request_count',
  dailyDate: 'ks_daily_request_date',
  dailyLimit: 'ks_daily_request_limit',
};

const DEFAULT_DAILY_LIMIT = 10;

/**
 * UserManager handles premium status and daily request limits for free users.
 * - Premium users: unlimited requests
 * - Free users: limited to dailyLimit requests per calendar day
 */
class UserManager {
  constructor() {
    this.isInitialized = false;
    this.premiumUser = false;
    this.dailyRequestCount = 0;
    this.dailyRequestDate = this.getTodayKey();
    this.dailyLimit = DEFAULT_DAILY_LIMIT;
  }

  getTodayKey() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      const [premiumStr, countStr, dateStr, limitStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.premiumUser),
        AsyncStorage.getItem(STORAGE_KEYS.dailyCount),
        AsyncStorage.getItem(STORAGE_KEYS.dailyDate),
        AsyncStorage.getItem(STORAGE_KEYS.dailyLimit),
      ]);

      this.premiumUser = premiumStr === 'true';
      this.dailyRequestCount = Number.isFinite(parseInt(countStr, 10)) ? parseInt(countStr, 10) : 0;
      this.dailyRequestDate = dateStr || this.getTodayKey();
      this.dailyLimit = Number.isFinite(parseInt(limitStr, 10)) ? parseInt(limitStr, 10) : DEFAULT_DAILY_LIMIT;

      // Auto reset if date changed
      await this.ensureDailyReset();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('UserManager.initialize error:', error);
      return false;
    }
  }

  async ensureDailyReset() {
    const today = this.getTodayKey();
    if (this.dailyRequestDate !== today) {
      this.dailyRequestDate = today;
      this.dailyRequestCount = 0;
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.dailyDate, today),
        AsyncStorage.setItem(STORAGE_KEYS.dailyCount, '0'),
      ]);
    }
  }

  async setPremiumUser(isPremium) {
    this.premiumUser = !!isPremium;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.premiumUser, this.premiumUser ? 'true' : 'false');
    } catch (error) {
      console.error('UserManager.setPremiumUser error:', error);
    }
    return this.premiumUser;
  }

  async refreshPremiumStatusFromIAP() {
    try {
      const hasActive = await nativeIapService.hasActiveSubscription();
      if (hasActive !== this.premiumUser) {
        await this.setPremiumUser(hasActive);
      }
      return hasActive;
    } catch (error) {
      console.error('UserManager.refreshPremiumStatusFromIAP error:', error);
      return this.premiumUser;
    }
  }

  isPremium() {
    return this.premiumUser === true;
  }

  async canSendRequest() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isPremium()) {
      return true;
    }

    await this.ensureDailyReset();
    return this.dailyRequestCount < this.dailyLimit;
  }

  async recordRequest() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isPremium()) {
      return { allowed: true, remaining: null };
    }

    await this.ensureDailyReset();

    if (this.dailyRequestCount >= this.dailyLimit) {
      return { allowed: false, remaining: 0 };
    }

    this.dailyRequestCount += 1;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.dailyCount, String(this.dailyRequestCount));
    } catch (error) {
      console.error('UserManager.recordRequest persistence error:', error);
    }

    return { allowed: true, remaining: Math.max(0, this.dailyLimit - this.dailyRequestCount) };
  }

  async resetDailyUsage() {
    this.dailyRequestCount = 0;
    this.dailyRequestDate = this.getTodayKey();
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.dailyCount, '0'),
        AsyncStorage.setItem(STORAGE_KEYS.dailyDate, this.dailyRequestDate),
      ]);
      return true;
    } catch (error) {
      console.error('UserManager.resetDailyUsage error:', error);
      return false;
    }
  }

  async setDailyLimit(limit) {
    const parsed = parseInt(limit, 10);
    this.dailyLimit = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.dailyLimit, String(this.dailyLimit));
    } catch (error) {
      console.error('UserManager.setDailyLimit error:', error);
    }
    return this.dailyLimit;
  }

  getRemainingRequests() {
    if (this.isPremium()) {
      return null; // unlimited
    }
    return Math.max(0, this.dailyLimit - this.dailyRequestCount);
  }

  getSnapshot() {
    return {
      isInitialized: this.isInitialized,
      premiumUser: this.premiumUser,
      dailyRequestCount: this.dailyRequestCount,
      dailyRequestDate: this.dailyRequestDate,
      dailyLimit: this.dailyLimit,
      today: this.getTodayKey(),
    };
  }
}

// Export singleton instance
export default new UserManager();


