<template>
  <q-page class="home-page">
    <section class="nm-hero nm-gradient">
      <div class="nm-hero__glow"></div>
      <div class="nm-container nm-hero__grid">
        <div>
          <div class="hero-kicker text-uppercase text-white nm-reveal">Northmark Facility Services</div>
          <h1 class="nm-display hero-title text-white q-mb-md nm-reveal nm-reveal--delay">
            Professional Commercial Property Maintenance
          </h1>
          <p class="hero-sub text-white q-mb-lg nm-reveal nm-reveal--delay">
            Supporting daily building operations and protecting property condition with documented
            procedures and quality control standards.
          </p>
          <div class="row q-gutter-sm items-center nm-reveal nm-reveal--delay">
            <q-btn color="white" text-color="primary" label="Request an Estimate" @click="goToEstimate" />
            <q-btn flat class="text-white" label="View Services" :to="{ name: 'services' }" />
          </div>
        </div>
        <div class="nm-hero__panel nm-reveal nm-reveal--delay">
          <q-card class="nm-surface-card" flat>
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium">Operational Confidence</div>
              <div class="text-body2 q-mt-sm">
                We keep commercial environments clean, safe, and audit-ready with proactive maintenance
                schedules, responsive teams, and clear documentation.
              </div>
              <div class="row q-col-gutter-sm q-mt-md">
                <div class="col-6">
                  <div class="text-h5 text-weight-bold">24/7</div>
                  <div class="text-caption text-grey-7">After-hours availability</div>
                </div>
                <div class="col-6">
                  <div class="text-h5 text-weight-bold">100%</div>
                  <div class="text-caption text-grey-7">Quality control tracking</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section class="page-section nm-container">
      <div class="row q-col-gutter-xl items-center">
        <div class="col-12 col-lg-6">
          <div class="nm-section-title">Built for property owners and managers</div>
          <p class="nm-section-lead">
            Northmark Facility Services provides professional commercial property maintenance and
            janitorial services focused on supporting daily building operations and protecting property
            condition. Our services include commercial property maintenance and cleaning, routine
            janitorial services, and general facility upkeep for offices, medical facilities, and
            commercial buildings. We work with property owners and managers to maintain clean, safe, and
            consistently serviced environments through documented procedures and quality control
            standards.
          </p>
        </div>
        <div class="col-12 col-lg-6">
          <q-card class="nm-surface-card" flat>
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-sm">Services</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="nm-icon-badge q-mb-sm">
                    <q-icon name="business" size="24px" />
                  </div>
                  <div class="text-body2">Commercial Offices</div>
                </div>
                <div class="col-6">
                  <div class="nm-icon-badge q-mb-sm">
                    <q-icon name="local_hospital" size="24px" />
                  </div>
                  <div class="text-body2">Medical Facilities</div>
                </div>
                <div class="col-6">
                  <div class="nm-icon-badge q-mb-sm">
                    <q-icon name="apartment" size="24px" />
                  </div>
                  <div class="text-body2">Commercial Buildings</div>
                </div>
                <div class="col-6">
                  <div class="nm-icon-badge q-mb-sm">
                    <q-icon name="inventory_2" size="24px" />
                  </div>
                  <div class="text-body2">Industrial Properties</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section class="page-section nm-container">
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <div class="nm-section-title">Service highlights</div>
          <div class="text-body1 text-grey-8">A snapshot of the solutions we deliver every day.</div>
        </div>
        <q-btn outline color="primary" label="Learn More" :to="{ name: 'services' }" />
      </div>
      <div class="row q-col-gutter-lg">
        <div v-for="item in servicesPreview" :key="item.title" class="col-12 col-md-6 col-lg-3">
          <q-card class="nm-surface-card full-height" flat>
            <q-card-section>
              <div class="nm-icon-badge q-mb-md">
                <q-icon :name="item.icon" size="24px" />
              </div>
              <div class="text-subtitle1 text-weight-medium q-mb-xs">{{ item.title }}</div>
              <p class="text-body2">{{ item.description }}</p>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section class="page-section nm-container">
      <div class="row items-center justify-between q-mb-lg">
        <div class="nm-section-title">Trust indicators</div>
      </div>
      <div class="row q-col-gutter-lg">
        <div v-for="item in trustIndicators" :key="item.title" class="col-12 col-md-4">
          <q-card class="nm-surface-card full-height" flat>
            <q-card-section>
              <div class="row items-start q-gutter-md">
                <div class="nm-icon-badge">
                  <q-icon :name="item.icon" size="24px" />
                </div>
                <div>
                  <div class="text-subtitle1 text-weight-medium q-mb-xs">{{ item.title }}</div>
                  <div class="text-body2">{{ item.description }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section class="page-section nm-container">
      <div class="row items-center justify-between q-mb-lg">
        <div class="nm-section-title">Core values</div>
      </div>
      <div class="row q-col-gutter-lg">
        <div v-for="item in coreValues" :key="item.title" class="col-12 col-md-3">
          <q-card class="nm-surface-card full-height" flat>
            <q-card-section>
              <div class="row items-start q-gutter-md">
                <div class="nm-icon-badge">
                  <q-icon :name="item.icon" size="24px" />
                </div>
                <div>
                  <div class="text-subtitle1 text-weight-medium q-mb-xs">{{ item.title }}</div>
                  <div class="text-body2">{{ item.description }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <section class="page-section nm-container">
      <div class="nm-cta row items-center justify-between q-col-gutter-lg">
        <div class="col-12 col-md-8">
          <div class="text-h5 text-white q-mb-sm">Ready to discuss your facility needs?</div>
          <div class="text-body1 text-white">
            Call <a class="text-white text-weight-medium" href="tel:+17015616324">(701) 561-6324</a> to
            connect with our team or request a tailored estimate.
          </div>
        </div>
        <div class="col-12 col-md-auto">
          <q-btn color="white" text-color="primary" label="Request an Estimate" @click="goToEstimate" />
        </div>
      </div>
    </section>

    <section id="estimate" class="page-section nm-container">
      <q-card class="nm-surface-card" flat>
        <q-card-section>
          <div class="row items-center justify-between q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-8">
              <div class="text-h6 q-mb-xs">Request an Estimate</div>
              <p class="text-body2 q-mb-none">
                Tell us about your facility needs. All fields are required and protected with
                validation, sanitization, and rate limiting.
              </p>
            </div>
            <div class="col-12 col-md-auto">
              <q-btn color="primary" label="Call Now" href="tel:+17015616324" />
            </div>
          </div>
          <EstimateForm />
        </q-card-section>
      </q-card>
    </section>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';
import EstimateForm from '../components/forms/EstimateForm.vue';

const router = useRouter();

const servicesPreview = [
  {
    title: 'Commercial Property Maintenance and Cleaning',
    description: 'Routine facility upkeep with commercial cleaning that protects building assets.',
    icon: 'schedule'
  },
  {
    title: 'Routine Janitorial',
    description: 'Customized schedules for offices, medical facilities, and buildings.',
    icon: 'cleaning_services'
  },
  {
    title: 'Aerial Documentation',
    description: 'Drone inspections for detailed exterior and roof visibility.',
    icon: 'flight'
  }
];

const trustIndicators = [
  {
    title: 'Professional Service',
    description: 'Trained teams, uniform standards, and consistent staffing.',
    icon: 'verified'
  },
  {
    title: 'Quality Control',
    description: 'Documented checklists and performance tracking for every visit.',
    icon: 'fact_check'
  },
  {
    title: 'Documented Procedures',
    description: 'Clear protocols that keep compliance and safety top of mind.',
    icon: 'description'
  }
];

const coreValues = [
  {
    title: 'Integrity',
    description: 'We deliver honest service and transparent communication.',
    icon: 'verified_user'
  },
  {
    title: 'Partnership',
    description: 'We align with property teams to support long-term success.',
    icon: 'handshake'
  },
  {
    title: 'Reliability',
    description: 'We show up consistently and follow through on commitments.',
    icon: 'schedule'
  },
  {
    title: 'Quality',
    description: 'We focus on the details that keep facilities looking their best.',
    icon: 'workspace_premium'
  }
];

const goToEstimate = () => {
  router.push({ hash: '#estimate' });
};
</script>

<style scoped>
.nm-hero {
  position: relative;
  padding: 72px 16px 64px;
  overflow: hidden;
  margin-bottom: 32px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  box-shadow: 0 20px 40px rgba(8, 18, 30, 0.12);
  background-image: linear-gradient(rgba(15, 48, 87, 0.68), rgba(15, 48, 87, 0.68)), url('/HOME.jpg');
  background-size: 100%;
  background-position: center;
}

.nm-hero__grid {
  display: grid;
  gap: 32px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: center;
}

.nm-hero__panel {
  position: relative;
  z-index: 1;
}

.nm-hero__glow {
  position: absolute;
  top: -180px;
  right: -120px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(0, 137, 123, 0.35), transparent 70%);
  filter: blur(10px);
  opacity: 0.9;
}

.hero-kicker {
  letter-spacing: 0.2em;
  font-size: 0.75rem;
}

.hero-title {
  font-size: clamp(2.4rem, 2.6vw + 1.4rem, 3.6rem);
  line-height: 1.12;
}

.hero-sub {
  max-width: 520px;
  font-size: 1.05rem;
  line-height: 1.7;
}

#estimate {
  scroll-margin-top: 96px;
}

@media (max-width: 600px) {
  .nm-hero {
    padding: 48px 16px 40px;
    margin-bottom: 24px;
  }

  .hero-title {
    font-size: clamp(2rem, 7vw, 2.6rem);
  }

  .hero-sub {
    font-size: 0.98rem;
  }
}
</style>
