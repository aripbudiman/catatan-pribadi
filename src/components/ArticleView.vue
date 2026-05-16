<script setup lang="ts">
import { computed } from 'vue';
import type { Article } from '../types';
import { Edit2, Trash2, Calendar, Tag, Clock } from 'lucide-vue-next';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

const props = defineProps<{
  article: Article;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

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
  return md.render(props.article.content || '');
});

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this article?')) {
    emit('delete');
  }
};
</script>

<template>
  <div class="flex-1 h-screen overflow-y-auto bg-white">
    <div class="max-w-4xl mx-auto px-8 py-12">
      <div class="flex items-start justify-between mb-8">
        <div class="space-y-4">
          <div class="flex items-center gap-4 text-xs font-medium text-zinc-400">
            <span class="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded text-zinc-600">
              <Tag class="w-3 h-3" />
              {{ article.category || 'General' }}
            </span>
            <span class="flex items-center gap-1.5">
              <Calendar class="w-3 h-3" />
              {{ formatDate(article.created_at) }}
            </span>
            <span class="flex items-center gap-1.5">
              <Clock class="w-3 h-3" />
              Updated {{ formatDate(article.updated_at) }}
            </span>
          </div>
          <h1 class="text-4xl font-extrabold text-zinc-900 tracking-tight">
            {{ article.title || 'Untitled Article' }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="emit('edit')"
            class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-indigo-600 transition-all"
            title="Edit Article"
          >
            <Edit2 class="w-5 h-5" />
          </button>
          <button
            @click="handleDelete"
            class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-all"
            title="Delete Article"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="markdown-body prose-custom" v-html="renderedContent"></div>
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
