<template>
  <div class="loading-spinner" :class="{ small: size === 'small' }">
    <div class="spinner"></div>
    <span v-if="text" class="text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  text: String,
  size: {
    type: String,
    default: 'normal'
  }
});
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}

.loading-spinner.small {
  padding: 10px;
  flex-direction: row;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #1B3573;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.text {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
