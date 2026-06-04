import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export const config = { api: { responseLimit: false } };

const DEFAULT_PROMPT = 'You are a helpful AI assistant for a professional team. Be clear, concise, and actionable.';

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
    return;
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
async function handleGemini(res, messages, model, system) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    send(res, { error: 'Gemini: GEMINI_API_KEY not set in Vercel environment variables.' });
    return;
  }

  const modelId  = model || 'gemini-1.5-flash';

  // Convert messages → Gemini format (role must be 'user' | 'model')
  const rawContents = messages
    .filter(m => m.content?.trim())
    .map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.trim() }],
    }));

  // Remove leading non-user turns (Gemini requires starting with 'user')
  while (rawContents.length > 0 && rawContents[0].role !== 'user') {
    rawContents.shift();
  }

  // Merge consecutive same-role turns (Gemini rejects them)
  const contents = [];
  for (const item of rawContents) {
    const last = contents[contents.length - 1];
    if (last && last.role === item.role) {
      last.parts.push(...item.parts); // merge into previous turn
    } else {
      contents.push({ role: item.role, parts: [...item.parts] });
    }
  }

  if (contents.length === 0) {
    send(res, { error: 'Gemini: no valid messages to process.' });
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // apiVersion 'v1' fixes the "not found for API version v1beta" 404 error
  const geminiModel = genAI.getGenerativeModel(
    { model: modelId },          // No systemInstruction here — pass it in contents instead
    { apiVersion: 'v1' }
  );

  // Prepend system prompt as first user turn if provided
  // (more reliable than systemInstruction property across model versions)
  const finalContents = system && system !== DEFAULT_PROMPT
    ? [
        { role: 'user',  parts: [{ text: `[System instructions]: ${system}` }] },
        { role: 'model', parts: [{ text: 'Understood. I will follow those instructions.' }] },
        ...contents,
      ]
    : contents;

  let hasReceivedText = false;

  const streamResult = await geminiModel.generateContentStream({
    contents: finalContents,
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  });

  for await (const chunk of streamResult.stream) {
    try {
      const text = chunk.text();
      if (text) {
        hasReceivedText = true;
        send(res, { text });
      }
    } catch (chunkErr) {
      // Some chunks are safety/metadata blocks — skip them silently
      console.warn('[Gemini chunk skipped]', chunkErr.message);
    }
  }

  // If stream finished with no text, check why and return a clear error
  if (!hasReceivedText) {
    let reason = 'Gemini returned an empty response.';
    try {
      const finalResp = await streamResult.response;
      const blockReason   = finalResp.promptFeedback?.blockReason;
      const finishReason  = finalResp.candidates?.[0]?.finishReason;
      if (blockReason)  reason = `Gemini blocked the request: ${blockReason}`;
      else if (finishReason && finishReason !== 'STOP') reason = `Gemini stopped early: ${finishReason}`;
    } catch (_) { /* ignore */ }
    send(res, { error: reason });
  }
}

// ── Groq (Llama) ─────────────────────────────────────────
async function handleGroq(res, messages, model, system) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    send(res, { error: 'Groq: GROQ_API_KEY not set in Vercel environment variables.' });
    return;
  }

  const modelId   = model || 'llama-3.3-70b-versatile';
  const is8B      = modelId.includes('8b');
  const maxTokens = is8B ? 2048 : 4096;

  // Trim history to last 10 messages to stay under free-tier 6000 TPM limit
  const trimmed = messages.length > 10
    ? [...messages.slice(0, 1), ...messages.slice(-9)]
    : messages;

  const groq   = new Groq({ apiKey });
  const stream = await groq.chat.completions.create({
    model: modelId, max_tokens: maxTokens, stream: true,
    messages: [
      { role: 'system', content: system },
      ...trimmed.map(m => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) send(res, { text });
  }
}

// ── Main ─────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, provider = 'claude', model, workspacePrompt } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages array is required' });

  const system = workspacePrompt || DEFAULT_PROMPT;
  startStream(res);

  try {
    switch (provider) {
      case 'claude': await handleClaude(res, messages, model, system); break;
      case 'gemini': await handleGemini(res, messages, model, system); break;
      case 'groq':   await handleGroq(res, messages, model, system);   break;
      default:       send(res, { error: `Unknown provider: ${provider}` });
    }
    send(res, { done: true });
  } catch (err) {
    console.error(`[${provider} error]`, err);
    // Surface the full error — not just message — so blank errors are caught
    const msg = err?.message || err?.toString?.() || JSON.stringify(err) || 'Unknown error';
    send(res, { error: `${provider}: ${msg}` });
  } finally {
    res.end();
  }
}
