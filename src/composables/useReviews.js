import { computed, ref } from 'vue';
import { stripHTML } from '../utils/sanitizer';

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const REVIEWS_API = import.meta.env?.VITE_REVIEWS_API || '';
const ADMIN_TOKEN = import.meta.env?.VITE_ADMIN_PASSCODE || '';

const normalizeReview = (review) => {
  const ratingValue = Number(review.rating);
  const rating = Number.isFinite(ratingValue) ? Math.min(Math.max(ratingValue, 1), 5) : 0;
  return {
    ...review,
    rating,
    name: stripHTML(review.name),
    company: stripHTML(review.company),
    text: stripHTML(review.text),
    service: stripHTML(review.service),
    date: review.date,
    source: review.source || 'seed'
  };
};

const sortedReviews = ref([]);
const storedReviews = ref([]);

export default function useReviews() {
  const loadReviews = async () => {
    if (!REVIEWS_API) {
      sortedReviews.value = [];
      storedReviews.value = [];
      return;
    }

    const response = await fetch(REVIEWS_API);
    if (!response.ok) {
      throw new Error('Failed to load reviews.');
    }
    const data = await response.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    const normalized = reviews
      .map(normalizeReview)
      .filter((review) => review.rating >= 1 && review.rating <= 5 && isValidDate(review.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedReviews.value = normalized;
    storedReviews.value = normalized.filter((review) => review.source === 'user');
  };

  const filterByService = (service) =>
    computed(() =>
      !service
        ? sortedReviews.value
        : sortedReviews.value.filter(
            (review) => review.service.toLowerCase() === service.toLowerCase()
          )
    );

  const averageRating = computed(() => {
    if (!sortedReviews.value.length) return 0;
    const total = sortedReviews.value.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / sortedReviews.value.length).toFixed(1));
  });

  const addReview = async (review) => {
    if (!REVIEWS_API) {
      throw new Error('Reviews API is not configured.');
    }
    const response = await fetch(REVIEWS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (!response.ok) {
      throw new Error('Failed to submit review.');
    }
    const data = await response.json().catch(() => ({}));
    const created = data?.review ? normalizeReview(data.review) : null;
    if (created && created.rating >= 1 && created.rating <= 5 && isValidDate(created.date)) {
      sortedReviews.value = [created, ...sortedReviews.value].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      storedReviews.value = sortedReviews.value.filter((item) => item.source === 'user');
    } else {
      await loadReviews();
    }
  };

  const removeReview = async (id) => {
    if (!REVIEWS_API) {
      throw new Error('Reviews API is not configured.');
    }
    const response = await fetch(`${REVIEWS_API}/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': ADMIN_TOKEN }
    });
    if (!response.ok) {
      throw new Error('Failed to delete review.');
    }
    await loadReviews();
  };

  const clearStoredReviews = async () => {
    if (!REVIEWS_API) {
      throw new Error('Reviews API is not configured.');
    }
    const response = await fetch(REVIEWS_API, {
      method: 'DELETE',
      headers: { 'x-admin-token': ADMIN_TOKEN }
    });
    if (!response.ok) {
      throw new Error('Failed to clear reviews.');
    }
    await loadReviews();
  };

  return {
    reviews: sortedReviews,
    averageRating,
    filterByService,
    addReview,
    removeReview,
    clearStoredReviews,
    storedReviews,
    loadReviews
  };
}
