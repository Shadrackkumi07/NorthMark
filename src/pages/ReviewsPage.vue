<template>
  <q-page class="reviews-page">
    <section class="reviews-hero nm-gradient">
      <div class="nm-container">
        <div class="text-white text-overline text-uppercase q-mb-sm nm-reveal">
          What Our Clients Say
        </div>
        <div class="nm-display text-white reviews-hero__title nm-reveal nm-reveal--delay">
          Trusted by property managers and business owners across the region
        </div>
        <div class="row items-center q-gutter-sm text-white q-mt-md nm-reveal nm-reveal--delay">
          <q-rating
            :model-value="averageRating"
            size="22px"
            color="amber"
            icon="star"
            icon-half="star_half"
            readonly
            aria-label="Average rating"
          />
          <span class="text-body2">{{ averageRating }} average rating</span>
        </div>
      </div>
    </section>

    <section class="page-section nm-container">
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <div class="text-h5 text-weight-medium">Share your experience</div>
          <div class="text-body2 text-grey-7">Quick, structured feedback helps us keep improving.</div>
        </div>
        <q-btn color="primary" label="Leave a Review" @click="dialogOpen = true" />
      </div>

      <div class="row q-col-gutter-lg">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <q-card class="review-card full-height" flat>
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle1 text-weight-medium">{{ review.name }}</div>
                <q-chip dense color="secondary" text-color="white">{{ review.service }}</q-chip>
              </div>
              <div class="text-caption text-grey-7 q-mb-sm">{{ review.company }}</div>
              <div class="row items-center q-gutter-sm q-mb-sm">
                <q-rating
                  :model-value="review.rating"
                  size="20px"
                  color="amber"
                  icon="star"
                  icon-half="star_half"
                  readonly
                  aria-label="Client rating"
                />
                <span class="text-caption text-grey-7">{{ formatDate(review.date) }}</span>
              </div>
              <p class="text-body2">{{ review.text }}</p>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <q-dialog v-model="dialogOpen">
      <q-card class="review-form-card">
        <q-card-section>
          <div class="text-h6 q-mb-xs">Leave a Review</div>
          <div class="text-body2 text-grey-7">All fields are required.</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="submitReview">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.trim="reviewForm.name"
                  label="Your Name"
                  outlined
                  dense
                  :error="Boolean(formErrors.name)"
                  :error-message="formErrors.name"
                  @blur="validateField('name')"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.trim="reviewForm.company"
                  label="Company"
                  outlined
                  dense
                  :error="Boolean(formErrors.company)"
                  :error-message="formErrors.company"
                  @blur="validateField('company')"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="reviewForm.service"
                  :options="serviceOptions"
                  label="Service Type"
                  outlined
                  dense
                  :error="Boolean(formErrors.service)"
                  :error-message="formErrors.service"
                />
              </div>
              <div class="col-12 col-md-6">
                <div class="text-caption text-grey-7 q-mb-xs">Rating</div>
                <q-rating
                  v-model="reviewForm.rating"
                  size="28px"
                  color="amber"
                  icon="star"
                  icon-half="star_half"
                  :max="5"
                />
                <div v-if="formErrors.rating" class="text-negative text-caption q-mt-xs">
                  {{ formErrors.rating }}
                </div>
              </div>
              <div class="col-12">
                <q-input
                  v-model.trim="reviewForm.text"
                  type="textarea"
                  label="Review"
                  outlined
                  dense
                  rows="4"
                  :error="Boolean(formErrors.text)"
                  :error-message="formErrors.text"
                  @blur="validateField('text')"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="dialogOpen = false" />
          <q-btn color="primary" label="Submit Review" @click="submitReview" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import useReviews from '../composables/useReviews';
import { Notify } from 'quasar';
import { sanitizeTextInput } from '../utils/sanitizer';

const { reviews, averageRating, addReview, loadReviews } = useReviews();

const dialogOpen = ref(false);
const reviewForm = reactive({
  name: '',
  company: '',
  service: '',
  rating: 0,
  text: ''
});
const formErrors = reactive({
  name: '',
  company: '',
  service: '',
  rating: '',
  text: ''
});

const serviceOptions = [
  'Commercial Property Maintenance and Cleaning',
  'Routine Janitorial Services',
  'Aerial Inspection & Documentation Services'
];

const validateField = (field) => {
  const value = reviewForm[field];
  if (!value) {
    formErrors[field] = 'This field is required.';
    return false;
  }
  if (field === 'rating' && value < 1) {
    formErrors[field] = 'Please select a rating.';
    return false;
  }
  formErrors[field] = '';
  return true;
};

const validateForm = () =>
  ['name', 'company', 'service', 'rating', 'text'].every((field) => validateField(field));

const submitReview = () => {
  if (!validateForm()) {
    Notify.create({
      type: 'negative',
      message: 'Please complete all fields before submitting.'
    });
    return;
  }

  const entry = {
    id: Date.now(),
    name: sanitizeTextInput(reviewForm.name),
    company: sanitizeTextInput(reviewForm.company),
    service: sanitizeTextInput(reviewForm.service),
    rating: reviewForm.rating,
    text: sanitizeTextInput(reviewForm.text),
    date: new Date().toISOString().slice(0, 10)
  };

  addReview(entry)
    .then(() => {
      Notify.create({
        type: 'positive',
        message: 'Thanks for sharing your review!'
      });
      dialogOpen.value = false;
      reviewForm.name = '';
      reviewForm.company = '';
      reviewForm.service = '';
      reviewForm.rating = 0;
      reviewForm.text = '';
    })
    .catch(() => {
      Notify.create({
        type: 'negative',
        message: 'We could not submit your review. Please try again.'
      });
    });
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

onMounted(() => {
  loadReviews().catch(() => {
    Notify.create({
      type: 'negative',
      message: 'Unable to load reviews right now.'
    });
  });
});
</script>

<style scoped>
.reviews-page {
  background: transparent;
}

.reviews-hero {
  padding: 96px 16px 80px;
  background-image: linear-gradient(rgba(15, 48, 87, 0.68), rgba(15, 48, 87, 0.68)), url('/reviews.jpg');
  background-size: cover;
  background-position: center;
}

.reviews-hero__title {
  font-size: clamp(2.2rem, 2.5vw + 1.6rem, 3.4rem);
  line-height: 1.15;
  max-width: 720px;
}

.review-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(8, 18, 30, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.review-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 48px rgba(8, 18, 30, 0.12);
}

.review-form-card {
  width: min(760px, 92vw);
  border-radius: 20px;
}
</style>
