import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import ServicesPage from '../pages/ServicesPage.vue';
import ReviewsPage from '../pages/ReviewsPage.vue';
import NotFoundPage from '../pages/NotFoundPage.vue';
import { applyPageMeta, sanitizePathname } from '../utils/security';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: {
      title: 'Northmark Facility Services',
      description: 'Northmark Facility Services delivers reliable commercial property maintenance and janitorial services with enterprise-grade security.',
      ogType: 'website'
    }
  },
  {
    path: '/services',
    name: 'services',
    component: ServicesPage,
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
      title: 'Client Reviews',
      description: 'Trusted by property managers and business owners across the region for consistent quality and professionalism.',
      ogType: 'website'
    }
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('../pages/AppointmentPage.vue'),
    meta: {
      title: 'Book an Appointment',
      description: 'Schedule a consultation with Northmark Facility Services.',
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
      description: 'The page you are looking for does not exist.',
      ogType: 'website'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0, behavior: 'smooth' };
  }
});

router.beforeEach((to, from, next) => {
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
