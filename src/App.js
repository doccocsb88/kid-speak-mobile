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
import HomeScreen from './components/HomeScreen';
import MainTabbarScreen from './components/MainTabbarScreen';
import ConversationHistory from './pages/ConversationHistory';
import FriendList from './pages/FriendList';
import FriendDetail from './pages/FriendDetail';
import NewTopicSelection from './pages/NewTopicSelection';
import TopicDetails from './pages/TopicDetails';

const Stack = createStackNavigator();

function App() {
  const [appState, setAppState] = useState(null); // null (loading), 'onboarding', 'userinfo', 'main'

  useEffect(() => {
    console.log('✅ App.js mounted - Checking app status...');
    // Check onboarding and userinfo status on mount
    const checkAppStatus = async () => {
      try {
        const hasCompletedOnboardingFlag = await hasCompletedOnboarding();
        const hasCompletedUserInfoFlag = await hasCompletedUserInfo();
        if (hasCompletedOnboardingFlag && hasCompletedUserInfoFlag) {
          setAppState('main');
        } else if (hasCompletedOnboardingFlag && !hasCompletedUserInfoFlag) {
          setAppState('userinfo');
        } else {
          setAppState('onboarding');
        }
      } catch (error) {
        console.log('❌ Error checking app status:', error);
        setAppState('onboarding');
      }
    };
    checkAppStatus();
  }, []);

  useEffect(() => {
    if (appState !== null) {
      console.log('🔄 App state changed to:', appState);
    }
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
    // Show nothing while checking app status (native splash will be visible)
    if (appState === null) {
      return null;
    }
    
    console.log('🎨 Rendering app content for state:', appState);
    
    switch (appState) {
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
              <Stack.Screen name="Home" component={MainTabbarScreen} />
              <Stack.Screen name="ConversationHistory" component={ConversationHistory} />
              <Stack.Screen name="FriendList" component={FriendList} />
              <Stack.Screen name="FriendDetail" component={FriendDetail} />
              <Stack.Screen name="NewTopicSelection" component={NewTopicSelection} />
              <Stack.Screen name="TopicDetails" component={TopicDetails} />
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
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {/* Overlay not needed for splash-driven flow */}
        <AppStartupOverlay visible={false} />
        {renderAppContent()}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;