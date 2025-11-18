import { ref } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

let recognition = null;
let isRecognitionActive = false;
let currentAudio = null; // Global audio instance für Stop-Funktion

// Voice configuration
let voiceSettings = {
  selectedVoice: 'polly-hans',
  barkVoice: 'de_speaker_1',
  elevenLabsVoice: 'rachel'
};

let ttsPriority = ['polly', 'bark', 'elevenlabs', 'browser'];

// Load voice settings from server
async function loadVoiceSettings() {
  try {
    const response = await axios.get('/api/admin/get-config');
    if (response.data.metadata?.voiceSettings) {
      voiceSettings = response.data.metadata.voiceSettings;
      console.log('🎙️ [Voice Settings] Loaded:', voiceSettings);
    }
    if (response.data.metadata?.ttsPriority) {
      ttsPriority = response.data.metadata.ttsPriority;
      console.log('⚙️ [TTS Priority] Loaded:', ttsPriority);
    }
  } catch (error) {
    console.warn('⚠️ [Voice Settings] Could not load, using defaults:', error.message);
  }
}

// Load settings on module load
loadVoiceSettings();

function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error('❌ Speech Recognition not supported in this browser');
    return null;
  }

  try {
    const rec = new SpeechRecognition();
    rec.lang = 'de-DE';
    rec.continuous = false;
    rec.interimResults = true;  // Enable interim results for better recognition
    rec.maxAlternatives = 3;    // Get multiple alternatives
    return rec;
  } catch (error) {
    console.error('❌ Error creating recognition:', error);
    return null;
  }
}

export function useVoice() {
  const isListening = ref(false);
  const isSpeaking = ref(false);
  const isSupported = ref(false);

  // Initialize on first use
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  isSupported.value = !!SpeechRecognition;

  // Start listening to user voice
  const startListening = () => {
    return new Promise((resolve, reject) => {
      if (!isSupported.value) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      // Check microphone permission first
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' }).then(permissionStatus => {
          console.log('🎤 [Voice] Microphone permission:', permissionStatus.state);
        }).catch(err => {
          console.warn('⚠️ [Voice] Could not query microphone permission:', err);
        });
      }

      try {
        // Create fresh recognition instance each time
        recognition = initRecognition();
        
        if (!recognition) {
          reject(new Error('Failed to initialize recognition'));
          return;
        }

        isListening.value = true;
        isRecognitionActive = true;
        console.log('🎤 [Voice] Starting recognition...');

        let hasStarted = false;
        let resultReceived = false;

        recognition.onstart = () => {
          hasStarted = true;
          console.log('🎤 [Voice] ✅ Recognition started successfully! Speak now...');
        };

        recognition.onspeechstart = () => {
          console.log('🎤 [Voice] Speech detected...');
        };

        recognition.onspeechend = () => {
          console.log('🎤 [Voice] Speech ended, processing...');
        };

        recognition.onresult = (event) => {
          let transcript = '';
          let isFinal = false;

          // Get results (both interim and final)
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptSegment = event.results[i][0].transcript;
            transcript += transcriptSegment;
            
            // Check if this result is final
            if (event.results[i].isFinal) {
              isFinal = true;
            }
          }

          // Log interim results for debugging
          if (!isFinal) {
            console.log('🎤 [Voice] Interim:', transcript);
          } else {
            console.log('🎤 [Voice] Final:', transcript);
          }

          // Use final results only
          if (!resultReceived && isFinal && transcript.trim()) {
            resultReceived = true;
            const confidence = event.results[event.results.length - 1][0].confidence;
            console.log('🎤 [Voice] ✅ Recognized:', transcript, `(${Math.round(confidence * 100)}% confidence)`);
            isListening.value = false;
            isRecognitionActive = false;
            resolve(transcript.trim());
          }
        };

        recognition.onerror = (event) => {
          console.error('❌ [Voice] Error:', event.error);
          
          // Provide helpful error messages
          let errorMessage = event.error;
          if (event.error === 'network') {
            errorMessage = 'Netzwerkfehler. Versuche es erneut oder nutze Chrome/Edge Browser.';
          } else if (event.error === 'not-allowed') {
            errorMessage = 'Mikrofon-Berechtigung verweigert. Bitte erlaube den Zugriff.';
          } else if (event.error === 'no-speech') {
            errorMessage = 'Keine Sprache erkannt. Sprich lauter oder näher am Mikrofon.';
          }
          
          isListening.value = false;
          isRecognitionActive = false;
          reject(new Error(errorMessage));
        };

        recognition.onend = () => {
          console.log('🎤 [Voice] Recognition ended');
          
          // If recognition ended without result and without error
          if (!resultReceived && hasStarted) {
            console.warn('⚠️ [Voice] Recognition ended without result (timeout or no speech)');
          }
          
          isListening.value = false;
          isRecognitionActive = false;
        };

        // Start recognition
        recognition.start();
        console.log('🎤 [Voice] start() called, waiting for onstart event...');
        
      } catch (error) {
        console.error('❌ Error in startListening:', error);
        isListening.value = false;
        isRecognitionActive = false;
        
        if (error.name === 'InvalidStateError') {
          reject(new Error('Mikrofon wird bereits verwendet. Bitte warte einen Moment.'));
        } else {
          reject(error);
        }
      }
    });
  };

  // Stop listening
  const stopListening = () => {
    if (recognition && isRecognitionActive) {
      try {
        recognition.abort();
        console.log('🎤 [Voice] Recognition aborted');
      } catch (error) {
        console.error('❌ Error stopping recognition:', error);
      }
      isListening.value = false;
      isRecognitionActive = false;
    }
  };

  // Text-to-Speech (using provider priority chain)
  const speak = async (text) => {
    isSpeaking.value = true;
    
    // Call providers in priority order
    for (const provider of ttsPriority) {
      console.log(`🎤 [TTS] Trying provider: ${provider}`);
      
      let success = false;
      
      if (provider === 'polly') {
        success = await speakPolly(text);
      } else if (provider === 'bark') {
        success = await speakBark(text);
      } else if (provider === 'elevenlabs') {
        success = await speakElevenLabs(text);
      } else if (provider === 'browser') {
        success = await speakBrowser(text);
      }
      
      if (success) {
        return; // Success, stop trying
      }
    }
    
    // All providers failed
    isSpeaking.value = false;
    console.error('❌ [TTS] All providers failed');
  };

  // Polly Text-to-Speech
  const speakPolly = async (text) => {
    try {
      console.log(`🎤 [POLLY] Attempting AWS Polly TTS with voice: ${voiceSettings.selectedVoice}...`);
      const response = await axios.post(`${API_URL}/polly`, { 
        text,
        voice: voiceSettings.selectedVoice 
      });
      
      if (response.data.audio) {
        // Play Polly audio
        const mimeType = 'audio/mpeg';
        const audio = new Audio(`data:${mimeType};base64,${response.data.audio}`);
        currentAudio = audio; // Speichere für Stop-Funktion
        
        audio.onended = () => {
          isSpeaking.value = false;
          currentAudio = null;
        };

        audio.onerror = () => {
          console.error('❌ [POLLY] Audio playback error');
          isSpeaking.value = false;
          currentAudio = null;
        };

        await audio.play();
        console.log('🔊 [POLLY] Audio abgespielt');
        return true;
      }
    } catch (error) {
      console.log('⚠️ [POLLY] Nicht verfügbar:', error.message);
    }
    
    return false;
  };

  // Bark Text-to-Speech
  const speakBark = async (text) => {
    try {
      console.log(`🎤 [BARK] Attempting Bark TTS with voice: ${voiceSettings.barkVoice}...`);
      const response = await axios.post(`${API_URL}/bark`, { 
        text,
        voice: voiceSettings.barkVoice
      });
      
      if (response.data.audio) {
        // Play Bark audio
        const mimeType = response.data.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
        const audio = new Audio(`data:${mimeType};base64,${response.data.audio}`);
        currentAudio = audio; // Speichere für Stop-Funktion
        
        audio.onended = () => {
          isSpeaking.value = false;
          currentAudio = null;
        };

        audio.onerror = () => {
          console.error('❌ [BARK] Audio playback error');
          isSpeaking.value = false;
          currentAudio = null;
        };

        await audio.play();
        console.log('🔊 [BARK] Audio abgespielt');
        return true;
      }
    } catch (error) {
      console.log('⚠️ [BARK] Nicht verfügbar:', error.message);
    }

    return false;
  };

  // ElevenLabs Text-to-Speech
  const speakElevenLabs = async (text) => {
    try {
      console.log(`🎤 [ELEVENLABS] Attempting ElevenLabs TTS with voice: ${voiceSettings.elevenLabsVoice}...`);
      const response = await axios.post(`${API_URL}/tts`, { 
        text,
        voice: voiceSettings.elevenLabsVoice
      });
      
      if (response.data.audio) {
        // Play ElevenLabs audio
        const audio = new Audio(`data:audio/mp3;base64,${response.data.audio}`);
        currentAudio = audio; // Speichere für Stop-Funktion
        
        audio.onended = () => {
          isSpeaking.value = false;
          currentAudio = null;
        };

        audio.onerror = () => {
          console.error('❌ [ElevenLabs] Audio playback error');
          isSpeaking.value = false;
          currentAudio = null;
        };

        await audio.play();
        console.log('🔊 [ElevenLabs] Audio abgespielt');
        return true;
      }
    } catch (error) {
      console.log('⚠️ [ElevenLabs] Nicht verfügbar:', error.message);
    }

    return false;
  };

  // Browser native Text-to-Speech (Fallback)
  const speakBrowser = async (text) => {
    if (!('speechSynthesis' in window)) {
      console.error('❌ [Browser TTS] Not supported');
      isSpeaking.value = false;
      return false;
    }

    try {
      console.log('🎤 [Browser TTS] Using browser speech synthesis');
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        isSpeaking.value = false;
        currentAudio = null;
      };

      utterance.onerror = () => {
        console.error('❌ [Browser TTS] Error');
        isSpeaking.value = false;
        currentAudio = null;
      };

      window.speechSynthesis.speak(utterance);
      console.log('🔊 [Browser TTS] Speaking');
      return true;
    } catch (error) {
      console.error('❌ [Browser TTS] Error:', error);
      isSpeaking.value = false;
      return false;
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        console.log('⏹️ [Audio] Stopped');
      } catch (error) {
        console.error('❌ Error stopping audio:', error);
      }
      currentAudio = null;
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    isSpeaking.value = false;
  };

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
