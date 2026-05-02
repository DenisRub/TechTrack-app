<template>
  <div class="equipment-view">
    <div class="sidebar">
      <EquipmentTree />
    </div>
    <div class="main">
      <EquipmentList />
    </div>
  </div>
</template>

<script setup lang="ts">
import EquipmentTree from '../components/EquipmentTree.vue';
import EquipmentList from '../components/EquipmentList.vue';
</script>

<style scoped>
.equipment-view { display: flex; gap: 20px; }
.sidebar { width: 350px; }
.main { flex: 1; }
</style>