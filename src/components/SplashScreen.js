import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';

const {width, height} = Dimensions.get('window');

const SplashScreen = ({onFinish}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [imageAspectRatio, setImageAspectRatio] = useState(height / width);

  useEffect(() => {
    console.log('🌟🌟🌟 SplashScreen MOUNTED (DISABLED - Skipping immediately) 🌟🌟🌟');
    
    // SPLASH SCREEN DISABLED - Immediately call onFinish
    if (onFinish) {
      setTimeout(() => {
        console.log('✅ SplashScreen bypassed - Calling onFinish immediately');
        onFinish();
      }, 100);
    }
  }, [onFinish]);
  
  console.log('🎨 SplashScreen RENDERING...');

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* Background image - outside of animated content */}
      <Image 
        source={require('../assets/images/spash_bg.png')} 
        style={[
          styles.backgroundImage,
          {
            height: width * imageAspectRatio,
          }
        ]}
        resizeMode="cover"
        onLoad={() => console.log('🖼️  Background image loaded successfully')}
        onError={(error) => console.log('❌ Background image load error:', error)}
      />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        
        {/* Decorative elements */}
        <View style={styles.decorativeElements}>
          {[...Array(20)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.floatingElement,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  backgroundColor: ['#FFB3E6', '#FFD1DC', '#E6E6FA', '#B19CD9'][Math.floor(Math.random() * 4)],
                  opacity: 0.3 + Math.random() * 0.4,
                },
              ]}
            />
          ))}
        </View>


        {/* Title */}
        <Text style={styles.title}>Kid Speak</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>Speak • Learn • Grow</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FF', // Fallback color matching top of gradient
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    // Height is calculated dynamically based on image aspect ratio
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imagePlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  birdImage: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 80,
    color: '#4A90E2',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 40,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#95A5A6',
    fontWeight: '400',
  },
});

export default SplashScreen;
