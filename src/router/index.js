import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import ServicesPage from '../pages/ServicesPage.vue';
import ReviewsPage from '../pages/ReviewsPage.vue';
import NotFoundPage from '../pages/NotFoundPage.vue';
import { applyPageMeta, sanitizePathname } from '../utils/security';

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: {
      title: 'Commercial Cleaning & Facility Services in Fargo-Moorhead | Northmark',
      description: 'Secure, reliable commercial cleaning, janitorial service, property maintenance and drone inspection for Fargo, West Fargo and Moorhead businesses.',
      ogType: 'website'
    }
  },
  {
    path: '/services',
    name: 'services',
    component: ServicesPage,
    // In production /services is a prerendered static hub (scripts/seo/build-pages.mjs).
    // Client-side navigation hands off to it with a full page load; a direct load that
    // still reaches the SPA (static file missing) falls back to the Vue page.
    beforeEnter: (to, from) => {
      if (import.meta.env.PROD && from.matched.length && window.location.pathname !== to.path) {
        window.location.assign(to.fullPath);
        return false;
      }
      return true;
    },
    meta: {
      title: 'Our Services',
      description: 'Commercial property maintenance, after-hours cleaning, janitorial services, and aerial inspections tailored for business facilities.',
      ogType: 'website'
    }
  },
  {
    path: '/reviews',
    name: 'reviews',
    component: ReviewsPage,
    meta: {
      title: 'Client Reviews in Fargo-Moorhead | Northmark',
      description: 'Read client feedback about Northmark Facility Services in Fargo, West Fargo and Moorhead, or share your experience with our commercial facility services.',
      ogType: 'website'
    }
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('../pages/AppointmentPage.vue'),
    meta: {
      title: 'Book a Facility Consultation | Northmark',
      description: 'Schedule a Northmark consultation for commercial cleaning, janitorial service, property maintenance or aerial documentation in Fargo, West Fargo and Moorhead.',
      ogType: 'website'
    }
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../pages/PrivacyPolicyPage.vue'),
    meta: {
      title: 'Privacy Policy',
      description: 'Privacy practices for Northmark Facility Services.',
      ogType: 'website'
    }
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('../pages/TermsPage.vue'),
    meta: {
      title: 'Terms of Use',
      description: 'Terms and conditions for using the Northmark Facility Services website.',
      ogType: 'website'
    }
  },
  {
    path: '/accessibility',
    name: 'accessibility',
    component: () => import('../pages/AccessibilityPage.vue'),
    meta: {
      title: 'Accessibility Statement',
      description: 'Accessibility statement and commitments for Northmark Facility Services.',
      ogType: 'website'
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../pages/AdminPage.vue'),
    meta: {
      title: 'Admin',
      noindex: true,
      description: 'Admin review management.',
      ogType: 'website'
    }
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: {
      title: 'Page Not Found',
      noindex: true,
      description: 'The page you are looking for does not exist.',
      ogType: 'website'
    }
  }
];

const router = createRouter({
  history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0, behavior: 'smooth' };
  }
});

router.beforeEach((to, from, next) => {
  if (import.meta.env.SSR) return next();
  if (to.name === 'admin') {
    try {
      const flag = sessionStorage.getItem('nm_admin');
      if (flag === 'true') {
        applyPageMeta(to);
        next();
        return;
      }
      const passcode = import.meta.env?.VITE_ADMIN_PASSCODE;
      const promptValue = window.prompt('Enter admin passcode');
      if (promptValue && passcode && promptValue === passcode) {
        sessionStorage.setItem('nm_admin', 'true');
        applyPageMeta(to);
        next();
        return;
      }
      next({ name: 'home' });
      return;
    } catch (e) {
      next({ name: 'home' });
      return;
    }
  }

  const safePath = sanitizePathname(to.fullPath);
  if (safePath !== to.fullPath) {
    next(safePath);
    return;
  }

  applyPageMeta(to);
  next();
});

export default router;

