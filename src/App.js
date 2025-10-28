import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator, CardStyleInterpolators} from '@react-navigation/stack';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './contexts/AuthContext';
import AuthWrapper from './components/AuthWrapper';
import APITest from './components/APITest';
import OnboardingScreen from './components/OnboardingScreen';
import UserInfoScreen from './components/UserInfoScreen';
import PaywallScreen from './components/PaywallScreen';
import {hasCompletedOnboarding, markOnboardingCompleted, hasCompletedUserInfo, markUserInfoCompleted} from './utils/onboardingStorage';
import AppStartupOverlay from './components/AppStartupOverlay';

const Stack = createStackNavigator();

function App() {
  const [appState, setAppState] = useState('loading'); // 'loading', 'onboarding', 'userinfo', 'main'

  useEffect(() => {
    console.log('✅ App.js mounted - Initial state:', appState);
    
    // SPLASH SCREEN SKIPPED - Initialize app immediately
    const initializeApp = async () => {
      console.log('🎬 App initializing (SplashScreen skipped) - Checking app status...');
      
      try {
        // Check app status
        const hasCompletedOnboardingFlag = await hasCompletedOnboarding();
        const hasCompletedUserInfoFlag = await hasCompletedUserInfo();
        
        console.log('📊 Onboarding completed:', hasCompletedOnboardingFlag);
        console.log('📊 UserInfo completed:', hasCompletedUserInfoFlag);
        
        if (hasCompletedOnboardingFlag && hasCompletedUserInfoFlag) {
          console.log('➡️  Going to MAIN app');
          setAppState('main');
        } else if (hasCompletedOnboardingFlag && !hasCompletedUserInfoFlag) {
          console.log('➡️  Going to USER INFO');
          setAppState('userinfo');
        } else {
          console.log('➡️  Going to ONBOARDING');
          setAppState('onboarding');
        }
      } catch (error) {
        console.log('❌ Error checking app status:', error);
        setAppState('onboarding');
      }
    };
    
    initializeApp();
  }, []);

  useEffect(() => {
    console.log('🔄 App state changed to:', appState);
  }, [appState]);

  const handleOnboardingFinish = async () => {
    // Mark onboarding as completed
    await markOnboardingCompleted();
    // Show user info screen
    setAppState('userinfo');
  };

  const handleUserInfoFinish = async (userData) => {
    // Mark user info as completed and save user data
    await markUserInfoCompleted(userData);
    // Show main app
    setAppState('main');
  };

  const renderAppContent = () => {
    console.log('🎨 Rendering app content for state:', appState);
    
    switch (appState) {
      case 'loading':
        console.log('⏳ Loading (SplashScreen skipped)');
        return null; // Very brief while we determine initial screen
        // return <SplashScreen onFinish={() => setAppState('onboarding')} />;
      case 'onboarding':
        console.log('👋 Rendering OnboardingScreen');
        return <OnboardingScreen onFinish={handleOnboardingFinish} />;
      case 'userinfo':
        console.log('👤 Rendering UserInfoScreen');
        return <UserInfoScreen onUserInfoSubmit={handleUserInfoFinish} />;
      case 'main':
        console.log('🏠 Rendering Main App');
        return (
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}>
              <Stack.Screen name="AuthWrapper" component={AuthWrapper} />
              <Stack.Screen name="APITest" component={APITest} />
              <Stack.Screen
                name="Paywall"
                component={PaywallScreen}
                options={{
                  gestureDirection: 'vertical',
                  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <AppStartupOverlay visible={appState === 'loading'} />
        {renderAppContent()}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;