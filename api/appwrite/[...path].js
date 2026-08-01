// Vercel serverless function: proxies all Appwrite API requests through the server,
// explicitly setting Origin so Appwrite's platform validation passes.
module.exports = async function handler(req, res) {
  // Handle CORS preflight from browser
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://planzylab.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', [
      'Content-Type',
      'X-Appwrite-Project',
      'X-Appwrite-Key',
      'X-Appwrite-JWT',
      'X-SDK-Version',
      'X-SDK-Name',
      'X-Appwrite-Response-Format',
      'X-Fallback-Cookies',
      'Cookie',
    ].join(', '));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(204).end();
    return;
  }

  // Build target path from catch-all param
  const pathParts = req.query.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

  // Forward any query params (excluding the internal "path" param)
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) {
      value.forEach(v => queryParams.append(key, v));
    } else {
      queryParams.append(key, value);
    }
  }
  const qs = queryParams.toString();
  const targetUrl = `https://sgp.cloud.appwrite.io/v1/${path}${qs ? '?' + qs : ''}`;

  // Build forwarded headers, skipping hop-by-hop headers
  const skipHeaders = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive']);
  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!skipHeaders.has(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  }

  // Explicitly set origin so Appwrite validates against the registered platform
  forwardHeaders['origin'] = 'https://planzylab.vercel.app';
  forwardHeaders['referer'] = 'https://planzylab.vercel.app/';

  // Build fetch options
  const fetchOptions = {
    method: req.method,
    headers: forwardHeaders,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body && typeof req.body === 'object') {
      fetchOptions.body = JSON.stringify(req.body);
      forwardHeaders['content-type'] = forwardHeaders['content-type'] || 'application/json';
    } else if (req.body) {
      fetchOptions.body = req.body;
    }
  }

  try {
    const appwriteResponse = await fetch(targetUrl, fetchOptions);

    // Forward response headers back to browser (skip problematic ones)
    const skipResponseHeaders = new Set(['transfer-encoding', 'connection', 'content-encoding']);
    for (const [key, value] of appwriteResponse.headers.entries()) {
      if (!skipResponseHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Ensure browser allows the response
    res.setHeader('Access-Control-Allow-Origin', 'https://planzylab.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    const body = await appwriteResponse.arrayBuffer();
    res.status(appwriteResponse.status).end(Buffer.from(body));
  } catch (error) {
    console.error('[Appwrite Proxy] Error:', error);
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
};
