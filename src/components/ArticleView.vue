<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Article } from '../types';
import { Edit2, Trash2, Calendar, Tag, Clock, List, Palette } from 'lucide-vue-next';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const props = defineProps<{
  article: Article;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const codeThemes = [
  { name: 'VS 2015', id: 'vs2015' },
  { name: 'GitHub Dark', id: 'github-dark' },
  { name: 'Monokai', id: 'monokai-sublime' },
  { name: 'Atom One Dark', id: 'atom-one-dark' },
  { name: 'Nord', id: 'nord' },
  { name: 'Tokyo Night Dark', id: 'tokyo-night-dark' },
];

const selectedTheme = ref(localStorage.getItem('hljs-theme') || 'vs2015');

watch(selectedTheme, (theme) => {
  localStorage.setItem('hljs-theme', theme);
  let link = document.getElementById('hljs-theme-link') as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.id = 'hljs-theme-link';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme}.min.css`;
}, { immediate: true });

const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch (__) { }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
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

const renderedContent = computed(() => {
  return md.render(props.article.content || '');
});

const toc = computed(() => {
  const headings: { level: number; text: string; id: string }[] = [];
  // Only look for headings in the markdown content
  const lines = (props.article.content || '').split('\n');

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
        <div class="flex flex-col items-end gap-4">
          <div v-if="!readonly" class="flex items-center gap-2">
            <button @click="emit('edit')"
              class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-indigo-600 transition-all"
              title="Edit Article">
              <Edit2 class="w-5 h-5" />
            </button>
            <button @click="handleDelete"
              class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-all"
              title="Delete Article">
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
          
          <div class="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm">
            <Palette class="w-3.5 h-3.5 text-zinc-400" />
            <select 
              v-model="selectedTheme" 
              class="text-xs font-semibold text-zinc-600 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option v-for="theme in codeThemes" :key="theme.id" :value="theme.id">
                {{ theme.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="toc.length > 0" class="mb-12 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
        <div class="flex items-center gap-2 mb-4 text-zinc-900">
          <List class="w-4 h-4 text-indigo-500" />
          <h2 class="text-sm font-bold uppercase tracking-wider">Daftar Isi</h2>
        </div>
        <nav class="relative pl-4 border-l-2 border-zinc-100 space-y-1">
          <a v-for="item in toc" :key="item.id" :href="'#' + item.id"
            class="group flex items-center gap-3 text-zinc-500 hover:text-indigo-600 transition-all text-sm py-1.5"
            :style="{ paddingLeft: `${(item.level - 1) * 1.25}rem` }">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-200 group-hover:bg-indigo-400 transition-colors shrink-0"></span>
            <span class="truncate">{{ item.text }}</span>
          </a>
        </nav>
      </div>

      <div class="markdown-body prose-custom" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<style scoped>
.flex-1 {
  scroll-behavior: smooth;
}

.prose-custom :deep(pre.hljs) {
  margin: 1rem 0;
  padding: 1.5rem;
  border-radius: 0.75rem;
  overflow: auto;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.9rem;
  line-height: 1.6;
}

.prose-custom :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
