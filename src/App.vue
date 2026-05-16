<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Loader2 } from 'lucide-vue-next';

const authLoading = ref(true);

onMounted(() => {
  onAuthStateChanged(auth, () => {
    authLoading.value = false;
  });
});
</script>

<template>
  <div v-if="authLoading" class="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 gap-4">
    <Loader2 class="w-8 h-8 text-indigo-600 animate-spin" />
    <p class="text-sm font-medium text-zinc-500">Initializing App...</p>
  </div>

  <router-view v-else></router-view>
</template>
