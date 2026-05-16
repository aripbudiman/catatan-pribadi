<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import ArticleView from '../components/ArticleView.vue';
import type { Article } from '../types';
import { Loader2, BookOpen, AlertCircle } from 'lucide-vue-next';

const FIREBASE_URL = 'https://english-zone-2c406-default-rtdb.asia-southeast1.firebasedatabase.app/article';

const articles = ref<Article[]>([]);
const selectedId = ref<string | null>(null);
const loading = ref(true);
const searchQuery = ref('');
const error = ref<string | null>(null);

onMounted(() => {
  fetchArticles();
});

const fetchArticles = async () => {
  try {
    error.value = null;
    loading.value = true;
    const response = await fetch(`${FIREBASE_URL}.json`);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        error.value = 'PERMISSION_DENIED';
      }
      throw new Error(`Firebase error ${response.status}`);
    }

    const data = await response.json();

    if (!data) {
      articles.value = [];
      return;
    }

    const list: Article[] = Object.keys(data)
      .map((key) => ({ ...data[key], id: key }))
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      });

    articles.value = list;
    if (list.length > 0 && selectedId.value === null) {
      selectedId.value = list[0].id;
    }
  } catch (err: any) {
    console.error('Failed to fetch articles:', err);
  } finally {
    loading.value = false;
  }
};

const selectedArticle = computed(() => articles.value.find((a) => a.id === selectedId.value));

const selectArticle = (id: string) => {
  selectedId.value = id;
};

</script>

<template>
  <div class="flex h-screen bg-zinc-50 overflow-hidden">
    <Sidebar
      :articles="articles"
      :selectedId="selectedId"
      :searchQuery="searchQuery"
      :user="null"
      :readonly="true"
      @update:searchQuery="searchQuery = $event"
      @select="selectArticle"
    />

    <main class="flex-1 relative overflow-hidden">
      <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center bg-white z-40 gap-4">
        <Loader2 class="w-8 h-8 text-indigo-600 animate-spin" />
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="error === 'PERMISSION_DENIED'" key="error-permission" class="absolute inset-0 flex items-center justify-center p-8 bg-white z-50">
          <div class="max-w-md w-full bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4 shadow-sm">
            <div class="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle class="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-amber-900">Permission Denied</h2>
              <p class="mt-2 text-sm text-amber-700">
                You do not have permission to access these articles. The database is locked for public reading.
              </p>
            </div>
            <button
              @click="fetchArticles"
              class="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>

        <div v-else-if="selectedArticle" :key="selectedArticle.id" class="h-full">
          <ArticleView
            :article="selectedArticle"
            :readonly="true"
          />
        </div>

        <div v-else key="empty" class="h-full flex flex-col items-center justify-center text-center p-8">
          <div class="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
            <BookOpen class="w-10 h-10 text-indigo-600" />
          </div>
          <h2 class="text-2xl font-bold text-zinc-900 mb-2">No articles found</h2>
          <p class="text-zinc-500 max-w-xs mb-8">
            The documentation is currently empty or cannot be loaded.
          </p>
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
