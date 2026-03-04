<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input 
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        class="search-input"
      />
      <button 
        v-if="modelValue" 
        class="clear-btn"
        @click="$emit('update:modelValue', '')"
      >×</button>
    </div>
    <slot name="filters"></slot>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: 'Buscar...'
  }
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 42px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: 0.2s;
  background: #f8fafc;
}

.search-input:focus {
  border-color: #1B3573;
  background: white;
  box-shadow: 0 0 0 3px rgba(27,53,115,0.1);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: 0.2s;
}

.clear-btn:hover {
  background: #cbd5e1;
  color: #1e293b;
}
</style>
