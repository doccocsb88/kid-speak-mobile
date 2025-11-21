package com.kidspeak.mobile

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class KSSpeechModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context), RecognitionListener {

  private var speechRecognizer: SpeechRecognizer? = null

  override fun getName(): String = "KSSpeech"

  @ReactMethod
  fun start(language: String?, promise: Promise) {
    // CRITICAL: SpeechRecognizer must be used from main thread
    context.runOnUiQueueThread {
      try {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
          promise.reject("UNAVAILABLE", "Speech recognition is not available on this device")
          return@runOnUiQueueThread
        }

        if (speechRecognizer == null) {
          speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(this@KSSpeechModule)
          }
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
          putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
          putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
          putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
          // Force on-device recognition to avoid network dependency
          putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
          if (language != null && language.isNotEmpty()) {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
          }
        }

        speechRecognizer?.startListening(intent)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("START_ERROR", e.message ?: "Failed to start speech recognition", e)
      }
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    // CRITICAL: SpeechRecognizer must be used from main thread
    context.runOnUiQueueThread {
      try {
        speechRecognizer?.stopListening()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("STOP_ERROR", e.message ?: "Failed to stop speech recognition", e)
      }
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    // CRITICAL: SpeechRecognizer must be used from main thread
    context.runOnUiQueueThread {
      try {
        speechRecognizer?.cancel()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("CANCEL_ERROR", e.message ?: "Failed to cancel speech recognition", e)
      }
    }
  }

  @ReactMethod
  fun destroy(promise: Promise) {
    // CRITICAL: SpeechRecognizer must be used from main thread
    context.runOnUiQueueThread {
      try {
        speechRecognizer?.destroy()
        speechRecognizer = null
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("DESTROY_ERROR", e.message ?: "Failed to destroy speech recognizer", e)
      }
    }
  }

  private fun emit(event: String, data: Bundle?) {
    try {
      val params = if (data != null) Arguments.fromBundle(data) else null
      context
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit(event, params)
      android.util.Log.d("KSSpeechModule", "EMITTED event: $event with data: $data")
    } catch (e: Exception) {
      android.util.Log.e("KSSpeechModule", "Failed to emit event: $event", e)
    }
  }

  override fun onReadyForSpeech(params: Bundle?) {
    android.util.Log.d("KSSpeechModule", "onReadyForSpeech called")
    emit("KSSpeech.onReady", null)
  }

  override fun onBeginningOfSpeech() {
    android.util.Log.d("KSSpeechModule", "onBeginningOfSpeech called - EMITTING onStart")
    emit("KSSpeech.onStart", null)
  }

  override fun onRmsChanged(rmsdB: Float) {
    android.util.Log.d("KSSpeechModule", "onRmsChanged called: rmsdB=$rmsdB")
    // Emit both formats for compatibility
    val b = Bundle().apply {
      putDouble("rms", rmsdB.toDouble())
      putDouble("value", rmsdB.toDouble()) // Match Voice.onSpeechVolumeChanged format
    }
    emit("KSSpeech.onRmsChanged", b)
  }

  override fun onBufferReceived(buffer: ByteArray?) = Unit

  override fun onEndOfSpeech() {
    android.util.Log.d("KSSpeechModule", "onEndOfSpeech called - EMITTING onEnd")
    emit("KSSpeech.onEnd", null)
  }

  override fun onError(error: Int) {
    android.util.Log.d("KSSpeechModule", "onError called: error=$error")
    // Convert error code to error message for compatibility with Voice library
    val errorMessage = when (error) {
      SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
      SpeechRecognizer.ERROR_CLIENT -> "Client side error"
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
      SpeechRecognizer.ERROR_NETWORK -> "Network error"
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
      SpeechRecognizer.ERROR_NO_MATCH -> "No match"
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RecognitionService busy"
      SpeechRecognizer.ERROR_SERVER -> "Server error"
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
      else -> "Unknown error"
    }
    val b = Bundle().apply {
      putInt("code", error)
      putString("message", errorMessage)
    }
    emit("KSSpeech.onError", b)
  }

  override fun onResults(results: Bundle?) {
    val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    android.util.Log.d("KSSpeechModule", "onResults called: results=$list")
    val b = Bundle().apply { putString("text", list?.firstOrNull() ?: "") }
    emit("KSSpeech.onResults", b)
  }

  override fun onPartialResults(partialResults: Bundle?) {
    val list = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    android.util.Log.d("KSSpeechModule", "onPartialResults called: partialResults=$list")
    val b = Bundle().apply { putString("text", list?.firstOrNull() ?: "") }
    emit("KSSpeech.onPartialResults", b)
  }

  override fun onEvent(eventType: Int, params: Bundle?) = Unit
}


