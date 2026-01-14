import DOMPurify from 'dompurify';

const emailPattern =
  /^(?:[a-zA-Z0-9_'^&+`{|}~-]+(?:\.[a-zA-Z0-9_'^&+`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
const phoneDigits = /\D+/g;

export function encodeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeInput(value = '') {
  const clean = String(value)
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/on\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return DOMPurify.sanitize(clean, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function validateEmail(email = '') {
  return emailPattern.test(String(email).trim().toLowerCase());
}

export function normalizePhone(phone = '') {
  const digits = String(phone).replace(phoneDigits, '').slice(-10);
  return digits;
}

export function validatePhone(phone = '') {
  return normalizePhone(phone).length === 10;
}

export function formatPhone(phone = '') {
  const digits = normalizePhone(phone);
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function validateZip(zip = '') {
  return /^\d{5}$/.test(String(zip).trim());
}

export function generateCsrfToken() {
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (num) => num.toString(16)).join('');
}

export function sanitizePathname(path = '') {
  return path.replace(/[^/a-zA-Z0-9-_?&=#.%]/g, '');
}

export function applyPageMeta(route) {
  if (typeof document === 'undefined') {
    return;
  }

  const titleBase = 'Northmark Facility Services';
  const rawTitle = route.meta?.title;
  const pageTitle = rawTitle
    ? rawTitle === titleBase
      ? titleBase
      : `${rawTitle} | ${titleBase}`
    : titleBase;
  const description =
    route.meta?.description ||
    'Commercial property maintenance and janitorial services with trusted quality control.';

  document.title = pageTitle;

  const ensureMeta = (attr, key, content) => {
    let tag = document.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', encodeHTML(content));
  };

  const ensureLink = (rel, href) => {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  };

  const normalizePath = (path) => {
    if (!path) return '/';
    const cleanPath = path.split('?')[0].split('#')[0];
    if (cleanPath === '' || cleanPath === '/') return '/';
    return cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath;
  };

  const canonicalPath = normalizePath(route?.path || window.location.pathname);
  const canonicalUrl = `${window.location.origin}${canonicalPath === '/' ? '/' : canonicalPath}`;

  ensureMeta('name', 'description', description);
  ensureMeta('property', 'og:title', pageTitle);
  ensureMeta('property', 'og:description', description);
  ensureMeta('property', 'og:type', route.meta?.ogType || 'website');
  ensureMeta('property', 'og:url', canonicalUrl);
  ensureLink('canonical', canonicalUrl);
}

export function enforceHttps() {
  if (typeof window === 'undefined') return;
  const httpsOnly = import.meta.env?.VITE_HTTPS_ONLY === 'true';
  const isProd = import.meta.env?.PROD;
  if ((httpsOnly || isProd) && window.location.protocol === 'http:') {
    const secureUrl = window.location.href.replace('http:', 'https:');
    window.location.replace(secureUrl);
  }
}

