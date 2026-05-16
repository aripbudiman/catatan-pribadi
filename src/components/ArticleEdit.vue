<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import type { Article, ArticleInput } from '../types';
import { Save, Eye, Edit3, List, Palette, Check, ChevronDown, Loader2 } from 'lucide-vue-next';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

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
const isUploading = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

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

const isThemeDropdownOpen = ref(false);
const themeDropdownRef = ref(null);

onClickOutside(themeDropdownRef, () => {
  isThemeDropdownOpen.value = false;
});

const currentThemeName = computed(() => {
  return codeThemes.find(t => t.id === selectedTheme.value)?.name || 'Select Theme';
});

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

const renderedContent = computed(() => {
  return md.render(content.value || '*No content yet*');
});

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (!file) continue;

      event.preventDefault();
      isUploading.value = true;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        const cursorState = {
          start: textareaRef.value?.selectionStart || 0,
          end: textareaRef.value?.selectionEnd || 0
        };
        
        const before = content.value.substring(0, cursorState.start);
        const after = content.value.substring(cursorState.end);
        
        // Insert base64 image
        content.value = before + `![pasted-image](${base64})` + after;
        isUploading.value = false;
      };
      
      reader.onerror = () => {
        console.error('Failed to read file');
        isUploading.value = false;
      };

      reader.readAsDataURL(file);
    }
  }
};

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
          <div class="flex-1 flex flex-col space-y-2 relative">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Content (Markdown)</label>
              <div v-if="isUploading" class="flex items-center gap-2 text-indigo-600 text-xs font-bold animate-pulse">
                <Loader2 class="w-3 h-3 animate-spin" />
                Processing image...
              </div>
            </div>
            <textarea
              ref="textareaRef"
              v-model="content"
              @paste="handlePaste"
              placeholder="# Start writing your documentation..."
              class="flex-1 w-full p-6 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed resize-none"
              required
            ></textarea>
            <div class="absolute bottom-4 right-6 text-[10px] text-zinc-400 font-medium">
              Pro tip: You can paste images directly here (Ctrl+V)
            </div>
          </div>
      </form>
      
      <div v-else class="flex-1 overflow-y-auto p-8 bg-white">
        <div class="max-w-4xl mx-auto">
          <div class="mb-8">
            <span class="text-xs font-bold text-indigo-600 uppercase tracking-widest">{{ category }}</span>
            <div class="flex items-center justify-between mt-2">
              <h1 class="text-4xl font-extrabold text-zinc-900">{{ title || 'Untitled Article' }}</h1>
              
              <div class="relative" ref="themeDropdownRef">
                <button 
                  @click="isThemeDropdownOpen = !isThemeDropdownOpen"
                  class="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-indigo-300 transition-all text-xs font-semibold text-zinc-600"
                >
                  <Palette class="w-3.5 h-3.5 text-zinc-400" />
                  <span>{{ currentThemeName }}</span>
                  <ChevronDown :class="['w-3.5 h-3.5 text-zinc-400 transition-transform', isThemeDropdownOpen ? 'rotate-180' : '']" />
                </button>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <div 
                    v-if="isThemeDropdownOpen"
                    class="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div class="p-1">
                      <button
                        v-for="theme in codeThemes"
                        :key="theme.id"
                        @click="selectedTheme = theme.id; isThemeDropdownOpen = false"
                        :class="[
                          'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors',
                          selectedTheme === theme.id ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-600 hover:bg-zinc-50'
                        ]"
                      >
                        {{ theme.name }}
                        <Check v-if="selectedTheme === theme.id" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
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

          <div class="markdown-body prose-custom" v-html="renderedContent"></div>
        </div>
      </div>
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
