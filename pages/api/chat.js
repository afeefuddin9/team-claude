import Anthropic from '@anthropic-ai/sdk';

export const config = { api: { responseLimit: false } };

const DEFAULT_PROMPT = 'You are a helpful AI assistant for a professional team. Be clear, concise, and actionable.';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Clear message if key is missing or still placeholder
  if (!apiKey || apiKey === 'sk-placeholder' || apiKey.length < 20) {
    return res.status(503).json({
      error: 'Anthropic API key not configured yet. Add ANTHROPIC_API_KEY in your Vercel environment variables, then redeploy.',
    });
  }

  const { messages, workspacePrompt } = req.body;
  if (!messages?.length) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const system = workspacePrompt || DEFAULT_PROMPT;
  const client = new Anthropic({ apiKey });

  res.writeHead(200, {
    'Content-Type':      'text/event-stream',
    'Cache-Control':     'no-cache, no-transform',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    const stream = client.messages.stream({
      model:      process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
      max_tokens: 8096,
      system,
      messages:   messages.map(m => ({ role: m.role, content: m.content })),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    console.error('[Claude API error]', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Unknown Claude API error' })}\n\n`);
  } finally {
    res.end();
  }
}
