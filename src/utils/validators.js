import { validateEmail, validatePhone, validateZip, sanitizeInput, normalizePhone } from './security';

export const namePattern = /^[A-Za-z\s-]{2,50}$/;

export function isRequired(value) {
  return sanitizeInput(value).length > 0;
}

export function validateName(value) {
  return namePattern.test(sanitizeInput(value));
}

export function validateEmailAddress(value) {
  return validateEmail(value);
}

export function validatePhoneNumber(value) {
  return validatePhone(value);
}

export function validateZipCode(value) {
  return validateZip(value);
}

export function validateServiceSelections(value) {
  if (!Array.isArray(value)) return false;
  return value.map((item) => sanitizeInput(item)).filter(Boolean).length > 0;
}

export function normalizePhoneNumber(value) {
  return normalizePhone(value);
}

export function buildFieldState(value, validator) {
  const clean = sanitizeInput(value);
  return {
    valid: validator(clean),
    sanitized: clean
  };
}
