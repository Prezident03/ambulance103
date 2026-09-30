// Server-only configuration. Prefer GROQ_API_KEY in Vercel Environment Variables.
const bundledKey = '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';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error:{message:'Faqat POST so‘rovi qabul qilinadi.'}});
  }
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({error:{message:'So‘rov formati noto‘g‘ri.'}}); }
  if (!Array.isArray(body?.messages) || !body.messages.length || body.messages.length > 20 ||
      body.messages.some(m => !['system','user','assistant'].includes(m.role) || typeof m.content !== 'string') ||
      JSON.stringify(body.messages).length > 100000) {
    return res.status(400).json({error:{message:'Xabarlar noto‘g‘ri yoki juda katta.'}});
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST', signal:controller.signal,
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.GROQ_API_KEY || bundledKey}`},
      body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:body.messages,
        temperature:0.2,max_tokens:Math.min(3000,Math.max(1,Number(body.max_tokens)||1500))})
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({error:{message:e.name === 'AbortError' ? 'AI javobi kechikdi. Qayta urinib ko‘ring.' : 'AI xizmatiga ulanib bo‘lmadi.'}});
  } finally { clearTimeout(timer); }
};
