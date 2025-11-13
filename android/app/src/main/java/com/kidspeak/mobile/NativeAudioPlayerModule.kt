package com.kidspeak.mobile

import android.media.MediaPlayer
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class NativeAudioPlayerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {

    private var mediaPlayer: MediaPlayer? = null
    private var tempFile: File? = null

    override fun getName(): String {
        return "NativeAudioPlayer"
    }

    @ReactMethod
    fun playAudioFromBase64(base64String: String, promise: Promise) {
        try {
            Log.d("NativeAudioPlayer", "🔊 Starting audio playback from base64...")
            
            // Stop any existing playback
            stopCurrentPlayback()
            
            // Decode base64 to byte array
            val audioData = Base64.decode(base64String, Base64.DEFAULT)
            if (audioData.isEmpty()) {
                promise.reject("INVALID_AUDIO_DATA", "Invalid base64 audio data")
                return
            }
            
            Log.d("NativeAudioPlayer", "📄 Audio data size: ${audioData.size} bytes")
            
            // Create temporary file
            tempFile = File.createTempFile("audio_", ".mp3", reactApplicationContext.cacheDir)
            FileOutputStream(tempFile).use { fos ->
                fos.write(audioData)
            }
            
            Log.d("NativeAudioPlayer", "📁 Temporary file created: ${tempFile?.absolutePath}")
            
            // Create and configure MediaPlayer
            mediaPlayer = MediaPlayer().apply {
                setDataSource(tempFile?.absolutePath)
                setOnCompletionListener(this@NativeAudioPlayerModule)
                setOnErrorListener(this@NativeAudioPlayerModule)
                prepare()
                setVolume(1.0f, 1.0f) // Set volume for left and right channels
                start()
            }
            
            Log.d("NativeAudioPlayer", "✅ Audio playback started successfully")
            
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "Audio playback started")
            })
            
        } catch (e: Exception) {
            Log.e("NativeAudioPlayer", "❌ Error playing audio", e)
            cleanup()
            promise.reject("AUDIO_PLAY_ERROR", e.message ?: "Unknown error", e)
        }
    }

    @ReactMethod
    fun stopAudio(promise: Promise) {
        try {
            stopCurrentPlayback()
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "Audio stopped")
            })
        } catch (e: Exception) {
            Log.e("NativeAudioPlayer", "❌ Error stopping audio", e)
            promise.reject("AUDIO_STOP_ERROR", e.message ?: "Unknown error", e)
        }
    }

    @ReactMethod
    fun isPlaying(promise: Promise) {
        try {
            val playing = mediaPlayer?.isPlaying ?: false
            promise.resolve(Arguments.createMap().apply {
                putBoolean("isPlaying", playing)
            })
        } catch (e: Exception) {
            Log.e("NativeAudioPlayer", "❌ Error checking playback status", e)
            promise.reject("AUDIO_STATUS_ERROR", e.message ?: "Unknown error", e)
        }
    }

    override fun onCompletion(mp: MediaPlayer?) {
        Log.d("NativeAudioPlayer", "🎵 Audio playback completed successfully")
        sendEvent("onAudioPlaybackFinished", Arguments.createMap().apply {
            putBoolean("success", true)
            putString("message", "Audio playback completed successfully")
        })
        cleanup()
    }

    override fun onError(mp: MediaPlayer?, what: Int, extra: Int): Boolean {
        val errorMsg = "MediaPlayer error: what=$what, extra=$extra"
        Log.e("NativeAudioPlayer", "❌ $errorMsg")
        sendEvent("onAudioPlaybackError", Arguments.createMap().apply {
            putString("error", errorMsg)
            putInt("code", what)
        })
        cleanup()
        return true
    }

    private fun stopCurrentPlayback() {
        try {
            mediaPlayer?.let { mp ->
                if (mp.isPlaying) {
                    mp.stop()
                }
                mp.release()
            }
            mediaPlayer = null
        } catch (e: Exception) {
            Log.w("NativeAudioPlayer", "Error stopping playback", e)
        }
    }

    private fun cleanup() {
        stopCurrentPlayback()
        tempFile?.let { file ->
            try {
                if (file.exists()) {
                    file.delete()
                    Log.d("NativeAudioPlayer", "🗑️ Temporary file deleted")
                }
            } catch (e: Exception) {
                Log.w("NativeAudioPlayer", "Error deleting temp file", e)
            }
        }
        tempFile = null
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        cleanup()
    }
}

