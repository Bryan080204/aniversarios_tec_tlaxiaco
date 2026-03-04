<template>
  <div class="qrCard">
    <div class="wrap">
      <qrcode-vue
        :value="value"
        :size="size"
        :margin="margin"
        level="H"
        render-as="canvas"
        :image-settings="imageSettings"
      />
    </div>

    <div v-if="showText" class="text">{{ value }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'

// Propiedades del componente
const props = defineProps({
  value: { type: String, required: true },
  size: { type: Number, default: 160 },
  margin: { type: Number, default: 2 },
  showText: { type: Boolean, default: true },
  logoSrc: { type: String, default: '' },
  logoScale: { type: Number, default: 0.24 },
})

const imageSettings = computed(() => {
  if (!props.logoSrc) return undefined

  const logoSize = props.size * props.logoScale
  return {
    src: props.logoSrc,
    width: logoSize,
    height: logoSize,
    excavate: false,
  }
})
</script>

<style scoped>
/* Tus estilos originales se mantienen intactos */
.qrCard {
  width: 220px;
  background: var(--white);
  border: 1px solid var(--steel-300);
  border-radius: 14px;
  padding: 10px;
}

.wrap {
  display: flex;
  justify-content: center;
  padding: 6px 0;
}

.text {
  font-size: 11px;
  color: var(--slate-700);
  word-break: break-all;
}
</style>