# 🚀 Groq LLaMA 3 Integration - Setup Anleitung

## Was wurde implementiert?

✅ Dein Chatbot nutzt jetzt **Groq LLaMA 3.1 70B** - eines der besten kostenlosen KI-Modelle!
✅ Intelligente Antworten statt vordefinierter Texte
✅ Kontext-bewusste Responses basierend auf deinen Kategorien
✅ Fallback zu config-basierten Antworten bei Problemen

---

## 🔑 API Key einrichten (5 Minuten)

### Schritt 1: Groq Account erstellen
1. Gehe zu: **https://console.groq.com**
2. Klicke auf **"Sign Up"** oder **"Sign In with Google"**
3. Kostenloser Account - keine Kreditkarte nötig!

### Schritt 2: API Key generieren
1. Nach dem Login gehe zu: **API Keys** (links im Menü)
2. Klicke auf **"Create API Key"**
3. Gib einen Namen ein (z.B. "Chatbot")
4. **Kopiere den Key** (sieht so aus: `gsk_...`)

### Schritt 3: Key in .env einfügen
1. Öffne `backend/.env`
2. Ersetze `your_groq_api_key_here` mit deinem echten Key:
   ```
   GROQ_API_KEY=gsk_deinSchlüsselHier123456789
   ```
3. Speichern!

### Schritt 4: Server neu starten
```bash
cd backend
node server.js
```

Du solltest sehen:
```
🤖 Mode: AI-Powered Chatbot (Groq LLaMA 3.1)
🔑 Groq API: ✅ Connected
```

---

## 🎯 Features

### Was kann die KI jetzt?

- ✅ **Intelligente Antworten** auf beliebige Fragen
- ✅ **Kontext-Verstehen** - nutzt deine Kategorie-Infos
- ✅ **Deutsch-sprachig** - optimiert für deutsche Gespräche
- ✅ **Business-bewusst** - kennt deine Firma und E-Mail
- ✅ **Schnell** - Groq ist extrem performant (< 1 Sekunde)
- ✅ **Kostenlos** - Unbegrenzte Nutzung!

### Beispiel-Dialog:

**User:** "Wie viel kostet eine Website?"

**Alte Version (Config-basiert):**
> "So erreichst du uns: E-Mail: info@example.com..."

**Neue Version (KI-powered):**
> "Eine professionelle Website kostet je nach Umfang unterschiedlich. Für ein individuelles Angebot kontaktiere uns gerne per E-Mail unter info@hasanyueksel.de. Wir besprechen dann gemeinsam deine Anforderungen! 💼"

---

## 📊 Technische Details

**Modell:** LLaMA 3.1 70B Versatile
- **Größe:** 70 Milliarden Parameter
- **Geschwindigkeit:** ~1 Sekunde pro Antwort
- **Kontext:** 8,000 Tokens
- **Qualität:** Vergleichbar mit GPT-3.5

**API Limits (kostenlos):**
- 30 Requests pro Minute
- 14,400 Tokens pro Minute
- Mehr als genug für deinen Chatbot!

---

## 🔧 Anpassungen

### System Prompt bearbeiten
In `server.js` findest du den Prompt (Zeile ~70):

```javascript
const systemPrompt = `Du bist ein hilfreicher Kundenservice-Assistent...`
```

Hier kannst du:
- Persönlichkeit der KI anpassen
- Zusätzliche Regeln definieren
- Ton und Stil verändern

### Modell wechseln
Andere verfügbare Modelle:
```javascript
model: 'llama-3.1-8b-instant',  // Schneller, weniger intelligent
model: 'mixtral-8x7b-32768',    // Alternative, sehr gut
model: 'gemma-7b-it',           // Google's Modell
```

---

## 🐛 Troubleshooting

### "❌ Missing API Key"
- Stelle sicher, dass `.env` Datei den Key enthält
- Key muss mit `gsk_` beginnen
- Server neu starten nach Änderung

### "AI temporarily unavailable"
- Prüfe Internet-Verbindung
- Groq API könnte down sein (selten)
- Chatbot nutzt dann automatisch Fallback-Antworten

### Langsame Antworten
- Groq ist normalerweise sehr schnell (<1s)
- Bei Problemen: Modell zu `llama-3.1-8b-instant` wechseln

---

## 📝 Nächste Schritte

1. **API Key holen** → https://console.groq.com
2. **In .env einfügen**
3. **Server starten**
4. **Chatbot testen!**

Bei Fragen: Die KI nutzt deine Kategorie-Konfigurationen als Kontext.
Je besser deine Kategorien gepflegt sind, desto besser die AI-Antworten!

---

**Status:** ✅ Integration abgeschlossen
**Version:** 3.0 (AI-Powered)
**Last Updated:** November 14, 2025
