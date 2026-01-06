<template>
  <q-page class="page-section nm-container">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="nm-section-title">Admin Reviews</div>
        <div class="text-body2 text-grey-7">
          Manage user-submitted reviews stored locally in this browser.
        </div>
      </div>
      <q-btn
        outline
        color="negative"
        label="Clear All"
        :disable="storedReviews.length === 0"
        @click="handleClear"
      />
    </div>

    <div v-if="storedReviews.length === 0" class="text-body1 text-grey-7">
      No user-submitted reviews found.
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div v-for="review in storedReviews" :key="review.id" class="col-12 col-md-6 col-lg-4">
        <q-card class="nm-surface-card full-height" flat>
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle1 text-weight-medium">{{ review.name }}</div>
              <q-chip dense color="secondary" text-color="white">{{ review.service }}</q-chip>
            </div>
            <div class="text-caption text-grey-7 q-mb-sm">{{ review.company }}</div>
            <div class="row items-center q-gutter-sm q-mb-sm">
              <q-rating
                :model-value="review.rating"
                size="18px"
                color="amber"
                icon="star"
                icon-half="star_half"
                readonly
              />
              <span class="text-caption text-grey-7">{{ formatDate(review.date) }}</span>
            </div>
            <p class="text-body2">{{ review.text }}</p>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right">
            <q-btn
              flat
              color="negative"
              label="Delete"
              @click="handleDelete(review.id)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { Notify } from 'quasar';
import { onMounted } from 'vue';
import useReviews from '../composables/useReviews';

const { storedReviews, removeReview, clearStoredReviews, loadReviews } = useReviews();

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

const handleDelete = (id) => {
  removeReview(id)
    .then(() => {
      Notify.create({
        type: 'positive',
        message: 'Review deleted.'
      });
    })
    .catch(() => {
      Notify.create({
        type: 'negative',
        message: 'Unable to delete review.'
      });
    });
};

const handleClear = () => {
  clearStoredReviews()
    .then(() => {
      Notify.create({
        type: 'warning',
        message: 'All stored reviews cleared.'
      });
    })
    .catch(() => {
      Notify.create({
        type: 'negative',
        message: 'Unable to clear reviews.'
      });
    });
};

onMounted(() => {
  loadReviews().catch(() => {
    Notify.create({
      type: 'negative',
      message: 'Unable to load reviews.'
    });
  });
});
</script>
