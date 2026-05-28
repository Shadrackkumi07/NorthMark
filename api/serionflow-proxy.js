// SerionFlow secure SEO routing.
// Works with React, Vite, CRA, and other non-Next Vercel projects.
// The private routing value is stored in Vercel and is not committed.

const PROJECT_ID = '7925219d-0f95-4130-975f-43262e617605';
const BASE_PATH = '/exploring';
const BACKEND_URL = 'https://serionflow-web-getnn.ondigitalocean.app';
const PROXY_TOKEN = process.env.SERIONFLOW_PROXY_TOKEN;

async function hmacHex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function firstHeader(value) {
  return Array.isArray(value) ? value[0] : value;
}

function firstQuery(value) {
  return Array.isArray(value) ? value[0] : value;
}

const SERIONFLOW_HTML_CSP = [
  "default-src 'self' https: data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' https: data: blob:",
  "font-src 'self' https: data:",
  "connect-src 'self' https: wss: blob:",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

export default async function handler(request, response) {
  if (!PROXY_TOKEN) {
    response.status(503).send('SerionFlow routing is not configured');
    return;
  }

  const host = firstHeader(request.headers['x-forwarded-host']) || firstHeader(request.headers.host) || '';
  const proto = firstHeader(request.headers['x-forwarded-proto']) || 'https';
  const incomingUrl = new URL(request.url || '/', `${proto}://${host || 'localhost'}`);
  const rewrittenPath = firstQuery(request.query?.sf_path);
  const relativePath = !rewrittenPath || rewrittenPath === '__serionflow_health_check'
    ? '__serionflow_health_check'
    : String(rewrittenPath).replace(/^\/+/, '');
  const originalPath = relativePath === '__serionflow_health_check'
    ? BASE_PATH
    : `${BASE_PATH}/${relativePath}`;

  const backend = new URL(`${BACKEND_URL}/api/proxy-render/${PROJECT_ID}/${relativePath}`);
  incomingUrl.searchParams.forEach((value, key) => {
    if (key !== 'sf_path') backend.searchParams.append(key, value);
  });

  const timestamp = String(Date.now());
  const signature = await hmacHex(PROXY_TOKEN, [
    'v1',
    PROJECT_ID,
    host.toLowerCase(),
    originalPath,
    timestamp,
  ].join('\n'));

  const headers = new Headers();
  Object.entries(request.headers).forEach(([key, value]) => {
    const headerValue = firstHeader(value);
    if (typeof headerValue === 'string') headers.set(key, headerValue);
  });
  headers.set('X-SerionFlow-Proxy-Source', 'vercel-function');
  headers.set('X-SerionFlow-Proxy-Token', PROXY_TOKEN);
  headers.set('X-SerionFlow-Proxy-Host', host);
  headers.set('X-SerionFlow-Original-Path', originalPath);
  headers.set('X-SerionFlow-Proxy-Timestamp', timestamp);
  headers.set('X-SerionFlow-Proxy-Signature', signature);
  headers.set('X-Forwarded-Host', host);
  headers.set('X-Forwarded-Proto', proto);

  const upstream = await fetch(backend, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });

  response.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
      response.setHeader(key, value);
    }
  });
  response.setHeader('Content-Security-Policy', SERIONFLOW_HTML_CSP);
  response.send(Buffer.from(await upstream.arrayBuffer()));
}
