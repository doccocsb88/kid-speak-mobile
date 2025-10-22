import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'kid_speak_onboarding_completed';
const USER_INFO_KEY = 'kid_speak_user_info_completed';
const USER_DATA_KEY = 'kid_speak_user_data';

export const hasCompletedOnboarding = async () => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.log('Error reading onboarding status:', error);
    return false;
  }
};

export const markOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.log('Error saving onboarding status:', error);
  }
};

export const hasCompletedUserInfo = async () => {
  try {
    const value = await AsyncStorage.getItem(USER_INFO_KEY);
    return value === 'true';
  } catch (error) {
    console.log('Error reading user info status:', error);
    return false;
  }
};

export const markUserInfoCompleted = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_INFO_KEY, 'true');
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.log('Error saving user info:', error);
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.log('Error reading user data:', error);
    return null;
  }
};

export const resetOnboardingStatus = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    await AsyncStorage.removeItem(USER_INFO_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.log('Error resetting onboarding status:', error);
  }
};
