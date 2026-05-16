<script setup lang="ts">
import { computed } from 'vue';
import type { Article } from '../types';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { Search, Plus, Book, Hash, ChevronRight, LogOut } from 'lucide-vue-next';

const props = defineProps<{
  articles: Article[];
  selectedId: string | null;
  searchQuery: string;
  user: User | null;
  readonly?: boolean;
}>();

const handleLogout = () => {
  auth.signOut();
};

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'new'): void;
  (e: 'update:searchQuery', query: string): void;
}>();

const categories = computed(() => {
  return Array.from(new Set(props.articles.map((a) => a.category || 'General')));
});

const filteredArticles = computed(() => {
  return props.articles.filter((a) => {
    const title = a.title || '';
    const category = a.category || '';
    const query = props.searchQuery.toLowerCase();
    return title.toLowerCase().includes(query) || category.toLowerCase().includes(query);
  });
});
</script>

<template>
  <div class="w-80 h-screen border-r border-zinc-200 bg-zinc-50 flex flex-col overflow-hidden">
    <div class="p-4 border-b border-zinc-200">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2 font-bold text-xl text-zinc-800">
          <Book class="w-6 h-6 text-indigo-600" />
          <span>DevNotes</span>
        </div>
        <button
          v-if="!readonly"
          @click="emit('new')"
          class="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          title="New Article"
        >
          <Plus class="w-5 h-5" />
        </button>
      </div>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search notes..."
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          class="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-6">
      <template v-for="category in categories" :key="category">
        <div v-if="filteredArticles.filter(a => a.category === category).length > 0" class="space-y-1">
          <div class="px-3 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Hash class="w-3 h-3" />
            {{ category }}
          </div>
          <button
            v-for="article in filteredArticles.filter(a => a.category === category)"
            :key="article.id"
            @click="emit('select', article.id)"
            :class="[
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-all group flex items-center justify-between',
              selectedId === article.id
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            ]"
          >
            <span class="truncate">{{ article.title }}</span>
            <ChevronRight :class="[
              'w-4 h-4 transition-transform',
              selectedId === article.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
            ]" />
          </button>
        </div>
      </template>

      <div v-if="filteredArticles.length === 0" class="text-center py-8 px-4">
        <p class="text-sm text-zinc-400 italic">No articles found</p>
      </div>
    </div>

    <div class="p-4 border-t border-zinc-200 bg-zinc-100/50 space-y-3">
      <div v-if="user" class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
            {{ user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-zinc-700 truncate">{{ user.displayName || 'User' }}</p>
            <p class="text-[10px] text-zinc-500 truncate">{{ user.email }}</p>
          </div>
        </div>
        <button 
          @click="handleLogout"
          class="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
      <div v-else class="flex justify-center">
        <router-link
          to="/login"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-900 transition-all shadow-sm"
        >
          Login Admin
        </router-link>
      </div>
    </div>
  </div>
</template>
