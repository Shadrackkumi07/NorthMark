import DOMPurify from 'dompurify';

export function stripHTML(value = '') {
  return DOMPurify.sanitize(String(value), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function removeDangerousChars(value = '') {
  return stripHTML(value)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/['"`;]/g, '')
    .replace(/--/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function normalizeWhitespace(value = '') {
  return removeDangerousChars(value).replace(/\s+/g, ' ').trim();
}

export function sanitizeTextInput(value = '') {
  return normalizeWhitespace(value);
}
