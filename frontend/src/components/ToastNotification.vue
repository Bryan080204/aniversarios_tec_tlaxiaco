<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" :class="type">
      <span class="icon">{{ icons[type] }}</span>
      <span class="message">{{ message }}</span>
      <button class="close" @click="close">×</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'error', 'warning', 'info'].includes(v)
  },
  duration: {
    type: Number,
    default: 3000
  },
  show: Boolean
});

const emit = defineEmits(['close']);

const visible = ref(false);
let timeout = null;

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

watch(() => props.show, (newVal) => {
  visible.value = newVal;
  if (newVal && props.duration > 0) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      close();
    }, props.duration);
  }
}, { immediate: true });

function close() {
  visible.value = false;
  emit('close');
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 14px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 9999;
  min-width: 280px;
}

.toast.success { background: linear-gradient(135deg, #10B981, #059669); }
.toast.error { background: linear-gradient(135deg, #EF4444, #DC2626); }
.toast.warning { background: linear-gradient(135deg, #F59E0B, #D97706); }
.toast.info { background: linear-gradient(135deg, #3B82F6, #2563EB); }

.icon {
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
}

.message { flex: 1; }

.close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.close:hover { opacity: 1; }

.toast-enter-active { animation: slideIn 0.3s ease-out; }
.toast-leave-active { animation: slideOut 0.3s ease-in; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
</style>
