<template>
  <q-page class="appointments-page">
    <section class="appointments-hero nm-gradient">
      <div class="nm-container">
        <div class="text-white text-overline text-uppercase q-mb-sm nm-reveal">
          Book an Appointment
        </div>
        <div class="nm-display text-white appointments-hero__title nm-reveal nm-reveal--delay">
          Northmark Facility Services Consultation
        </div>
        <p class="text-white appointments-hero__lead q-mt-md nm-reveal nm-reveal--delay">
          Choose a time that works for you. We’ll review scope, timelines, and next steps for your
          facility maintenance or janitorial needs.
        </p>
      </div>
    </section>

    <section class="page-section nm-container">
      <q-card class="nm-surface-card" flat>
        <q-card-section>
          <iframe
            class="calendly-frame"
            src="https://calendly.com/scheduling-northmarkfacilityservices/northmark-facility-services-consultation"
            title="Northmark Facility Services Consultation"
            frameborder="0"
          ></iframe>
        </q-card-section>
      </q-card>
      <div class="text-caption text-grey-7 q-mt-sm">
        Prefer to talk now? Call <a href="tel:+17015616324">(701) 561-6324</a> or email
        <a href="mailto:scheduling@northmarkfacilityservices.com">scheduling@northmarkfacilityservices.com</a>.
      </div>
    </section>
  </q-page>
</template>

<style scoped>
.appointments-page {
  background: transparent;
}

.appointments-hero {
  padding: 96px 16px 80px;
  background-image: linear-gradient(rgba(15, 48, 87, 0.68), rgba(15, 48, 87, 0.68)), url('/appointment.jpg');
  background-size: cover;
  background-position: center calc(50% + 120px);
}

.appointments-hero__title {
  font-size: clamp(2.2rem, 2.5vw + 1.6rem, 3.4rem);
  line-height: 1.15;
  max-width: 760px;
}

.appointments-hero__lead {
  max-width: 680px;
  line-height: 1.7;
}

.calendly-frame {
  width: 100%;
  min-height: 720px;
  border: none;
}

@media (max-width: 768px) {
  .calendly-frame {
    min-height: 640px;
  }
}
</style>
