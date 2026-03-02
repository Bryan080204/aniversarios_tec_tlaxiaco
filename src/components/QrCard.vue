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

    <div class="text">{{ value }}</div>
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
})

/**
 * Configuración para 'excavar' la forma del logo en el QR.
 * Esto crea un hueco blanco con la silueta del logo, y el código se dibuja alrededor.
 */
const imageSettings = computed(() => {
  // Definimos el tamaño del hueco central (ej: 30% del tamaño del QR).
  // Asegúrate de que no sea demasiado grande para mantener la legibilidad.
  const logoSize = props.size * 0.30;
  
  return {
    // 1. src: Ruta al archivo del logo en tu carpeta 'public'.
    // Usamos el logo para definir la forma de la excavación.
    src: '/logo-itt.png', // Asegúrate de que este nombre sea correcto
    
    // 2. width y height: Dimensiones del hueco central.
    width: logoSize,
    height: logoSize,
    
    // 3. excavate: true. ESTA ES LA CLAVE.
    // Recorta los módulos (puntos) del QR que quedan detrás de la imagen.
    // Como el fondo del QR es blanco, esto crea un hueco blanco con la forma del logo.
    excavate: true, // Esto asegura que el código esté al rededor de la imagen
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