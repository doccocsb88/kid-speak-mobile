import React, {useState, useRef} from 'react';
import {
  View,
  ImageBackground,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';

const {width, height} = Dimensions.get('window');

const OnboardingScreen = ({onFinish}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const onboardingData = [
    {
      id: 1,
      backgroundImage: require('../assets/images/onb_page1.png'),
      title: 'Welcome to KidSpeak!',
      subtitle: 'Speak • Learn • Grow Together',
      description: 'Start your amazing journey of language learning and fun conversations.',
      buttonText: 'Next',
      buttonColor: '#FF6B6B',
    },
    {
      id: 2,
      backgroundImage: require('../assets/images/onb_page2.png'),
      title: 'Have Fun Learning',
      subtitle: 'Interactive Conversations',
      description: 'Engage in exciting conversations with our friendly AI assistant.',
      buttonText: 'Next',
      buttonColor: '#4ECDC4',
    },
    {
      id: 3,
      backgroundImage: require('../assets/images/onb_page3.png'),
      title: 'Ready to Start!',
      subtitle: 'Let\'s Begin Your Adventure',
      description: 'You\'re all set! Begin speaking, learning, and growing with KidSpeak.',
      buttonText: 'Get Started',
      buttonColor: '#45B7D1',
    },
  ];

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      
      // Animate scroll to next page
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
    } else {
      // Finish onboarding
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }
  };

  // const handleSkip = () => {
  //   Animated.timing(fadeAnim, {
  //     toValue: 0,
  //     duration: 500,
  //     useNativeDriver: true,
  //   }).start(() => {
  //     if (onFinish) onFinish();
  //   });
  // };

  const renderPage = (pageData, index) => {
    const isActive = index === currentPage;
    
    return (
      <View key={pageData.id} style={styles.pageContainer}>
        <ImageBackground
          source={pageData.backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover">
          
          {/* Overlay gradient */}
          <View style={styles.gradientOverlay} />
          
          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Skip button (first 2 pages only) */}
            {/* {currentPage < onboardingData.length - 1 && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )} */}

            {/* Bottom stack: text just above indicators, both anchored to bottom */}
            <View style={styles.bottomStack}>
              {/* Main content */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{pageData.title}</Text>
                <Text style={styles.subtitle}>{pageData.subtitle}</Text>
                <Text style={styles.description}>{pageData.description}</Text>
              </View>

              {/* Page indicators at very bottom */}
              <View style={styles.indicatorContainer}>
                {onboardingData.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor: index === currentPage ? '#FFFFFF' : '#FFFFFF80',
                        width: index === currentPage ? 30 : 8,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Action button below indicators */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {backgroundColor: pageData.buttonColor},
                ]}
                onPress={handleNext}
                activeOpacity={0.8}>
                <Text style={styles.actionButtonText}>
                  {pageData.buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
      <StatusBar hidden={true} />
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false} // Disable manual scrolling, use buttons only
        onMomentumScrollEnd={(event) => {
          const newPage = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentPage(newPage);
        }}>
        {onboardingData.map((pageData, index) => renderPage(pageData, index))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pageContainer: {
    width: width,
    height: height,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  bottomStack: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  skipButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFD700', // Golden yellow
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  bottomSection: {
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    width: width * 0.7,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});

export default OnboardingScreen;
