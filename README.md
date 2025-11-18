# 💬 Kundenservice Chatbot

Ein moderner Chatbot für Webdesign-Dienstleistungen mit **OpenAI GPT-3.5**, gebaut mit **Node.js + Express** (Backend) und **Vue 3 + Tailwind CSS** (Frontend).

## 🎯 Features

✅ Intelligente KI-gesteuerte Antworten (OpenAI GPT-3.5)  
✅ Echtzeit-Chat-Kommunikation  
✅ Responsive Design mit Tailwind CSS  
✅ Benutzerfreundliche Vue 3 UI  
✅ REST API Backend  
✅ Mehrsprachigkeit (auf Deutsch optimiert)

## 🚀 Installation & Setup

### 1. Backend Dependencies installieren

```bash
cd backend
npm install
```

### 2. OpenAI API Key besorgen

1. Gehe zu [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Melde dich an oder erstelle einen Account
3. Generiere einen neuen API Key
4. Kopiere den Key

### 3. .env Datei aktualisieren

Bearbeite `backend/.env`:

```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=sk-your-actual-api-key-here
```

Ersetze `sk-your-actual-api-key-here` mit deinem echten OpenAI API Key.

### 4. Backend starten

```bash
npm run dev
```

Server läuft auf: `http://localhost:5000`

### 5. Frontend installieren & starten

In einem neuen Terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend läuft auf: `http://localhost:3000`

## 📁 Projektstruktur

```
ChatBotKundenservice/
├── backend/
│   ├── server.js          # Express Server + OpenAI Integration
│   ├── package.json
│   └── .env               # Umgebungsvariablen (GEHEIM!)
├── frontend/
│   ├── src/
│   │   ├── App.vue        # Haupt-Komponente
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### POST `/api/chat`
Sendet eine Nachricht an den KI-Chatbot.

**Request:**
```json
{
  "message": "Wie viel kostet eine Website?"
}
```

**Response:**
```json
{
  "reply": "Unsere Webdesign-Pakete beginnen ab €2.000 für das Basispaket...",
  "timestamp": "2024-11-13T..."
}
```

## 💰 Kosten

OpenAI GPT-3.5 ist sehr günstig:
- ~0,001$ pro 1.000 Tokens
- Eine typische Unterhaltung: ~1-2 Cent

**Kostenlos testen:** OpenAI gibt dir $5 kostenlosen Credits zum Testen.

## 🎨 Anpassungen

### Chatbot-Verhalten ändern
Bearbeite den `SYSTEM_PROMPT` in `backend/server.js`:

```javascript
const SYSTEM_PROMPT = `Du bist ein freundlicher Kundenservice-Chatbot...`;
```

### Styling anpassen
Modifiziere `frontend/src/style.css` oder `tailwind.config.js`.

## ⚠️ Wichtig: .env Sicherheit

**NIEMALS deinen OpenAI API Key in GitHub pushen!**

- Die `.env` Datei steht bereits in `.gitignore`
- Teile deinen Key mit niemandem
- Bei Verdacht auf Kompromittierung: API Key regenerieren

## 🚀 Nächste Schritte

1. **Chat-Verlauf speichern**: Datenbank integrieren (MongoDB)
2. **Benutzerkonten**: Authentifizierung mit JWT
3. **Weitere KI-Features**: Datei-Upload für Kontextinformationen
4. **Deployment**: Docker + Railway/Vercel
5. **Analytics**: Chat-Statistiken und Feedback

## 📝 Lizenz

MIT

---

**Viel Spaß mit deinem intelligenten Chatbot! 🤖✨**

