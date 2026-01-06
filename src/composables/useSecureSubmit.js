import { ref } from 'vue';
import { generateCsrfToken } from '../utils/security';
import { sanitizeTextInput } from '../utils/sanitizer';

const MIN_OPEN_MS = 0;
const STORAGE_KEY = 'nm_estimate_submissions';
const API_ENDPOINT = import.meta.env?.VITE_ESTIMATE_API || '';

function getSubmissionCount() {
  try {
    return Number(sessionStorage.getItem(STORAGE_KEY) || 0);
  } catch (e) {
    return 0;
  }
}

function incrementSubmissionCount() {
  try {
    const next = getSubmissionCount() + 1;
    sessionStorage.setItem(STORAGE_KEY, String(next));
    return next;
  } catch (e) {
    return MAX_SUBMISSIONS + 1;
  }
}

export default function useSecureSubmit() {
  const submitting = ref(false);
  const csrfToken = ref(generateCsrfToken());
  const startedAt = ref(Date.now());
  const honeypot = ref('');

  const canSubmit = () => {
    const elapsed = Date.now() - startedAt.value;
    return elapsed >= MIN_OPEN_MS && !honeypot.value;
  };

  const submit = async (payload, validator) => {
    if (!canSubmit()) {
      throw new Error('Form blocked by security rules.');
    }

    const { valid, sanitized } = validator(payload);
    if (!valid) {
      throw new Error('Validation failed.');
    }

    submitting.value = true;
    const submissionRecord = {
      ...sanitized,
      submittedAt: new Date().toISOString(),
      csrf: csrfToken.value
    };

    try {
      if (API_ENDPOINT) {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitized)
        });
        if (!response.ok) {
          throw new Error('Server submission failed.');
        }
      }

      const stored = JSON.parse(localStorage.getItem('nm_estimate_archive') || '[]');
      stored.push(submissionRecord);
      localStorage.setItem('nm_estimate_archive', JSON.stringify(stored));
      return {
        message: "Thank you! We'll contact you shortly.",
        detail: Object.fromEntries(
          Object.entries(submissionRecord).map(([key, value]) => [key, sanitizeTextInput(value)])
        )
      };
    } finally {
      submitting.value = false;
      csrfToken.value = generateCsrfToken();
      startedAt.value = Date.now();
      honeypot.value = '';
    }
  };

  return {
    submitting,
    csrfToken,
    startedAt,
    honeypot,
    canSubmit,
    submit,
    sanitizeTextInput
  };
}
