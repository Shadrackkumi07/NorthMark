<template>
  <q-page class="services-page">
    <section class="services-hero nm-gradient">
      <div class="nm-container">
        <div class="text-white text-overline text-uppercase q-mb-sm nm-reveal">Our Services</div>
        <div class="nm-display text-white services-hero__title nm-reveal nm-reveal--delay">
          Operational-ready facility care
        </div>
        <p class="text-white services-hero__lead q-mt-md nm-reveal nm-reveal--delay">
          We deliver a complete suite of maintenance, janitorial, and inspection services designed to
          keep commercial properties clean, safe, and consistently serviced.
        </p>
      </div>
    </section>

    <section class="page-section nm-container">
      <div class="row items-start q-col-gutter-lg">
        <div v-for="service in services" :key="service.title" class="col-12 col-md-6">
          <q-card class="nm-surface-card full-height" flat>
            <q-card-section class="row items-start q-gutter-md">
              <div class="nm-icon-badge">
                <q-icon :name="service.icon" size="26px" />
              </div>
              <div>
                <div class="text-h6 q-mb-xs">{{ service.title }}</div>
                <p class="text-body2 q-mb-md">{{ service.description }}</p>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="text-subtitle2 text-weight-medium q-mb-sm">Key features</div>
              <div class="row q-col-gutter-sm">
                <div v-for="point in service.points" :key="point" class="col-12 col-sm-6">
                  <div class="service-point">
                    <q-icon name="check_circle" color="primary" size="18px" />
                    <span>{{ point }}</span>
                  </div>
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
          <div class="text-h5 text-white q-mb-sm">Contact us to discuss your specific needs</div>
          <div class="text-body1 text-white">
            Call <a class="text-white text-weight-medium" href="tel:+17015616324">(701) 561-6324</a> or
            request a detailed estimate.
          </div>
        </div>
        <div class="col-12 col-md-auto">
          <q-btn color="white" text-color="primary" label="Request an Estimate" :to="{ name: 'home', hash: '#estimate' }" />
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
const services = [
  {
    title: 'Commercial Property Maintenance',
    description:
      'Comprehensive commercial property maintenance services including routine upkeep, preventive maintenance, and building systems support. We work with property owners and managers to protect property condition and ensure smooth daily operations.',
    points: [
      'Routine facility upkeep',
      'Building systems maintenance',
      'Property condition protection',
      'Scheduled maintenance programs'
    ],
    icon: 'apartment'
  },
  {
    title: 'After-Hours Commercial Cleaning',
    description:
      'Professional after-hours commercial cleaning services designed to maintain clean, healthy work environments without disrupting your business operations. Our trained staff follows documented procedures and quality control standards.',
    points: [
      'Office cleaning',
      'Medical facility sanitization',
      'Floor care and maintenance',
      'Restroom sanitization',
      'Quality control documentation'
    ],
    icon: 'schedule'
  },
  {
    title: 'Routine Janitorial Services',
    description:
      'Consistent, reliable janitorial services for offices, medical facilities, and commercial buildings. We provide scheduled service with attention to detail and quality standards.',
    points: [
      'Daily/weekly scheduled service',
      'Customized cleaning plans',
      'Trained, professional staff',
      'Environmentally responsible products'
    ],
    icon: 'cleaning_services'
  },
  {
    title: 'Aerial Inspection & Documentation Services',
    description:
      'Advanced aerial inspection and documentation services using professional drone technology. Comprehensive building and property assessments providing detailed visual documentation for maintenance planning, insurance documentation, and property condition reports.',
    points: [
      'Roof and exterior inspections',
      'High-resolution imagery and video',
      'Property condition documentation',
      'Safety-first approach',
      'Detailed inspection reports'
    ],
    icon: 'flight'
  }
];
</script>

<style scoped>
.services-page {
  background: transparent;
}

.services-hero {
  padding: 96px 16px 80px;
}

.services-hero__title {
  font-size: clamp(2.4rem, 2.5vw + 1.8rem, 3.6rem);
  line-height: 1.1;
}

.services-hero__lead {
  max-width: 680px;
  line-height: 1.7;
}

.service-point {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}
</style>
