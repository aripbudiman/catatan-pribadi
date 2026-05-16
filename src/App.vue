<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import ArticleView from './components/ArticleView.vue';
import ArticleEdit from './components/ArticleEdit.vue';
import type { Article, ArticleInput } from './types';
import { Loader2, BookOpen, AlertCircle } from 'lucide-vue-next';

const FIREBASE_URL = 'https://english-zone-2c406-default-rtdb.asia-southeast1.firebasedatabase.app/article';

const articles = ref<Article[]>([]);
const selectedId = ref<string | null>(null);
const isEditing = ref(false);
const isCreating = ref(false);
const loading = ref(true);
const searchQuery = ref('');
const walletAddress = ref<string | null>(null);
const error = ref<string | null>(null);

const fetchArticles = async () => {
  try {
    error.value = null;
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

const checkWalletConnection = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        walletAddress.value = accounts[0];
      }
    } catch (err) {
      console.error('Failed to check wallet connection:', err);
    }
  }
};

onMounted(() => {
  fetchArticles();
  checkWalletConnection();
});

const handleConnectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        walletAddress.value = accounts[0];
      }
    } catch (err: any) {
      console.error('Failed to connect to MetaMask:', err);
      alert(`Failed to connect to MetaMask: ${err.message || 'Unknown error'}`);
    }
  } else {
    alert('MetaMask is not installed. Please install it to use this feature.');
  }
};

const handleSave = async (data: ArticleInput) => {
  try {
    const now = new Date().toISOString();
    if (isCreating.value) {
      const articleData = { ...data, category: data.category || 'General', created_at: now, updated_at: now };
      const response = await fetch(`${FIREBASE_URL}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });
      if (!response.ok) throw new Error(`Firebase error ${response.status}`);
      const result = await response.json();
      const newArticle: Article = { ...articleData, id: result.name };
      articles.value = [newArticle, ...articles.value];
      selectedId.value = newArticle.id;
      isCreating.value = false;
    } else if (selectedId.value) {
      const articleData = { ...data, category: data.category || 'General', updated_at: now };
      const response = await fetch(`${FIREBASE_URL}/${selectedId.value}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });
      if (!response.ok) throw new Error(`Firebase error ${response.status}`);
      const updated = await response.json();
      articles.value = articles.value.map((a) => (a.id === selectedId.value ? { ...a, ...updated, id: selectedId.value } : a));
      isEditing.value = false;
    }
  } catch (err: any) {
    console.error('Failed to save article:', err);
    alert(`Failed to save article: ${err.message}`);
  }
};

const handleDelete = async () => {
  if (!selectedId.value) return;
  try {
    const response = await fetch(`${FIREBASE_URL}/${selectedId.value}.json`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Firebase error ${response.status}`);
    const remaining = articles.value.filter((a) => a.id !== selectedId.value);
    articles.value = remaining;
    selectedId.value = remaining.length > 0 ? remaining[0].id : null;
  } catch (err) {
    console.error('Failed to delete article:', err);
    alert('Failed to delete article.');
  }
};

const selectedArticle = computed(() => articles.value.find((a) => a.id === selectedId.value));

const selectArticle = (id: string) => {
  selectedId.value = id;
  isEditing.value = false;
  isCreating.value = false;
};

const startCreating = () => {
  isCreating.value = true;
  isEditing.value = false;
  selectedId.value = null;
};

const cancelEditing = () => {
  isEditing.value = false;
  isCreating.value = false;
  if (isCreating.value && articles.value.length > 0) {
    selectedId.value = articles.value[0].id;
  }
};

</script>

<template>
  <div v-if="loading" class="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 gap-4">
    <Loader2 class="w-8 h-8 text-indigo-600 animate-spin" />
    <p class="text-sm font-medium text-zinc-500">Loading your documentation...</p>
  </div>

  <div v-else class="flex h-screen bg-zinc-50 overflow-hidden">
    <Sidebar
      :articles="articles"
      :selectedId="selectedId"
      :searchQuery="searchQuery"
      :walletAddress="walletAddress"
      @update:searchQuery="searchQuery = $event"
      @select="selectArticle"
      @new="startCreating"
      @connectWallet="handleConnectWallet"
    />

    <main class="flex-1 relative overflow-hidden">
      <Transition name="fade" mode="out-in">
        <div v-if="error === 'PERMISSION_DENIED'" key="error-permission" class="absolute inset-0 flex items-center justify-center p-8 bg-white z-50">
          <div class="max-w-md w-full bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4 shadow-sm">
            <div class="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle class="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-amber-900">Permission Denied</h2>
              <p class="mt-2 text-sm text-amber-700">
                Your Firebase Realtime Database is currently locked. To fix this, you need to update your database rules to be public or provide a Secret.
              </p>
            </div>
            <div class="bg-white/50 border border-amber-200 rounded-lg p-4 text-left">
              <p class="text-[10px] font-mono text-amber-900 break-all leading-relaxed whitespace-pre">
{
  "rules": {
    "article": {
      ".read": "true",
      ".write": "true"
    }
  }
}</p>
            </div>
            <p class="text-[10px] text-amber-600">
              Update your <strong>Firebase Console</strong> rules to include the <code>article</code> path as shown above.
            </p>
            <button
              @click="fetchArticles"
              class="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>

        <div v-else-if="isCreating || isEditing" key="editor" class="h-full">
          <ArticleEdit
            :article="isEditing ? selectedArticle : undefined"
            @save="handleSave"
            @cancel="cancelEditing"
          />
        </div>

        <div v-else-if="selectedArticle" :key="selectedArticle.id" class="h-full">
          <ArticleView
            :article="selectedArticle"
            @edit="isEditing = true"
            @delete="handleDelete"
          />
        </div>

        <div v-else key="empty" class="h-full flex flex-col items-center justify-center text-center p-8">
          <div class="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
            <BookOpen class="w-10 h-10 text-indigo-600" />
          </div>
          <h2 class="text-2xl font-bold text-zinc-900 mb-2">No articles yet</h2>
          <p class="text-zinc-500 max-w-xs mb-8">
            Start building your knowledge base by creating your first coding note.
          </p>
          <button
            @click="startCreating"
            class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Create First Note
          </button>
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
