<script setup>
import { ref, computed } from 'vue'
import { jobs, technicians } from '../data'
const statusFilter = ref('All')
const techName = id => technicians.find(t => t.id === id)?.name ?? '—'
const filtered = computed(() => statusFilter.value === 'All' ? jobs : jobs.filter(j => j.status === statusFilter.value))
</script>

<template>
  <h1>Jobs</h1>
  <div style="margin-bottom: 15px">
    Status:
    <select v-model="statusFilter">
      <option>All</option><option>Scheduled</option><option>In progress</option><option>Completed</option><option>Overdue</option>
    </select>
    <button class="primary" style="float:right">+ New job</button>
  </div>
  <div class="box">
    <table>
      <tr><th>Job</th><th>Customer</th><th>Type</th><th>Technician</th><th>Date</th><th>Value</th><th>Status</th></tr>
      <tr v-for="j in filtered" :key="j.id">
        <td>{{ j.id }}</td><td>{{ j.customer }}</td><td>{{ j.type }}</td><td>{{ techName(j.tech) }}</td>
        <td>{{ j.date }}</td><td>${{ j.value }}</td>
        <td><span :class="['status', j.status]">{{ j.status }}</span></td>
      </tr>
    </table>
    <p v-if="!filtered.length">No jobs match.</p>
  </div>
</template>
