<template>
  <div 
    class="estado-indicador" 
    :class="colorClase" 
    @click="$emit('irAValidacion')"
  >
    <span class="label">ESTADO</span>
    <div class="circulo"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  estado: { type: Number, default: 0 } // 0: Rojo, 1: Amarillo, 2: Verde
});

const colorClase = computed(() => {
  if (props.estado === 1) return 'amarillo';
  if (props.estado === 2) return 'verde';
  return 'rojo';
});
</script>

<style scoped>
.estado-indicador {
  width: 100px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.estado-indicador:hover { transform: scale(1.05); }

/* Colores según tu lógica de pizarra */
.rojo { background-color: #EF4444; border: 2px solid #B91C1C; }
.amarillo { background-color: #F59E0B; border: 2px solid #B45309; }
.verde { background-color: #10B981; border: 2px solid #047857; }

.label {
  color: white;
  font-weight: 800;
  font-size: 10px;
  margin-bottom: 5px;
}

.circulo {
  width: 25px;
  height: 25px;
  background: white;
  border-radius: 50%;
}
</style>