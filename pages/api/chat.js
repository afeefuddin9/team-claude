import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export const config = { api: { responseLimit: false } };

const DEFAULT_PROMPT = 'You are a helpful AI assistant for a professional team. Be clear, concise, and actionable.';

// ── SSE helpers ──────────────────────────────────────────
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

// ── Claude ───────────────────────────────────────────────
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

// ── Gemini ───────────────────────────────────────────────
// FIX: Use apiVersion 'v1' (not v1beta) to resolve 404 errors
async function handleGemini(res, messages, model, system) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    send(res, { error: 'GEMINI_API_KEY not configured in Vercel env vars.' });
    return res.end();
  }

  const genAI    = new GoogleGenerativeAI(apiKey);
  const modelId  = model || 'gemini-1.5-flash-8b';

  // apiVersion: 'v1' fixes the 404 "not found for API version v1beta" error
  const geminiModel = genAI.getGenerativeModel(
    { model: modelId, systemInstruction: system },
    { apiVersion: 'v1' }
  );

  // Convert to Gemini format (uses 'model' not 'assistant')
  const contents = messages
    .filter(m => m.content?.trim())
    .map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Gemini requires content to start with a user turn
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  if (contents.length === 0) {
    send(res, { error: 'No valid messages to send to Gemini.' });
    return res.end();
  }

  // Use generateContentStream with full contents array (more reliable than startChat)
  const result = await geminiModel.generateContentStream({ contents });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) send(res, { text });
  }
}

// ── Groq (Llama) ─────────────────────────────────────────
// FIX: Trim history to last 10 msgs + reduce max_tokens to stay under 6000 TPM free limit
async function handleGroq(res, messages, model, system) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    send(res, { error: 'GROQ_API_KEY not configured in Vercel env vars.' });
    return res.end();
  }

  const modelId = model || 'llama-3.3-70b-versatile';

  // Different token limits per model on Groq free tier:
  // llama-3.1-8b-instant  → 6,000 TPM  → cap at 2048 output + trim history
  // llama-3.3-70b         → 6,000 TPM  → cap at 4096 output
  const is8B      = modelId.includes('8b');
  const maxTokens = is8B ? 2048 : 4096;

  // Trim history to last 10 messages to reduce input token count
  // Always keep the last message (current user query) + up to 9 previous
  const recentMessages = messages.length > 10
    ? [...messages.slice(0, 1), ...messages.slice(-9)]  // keep first (context) + last 9
    : messages;

  const groq   = new Groq({ apiKey });
  const stream = await groq.chat.completions.create({
    model:      modelId,
    max_tokens: maxTokens,
    stream:     true,
    messages: [
      { role: 'system', content: system },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) send(res, { text });
  }
}

// ── Main handler ─────────────────────────────────────────
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
