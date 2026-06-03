import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export const config = { api: { responseLimit: false } };

const DEFAULT_PROMPT = 'You are a helpful AI assistant for a professional team. Be clear, concise, and actionable.';

// ── SSE helpers ─────────────────────────────────────────────
function startStream(res) {
  res.writeHead(200, {
    'Content-Type':      'text/event-stream',
    'Cache-Control':     'no-cache, no-transform',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no',
  });
}
function send(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  if (typeof res.flush === 'function') res.flush();
}

// ── Provider handlers ────────────────────────────────────────
async function handleClaude(res, messages, model, system) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-placeholder') {
    send(res, { error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY in Vercel env vars.' });
    return res.end();
  }
  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model:      model || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
    max_tokens: 8096,
    system,
    messages:   messages.map(m => ({ role: m.role, content: m.content })),
  });
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
      send(res, { text: chunk.delta.text });
    }
  }
}

async function handleGemini(res, messages, model, system) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    send(res, { error: 'GEMINI_API_KEY not configured in Vercel env vars.' });
    return res.end();
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model:             model || 'gemini-2.0-flash',
    systemInstruction: system,
  });

  // Gemini requires messages to alternate and start with 'user'
  // roles: 'user' | 'model'  (NOT 'assistant')
  const converted = messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Remove leading non-user messages
  while (converted.length > 0 && converted[0].role !== 'user') converted.shift();

  const history  = converted.slice(0, -1);
  const lastText = converted[converted.length - 1]?.parts[0]?.text || '';

  const chat   = geminiModel.startChat({ history });
  const result = await chat.sendMessageStream(lastText);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) send(res, { text });
  }
}

async function handleGroq(res, messages, model, system) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    send(res, { error: 'GROQ_API_KEY not configured in Vercel env vars.' });
    return res.end();
  }
  const groq   = new Groq({ apiKey });
  const stream = await groq.chat.completions.create({
    model:      model || 'llama-3.3-70b-versatile',
    max_tokens: 8096,
    stream:     true,
    messages: [
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) send(res, { text });
  }
}

// ── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, provider = 'claude', model, workspacePrompt } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages array is required' });

  const system = workspacePrompt || DEFAULT_PROMPT;
  startStream(res);

  try {
    switch (provider) {
      case 'claude':  await handleClaude(res, messages, model, system); break;
      case 'gemini':  await handleGemini(res, messages, model, system); break;
      case 'groq':    await handleGroq(res, messages, model, system);   break;
      default:
        send(res, { error: `Unknown provider: ${provider}` });
    }
    send(res, { done: true });
  } catch (err) {
    console.error(`[${provider} error]`, err.message);
    send(res, { error: err.message || 'API error' });
  } finally {
    res.end();
  }
}
