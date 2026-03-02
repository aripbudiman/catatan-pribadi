import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ArticleView } from './components/ArticleView';
import { ArticleEdit } from './components/ArticleEdit';
import { Article, ArticleInput } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, BookOpen } from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();
      if (Array.isArray(data)) {
        setArticles(data);
        if (data.length > 0 && selectedId === null) {
          setSelectedId(data[0].id);
        }
      } else {
        console.error('Expected array of articles, got:', data);
        setArticles([]);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: ArticleInput) => {
    try {
      if (isCreating) {
        const response = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to create article');
        
        setArticles([result, ...articles]);
        setSelectedId(result.id);
        setIsCreating(false);
      } else if (selectedId) {
        const response = await fetch(`/api/articles/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update article');
        
        setArticles(articles.map((a) => (a.id === selectedId ? result : a)));
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Failed to save article:', error);
      alert(`Failed to save article: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      const response = await fetch(`/api/articles/${selectedId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete article');
      const remaining = articles.filter((a) => a.id !== selectedId);
      setArticles(remaining);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Failed to delete article.');
    }
  };

  const selectedArticle = articles.find((a) => a.id === selectedId);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-zinc-500">Loading your documentation...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar
        articles={articles}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setIsEditing(false);
          setIsCreating(false);
        }}
        onNew={() => {
          setIsCreating(true);
          setIsEditing(false);
          setSelectedId(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {isCreating || isEditing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <ArticleEdit
                article={isEditing ? selectedArticle : undefined}
                onSave={handleSave}
                onCancel={() => {
                  setIsEditing(false);
                  setIsCreating(false);
                  if (isCreating && articles.length > 0) {
                    setSelectedId(articles[0].id);
                  }
                }}
              />
            </motion.div>
          ) : selectedArticle ? (
            <motion.div
              key={selectedArticle.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full"
            >
              <ArticleView
                article={selectedArticle}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDelete}
              />
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">No articles yet</h2>
              <p className="text-zinc-500 max-w-xs mb-8">
                Start building your knowledge base by creating your first coding note.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                Create First Note
              </button>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
