<script setup>
import { ref } from 'vue'
const company = ref('FieldOps Services LLC')
const notifyEmail = ref(true)
const notifySms = ref(false)
const saved = ref(false)
const save = () => { saved.value = true; setTimeout(() => (saved.value = false), 2000) }
</script>

<template>
  <h1>Settings</h1>
  <div class="box" style="max-width:520px">
    <label>Company name<br><input v-model="company" style="width:100%; padding:6px; margin:6px 0 16px" /></label>
    <div><label><input type="checkbox" v-model="notifyEmail" /> Email notifications</label></div>
    <div style="margin:8px 0 18px"><label><input type="checkbox" v-model="notifySms" /> SMS notifications</label></div>
    <button class="primary" @click="save">Save</button>
    <span v-if="saved" style="margin-left:10px; color:green">Saved</span>
  </div>
</template>
