// Vercel serverless proxy for Appwrite API.
// Extracts path from req.url to avoid Vercel routes not populating req.query.path.

module.exports.config = {
  api: {
    bodyParser: false,
  }
};

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://planzylab.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Appwrite-Project, X-Appwrite-Key, X-Appwrite-JWT, X-SDK-Version, X-SDK-Name, X-Appwrite-Response-Format, X-Fallback-Cookies');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(204).end();
    return;
  }

  // Extract Appwrite path from the full request URL
  // e.g. req.url = /api/appwrite/account/sessions/email?foo=bar
  //      → apiPath = account/sessions/email
  const fullUrl = new URL(req.url, 'http://localhost');
  const apiPath = fullUrl.pathname.replace(/^\/api\/appwrite\/?/, '');

  // Forward query string params (excluding the internal path param)
  const qs = fullUrl.search || '';
  const targetUrl = `https://sgp.cloud.appwrite.io/v1/${apiPath}${qs}`;

  // Read raw request body (bodyParser is disabled)
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks);

  // Build forwarded headers — skip hop-by-hop and cookies
  const skipHeaders = new Set(['host', 'connection', 'transfer-encoding', 'keep-alive', 'cookie', 'set-cookie']);
  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!skipHeaders.has(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  }

  // Set correct origin so Appwrite platform validation passes
  forwardHeaders['origin'] = 'https://planzylab.vercel.app';
  forwardHeaders['referer'] = 'https://planzylab.vercel.app/';
  if (rawBody.length > 0) {
    forwardHeaders['content-length'] = String(rawBody.length);
  }

  const fetchOptions = {
    method: req.method,
    headers: forwardHeaders,
    ...(rawBody.length > 0 && req.method !== 'GET' && req.method !== 'HEAD'
      ? { body: rawBody }
      : {}),
  };

  try {
    const appwriteResponse = await fetch(targetUrl, fetchOptions);

    // Forward Appwrite response headers
    const skipResponseHeaders = new Set(['transfer-encoding', 'connection', 'content-encoding']);
    for (const [key, value] of appwriteResponse.headers.entries()) {
      if (!skipResponseHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }
    res.setHeader('Access-Control-Allow-Origin', 'https://planzylab.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    const body = await appwriteResponse.arrayBuffer();
    res.status(appwriteResponse.status).end(Buffer.from(body));
  } catch (error) {
    console.error('[Appwrite Proxy] Error:', error);
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
};
