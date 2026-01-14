<template>
  <q-layout view="hHh lpR fff" class="bg-light">
    <a href="#main-content" class="sr-only">Skip to main content</a>

    <q-header class="nm-header" reveal elevated>
      <q-toolbar class="nm-toolbar">
        <q-btn
          dense
          flat
          round
          icon="menu"
          aria-label="Toggle navigation"
          class="lt-md"
          @click="drawer = !drawer"
        />
        <q-toolbar-title class="row items-center">
          <img
            src="/logo.webp"
            alt="Northmark Facility Services LLC logo"
            class="brand-logo"
            width="80"
            height="80"
            loading="eager"
          />
          <div class="column">
            <span class="text-weight-bold">Northmark Facility Services LLC</span>
            <span class="text-caption text-grey-4">Property Maintenance &amp; Janitorial</span>
          </div>
        </q-toolbar-title>

        <div class="gt-sm row items-center q-gutter-md nav-actions">
          <q-btn
            v-for="item in navItems"
            :key="item.label"
            flat
            :label="item.label"
            :to="item.to"
            :aria-label="item.label"
            class="text-body2 nav-link"
          />
          <q-btn
            dense
            unelevated
            color="primary"
            label="Request Estimate"
            aria-label="Request an Estimate"
            class="nav-cta"
            @click="goToEstimate"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      side="left"
      overlay
      behavior="mobile"
      aria-label="Main navigation"
      class="nm-drawer"
      :width="320"
    >
      <div class="drawer-hero">
        <img src="/logo.webp" alt="Northmark Facility Services LLC logo" class="drawer-logo" />
        <div class="drawer-brand">
          <div class="text-subtitle1 text-weight-bold">Northmark Facility Services LLC</div>
          <div class="text-caption">Property Maintenance &amp; Janitorial</div>
        </div>
      </div>
      <q-list class="drawer-list">
        <q-item
          v-for="(item, index) in navItems"
          :key="item.label"
          clickable
          :to="item.to"
          @click="drawer = false"
          class="drawer-item"
          :style="{ '--delay': `${index * 0.06}s` }"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
        <q-separator spaced class="drawer-separator" />
        <q-item
          clickable
          class="drawer-item drawer-cta"
          @click="handleDrawerEstimate"
          :style="{ '--delay': `${navItems.length * 0.06}s` }"
        >
          <q-item-section avatar>
            <q-icon name="request_quote" />
          </q-item-section>
          <q-item-section class="text-weight-bold">Request Estimate</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container id="main-content" class="bg-light nm-page">
      <router-view />
    </q-page-container>

    <q-footer class="nm-footer text-white">
      <div class="nm-container">
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="column">
            <div class="text-h6 q-mb-xs">Northmark Facility Services LLC</div>
            <div class="text-body2">Trusted commercial property maintenance partner.</div>
          </div>
          <div class="column q-gutter-sm">
            <a class="text-white" href="tel:+17015616324" aria-label="Call Northmark at 701-561-6324">
              (701) 561-6324
            </a>
            <a
              class="text-white"
              href="mailto:contact@northmarkfacilityservices.com"
              aria-label="Email Northmark at contact@northmarkfacilityservices.com"
            >
              contact@northmarkfacilityservices.com
            </a>
            <div class="text-body2 text-grey-3">Fargo, North Dakota</div>
          </div>
          <div class="column items-end">
            <q-btn
              color="white"
              text-color="primary"
              label="Request an Estimate"
              aria-label="Request an Estimate"
              @click="goToEstimate"
            />
          </div>
        </div>
        <div class="row items-center q-mt-md q-col-gutter-md text-grey-3 footer-links">
          <div class="text-caption">
            © 2026 Northmark Facility Services LLC. All rights reserved.
          </div>
          <div class="row items-center q-gutter-sm text-caption">
            <q-btn flat dense class="text-grey-3" label="Privacy Policy" :to="{ name: 'privacy' }" />
            <q-btn flat dense class="text-grey-3" label="Terms of Use" :to="{ name: 'terms' }" />
            <q-btn flat dense class="text-grey-3" label="Accessibility" :to="{ name: 'accessibility' }" />
            <q-btn
              flat
              dense
              class="text-grey-3"
              label="Request an Estimate"
              @click="goToEstimate"
            />
          </div>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const drawer = ref(false);

const navItems = [
  { label: 'Home', to: { name: 'home' }, icon: 'home' },
  { label: 'Services', to: { name: 'services' }, icon: 'business_center' },
  { label: 'Reviews', to: { name: 'reviews' }, icon: 'star' },
  { label: 'Contact Us', to: { name: 'home', hash: '#estimate' }, icon: 'support_agent' },
  { label: 'Book Appointment', to: { name: 'appointments' }, icon: 'event' }
];

const goToEstimate = () => {
  router.push({ name: 'home', hash: '#estimate' });
};

const handleDrawerEstimate = () => {
  drawer.value = false;
  goToEstimate();
};
</script>

<style scoped>
.nm-header {
  backdrop-filter: blur(10px);
  background: rgba(21, 101, 192, 0.92);
}

.nm-toolbar {
  min-height: 104px;
  padding: 14px 0;
}

.brand-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-right: 16px;
  background: #ffffff;
  border-radius: 16px;
  padding: 6px;
  filter: drop-shadow(0 10px 16px rgba(8, 18, 30, 0.25));
}

.nav-actions {
  margin-left: 12px;
  margin-right: 12px;
}

.nav-link {
  letter-spacing: 0.02em;
}

.nav-cta {
  border-radius: 999px;
  padding: 6px 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffffff, #e8eef5);
  color: #1f3b63;
  box-shadow: 0 10px 18px rgba(8, 18, 30, 0.18);
}

.nm-footer {
  background: linear-gradient(135deg, #1565c0, #0f3057);
  padding: 24px 16px 32px;
}

.footer-links :deep(.q-btn) {
  text-transform: none;
  padding: 0 6px;
  min-height: 20px;
}

@media (max-width: 600px) {
  .nm-toolbar {
    min-height: 84px;
    padding: 8px 0;
  }

  .brand-logo {
    width: 64px;
    height: 64px;
    margin-right: 12px;
    padding: 4px;
  }

  .nm-drawer {
    background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), #eef3fb 55%, #dfe7f3);
    border-top-right-radius: 26px;
    border-bottom-right-radius: 26px;
    overflow: hidden;
  }

  .drawer-hero {
    padding: 24px 20px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, rgba(21, 101, 192, 0.12), rgba(0, 137, 123, 0.1));
  }

  .drawer-logo {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: #fff;
    padding: 6px;
    box-shadow: 0 8px 18px rgba(8, 18, 30, 0.18);
  }

  .drawer-brand {
    color: #0f172a;
  }

  .drawer-list {
    padding: 10px 14px 24px;
  }

  .drawer-item {
    border-radius: 14px;
    margin: 10px 0;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 10px 20px rgba(8, 18, 30, 0.08);
    color: #1f2937;
    animation: drawer-rise 0.5s ease-out both;
    animation-delay: var(--delay);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .drawer-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(8, 18, 30, 0.14);
  }

  .drawer-item :deep(.q-icon) {
    color: #1565c0;
  }

  .drawer-cta {
    background: linear-gradient(135deg, #1565c0, #0f3057);
    color: #ffffff;
  }

  .drawer-cta :deep(.q-icon) {
    color: #ffffff;
  }

  .drawer-separator {
    margin: 16px 6px;
    opacity: 0.5;
  }

  @keyframes drawer-rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .nm-page {
    padding-bottom: 140px;
  }

  .nm-footer {
    padding: 14px 14px 20px;
    margin-top: 120px;
  }

  .nm-footer .text-h6 {
    font-size: 0.98rem;
  }

  .nm-footer .text-body2,
  .nm-footer .text-caption {
    font-size: 0.78rem;
  }

  .footer-links {
    row-gap: 4px;
  }
}
</style>

