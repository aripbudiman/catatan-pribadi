import React from 'react';
import { Article } from '../types';
import { Search, Plus, Book, Hash, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  articles: Article[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  articles,
  selectedId,
  onSelect,
  onNew,
  searchQuery,
  onSearchChange,
}) => {
  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const filteredArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-screen border-r border-zinc-200 bg-zinc-50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-xl text-zinc-800">
            <Book className="w-6 h-6 text-indigo-600" />
            <span>DevNotes</span>
          </div>
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            title="New Article"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {categories.map((category) => {
          const categoryArticles = filteredArticles.filter((a) => a.category === category);
          if (categoryArticles.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <div className="px-3 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                {category}
              </div>
              {categoryArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => onSelect(article.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all group flex items-center justify-between",
                    selectedId === article.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <span className="truncate">{article.title}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    selectedId === article.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  )} />
                </button>
              ))}
            </div>
          );
        })}

        {filteredArticles.length === 0 && (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-zinc-400 italic">No articles found</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-200 bg-zinc-100/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            AB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-700 truncate">Arif Budiman</p>
            <p className="text-[10px] text-zinc-500 truncate">muhamadarifbudiman22@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
