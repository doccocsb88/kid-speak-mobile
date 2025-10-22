package com.kidspeak.mobile;

import android.content.Context;
import com.facebook.react.ReactInstanceManager;

/**
 * Class responsible for loading Flipper inside your React Native application. This includes adding
 * all necessary plugins and loading the Flipper library.
 */
public class ReactNativeFlipper {
  public static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
    // Do nothing as we don't want to initialize Flipper on Release.
  }
}