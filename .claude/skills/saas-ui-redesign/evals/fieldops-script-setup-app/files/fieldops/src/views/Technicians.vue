<script setup>
import { technicians } from '../data'
</script>

<template>
  <h1>Technicians</h1>
  <div style="display:flex; flex-wrap:wrap; gap:16px">
    <div v-for="t in technicians" :key="t.id" class="box" style="width:260px; margin:0">
      <div style="font-weight:bold; font-size:17px">{{ t.name }}</div>
      <div style="color:#666; margin:4px 0 10px">{{ t.region }} region</div>
      <div>Skills: {{ t.skills.join(', ') }}</div>
      <div style="margin-top:8px">Jobs today: <b>{{ t.jobsToday }}</b></div>
      <div :style="{ marginTop: '8px', color: t.active ? 'green' : '#999' }">{{ t.active ? 'Active' : 'Off duty' }}</div>
    </div>
  </div>
</template>
