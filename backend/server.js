import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Groq AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Load chatbot configuration
let chatbotConfig = {
  metadata: {},
  categories: {}
};

try {
  const configPath = path.join(__dirname, 'chatbot-config.json');
  const configData = fs.readFileSync(configPath, 'utf-8');
  chatbotConfig = JSON.parse(configData);
  console.log('✅ Chatbot-Konfiguration geladen:', chatbotConfig.metadata.businessName);
} catch (error) {
  console.error('❌ Fehler beim Laden der chatbot-config.json:', error.message);
  console.log('ℹ️ Verwende Standard-Konfiguration');
}

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Find best matching category
function findBestCategory(message) {
  const lowerMessage = message.toLowerCase().trim();
  let bestMatch = 'default';
  let highestScore = 0;

  Object.entries(chatbotConfig.categories).forEach(([categoryKey, categoryData]) => {
    if (categoryKey === 'default') return; // Skip default for now

    // Count keyword matches with priority
    let matchScore = 0;
    categoryData.keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        matchScore += 1;
        // Bonus points for exact word matches
        const wordBoundary = /\b/g;
        if (new RegExp(`\\b${keyword.toLowerCase()}\\b`).test(lowerMessage)) {
          matchScore += 0.5;
        }
      }
    });

    if (matchScore > highestScore) {
      highestScore = matchScore;
      bestMatch = categoryKey;
    }
  });

  console.log(`📊 Matching: "${message}" → ${bestMatch} (Score: ${highestScore})`);
  return bestMatch;
}

// Helper: Format text as HTML
function formatAsHTML(text) {
  if (!text) return '<p></p>';
  
  // Convert plain text to HTML with basic formatting
  let html = text
    // Split by line breaks
    .split('\n').map(line => {
      line = line.trim();
      if (!line) return '<br>';
      
      // Detect lists (lines starting with - or • or ✓)
      if (line.match(/^[-•✓]\s/)) {
        // Behalte HTML tags wie <a> in Listen
        const listContent = line.replace(/^[-•✓]\s/, '');
        return '<li>' + listContent + '</li>';
      }
      
      // Detect numbered lists
      if (line.match(/^\d+\.\s/)) {
        const listContent = line.replace(/^\d+\.\s/, '');
        return '<li>' + listContent + '</li>';
      }
      
      // Regular paragraph - behalte HTML tags wie <a>
      return '<p>' + line + '</p>';
    }).join('');
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Bold text **text** (aber nicht in bereits vorhandenen HTML Tags)
  html = html.replace(/\*\*([^*<]+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic text *text* (aber nicht in bereits vorhandenen HTML Tags oder **bold**)
  html = html.replace(/(?<!\*)\*([^*<]+?)\*(?!\*)/g, '<em>$1</em>');
  
  return html;
}

// Helper: Generate smart response when AI is unavailable
function generateSmartResponse(message, categoryKey, categoryData) {
  const businessName = chatbotConfig.metadata.businessName || 'Webdesign & Development';
  const businessEmail = chatbotConfig.metadata.businessEmail || 'info@example.com';
  const lowerMessage = message.toLowerCase().trim();

  // Get smart patterns from config
  const patterns = chatbotConfig.smartPatterns || {};

  // Check each pattern
  for (const [patternKey, patternData] of Object.entries(patterns)) {
    if (patternKey === 'default') continue; // Skip default for now
    
    const keywords = patternData.keywords || [];
    const patternRegex = new RegExp(keywords.join('|'), 'i');
    
    if (patternRegex.test(lowerMessage)) {
      let response = patternData.response;
      
      // Replace placeholders
      response = response.replace(/\{businessName\}/g, businessName);
      response = response.replace(/\{businessEmail\}/g, businessEmail);
      
      // Replace {categories} with list of category names
      if (response.includes('{categories}')) {
        const categoryList = Object.values(chatbotConfig.categories)
          .filter(cat => cat.name && cat.name !== 'Default' && cat.name !== 'Standard-Antwort')
          .map(cat => cat.name)
          .join(', ');
        response = response.replace(/\{categories\}/g, categoryList);
      }
      
      console.log(`🎯 [SMART-PATTERN] Matched pattern: ${patternKey}`);
      return formatAsHTML(response);
    }
  }

  // Default smart response using category context
  if (categoryKey !== 'default' && categoryData && categoryData.response) {
    const plainText = `🤔 Deine Frage ist sehr interessant! 
Zum Thema "${categoryData.name}" kann ich dir folgendes sagen:

${categoryData.response}

❓ Hast du noch weitere Fragen? 
📧 Wir helfen gerne unter ${businessEmail}!`;
    return formatAsHTML(plainText);
  }

  // Ultimate fallback from config
  const defaultPattern = patterns.default;
  if (defaultPattern && defaultPattern.response) {
    let response = defaultPattern.response;
    response = response.replace(/\{businessName\}/g, businessName);
    response = response.replace(/\{businessEmail\}/g, businessEmail);
    return formatAsHTML(response);
  }

  // Hard-coded fallback (should never reach here)
  const hardFallback = `💡 Danke für deine Frage! 
Kontakt: ${businessEmail}
📞 Unser Team freut sich auf dich!`;
  return formatAsHTML(hardFallback);
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log('📨 User Message:', message);

  try {
    // Find best matching category
    const categoryKey = findBestCategory(message);
    const categoryData = chatbotConfig.categories[categoryKey];
    const contextInfo = categoryData?.response || chatbotConfig.categories.default.response;

    // Create AI prompt with business context
    const systemPrompt = `Du bist ein hilfreicher Kundenservice-Assistent für ${chatbotConfig.metadata.businessName || 'unser Unternehmen'}.

Geschäftsinformationen:
- Business: ${chatbotConfig.metadata.businessName || 'Webdesign & Development'}
- E-Mail: ${chatbotConfig.metadata.businessEmail || 'info@example.com'}
- Sprache: Deutsch

Kontext zur Frage:
${contextInfo}

Regeln:
- Antworte kurz, präzise und freundlich auf Deutsch
- Nutze die Kontextinformationen oben für deine Antwort
- Verwende Emojis sparsam (max. 1-2)
- Bei technischen Fragen: biete konkrete Lösungen
- Bei Preisfragen: verweise auf die Kontaktmöglichkeiten`;

    // Call Groq API
    console.log('🚀 [GROQ] Versuche Groq AI zu erreichen...');
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-70b-versatile', // Bestes kostenloses Modell
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiReply = completion.choices[0]?.message?.content || contextInfo;
    const formattedReply = formatAsHTML(aiReply);
    const suggestions = categoryData?.followUp || chatbotConfig.categories.default.followUp;

    console.log('✅ [GROQ] Verbindung erfolgreich! AI-Response generiert');
    console.log('🎯 Category:', categoryKey);
    console.log('🤖 AI Reply:', aiReply.substring(0, 50) + '...');

    res.json({
      reply: formattedReply,
      timestamp: new Date(),
      mode: 'ai-powered',
      model: 'llama-3.1-70b',
      version: '3.0',
      category: categoryKey,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('❌ [GROQ] Fehler bei AI-Verbindung:', error.message);
    console.error('Error details:', error.response?.data || error);
    
    // Use smart fallback response instead of static config
    const categoryKey = findBestCategory(message);
    const categoryData = chatbotConfig.categories[categoryKey];
    const reply = generateSmartResponse(message, categoryKey, categoryData);
    const suggestions = categoryData?.followUp || chatbotConfig.categories.default.followUp;

    console.log('🧠 [FALLBACK] Nutze Smart-Response Fallback statt Groq');
    console.log('🎯 Category:', categoryKey);

    res.json({
      reply,
      timestamp: new Date(),
      mode: 'smart-fallback',
      version: '3.0',
      category: categoryKey,
      suggestions: suggestions
    });
  }
});

// AWS Polly Text-to-Speech Endpoint (PRIMÄR)
app.post('/api/polly', async (req, res) => {
  const { text, voice } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ [POLLY] AWS credentials fehlen');
      return res.status(503).json({
        error: 'Polly TTS service not configured',
        fallback: 'browser-tts'
      });
    }

    // Map voice selection to Polly voice ID
    const voiceMapping = {
      'polly-hans': { VoiceId: 'Hans', Engine: 'standard' },
      'polly-marlene': { VoiceId: 'Marlene', Engine: 'standard' },
      'polly-hans-neural': { VoiceId: 'Hans', Engine: 'neural' }
    };
    
    const voiceConfig = voiceMapping[voice] || voiceMapping['polly-hans'];
    console.log(`🎤 [POLLY] Generating audio with voice: ${voice || 'default'} for: ${text.substring(0, 50)}...`);

    // Initialize Polly Client
    const pollyClient = new PollyClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });

    // Synthesize speech
    const command = new SynthesizeSpeechCommand({
      Text: text,
      Engine: voiceConfig.Engine,
      OutputFormat: 'mp3',
      VoiceId: voiceConfig.VoiceId,
      LanguageCode: 'de-DE'
    });

    const response = await pollyClient.send(command);

    // Convert audio stream to buffer
    const chunks = [];
    const audioStream = response.AudioStream;

    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString('base64');

    console.log('✅ [POLLY] Audio generated successfully');

    res.json({
      audio: audioBase64,
      format: 'mp3',
      provider: 'polly',
      size: audioBuffer.length
    });

  } catch (error) {
    console.error('❌ [POLLY] Error:', error.message);
    
    res.status(500).json({
      error: 'Polly TTS generation failed',
      message: error.message,
      fallback: 'browser-tts'
    });
  }
});

// Bark Text-to-Speech Endpoint (Fallback)
app.post('/api/bark', async (req, res) => {
  const { text, voice } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Map voice selection
  const voiceMapping = {
    'de_speaker_1': 'de_speaker_1',
    'de_speaker_2': 'de_speaker_2',
    'de_speaker_3': 'de_speaker_3'
  };
  
  const selectedVoice = voiceMapping[voice] || 'de_speaker_1';
  console.log(`🎤 [BARK] Using voice: ${selectedVoice}`);

  try {
    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    
    if (!REPLICATE_API_KEY) {
      console.log('⚠️ [BARK] Replicate API Key fehlt');
      return res.status(503).json({ 
        error: 'Bark TTS service not configured',
        fallback: 'browser-tts'
      });
    }

    console.log('🎤 [BARK] Generating audio for:', text.substring(0, 50) + '...');

    // Replicate API Call - Bark Text-to-Speech
    // Model: suno-ai/bark (latest version)
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        model: 'suno-ai/bark',
        input: {
          prompt: text,
          history_prompt: selectedVoice,
          text_temp: 0.7,
          waveform_temp: 0.5
        }
      },
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const predictionId = response.data.id;
    console.log('🎤 [BARK] Prediction created:', predictionId);

    // Poll for completion (Replicate is async)
    let prediction = response.data;
    let attempts = 0;
    const maxAttempts = 60; // ~30 seconds with 500ms interval

    while (prediction.status === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pollResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`
          }
        }
      );

      prediction = pollResponse.data;
      attempts++;
    }

    if (prediction.status !== 'succeeded') {
      console.error('❌ [BARK] Prediction failed:', prediction.status);
      return res.status(500).json({ 
        error: 'Bark prediction failed',
        status: prediction.status,
        fallback: 'browser-tts'
      });
    }

    // Get the audio URL from output
    const audioUrl = prediction.output;
    if (!audioUrl) {
      console.error('❌ [BARK] No audio URL in output');
      return res.status(500).json({ 
        error: 'No audio generated',
        fallback: 'browser-tts'
      });
    }

    console.log('✅ [BARK] Audio generated successfully');

    // Download the audio file and convert to base64
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer'
    });

    const audioBase64 = Buffer.from(audioResponse.data).toString('base64');
    
    res.json({
      audio: audioBase64,
      format: 'wav',
      provider: 'bark',
      duration: audioResponse.headers['content-length']
    });

  } catch (error) {
    console.error('❌ [BARK] Error:', error.message);
    if (error.response?.data) {
      console.error('API Response:', error.response.data);
    }
    
    res.status(500).json({ 
      error: 'Bark TTS generation failed',
      message: error.message,
      fallback: 'browser-tts'
    });
  }
});

// Text-to-Speech Endpoint (ElevenLabs)
app.post('/api/tts', async (req, res) => {
  const { text, voice } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.log('⚠️ [TTS] ElevenLabs API Key fehlt - verwende Browser TTS');
      return res.status(503).json({ 
        error: 'TTS service not configured',
        fallback: 'browser-tts'
      });
    }

    // Map voice selection to ElevenLabs voice ID
    const voiceMapping = {
      'rachel': 'pNInz6obpgDQGcFmaJgB',
      'bella': '8L2pGqFJfXDy0YKG3Q2R',
      'charlotte': 'mTcLxHfAvLYt1v6zFXJc'
    };
    
    const voiceId = voiceMapping[voice] || voiceMapping['rachel']; // Fallback to Rachel
    console.log(`🎤 [TTS] Using voice: ${voice || 'rachel'} (ID: ${voiceId})`);
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    console.log('✅ [TTS] ElevenLabs Audio generiert');
    
    // Send audio back as base64
    const audioBase64 = Buffer.from(response.data).toString('base64');
    res.json({
      audio: audioBase64,
      format: 'mp3',
      provider: 'elevenlabs'
    });

  } catch (error) {
    console.error('❌ [TTS] Fehler:', error.message);
    res.status(500).json({ 
      error: 'TTS generation failed',
      fallback: 'browser-tts'
    });
  }
});

// TTS Preview Endpoint (für Voice-Tests im Admin-Bereich)
app.post('/api/tts-preview', async (req, res) => {
  const { text, voice } = req.body;
  const previewText = text || 'Das ist eine Sprachprobe. Hallo, ich bin ein Sprachassistent.';

  if (!voice) {
    return res.status(400).json({ error: 'Voice is required' });
  }

  try {
    console.log(`🎙️ [PREVIEW] Generating preview with voice: ${voice}`);
    
    // Route to correct TTS provider based on voice prefix
    if (voice.startsWith('polly-')) {
      // Use Polly
      const response = await axios.post('http://localhost:5001/api/polly', {
        text: previewText,
        voice: voice
      });
      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(response.data.audio, 'base64'));
    } else if (voice.startsWith('de_speaker')) {
      // Use Bark
      const response = await axios.post('http://localhost:5001/api/bark', {
        text: previewText,
        voice: voice
      });
      const mimeType = response.data.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
      res.set('Content-Type', mimeType);
      res.send(Buffer.from(response.data.audio, 'base64'));
    } else {
      // Use ElevenLabs
      const response = await axios.post('http://localhost:5001/api/tts', {
        text: previewText,
        voice: voice
      });
      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(response.data.audio, 'base64'));
    }
  } catch (error) {
    console.error('❌ [PREVIEW] Error:', error.message);
    res.status(500).json({ error: 'Preview generation failed' });
  }
});

// Admin Endpoints
app.get('/api/admin/get-config', (req, res) => {
  try {
    res.json({
      categories: chatbotConfig.categories,
      metadata: chatbotConfig.metadata
    });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
  }
});

app.post('/api/admin/save-config', (req, res) => {
  try {
    const { categories, metadata } = req.body;

    if (!categories) {
      return res.status(400).json({ error: 'Categories erforderlich' });
    }

    // Update in-memory config
    chatbotConfig.categories = categories;
    if (metadata) {
      chatbotConfig.metadata = { ...chatbotConfig.metadata, ...metadata };
    }

    // Save to file
    const configPath = path.join(__dirname, 'chatbot-config.json');
    fs.writeFileSync(configPath, JSON.stringify(chatbotConfig, null, 2), 'utf-8');

    console.log('✅ Konfiguration gespeichert!');

    res.json({
      success: true,
      message: 'Konfiguration erfolgreich gespeichert',
      categories: chatbotConfig.categories,
      metadata: chatbotConfig.metadata
    });
  } catch (error) {
    console.error('❌ Fehler beim Speichern:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server läuft auf http://localhost:${PORT}`);
  console.log(`📨 Chat API: POST http://localhost:${PORT}/api/chat`);
  console.log(`⚙️ Admin API: GET http://localhost:${PORT}/api/admin/get-config`);
  console.log(`⚙️ Admin API: POST http://localhost:${PORT}/api/admin/save-config`);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Mode: AI-Powered Chatbot (Groq LLaMA 3.1)`);
  
  if (process.env.GROQ_API_KEY) {
    console.log(`✅ [GROQ] API Key vorhanden - AI-Responses AKTIV`);
    console.log(`📌 Status: Groq wird für Antworten verwendet`);
  } else {
    console.log(`❌ [GROQ] API Key FEHLT - Smart-Fallback wird verwendet`);
    console.log(`📌 Status: Intelligente regelbasierte Antworten`);
  }
  console.log(`${'='.repeat(60)}\n`);
});
