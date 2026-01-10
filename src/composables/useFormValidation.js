import { reactive } from 'vue';
import {
  validateName,
  validateEmailAddress,
  validatePhoneNumber,
  validateZipCode,
  normalizePhoneNumber,
  validateServiceSelections
} from '../utils/validators';
import { sanitizeTextInput } from '../utils/sanitizer';

const errorMessages = {
  firstName: 'Please enter a valid first name (2-50 characters)',
  lastName: 'Please enter a valid last name (2-50 characters)',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid 10-digit phone number',
  zip: 'Please enter a valid 5-digit zip code',
  services: 'Please select at least one service'
};

export default function useFormValidation(initialState = {}) {
  const errors = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zip: '',
    services: '',
    ...initialState
  });

  const validators = {
    firstName: validateName,
    lastName: validateName,
    email: validateEmailAddress,
    phone: validatePhoneNumber,
    zip: validateZipCode,
    services: validateServiceSelections
  };

  const sanitizePayload = (payload) => ({
    ...payload,
    firstName: sanitizeTextInput(payload.firstName),
    lastName: sanitizeTextInput(payload.lastName),
    email: sanitizeTextInput(payload.email).toLowerCase(),
    phone: normalizePhoneNumber(payload.phone),
    zip: sanitizeTextInput(payload.zip),
    services: Array.isArray(payload.services)
      ? payload.services.map((service) => sanitizeTextInput(service)).filter(Boolean)
      : []
  });

  const validateField = (field, value) => {
    const validator = validators[field];
    if (!validator) return true;
    const isValid = validator(value);
    errors[field] = isValid ? '' : errorMessages[field];
    return isValid;
  };

  const validateForm = (payload) => {
    const sanitized = sanitizePayload(payload);
    const validity = Object.entries(sanitized).map(([key, value]) => validateField(key, value));
    return validity.every(Boolean) ? { valid: true, sanitized } : { valid: false, sanitized };
  };

  return {
    errors,
    validateField,
    validateForm,
    sanitizePayload
  };
}
