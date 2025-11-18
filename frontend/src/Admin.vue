<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800" style="transform: scale(0.9); transform-origin: top left; width: 111.11%;">
    <!-- Header -->
    <div class="bg-slate-950 border-b border-slate-700 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-white">🤖 Chatbot CMS</h1>
          <p class="text-slate-400 text-xs mt-1">Verwalte Fragen, Antworten und Kategorien</p>
        </div>
        <div class="flex gap-3">
          <button
            v-if="selectedCategories.size > 0"
            @click="deleteSelected"
            class="px-5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-sm"
          >
            🗑️ {{ selectedCategories.size }} Löschen
          </button>
          <button
            @click="saveChanges"
            :disabled="!hasChanges || saving"
            class="px-5 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition text-sm"
          >
            {{ saving ? '💾 Speichert...' : '✅ Änderungen speichern' }}
          </button>
          <router-link to="/" class="px-5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm">
            🚀 Zum Chatbot
          </router-link>
        </div>
      </div>
    </div>

    <div class="flex min-h-[calc(100vh-60px)]">
      <!-- Linke Spalte - Kategorien -->
      <div class="w-1/3 bg-slate-800 border-r border-slate-700 overflow-y-auto">
        <div class="p-5 space-y-5">
          <!-- Willkommensnachricht -->
          <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 willkommensNachricht-editor-in-admin">
            <label class="block text-white font-semibold mb-2 text-sm">👋 Willkommensnachricht (WYSIWYG Editor):</label>
            <RichTextEditor
              v-model="welcomeMessage"
              @update:modelValue="markAsChanged"
              min-height="min-h-64"
            />
            <p class="text-slate-400 text-xs mt-2">💡 Nutze den Editor um Text zu formatieren. Emojis können mit der 😀 Schaltfläche eingefügt werden.</p>
          </div>

          <!-- Kategorien Liste mit Drag & Drop & Multi-Select -->
          <div class="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-bold text-white">📋 Kategorien verwalten</h3>
              <div class="flex gap-1">
                <button
                  v-if="selectAll"
                  @click="clearSelection"
                  class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
                >
                  Alle abwählen
                </button>
                <button
                  v-else
                  @click="selectAllCategories"
                  class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
                >
                  Alle auswählen
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <!-- Drop Zone vor erster Kategorie mit neuer Kategorie Button -->
              <button
                @click="showNewCategoryForm = !showNewCategoryForm"
                class="dropZone-in-admin w-full h-8 my-1 rounded transition bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1"
              >
                ➕ neue Kategorie
              </button>

              <!-- Kategorien -->
              <div
                v-for="(key, idx) in filteredCategoryOrder"
                :key="key"
              >
                <div
                  draggable="true"
                  @dragstart="dragStart($event, key)"
                  @dragover="dragOver($event, key)"
                  @dragleave="dragLeave"
                  @dragend="dragEnd"
                  :class="[
                    'p-2 rounded-lg cursor-move transition select-none border-2 text-sm',
                    draggedItem === key ? 'opacity-50 bg-slate-600 border-slate-500' : '',
                    selectedCategories.has(key) && draggedItem !== key
                      ? 'bg-blue-600 border-blue-400'
                      : draggedItem !== key
                      ? 'bg-slate-700 hover:bg-slate-600 border-transparent'
                      : 'border-transparent'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :checked="selectedCategories.has(key)"
                      @change="toggleSelect(key)"
                      class="w-4 h-4 cursor-pointer"
                    />
                    <span class="text-slate-400 text-xs">☰</span>
                    <button
                      @click="selectCategoryAndScroll(key)"
                      class="flex-1 text-left font-semibold text-white hover:text-blue-300 transition text-sm"
                    >
                      {{ idx + 1 }}. {{ categories[key].name }}
                    </button>
                    <button
                      @click="deleteCategory(key)"
                      class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <!-- Drop Zone nach dieser Kategorie -->
                <div
                  @dragover="dragOverDropZone($event, idx)"
                  @dragleave="dragLeave"
                  @drop="dropOnZone($event, idx)"
                  :class="[
                    'dropZone-in-admin h-4 my-1 rounded transition',
                    dropZoneIndex === idx ? 'bg-green-500 scale-y-200' : 'bg-slate-600 hover:bg-slate-500'
                  ]"
                ></div>
              </div>
            </div>
            <p class="text-slate-400 text-xs mt-2">💡 Tipp: Ziehe eine Kategorie über die grüne Linie um die Position zu bestimmen</p>
          </div>

          <!-- Neue Kategorie -->
          <div v-if="showNewCategoryForm" class="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 class="text-lg font-bold text-white mb-3">➕ Neue Kategorie</h3>
            <div class="space-y-2">
              <input
                v-model="newCategory.name"
                type="text"
                placeholder="Name (z.B. 'Support')"
                class="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs"
              />
              <input
                v-model="newCategory.id"
                type="text"
                placeholder="ID (z.B. 'support')"
                class="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs"
              />
              <textarea
                v-model="newCategory.response"
                placeholder="Bot-Antwort"
                rows="2"
                class="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-y text-xs"
              ></textarea>
              <button
                @click="createCategory"
                class="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition text-xs"
              >
                ✅ Erstellen
              </button>
            </div>
          </div>

          <!-- Info -->
          <div class="bg-blue-900 border border-blue-700 rounded-lg p-3">
            <h3 class="text-white font-semibold mb-1 text-xs">ℹ️ Informationen</h3>
            <ul class="text-blue-100 text-xs space-y-0">
              <li>✓ Änderungen werden lokal vorgenommen</li>
              <li>✓ Klick "Änderungen speichern" um zu persistieren</li>
              <li>✓ Konfiguration wird auf dem Server gespeichert</li>
              <li>✓ Änderungen sind sofort im Chatbot sichtbar</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Rechte Spalte - Kategoriebearbeitung -->
      <div class="w-2/3 bg-gradient-to-br from-slate-900 to-slate-800 overflow-y-auto">
        <div class="p-6">
          <div v-if="selectedCategory && categories[selectedCategory]" class="editDetail-in-admin space-y-5" ref="editDetailRef">
            <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <!-- Kategorie Info -->
              <div class="mb-6 pb-6 border-b border-slate-700">
                <h2 class="text-xl font-bold text-white mb-3">{{ categories[selectedCategory].name }}</h2>
                <p class="text-slate-400 text-sm">Kategorie ID: <span class="font-mono text-slate-300">{{ selectedCategory }}</span></p>
              </div>

              <!-- Response bearbeiten mit WYSIWYG Editor -->
              <div class="mb-6 botAntwort-editor-in-admin">
                <label class="block text-white font-semibold mb-2 text-sm">📝 Bot-Antwort (WYSIWYG Editor):</label>
                <RichTextEditor
                  :key="selectedCategory"
                  v-model="categories[selectedCategory].response"
                  @update:modelValue="markAsChanged"
                />
                <p class="text-slate-400 text-xs mt-2">💡 Nutze den Editor um Text zu formatieren. Emojis können mit der 😀 Schaltfläche eingefügt werden.</p>
              </div>

              <!-- Keywords bearbeiten -->
              <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-white font-semibold text-sm">🔍 Keywords:</label>
                  <button
                    @click="addKeyword(selectedCategory)"
                    class="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition"
                  >
                    + Keyword hinzufügen
                  </button>
                </div>
                <div class="space-y-1">
                  <div
                    v-for="(keyword, idx) in categories[selectedCategory].keywords"
                    :key="idx"
                    class="flex gap-2"
                  >
                    <input
                      v-model="categories[selectedCategory].keywords[idx]"
                      @input="markAsChanged"
                      type="text"
                      class="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs"
                      placeholder="z.B. 'preis', 'kosten', 'geld'"
                    />
                    <button
                      @click="removeKeyword(selectedCategory, idx)"
                      class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Follow-Up Fragen bearbeiten -->
              <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-white font-semibold text-sm">➡️ Folgefragen:</label>
                  <button
                    @click="addFollowUp(selectedCategory)"
                    class="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition"
                  >
                    + Folgefrage hinzufügen
                  </button>
                </div>
                <div class="space-y-1">
                  <div
                    v-for="(question, idx) in categories[selectedCategory].followUp"
                    :key="idx"
                    class="flex gap-2"
                  >
                    <input
                      v-model="categories[selectedCategory].followUp[idx]"
                      @input="markAsChanged"
                      type="text"
                      class="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs"
                      placeholder="z.B. 'Was kostet eine Website?'"
                    />
                    <button
                      @click="removeFollowUp(selectedCategory, idx)"
                      class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Stimmenauswahl -->
              <div class="mb-6">
                <label class="block text-white font-semibold mb-2 text-sm">🎙️ Sprachausgabe-Stimme:</label>
                <div class="grid grid-cols-2 gap-3">
                  <!-- Polly Voices -->
                  <div class="bg-slate-900 border border-slate-600 rounded-lg p-3">
                    <h4 class="text-slate-300 font-semibold text-xs mb-2">AWS Polly (5M Zeichen/Monat kostenlos)</h4>
                    <select
                      v-model="selectedVoice"
                      @change="markAsChanged"
                      class="w-full px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs mb-2"
                    >
                      <option value="polly-hans">🇩🇪 Hans (Standard)</option>
                      <option value="polly-marlene">🇩🇪 Marlene (Standard)</option>
                      <option value="polly-hans-neural">🇩🇪 Hans (Neural)</option>
                    </select>
                    <button
                      @click="previewVoice('Hallo, das ist eine Sprachprobe.', 'polly-hans')"
                      class="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
                    >
                      🔊 Anhören
                    </button>
                  </div>

                  <!-- Bark -->
                  <div class="bg-slate-900 border border-slate-600 rounded-lg p-3">
                    <h4 class="text-slate-300 font-semibold text-xs mb-2">Bark (Fallback)</h4>
                    <select
                      v-model="barkVoice"
                      @change="markAsChanged"
                      class="w-full px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs mb-2"
                    >
                      <option value="de_speaker_1">🎙️ Speaker 1</option>
                      <option value="de_speaker_2">🎙️ Speaker 2</option>
                      <option value="de_speaker_3">🎙️ Speaker 3</option>
                    </select>
                    <p class="text-slate-400 text-xs">Fallback-Stimme (6 Req/Min)</p>
                  </div>

                  <!-- ElevenLabs -->
                  <div class="bg-slate-900 border border-slate-600 rounded-lg p-3">
                    <h4 class="text-slate-300 font-semibold text-xs mb-2">ElevenLabs (Reserve)</h4>
                    <select
                      v-model="elevenLabsVoice"
                      @change="markAsChanged"
                      class="w-full px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs mb-2"
                    >
                      <option value="rachel">👩 Rachel</option>
                      <option value="bella">👱 Bella</option>
                      <option value="charlotte">👵 Charlotte</option>
                    </select>
                    <p class="text-slate-400 text-xs">Reserve-Fallback (10k Ch/Mo)</p>
                  </div>

                  <!-- Browser TTS -->
                  <div class="bg-slate-900 border border-slate-600 rounded-lg p-3">
                    <h4 class="text-slate-300 font-semibold text-xs mb-2">🌐 Browser-Sprache</h4>
                    <div class="text-slate-400 text-xs mb-2">
                      Automatische Fallback-Stimme
                    </div>
                    <p class="text-slate-400 text-xs">Nutzt System-Sprache</p>
                  </div>
                </div>
                <p class="text-slate-400 text-xs mt-2">💡 Gespeicherte Stimmen werden für alle Chatbot-Benutzer genutzt</p>
              </div>

              <!-- TTS Provider Priorität -->
              <div class="mb-6">
                <label class="block text-white font-semibold mb-2 text-sm">⚙️ TTS Provider Reihenfolge (Drag & Drop):</label>
                <p class="text-slate-400 text-xs mb-3">Sortiere die Provider von oben nach unten (erste = primär, letzte = Fallback)</p>
                <div class="bg-slate-900 border border-slate-600 rounded-lg p-3 space-y-2">
                  <div
                    v-for="(provider, idx) in ttsPriority"
                    :key="provider"
                    draggable="true"
                    @dragstart="dragStartProvider($event, idx)"
                    @dragover="dragOverProvider($event)"
                    @drop="dropProvider($event, idx)"
                    @dragend="dragEndProvider"
                    :class="[
                      'p-3 rounded-lg cursor-move transition border-2',
                      draggedProviderIdx === idx ? 'opacity-50 bg-slate-700 border-slate-400' : 'bg-slate-800 border-slate-600 hover:border-slate-400'
                    ]"
                  >
                    <div class="flex items-center gap-2 text-white text-sm">
                      <span class="text-xs text-slate-400">☰</span>
                      <span class="font-semibold">{{ idx + 1 }}.</span>
                      <span v-if="provider === 'polly'" class="flex items-center gap-1">
                        <span>AWS Polly</span>
                        <span class="text-xs bg-green-700 px-2 py-0.5 rounded">5M Ch/Mo</span>
                      </span>
                      <span v-else-if="provider === 'bark'" class="flex items-center gap-1">
                        <span>Bark (Replicate)</span>
                        <span class="text-xs bg-orange-700 px-2 py-0.5 rounded">6 Req/Min</span>
                      </span>
                      <span v-else-if="provider === 'elevenlabs'" class="flex items-center gap-1">
                        <span>ElevenLabs</span>
                        <span class="text-xs bg-blue-700 px-2 py-0.5 rounded">10k Ch/Mo</span>
                      </span>
                      <span v-else-if="provider === 'browser'" class="flex items-center gap-1">
                        <span>Browser TTS</span>
                        <span class="text-xs bg-gray-700 px-2 py-0.5 rounded">Fallback</span>
                      </span>
                    </div>
                  </div>
                </div>
                <p class="text-slate-400 text-xs mt-2">💡 Tipp: Ziehe Provider um die Fallback-Reihenfolge zu ändern</p>
              </div>

              <!-- Preview -->
              <div class="bg-slate-900 rounded-lg p-5 border border-slate-700">
                <h3 class="text-white font-semibold mb-2 text-sm">📱 Vorschau:</h3>
                <div
                  class="rounded-lg p-3 text-white text-xs 
                  whitespace-pre-wrap max-h-56 overflow-y-auto font-mono editorVorschau-in-admin bg-slate-800"
                  v-html="categories[selectedCategory].response"
                >
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-slate-400 py-12">
            <p class="text-sm">Wähle eine Kategorie aus, um sie zu bearbeiten</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import axios from 'axios'
import RichTextEditor from './components/RichTextEditor.vue'

export default {
  name: 'Admin',
  components: {
    RichTextEditor
  },
  setup() {
    const categories = ref({})
    const selectedCategory = ref(null)
    const hasChanges = ref(false)
    const saving = ref(false)
    const welcomeMessage = ref('Hallo! 👋 Willkommen zu unserem Kundenservice-Chatbot. Wie kann ich dir heute helfen?')
    const selectedVoice = ref('polly-hans')
    const barkVoice = ref('de_speaker_1')
    const elevenLabsVoice = ref('rachel')
    const ttsPriority = ref(['polly', 'bark', 'elevenlabs', 'browser'])
    const draggedProviderIdx = ref(null)
    const newCategory = ref({
      name: '',
      id: '',
      response: ''
    })
    const selectedCategories = ref(new Set())
    const categoryOrder = ref([])
    const draggedItem = ref(null)
    const dragOverKey = ref(null)
    const dropZoneIndex = ref(null)
    const editDetailRef = ref(null)
    const showNewCategoryForm = ref(false)

    const selectAll = computed(() => {
      return selectedCategories.value.size === categoryOrder.value.length
    })

    const filteredCategoryOrder = computed(() => {
      return categoryOrder.value.filter(key => categories.value[key])
    })

    const toggleSelect = (key) => {
      if (selectedCategories.value.has(key)) {
        selectedCategories.value.delete(key)
      } else {
        selectedCategories.value.add(key)
      }
    }

    const selectAllCategories = () => {
      selectedCategories.value.clear()
      categoryOrder.value.forEach(key => {
        selectedCategories.value.add(key)
      })
    }

    const clearSelection = () => {
      selectedCategories.value.clear()
    }

    const deleteCategory = (key) => {
      if (confirm(`⚠️ Kategorie "${categories.value[key].name}" wirklich löschen?`)) {
        delete categories.value[key]
        categoryOrder.value = categoryOrder.value.filter(k => k !== key)
        selectedCategories.value.delete(key)
        if (selectedCategory.value === key) {
          selectedCategory.value = categoryOrder.value[0] || null
        }
        markAsChanged()
      }
    }

    const deleteSelected = () => {
      if (selectedCategories.value.size === 0) return
      if (confirm(`⚠️ ${selectedCategories.value.size} Kategorie(n) wirklich löschen?`)) {
        selectedCategories.value.forEach(key => {
          delete categories.value[key]
          categoryOrder.value = categoryOrder.value.filter(k => k !== key)
        })
        selectedCategories.value.clear()
        selectedCategory.value = categoryOrder.value[0] || null
        markAsChanged()
      }
    }

    const dragStart = (event, key) => {
      draggedItem.value = key
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', event.target.innerText)
    }

    const dragOver = (event, key) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      dragOverKey.value = key
    }

    const dragOverDropZone = (event, zoneIndex) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      dropZoneIndex.value = zoneIndex
    }

    const dragLeave = () => {
      dragOverKey.value = null
      dropZoneIndex.value = null
    }

    const drop = (event, targetKey) => {
      event.preventDefault()
      if (draggedItem.value && draggedItem.value !== targetKey) {
        const draggedIndex = categoryOrder.value.indexOf(draggedItem.value)
        const targetIndex = categoryOrder.value.indexOf(targetKey)
        
        categoryOrder.value.splice(draggedIndex, 1)
        let insertIndex = categoryOrder.value.indexOf(targetKey)
        categoryOrder.value.splice(insertIndex, 0, draggedItem.value)
        
        markAsChanged()
      }
      dragEnd()
    }

    const dropOnZone = (event, zoneIndex) => {
      event.preventDefault()
      if (!draggedItem.value) return

      const draggedIndex = categoryOrder.value.indexOf(draggedItem.value)
      
      // Entferne das gezogene Element
      categoryOrder.value.splice(draggedIndex, 1)
      
      // Berechne die neue Position basierend auf zoneIndex
      // zoneIndex -1 = vor dem ersten Element
      // zoneIndex 0, 1, 2... = nach Element an Index 0, 1, 2...
      let insertIndex = zoneIndex + 1
      categoryOrder.value.splice(insertIndex, 0, draggedItem.value)
      
      markAsChanged()
      dragEnd()
    }

    const dragEnd = () => {
      draggedItem.value = null
      dragOverKey.value = null
      dropZoneIndex.value = null
    }

    // Provider Drag & Drop
    const dragStartProvider = (event, idx) => {
      draggedProviderIdx.value = idx
      event.dataTransfer.effectAllowed = 'move'
    }

    const dragOverProvider = (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }

    const dropProvider = (event, targetIdx) => {
      event.preventDefault()
      if (draggedProviderIdx.value !== null && draggedProviderIdx.value !== targetIdx) {
        const draggedProvider = ttsPriority.value[draggedProviderIdx.value]
        ttsPriority.value.splice(draggedProviderIdx.value, 1)
        ttsPriority.value.splice(targetIdx, 0, draggedProvider)
        markAsChanged()
      }
    }

    const dragEndProvider = () => {
      draggedProviderIdx.value = null
    }

    const markAsChanged = () => {
      hasChanges.value = true
    }

    const selectCategoryAndScroll = (key) => {
      selectedCategory.value = key
      // Scroll die rechte Spalte nach oben
      setTimeout(() => {
        if (editDetailRef.value) {
          editDetailRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 0)
    }

    const addKeyword = (categoryKey) => {
      if (!categories.value[categoryKey].keywords) {
        categories.value[categoryKey].keywords = []
      }
      categories.value[categoryKey].keywords.push('')
      markAsChanged()
    }

    const removeKeyword = (categoryKey, idx) => {
      categories.value[categoryKey].keywords.splice(idx, 1)
      markAsChanged()
    }

    const addFollowUp = (categoryKey) => {
      if (!categories.value[categoryKey].followUp) {
        categories.value[categoryKey].followUp = []
      }
      categories.value[categoryKey].followUp.push('')
      markAsChanged()
    }

    const removeFollowUp = (categoryKey, idx) => {
      categories.value[categoryKey].followUp.splice(idx, 1)
      markAsChanged()
    }

    const saveChanges = async () => {
      saving.value = true
      try {
        console.log('💾 Speichere welcomeMessage:', welcomeMessage.value)
        
        // Rekonstruiere categories mit neuer Ordnung
        const orderedCategories = {}
        categoryOrder.value.forEach(key => {
          if (categories.value[key]) {
            orderedCategories[key] = categories.value[key]
          }
        })

        await axios.post('/api/admin/save-config', {
          categories: orderedCategories,
          metadata: {
            welcomeMessage: welcomeMessage.value,
            voiceSettings: {
              selectedVoice: selectedVoice.value,
              barkVoice: barkVoice.value,
              elevenLabsVoice: elevenLabsVoice.value
            },
            ttsPriority: ttsPriority.value
          }
        })
        hasChanges.value = false
        alert('✅ Konfiguration erfolgreich gespeichert!')
      } catch (error) {
        console.error('Fehler beim Speichern:', error)
        alert('❌ Fehler beim Speichern der Konfiguration')
      } finally {
        saving.value = false
      }
    }

    const createCategory = async () => {
      if (!newCategory.value.id || !newCategory.value.name || !newCategory.value.response) {
        alert('⚠️ Bitte alle Felder ausfüllen!')
        return
      }

      categories.value[newCategory.value.id] = {
        name: newCategory.value.name,
        keywords: [],
        response: newCategory.value.response,
        followUp: ['Was kostet eine Website?', 'Wie kann ich euch kontaktieren?']
      }
      categoryOrder.value.push(newCategory.value.id)

      newCategory.value = { name: '', id: '', response: '' }
      selectedCategory.value = newCategory.value.id
      markAsChanged()
      alert('✅ Kategorie erstellt! Bitte speichern nicht vergessen.')
    }

    // Load config on mount
    const loadConfig = async () => {
      try {
        const response = await axios.get('/api/admin/get-config')
        categories.value = response.data.categories
        categoryOrder.value = Object.keys(response.data.categories)
        // Explicitly select first category
        if (categoryOrder.value.length > 0) {
          selectedCategory.value = categoryOrder.value[0]
        }
        if (response.data.metadata?.welcomeMessage) {
          welcomeMessage.value = response.data.metadata.welcomeMessage
          console.log('📥 Geladene welcomeMessage:', welcomeMessage.value)
        }
        if (response.data.metadata?.voiceSettings) {
          selectedVoice.value = response.data.metadata.voiceSettings.selectedVoice || 'polly-hans'
          barkVoice.value = response.data.metadata.voiceSettings.barkVoice || 'de_speaker_1'
          elevenLabsVoice.value = response.data.metadata.voiceSettings.elevenLabsVoice || 'rachel'
        }
        if (response.data.metadata?.ttsPriority) {
          ttsPriority.value = response.data.metadata.ttsPriority
        }
      } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error)
        alert('❌ Fehler beim Laden der Konfiguration')
      }
    }

    // Preview voice sample
    const previewVoice = async (text, voice) => {
      try {
        console.log('🔊 Vorschau starten:', voice)
        const response = await axios.post('/api/tts-preview', {
          text: text,
          voice: voice
        }, {
          responseType: 'blob'
        })
        
        const audio = new Audio(URL.createObjectURL(response.data))
        audio.play()
      } catch (error) {
        console.error('❌ Fehler bei der Sprachprobe:', error)
        alert('❌ Sprachprobe konnte nicht geladen werden')
      }
    }

    loadConfig()

    return {
      categories,
      categoryOrder,
      selectedCategory,
      selectedCategories,
      hasChanges,
      saving,
      welcomeMessage,
      selectedVoice,
      barkVoice,
      elevenLabsVoice,
      ttsPriority,
      draggedProviderIdx,
      newCategory,
      selectAll,
      filteredCategoryOrder,
      draggedItem,
      dragOverKey,
      dropZoneIndex,
      editDetailRef,
      showNewCategoryForm,
      markAsChanged,
      selectCategoryAndScroll,
      toggleSelect,
      selectAllCategories,
      clearSelection,
      deleteCategory,
      deleteSelected,
      dragStart,
      dragOver,
      dragOverDropZone,
      dragLeave,
      drop,
      dropOnZone,
      dragEnd,
      dragStartProvider,
      dragOverProvider,
      dropProvider,
      dragEndProvider,
      addKeyword,
      removeKeyword,
      addFollowUp,
      removeFollowUp,
      saveChanges,
      createCategory,
      previewVoice
    }
  }
}
</script>

<style scoped>
textarea {
  font-family: 'Courier New', monospace;
}
</style>
