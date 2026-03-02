<template>
  <aside class="sidebar">
    <!-- LOGO GRANDE ARRIBA (ancho del menú) -->
    <div class="logoBox">
      <img class="logo" src="/logo-itt.png" alt="Logo Tec Tlaxiaco" />
    </div>

    <div class="title">MENÚ</div>

    <button class="item" :class="{ active: active === 'inicio' }" @click="$emit('select', 'inicio')">
      Inicio
    </button>

    <button class="item" :class="{ active: active === 'registro' }" @click="$emit('select', 'registro')">
      Registro
    </button>

    <button class="item" :class="{ active: active === 'reportes' }" @click="$emit('select', 'reportes')">
      Informes
    </button>

    <button class="item" :class="{ active: active === 'config' }" @click="$emit('select', 'config')">
      Configuración
    </button>
  </aside>
</template>

<script setup>
defineProps({
  active: { type: String, default: 'inicio' },
})
defineEmits(['select'])
</script>

<style scoped>
.sidebar{
  width: 240px;
  min-height: 100vh;
  background: var(--navy-900);
  color: var(--white);
  padding: 14px;
}

/* Caja del logo grande */
.logoBox{
  width: 100%;
  background: rgba(255,255,255,0.10);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
}

/* Logo grande (ajusta altura si quieres más grande) */
.logo{
  width: 100%;
  height: 150px; /* ← cambia a 170px o 180px si lo quieres más grande */
  object-fit: contain;
}

.title{
  font-weight: 1000;
  letter-spacing: .6px;
  margin: 10px 0 14px;
}

.item{
  width: 100%;
  text-align: left;
  padding: 12px 12px;
  border: 0;
  border-radius: 12px;
  margin-bottom: 10px;
  background: rgba(255,255,255,0.10);
  color: var(--white);
  cursor: pointer;
  font-weight: 800;
}

.item:hover{ background: rgba(255,255,255,0.18); }
.item.active{ background: var(--blue-500); }
</style>