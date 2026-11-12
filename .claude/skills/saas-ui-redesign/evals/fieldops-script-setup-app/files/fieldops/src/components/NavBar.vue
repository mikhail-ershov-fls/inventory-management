<script setup>
import { ref } from 'vue'
const search = ref('')
const notifications = ref(3)
</script>

<template>
  <div class="navbar">
    <div class="brand">FieldOps</div>
    <router-link to="/">Dashboard</router-link>
    <router-link to="/jobs">Jobs</router-link>
    <router-link to="/technicians">Technicians</router-link>
    <router-link to="/settings">Settings</router-link>
    <input v-model="search" class="search" placeholder="Search jobs..." />
    <button class="bell" @click="notifications = 0">Alerts ({{ notifications }})</button>
    <div class="user">Sam Lee</div>
  </div>
</template>

<style>
.navbar { background: #1e3a8a; color: white; display: flex; align-items: center; padding: 14px 18px; }
.navbar a { color: #c7d2fe; margin-left: 22px; text-decoration: none; font-size: 15px; }
.navbar a.router-link-exact-active { color: white; font-weight: bold; text-decoration: underline; }
.brand { font-size: 21px; font-weight: bold; margin-right: 30px; }
.search { margin-left: auto; padding: 5px 9px; border-radius: 3px; border: none; width: 220px; }
.bell { margin-left: 12px; background: #f59e0b; border: none; padding: 6px 10px; color: #111; cursor: pointer; }
.user { margin-left: 15px; font-size: 14px; }
</style>
