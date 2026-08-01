// Vercel serverless proxy for Appwrite API.
// Uses raw body (no JSON re-serialization) and skips cookies to avoid stale session conflicts.

module.exports.config = {
  api: {
    bodyParser: false, // Get raw bytes — avoids double-stringification
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

  // Read raw request body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks);

  // Build Appwrite target URL
  const pathParts = req.query.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join('/') : String(pathParts);

  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) value.forEach(v => queryParams.append(key, v));
    else queryParams.append(key, value);
  }
  const qs = queryParams.toString();
  const targetUrl = `https://sgp.cloud.appwrite.io/v1/${path}${qs ? '?' + qs : ''}`;

  // Build forwarded headers — skip hop-by-hop and cookies (stale cookies cause 403)
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

    // Forward Appwrite response headers back to browser
    const skipResponseHeaders = new Set(['transfer-encoding', 'connection', 'content-encoding']);
    for (const [key, value] of appwriteResponse.headers.entries()) {
      if (!skipResponseHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // CORS headers for the browser
    res.setHeader('Access-Control-Allow-Origin', 'https://planzylab.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    const body = await appwriteResponse.arrayBuffer();
    res.status(appwriteResponse.status).end(Buffer.from(body));
  } catch (error) {
    console.error('[Appwrite Proxy] Fetch error:', error);
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
};
