<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Article, ArticleInput } from '../types';
import { Save, Eye, Edit3 } from 'lucide-vue-next';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

const props = defineProps<{
  article?: Article;
}>();

const emit = defineEmits<{
  (e: 'save', data: ArticleInput): void;
  (e: 'cancel'): void;
}>();

const title = ref(props.article?.title || '');
const content = ref(props.article?.content || '');
const category = ref(props.article?.category || 'General');
const preview = ref(false);

const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

const renderedContent = computed(() => {
  return md.render(content.value || '*No content yet*');
});

const handleSubmit = (e?: Event) => {
  if (e) e.preventDefault();
  if (!title.value || !content.value) return;
  emit('save', { title: title.value, content: content.value, category: category.value });
};
</script>

<template>
  <div class="flex-1 h-screen flex flex-col bg-white">
    <div class="px-8 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-bold text-zinc-800">
          {{ article ? 'Edit Article' : 'New Article' }}
        </h2>
        <div class="flex bg-zinc-200 p-1 rounded-lg">
          <button
            @click="preview = false"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
              !preview ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            ]"
          >
            <Edit3 class="w-3.5 h-3.5" />
            Editor
          </button>
          <button
            @click="preview = true"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
              preview ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            ]"
          >
            <Eye class="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
        >
          <Save class="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-hidden flex">
      <form v-if="!preview" class="flex-1 flex flex-col p-8 gap-6 overflow-y-auto" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
            <input
              type="text"
              v-model="title"
              placeholder="e.g. Vue 3 Guide"
              class="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg font-semibold"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
            <input
              type="text"
              v-model="category"
              placeholder="e.g. Frontend, Backend, Tips"
              class="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
        <div class="flex-1 flex flex-col space-y-2">
          <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Content (Markdown)</label>
          <textarea
            v-model="content"
            placeholder="# Start writing your documentation..."
            class="flex-1 w-full p-6 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed resize-none"
            required
          ></textarea>
        </div>
      </form>
      
      <div v-else class="flex-1 overflow-y-auto p-8 bg-white">
        <div class="max-w-4xl mx-auto">
          <div class="mb-8">
            <span class="text-xs font-bold text-indigo-600 uppercase tracking-widest">{{ category }}</span>
            <h1 class="text-4xl font-extrabold text-zinc-900 mt-2">{{ title || 'Untitled Article' }}</h1>
          </div>
          <div class="markdown-body prose-custom" v-html="renderedContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose-custom :deep(pre.hljs) {
  margin: 1.5rem 0;
  padding: 1.5rem;
  border-radius: 0.75rem;
  overflow: auto;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  border: 1px solid #27272a;
  background-color: #27272a;
  font-size: 0.9rem;
  line-height: 1.6;
}
.prose-custom :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
