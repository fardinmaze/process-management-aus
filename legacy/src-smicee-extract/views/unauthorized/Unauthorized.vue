<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-card__icon bg-yellow-100 text-yellow-600">
        <i class="ri-lock-line" />
      </div>
      <h1 class="error-card__code">403</h1>
      <h2 class="error-card__title">Access Denied</h2>
      <p class="error-card__desc">
        You don't have permission to view this page.
        Contact your administrator if you believe this is a mistake.
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
export default { name: 'UnauthorizedView' }
</script>

<style scoped>
@import '@/assets/styles/error-page.css';
</style>
