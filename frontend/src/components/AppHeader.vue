<template>
  <header class="header">
    <div class="left">
      <div class="h1">ANIVERSARIOS</div>
      <div class="h2">Tec Tlaxiaco</div>
    </div>

    <div class="right">
      <img class="logo" src="/logo35.png" alt="Logo Tec Tlaxiaco" />
    </div>
  </header>
</template>

<script setup>

</script>

<style scoped>
.header{
  height: 150px; 
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: linear-gradient(90deg, var(--navy-900), var(--blue-600));
  color: var(--white);

  border-radius: 0 0 0 20px; 
}

.left .h1{
  font-size: 22px;
  font-weight: 1000;
  letter-spacing: .5px;
}

.left .h2{
  margin-top: 4px;
  font-size: 13px;
  opacity: .9;
}

.right{
  display: flex;
  align-items: flex-start;
  gap: 16px;
}


.logo{
  height: 125px;
  width: auto;
  object-fit: contain;
  background: rgba(255,255,255,0.10);
  border-radius: 14px;
  padding: 8px;
}
</style>