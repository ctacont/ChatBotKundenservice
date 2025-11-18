# 🤖 Kundenservice Chatbot

Ein professioneller KI-gestützter Kundenservice-Chatbot mit **Spracheingabe/Sprachausgabe** und **HTML-Rendering**.

## ✨ Features

### 🎤 Speech-to-Text (STT)
- **Web Speech API** mit Deutsch (de-DE) Unterstützung
- Live Transkription mit Interim Results
- Confidence Score Anzeige

### 🔊 Text-to-Speech (TTS) - Intelligente Fallback-Kette
1. **AWS Polly** (Primär) - 5M Zeichen/Monat kostenlos
2. **Bark via Replicate** (Fallback 1) - 6 Requests/Minute kostenlos
3. **ElevenLabs** (Fallback 2) - 10k Zeichen/Monat kostenlos
4. **Browser TTS** (Ultimate Fallback) - Immer verfügbar

### 🎨 Admin Panel (WYSIWYG Editor)
- Rich Text Editor mit HTML-Formatierung
- Voice Settings pro Provider (Polly, Bark, ElevenLabs)
- TTS Provider Prioritization mit Drag-and-Drop
- Persistente Konfiguration

### 💬 Intelligente Chat-Funktionen
- Kategorien-basierte Smart Patterns
- Groq AI Integration
- HTML-Safe Rendering mit DOMPurify XSS-Schutz

## 🚀 Quick Start

```bash
# Backend
cd backend
cp .env.example .env
# Füge API-Keys ein!
npm install
npm start

# Frontend (neues Terminal)
cd frontend
npm install
npm run dev
```

**Zugriff:**
- 🤖 Chatbot: http://localhost:3001
- ⚙️ Admin: http://localhost:3001/admin

## 📋 API-Keys benötigt

- **Groq** - https://console.groq.com (kostenlos)
- **AWS** - https://aws.amazon.com (kostenlos)
- Optional: ElevenLabs, Replicate

## 📁 Struktur

```
ChatBotKundenservice/
├── backend/
│   ├── server.js              # Express API
│   ├── chatbot-config.json    # Konfiguration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── Chatbot.vue       # Chat UI
│   │   ├── Admin.vue         # Admin Panel
│   │   ├── components/RichTextEditor.vue  # WYSIWYG
│   │   └── composables/useVoice.js  # Voice Logik
│   └── package.json
└── README.md
```

## 🛡️ Sicherheit

- XSS Protection mit DOMPurify
- API-Keys in `.env` (nicht committen!)
- HTML Whitelist: `<p>, <strong>, <em>, <ul>, <li>, <a>, <h1-h4>, <code>`

## 📝 Lizenz

MIT - Frei zu verwenden und zu modifizieren

---

**Gebaut mit ❤️ für professionelle Kundenservice-Chatbots**

