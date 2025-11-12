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
    if (!SpeechRecognizer.isRecognitionAvailable(context)) {
      promise.reject("UNAVAILABLE", "Speech recognition is not available on this device")
      return
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
      if (language != null && language.isNotEmpty()) {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
      }
    }

    speechRecognizer?.startListening(intent)
    promise.resolve(null)
  }

  @ReactMethod
  fun stop(promise: Promise) {
    speechRecognizer?.stopListening()
    promise.resolve(null)
  }

  @ReactMethod
  fun destroy(promise: Promise) {
    speechRecognizer?.destroy()
    speechRecognizer = null
    promise.resolve(null)
  }

  private fun emit(event: String, data: Bundle?) {
    val params = if (data != null) Arguments.fromBundle(data) else null
    context
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(event, params)
  }

  override fun onReadyForSpeech(params: Bundle?) {
    emit("KSSpeech.onReady", null)
  }

  override fun onBeginningOfSpeech() {
    emit("KSSpeech.onStart", null)
  }

  override fun onRmsChanged(rmsdB: Float) {
    val b = Bundle().apply { putDouble("rms", rmsdB.toDouble()) }
    emit("KSSpeech.onRmsChanged", b)
  }

  override fun onBufferReceived(buffer: ByteArray?) = Unit

  override fun onEndOfSpeech() {
    emit("KSSpeech.onEnd", null)
  }

  override fun onError(error: Int) {
    val b = Bundle().apply { putInt("code", error) }
    emit("KSSpeech.onError", b)
  }

  override fun onResults(results: Bundle?) {
    val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    val b = Bundle().apply { putString("text", list?.firstOrNull() ?: "") }
    emit("KSSpeech.onResults", b)
  }

  override fun onPartialResults(partialResults: Bundle?) {
    val list = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    val b = Bundle().apply { putString("text", list?.firstOrNull() ?: "") }
    emit("KSSpeech.onPartialResults", b)
  }

  override fun onEvent(eventType: Int, params: Bundle?) = Unit
}


