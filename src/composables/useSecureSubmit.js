import { ref } from 'vue';
import { generateCsrfToken } from '../utils/security';
import { sanitizeTextInput } from '../utils/sanitizer';

const MIN_OPEN_MS = 0;
const API_ENDPOINT = import.meta.env?.VITE_ESTIMATE_API || '';

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
    if (!API_ENDPOINT) throw new Error('Please call (701) 561-6324 or book a consultation online.');
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
