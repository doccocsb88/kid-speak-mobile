package com.kidspeak.mobile

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.wenkesj.voice.VoicePackage
import com.kidspeak.mobile.KSPurchasePackage
import com.kidspeak.mobile.KSSpeechPackage
import com.kidspeak.mobile.NativeAudioPlayerPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList = PackageList(this).packages.apply {
        // Debug: Log all packages from autolinking
        Log.d("MainApplication", "Autolinked packages: ${this.map { it.javaClass.simpleName }}")
        
        // Check if VoicePackage is already included by autolinking
        val hasVoicePackage = this.any { 
          it.javaClass.name == "com.wenkesj.voice.VoicePackage" || 
          it.javaClass.simpleName == "VoicePackage"
        }
        
        Log.d("MainApplication", "VoicePackage found in autolinking: $hasVoicePackage")
        
        // If not found, add it manually (autolinking may not work in some cases)
        if (!hasVoicePackage) {
          Log.d("MainApplication", "Manually adding VoicePackage")
          try {
            add(VoicePackage())
            Log.d("MainApplication", "VoicePackage added successfully")
          } catch (e: Exception) {
            Log.e("MainApplication", "Failed to add VoicePackage", e)
          }
        }
        
        // Add custom packages
        add(KSPurchasePackage())
        add(KSSpeechPackage())
        add(NativeAudioPlayerPackage())
        
        Log.d("MainApplication", "Final packages: ${this.map { it.javaClass.simpleName }}")
      },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}


