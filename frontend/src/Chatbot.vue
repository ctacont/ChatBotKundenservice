<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Chatbot Toggle Button -->
    <button
      @click="toggleChat"
      v-if="!isChatOpen"
      class="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition transform hover:scale-110 z-40"
      title="Chat öffnen"
    >
      💬
    </button>

    <!-- Admin Link -->
    <router-link to="/admin" class="fixed bottom-6 left-6 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition z-40">
      ⚙️ Admin
    </router-link>

    <!-- Chat Window mit Animation -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-4"
    >
      <div
        v-if="isChatOpen"
        class="fixed bottom-6 right-6 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[720px] z-50"
        style="transform: scale(0.9); transform-origin: bottom right; width: 111.11%;"
      >
        <!-- Header with Close Button -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold">💬 Support Chatbot</h1>
            <p class="text-sm text-blue-100 mt-1">Webdesign & Development / (c) 2025 Hasan Yüksel</p>
          </div>
          <button
            @click="toggleChat"
            class="text-white hover:bg-blue-700 p-2 rounded transition"
            title="Chat schließen"
          >
            ✕
          </button>
        </div>

        <!-- Toggle Suggestions -->
        <div class="px-6 py-3 bg-gray-50 border-b flex items-center gap-2">
          <input 
            type="checkbox" 
            v-model="showSuggestions" 
            id="toggle-suggestions"
            class="w-4 h-4 cursor-pointer"
          >
          <label for="toggle-suggestions" class="text-sm text-gray-700 cursor-pointer">
            Vorschlagsfragen anzeigen
          </label>
        </div>

        <!-- Chat Messages -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
        >
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :ref="index === messages.length - 1 ? el => lastMessageRef = el : null"
            :class="[
              'flex',
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              :class="[
                'max-w-xs px-4 py-2 rounded-lg messageChatbot-in-Frontend',
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-300 text-gray-900 rounded-bl-none'
              ]"
              v-html="msg.text"
              style="word-wrap: break-word; overflow-wrap: break-word;"
            >
            </div>
          </div>

          <!-- Suggestion Buttons -->
          <div v-if="showSuggestions && messages.length > 0 && !loading && availableSuggestions.length > 0" class="space-y-2">
            <button
              v-for="(suggestion, idx) in availableSuggestions"
              :key="idx"
              @click="sendMessage(suggestion)"
              class="w-full text-left px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border border-blue-300 transition"
            >
              → {{ suggestion }}
            </button>
          </div>

          <div v-if="loading" class="flex justify-start">
            <div class="bg-gray-300 px-4 py-2 rounded-lg rounded-bl-none">
              <span class="animate-pulse">Bot schreibt...</span>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-4 border-t border-gray-200 bg-white">
          <!-- Voice Controls -->
          <div v-if="isSupported" class="flex gap-2 mb-2">
            <button
              @click="toggleVoice"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition',
                voiceEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              ]"
              :title="voiceEnabled ? 'Voice aktiviert' : 'Voice deaktiviert'"
            >
              {{ voiceEnabled ? '🔊 Voice AN' : '🔇 Voice AUS' }}
            </button>
            <button
              v-if="isSpeaking"
              @click="stopSpeaking"
              class="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              title="Sprachausgabe stoppen"
            >
              ⏹️ Stop
            </button>
          </div>

          <form @submit.prevent="sendUserMessage" class="flex gap-2">
            <button
              v-if="isSupported"
              @click.prevent="handleVoiceInput"
              type="button"
              :disabled="loading || isListening"
              :class="[
                'px-4 py-2 rounded-lg transition',
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
              :title="isListening ? 'Aufnahme läuft...' : 'Spracheingabe'"
            >
              {{ isListening ? '🔴' : '🎤' }}
            </button>
            <input
              v-model="userInput"
              type="text"
              placeholder="Schreibe eine Nachricht..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              :disabled="loading"
            />
            <button
              type="submit"
              :disabled="loading || !userInput.trim()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              Senden
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import axios from 'axios'
import DOMPurify from 'dompurify'
import { useVoice } from './composables/useVoice'

// API-URL: In Production von Environment Variable, lokal von localhost
const API_URL = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5001'
  }
  return import.meta.env.VITE_API_URL || 'https://chatbotkundenservice.onrender.com'
})()

export default {
  name: 'Chatbot',
  setup() {
    const messages = ref([])
    const welcomeMessage = ref('Hallo! 👋 Willkommen zu unserem Kundenservice-Chatbot. Wie kann ich dir heute helfen?')
    const userInput = ref('')
    const loading = ref(false)
    const messagesContainer = ref(null)
    const lastMessageRef = ref(null)
    const showSuggestions = ref(false)
    const isChatOpen = ref(false)
    const usedSuggestions = ref(new Set())
    const currentSuggestions = ref([
      'Was kostet eine Website?',
      'Welche Technologien nutzt ihr?',
      'Wie lange dauert ein Projekt?',
      'Wie kann ich euch kontaktieren?',
      'Erzählt mir von eurem Team',
      'Zeigt mir euer Portfolio'
    ])

    // Voice functionality
    const { 
      isListening, 
      isSpeaking, 
      isSupported, 
      startListening, 
      stopListening, 
      speak, 
      stopSpeaking 
    } = useVoice()
    const voiceEnabled = ref(false)

    const availableSuggestions = computed(() => {
      return currentSuggestions.value.filter(s => !usedSuggestions.value.has(s))
    })

    const scrollToBottom = () => {
      setTimeout(() => {
        if (lastMessageRef.value) {
          // Scroll zum Anfang (oben) der letzten Nachricht
          lastMessageRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (messagesContainer.value) {
          // Fallback: Scrollen zum Ende des Containers
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      }, 100)
    }

    const loadWelcomeMessage = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/get-config`)
        if (response.data.metadata?.welcomeMessage) {
          welcomeMessage.value = response.data.metadata.welcomeMessage
        }
      } catch (error) {
        console.error('Fehler beim Laden der Willkommensnachricht:', error)
      }
      // Initialize messages after loading
      messages.value = [
        {
          sender: 'bot',
          text: welcomeMessage.value
        }
      ]
    }

    const toggleChat = () => {
      isChatOpen.value = !isChatOpen.value
      if (isChatOpen.value) {
        scrollToBottom()
      }
    }

    onMounted(() => {
      loadWelcomeMessage()
    })

    onUnmounted(() => {
      stopListening()
      stopSpeaking()
    })

    const sendUserMessage = () => {
      if (!userInput.value.trim()) return
      sendMessage(userInput.value)
      userInput.value = ''
    }

    const sendMessage = async (message) => {
      if (currentSuggestions.value.includes(message)) {
        usedSuggestions.value.add(message)
      }

      messages.value.push({
        sender: 'user',
        text: message
      })

      scrollToBottom()
      loading.value = true

      try {
        const response = await axios.post(`${API_URL}/api/chat`, {
          message: message
        })

        const botReply = response.data.reply

        const sanitizedReply = DOMPurify.sanitize(botReply, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'code', 'pre', 'blockquote', 'span'],
          ALLOWED_ATTR: ['href', 'title', 'target', 'class'],
          ALLOW_DATA_ATTR: false,
          FORCE_BODY: false
        })

        messages.value.push({
          sender: 'bot',
          text: sanitizedReply
        })

        if (voiceEnabled.value) {
          const textToSpeak = sanitizedReply.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
          speak(textToSpeak)
        }

        if (response.data.suggestions && Array.isArray(response.data.suggestions)) {
          currentSuggestions.value = response.data.suggestions
          usedSuggestions.value.clear()
        }

        scrollToBottom()
      } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error)
        let errorMessage = 'Entschuldigung, es gab einen Fehler. Bitte versuche es später erneut.'
        
        if (error.response?.status === 500) {
          errorMessage = `⚠️ Server Fehler: ${error.response.data?.error}`
          if (error.response.data?.hint) {
            errorMessage += `\n💡 ${error.response.data.hint}`
          }
        }
        
        messages.value.push({
          sender: 'bot',
          text: errorMessage
        })

        scrollToBottom()
      } finally {
        loading.value = false
      }
    }

    const handleVoiceInput = async () => {
      try {
        console.log('🎤 Attempting to start voice input...')
        const transcript = await startListening()
        console.log('✅ Voice input successful:', transcript)
        userInput.value = transcript
        sendMessage(transcript)
      } catch (error) {
        console.error('❌ Voice input error:', error)
        alert(`Voice-Fehler: ${error.message || 'Unbekannter Fehler'}\n\nTipps:\n- Nutze Chrome oder Edge Browser\n- Erlaube Mikrofon-Zugriff\n- Sprich deutlich nach dem Klick`)
      }
    }

    const toggleVoice = () => {
      voiceEnabled.value = !voiceEnabled.value
      if (!voiceEnabled.value) {
        stopSpeaking()
      }
    }

    return {
      messages,
      userInput,
      loading,
      messagesContainer,
      lastMessageRef,
      showSuggestions,
      currentSuggestions,
      availableSuggestions,
      isChatOpen,
      welcomeMessage,
      toggleChat,
      sendUserMessage,
      sendMessage,
      // Voice
      isListening,
      isSpeaking,
      isSupported,
      voiceEnabled,
      handleVoiceInput,
      toggleVoice,
      stopSpeaking
    }
  }
}
</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Button Animation */
button[title="Chat öffnen"] {
  transition: all 0.3s ease;
}

button[title="Chat öffnen"]:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.4);
}

button[title="Chat öffnen"]:active {
  transform: scale(0.95);
}

/* HTML Link Styling */
.messageChatbot-in-Frontend a {
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
}

.messageChatbot-in-Frontend a:hover {
  opacity: 0.8;
}

/* Message text with proper formatting */
.messageChatbot-in-Frontend {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;
}

/* Preserve line breaks in text */
.messageChatbot-in-Frontend br {
  display: block;
  content: "";
  margin: 0.5rem 0;
}
</style>
