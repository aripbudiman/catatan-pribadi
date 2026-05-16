<script setup lang="ts">
import { ref } from 'vue';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { Loader2, Lock, Mail, User } from 'lucide-vue-next';

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const name = ref('');
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (!email.value || !password.value) return;
  if (!isLogin.value && !name.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    if (isLogin.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
      await updateProfile(userCredential.user, { displayName: name.value });
      // Force reload to get updated profile
      window.location.reload();
    }
  } catch (err: any) {
    console.error(err);
    error.value = err.message || 'Authentication failed';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100">
      <div>
        <div class="mx-auto h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
          <Lock class="h-8 w-8 text-indigo-600" />
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
          {{ isLogin ? 'Sign in to DevNotes' : 'Create your account' }}
        </h2>
        <p class="mt-2 text-center text-sm text-zinc-600">
          Or
          <button @click="isLogin = !isLogin; error = ''" class="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            {{ isLogin ? 'register a new account' : 'sign in to existing account' }}
          </button>
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div v-if="!isLogin">
            <label for="name" class="sr-only">Full Name</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User class="h-5 w-5 text-zinc-400" />
              </div>
              <input id="name" name="name" type="text" required v-model="name" class="appearance-none relative block w-full px-3 py-3 pl-11 border border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all shadow-sm" placeholder="Full Name" />
            </div>
          </div>
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail class="h-5 w-5 text-zinc-400" />
              </div>
              <input id="email-address" name="email" type="email" autocomplete="email" required v-model="email" class="appearance-none relative block w-full px-3 py-3 pl-11 border border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all shadow-sm" placeholder="Email address" />
            </div>
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-zinc-400" />
              </div>
              <input id="password" name="password" type="password" autocomplete="current-password" required v-model="password" class="appearance-none relative block w-full px-3 py-3 pl-11 border border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all shadow-sm" placeholder="Password" />
            </div>
          </div>
        </div>

        <div v-if="error" class="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center">
          {{ error }}
        </div>

        <div>
          <button type="submit" :disabled="loading" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed">
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin absolute left-4" />
            {{ isLogin ? 'Sign in' : 'Register' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
