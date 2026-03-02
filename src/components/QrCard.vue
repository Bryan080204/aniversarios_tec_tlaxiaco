<template>
  <div class="qrCard">
    <div class="wrap">
      <qrcode-vue :value="value" :size="160" :margin="2" />
    </div>

    <div class="text">{{ value }}</div>
  </div>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'

defineProps({
  value: { type: String, required: true },
})
</script>

<style scoped>
.qrCard{
  width: 220px;
  background: var(--white);
  border: 1px solid var(--steel-300);
  border-radius: 14px;
  padding: 10px;
}

.wrap{
  display: flex;
  justify-content: center;
  padding: 6px 0;
}

.text{
  font-size: 11px;
  color: var(--slate-600);
  word-break: break-all;
}
</style>