import React, {useEffect, useRef, useState} from 'react';
import {Animated, Image, StyleSheet} from 'react-native';

export default function AppStartupOverlay({visible, minVisibleMs = 2000, fadeDurationMs = 250}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [shouldRender, setShouldRender] = useState(true);
  const shownAtRef = useRef(Date.now());

  useEffect(() => {
    if (visible) {
      shownAtRef.current = Date.now();
      setShouldRender(true);
      opacity.setValue(1);
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    const timerId = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: fadeDurationMs,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }, remaining);

    return () => clearTimeout(timerId);
  }, [visible, minVisibleMs, fadeDurationMs, opacity]);

  if (!shouldRender) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, {opacity}]}> 
      <Image
        source={require('../assets/images/spash_bg.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#E8F4FF' },
  image: { width: '100%', height: '100%' },
});


