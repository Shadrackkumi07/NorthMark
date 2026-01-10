<template>
  <div>
    <q-form class="nm-form" @submit.prevent="handleSubmit">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input
            v-model.trim="form.firstName"
            label="First Name"
            outlined
            dense
            autocomplete="given-name"
            :error="Boolean(errors.firstName)"
            :error-message="errors.firstName"
            aria-required="true"
            @blur="handleBlur('firstName')"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model.trim="form.lastName"
            label="Last Name"
            outlined
            dense
            autocomplete="family-name"
            :error="Boolean(errors.lastName)"
            :error-message="errors.lastName"
            aria-required="true"
            @blur="handleBlur('lastName')"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model.trim="form.email"
            type="email"
            label="Email"
            outlined
            dense
            autocomplete="email"
            :error="Boolean(errors.email)"
            :error-message="errors.email"
            aria-required="true"
            @blur="handleEmailBlur"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.phone"
            type="tel"
            label="Phone"
            outlined
            dense
            mask="(###) ###-####"
            :input-attrs="{ inputmode: 'tel', autocomplete: 'tel' }"
            :error="Boolean(errors.phone)"
            :error-message="errors.phone"
            aria-required="true"
            @blur="handlePhoneBlur"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model.trim="form.zip"
            label="Zip Code"
            outlined
            dense
            mask="#####"
            :input-attrs="{ inputmode: 'numeric', autocomplete: 'postal-code' }"
            :error="Boolean(errors.zip)"
            :error-message="errors.zip"
            aria-required="true"
            @blur="handleBlur('zip')"
          />
        </div>
        <div class="col-12">
          <div class="text-subtitle2 text-weight-medium q-mb-sm">Services</div>
          <q-option-group
            v-model="form.services"
            type="toggle"
            color="primary"
            :options="serviceOptions"
            :error="Boolean(errors.services)"
            :error-message="errors.services"
            @update:model-value="handleServicesChange"
          />
        </div>
      </div>

      <input type="hidden" name="csrfToken" :value="csrfToken" />
      <input
        v-model="honeypot"
        type="text"
        name="company"
        autocomplete="off"
        tabindex="-1"
        class="sr-only"
        aria-hidden="true"
      />

      <div class="row items-center q-mt-lg q-gutter-sm">
        <q-btn
          color="primary"
          label="Request Estimate"
          type="submit"
          :loading="submitting"
        />
        <div class="text-caption text-grey-7">
          We respond quickly during business hours.
        </div>
      </div>
    </q-form>

    <q-banner
      v-if="submitted"
      class="q-mt-lg bg-green-1 text-green-9"
      rounded
      role="status"
      aria-live="polite"
    >
      <div class="text-subtitle1 text-weight-medium">Thank you! We'll contact you shortly.</div>
    </q-banner>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Notify } from 'quasar';
import useFormValidation from '../../composables/useFormValidation';
import useSecureSubmit from '../../composables/useSecureSubmit';

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  zip: '',
  services: []
});

const submitted = ref(false);

const { errors, validateField, validateForm } = useFormValidation();
const { submitting, csrfToken, honeypot, canSubmit, submit } = useSecureSubmit();

const handleBlur = (field) => {
  validateField(field, form[field]);
};

const handleServicesChange = () => {
  validateField('services', form.services);
};

const handleEmailBlur = () => {
  form.email = form.email.trim().toLowerCase();
  handleBlur('email');
};

const handlePhoneBlur = () => {
  form.phone = formatPhone(form.phone);
  handleBlur('phone');
};

const handleSubmit = async () => {
  const validation = validateForm(form);
  if (!validation.valid) {
    Notify.create({
      type: 'negative',
      message: 'Please correct the highlighted fields.'
    });
    return;
  }

  try {
    const result = await submit(form, validateForm);
    submitted.value = true;
    form.firstName = '';
    form.lastName = '';
    form.email = '';
    form.phone = '';
    form.zip = '';
    form.services = [];
    Notify.create({
      type: 'positive',
      message: result.message
    });
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'We could not submit the form. Please try again in a moment.'
    });
  }
};

const serviceOptions = [
  {
    label: 'Commercial Property Maintenance and Cleaning',
    value: 'Commercial Property Maintenance and Cleaning'
  },
  { label: 'Routine Janitorial Services', value: 'Routine Janitorial Services' },
  {
    label: 'Aerial Inspection & Documentation Services',
    value: 'Aerial Inspection & Documentation Services'
  }
];
</script>

<style scoped>
.nm-form {
  margin-top: 16px;
}
</style>
