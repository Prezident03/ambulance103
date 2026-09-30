module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: { message: 'Faqat POST so‘rovi qabul qilinadi.' }
    });
  }

  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return res.status(503).json({
      error: {
        message: 'Vercel sozlamalarida GROQ_API_KEY kiritilmagan.'
      }
    });
  }

  let body;
  try {
    body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;
  } catch {
    return res.status(400).json({
      error: { message: 'So‘rov formati noto‘g‘ri.' }
    });
  }

  if (
    !Array.isArray(body?.messages) ||
    !body.messages.length ||
    body.messages.length > 20 ||
    body.messages.some(message =>
      !['system', 'user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string'
    ) ||
    JSON.stringify(body.messages).length > 100000
  ) {
    return res.status(400).json({
      error: { message: 'Xabarlar noto‘g‘ri yoki juda katta.' }
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: body.messages,
          temperature: 0.2,
          max_tokens: Math.min(
            3000,
            Math.max(1, Number(body.max_tokens) || 1500)
          )
        })
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({
      error: {
        message: error.name === 'AbortError'
          ? 'AI javobi kechikdi. Qayta urinib ko‘ring.'
          : 'AI xizmatiga ulanib bo‘lmadi.'
      }
    });
  } finally {
    clearTimeout(timer);
  }
};
