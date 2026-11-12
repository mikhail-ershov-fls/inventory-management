<script setup>
import { computed } from 'vue'
import { jobs, technicians } from '../data'
const open = computed(() => jobs.filter(j => j.status !== 'Completed').length)
const overdue = computed(() => jobs.filter(j => j.status === 'Overdue').length)
const activeTechs = computed(() => technicians.filter(t => t.active).length)
const revenue = computed(() => jobs.filter(j => j.status === 'Completed').reduce((s, j) => s + j.value, 0))
const today = computed(() => jobs.filter(j => j.date === '2026-11-12'))
</script>

<template>
  <h1>Dashboard</h1>
  <div class="kpis">
    <div class="kpi"><div class="num">{{ open }}</div><div class="lbl">Open jobs</div></div>
    <div class="kpi"><div class="num" style="color:#dc2626">{{ overdue }}</div><div class="lbl">Overdue</div></div>
    <div class="kpi"><div class="num">{{ activeTechs }}</div><div class="lbl">Active technicians</div></div>
    <div class="kpi"><div class="num">${{ revenue.toLocaleString() }}</div><div class="lbl">Completed revenue</div></div>
  </div>
  <div class="box">
    <h3 style="margin-top:0">Today's jobs</h3>
    <table>
      <tr><th>Job</th><th>Customer</th><th>Type</th><th>Status</th></tr>
      <tr v-for="j in today" :key="j.id">
        <td>{{ j.id }}</td><td>{{ j.customer }}</td><td>{{ j.type }}</td>
        <td><span :class="['status', j.status]">{{ j.status }}</span></td>
      </tr>
    </table>
  </div>
</template>
