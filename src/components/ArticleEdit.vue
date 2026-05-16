<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Article, ArticleInput } from '../types';
import { Save, Eye, Edit3, List } from 'lucide-vue-next';
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

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const md = new MarkdownIt({
  highlight: function (str, lang) {
    const highlighted = (lang && hljs.getLanguage(lang))
      ? hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      : md.utils.escapeHtml(str);
      
    return `<div class="code-block-wrapper group">
              <button class="copy-code-button opacity-0 group-hover:opacity-100 transition-opacity" title="Copy code">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <pre class="hljs"><code>${highlighted}</code></pre>
            </div>`;
  }
});

// Add IDs to headings for anchor links
md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx];
  const nextToken = tokens[idx + 1];
  if (nextToken && nextToken.type === 'inline') {
    const text = nextToken.content;
    const id = slugify(text);
    token.attrSet('id', id);
  }
  return self.renderToken(tokens, idx, options);
};

const toc = computed(() => {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = (content.value || '').split('\n');
  
  let inCodeBlock = false;
  lines.forEach(line => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    
    if (!inCodeBlock) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[#*`\[\]()]/g, '').trim();
        const id = slugify(text);
        headings.push({ level, text, id });
      }
    }
  });
  
  return headings;
});

const handleCopyClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const button = target.closest('.copy-code-button') as HTMLButtonElement;
  
  if (button) {
    const wrapper = button.closest('.code-block-wrapper');
    const code = wrapper?.querySelector('code')?.textContent || '';
    
    navigator.clipboard.writeText(code).then(() => {
      const originalInner = button.innerHTML;
      button.innerHTML = '<span class="text-[10px] font-bold uppercase tracking-wider">Copied!</span>';
      button.classList.add('bg-green-500/20', 'border-green-500/50', 'text-green-400');
      
      setTimeout(() => {
        button.innerHTML = originalInner;
        button.classList.remove('bg-green-500/20', 'border-green-500/50', 'text-green-400');
      }, 2000);
    });
  }
};

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

          <div v-if="toc.length > 0" class="mb-12 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div class="flex items-center gap-2 mb-4 text-zinc-900">
              <List class="w-4 h-4 text-indigo-500" />
              <h2 class="text-sm font-bold uppercase tracking-wider">Daftar Isi</h2>
            </div>
            <nav class="relative pl-4 border-l-2 border-zinc-100 space-y-1">
              <a
                v-for="item in toc"
                :key="item.id"
                :href="'#' + item.id"
                class="group flex items-center gap-3 text-zinc-500 hover:text-indigo-600 transition-all text-sm py-1.5"
                :style="{ paddingLeft: `${(item.level - 1) * 1.25}rem` }"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-zinc-200 group-hover:bg-indigo-400 transition-colors shrink-0"></span>
                <span class="truncate">{{ item.text }}</span>
              </a>
            </nav>
          </div>

          <div class="markdown-body prose-custom" v-html="renderedContent" @click="handleCopyClick"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-1 {
  scroll-behavior: smooth;
}
.prose-custom :deep(.code-block-wrapper) {
  position: relative;
  margin: 1.5rem 0;
}
.prose-custom :deep(.copy-code-button) {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}
.prose-custom :deep(.copy-code-button:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}
.prose-custom :deep(pre.hljs) {
  margin: 0 !important;
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
