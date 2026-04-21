const http = require('node:http');
const { URL } = require('node:url');

const PORT = Number.parseInt(process.env.PORT ?? '8787', 10);
const HOST = process.env.HOST?.trim() || '127.0.0.1';
const PROXY_PATH = process.env.PROXY_PATH?.trim() || '/api/proxy';
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN?.trim() || '*';

const BLOCKED_REQUEST_HEADERS = new Set(['connection', 'content-length', 'host']);
const BLOCKED_RESPONSE_HEADERS = new Set(['connection', 'content-encoding', 'content-length', 'transfer-encoding']);

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, x-oxapi-client-id',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function sanitizeRequestHeaders(headers) {
  const nextHeaders = new Headers();

  Object.entries(headers ?? {}).forEach(([key, value]) => {
    if (!BLOCKED_REQUEST_HEADERS.has(String(key).toLowerCase()) && value !== undefined) {
      nextHeaders.set(key, String(value));
    }
  });

  return nextHeaders;
}

function serializeResponseHeaders(headers) {
  const serializedHeaders = {};

  headers.forEach((value, key) => {
    if (!BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      serializedHeaders[key] = value;
    }
  });

  return serializedHeaders;
}

async function readRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function handleProxyRequest(payload) {
  const targetUrl = payload?.url?.trim();

  if (!targetUrl) {
    return {
      statusCode: 400,
      body: { error: '缺少目标请求地址。' },
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return {
      statusCode: 400,
      body: { error: '目标请求地址无效。' },
    };
  }

  const method = String(payload?.method || 'GET').toUpperCase();

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      statusCode: 400,
      body: { error: '这个本地代理示例当前只支持 HTTP 和 HTTPS 请求。' },
    };
  }

  if (method === 'WS' || method === 'GRPC') {
    return {
      statusCode: 400,
      body: { error: '这个本地代理示例暂不支持 WebSocket 或 gRPC。' },
    };
  }

  const upstreamResponse = await fetch(parsedUrl, {
    method,
    headers: sanitizeRequestHeaders(payload?.headers),
    body: method === 'GET' || method === 'HEAD' ? undefined : payload?.body,
  });

  const body = await upstreamResponse.text();

  return {
    statusCode: 200,
    body: {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: serializeResponseHeaders(upstreamResponse.headers),
      body,
    },
  };
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    writeJson(response, 404, { error: 'Not found.' });
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOW_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type, x-oxapi-client-id',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    writeJson(response, 200, {
      ok: true,
      proxyPath: PROXY_PATH,
      message: 'Local proxy is running.',
    });
    return;
  }

  if (request.method !== 'POST' || requestUrl.pathname !== PROXY_PATH) {
    writeJson(response, 404, {
      error: `Only POST ${PROXY_PATH} is supported.`,
    });
    return;
  }

  try {
    const rawBody = await readRequestBody(request);
    const payload = JSON.parse(rawBody || '{}');
    const result = await handleProxyRequest(payload);
    writeJson(response, result.statusCode, result.body);
  } catch (error) {
    writeJson(response, 502, {
      error: error instanceof Error ? error.message : '代理请求失败。',
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[proxy_client] listening on http://${HOST}:${PORT}${PROXY_PATH}`);
  console.log(`[proxy_client] health check: http://${HOST}:${PORT}/health`);
});