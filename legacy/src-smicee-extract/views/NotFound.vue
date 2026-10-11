<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-card__icon bg-blue-50 text-blue-500">
        <i class="ri-map-pin-2-line" />
      </div>
      <h1 class="error-card__code">404</h1>
      <h2 class="error-card__title">Page Not Found</h2>
      <p class="error-card__desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="error-card__actions">
        <button class="btn btn--ghost" @click="$router.back()">
          <i class="ri-arrow-left-line" /> Go Back
        </button>
        <router-link :to="{ name: 'Dashboard' }" class="btn btn--primary">
          <i class="ri-home-line" /> Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'NotFoundView' }
</script>

<style scoped>
@import '@/assets/styles/error-page.css';
</style>
