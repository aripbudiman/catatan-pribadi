import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ArticleView } from './components/ArticleView';
import { ArticleEdit } from './components/ArticleEdit';
import { Article, ArticleInput } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';

const FIREBASE_URL = 'https://english-zone-2c406-default-rtdb.asia-southeast1.firebasedatabase.app/article';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
    checkWalletConnection();
  }, []);


  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
      }
    }
  };

  const handleConnectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error: any) {
        console.error('Failed to connect to MetaMask:', error);
        alert(`Failed to connect to MetaMask: ${error.message || 'Unknown error'}`);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this feature.');
    }
  };

  const fetchArticles = async () => {
    try {
      setError(null);
      const response = await fetch(`${FIREBASE_URL}.json`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('PERMISSION_DENIED');
        }
        throw new Error(`Firebase error ${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        setArticles([]);
        return;
      }

      const list: Article[] = Object.keys(data)
        .map((key) => ({ ...data[key], id: key }))
        .sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });

      setArticles(list);
      if (list.length > 0 && selectedId === null) {
        setSelectedId(list[0].id);
      }
    } catch (error: any) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: ArticleInput) => {
    try {
      const now = new Date().toISOString();
      if (isCreating) {
        const articleData = { ...data, category: data.category || 'General', created_at: now, updated_at: now };
        const response = await fetch(`${FIREBASE_URL}.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        });
        if (!response.ok) throw new Error(`Firebase error ${response.status}`);
        const result = await response.json();
        const newArticle: Article = { ...articleData, id: result.name };
        setArticles([newArticle, ...articles]);
        setSelectedId(newArticle.id);
        setIsCreating(false);
      } else if (selectedId) {
        const articleData = { ...data, category: data.category || 'General', updated_at: now };
        const response = await fetch(`${FIREBASE_URL}/${selectedId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        });
        if (!response.ok) throw new Error(`Firebase error ${response.status}`);
        const updated = await response.json();
        setArticles(articles.map((a) => (a.id === selectedId ? { ...a, ...updated, id: selectedId } : a)));
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
      const response = await fetch(`${FIREBASE_URL}/${selectedId}.json`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Firebase error ${response.status}`);
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
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
      />

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {error === 'PERMISSION_DENIED' ? (
            <motion.div
              key="error-permission"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex items-center justify-center p-8 bg-white z-50"
            >
              <div className="max-w-md w-full bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4 shadow-sm">
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-900">Permission Denied</h2>
                  <p className="mt-2 text-sm text-amber-700">
                    Your Firebase Realtime Database is currently locked. To fix this, you need to update your database rules to be public or provide a Secret.
                  </p>
                </div>
                <div className="bg-white/50 border border-amber-200 rounded-lg p-4 text-left">
                  <p className="text-[10px] font-mono text-amber-900 break-all leading-relaxed whitespace-pre">
                    {`{
  "rules": {
    "article": {
      ".read": "true",
      ".write": "true"
    },
    // ... your existing rules
  }
}`}
                  </p>
                </div>
                <p className="text-[10px] text-amber-600">
                  Update your <strong>Firebase Console</strong> rules to include the <code>article</code> path as shown above.
                </p>
                <button
                  onClick={fetchArticles}
                  className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Retry Connection
                </button>
              </div>
            </motion.div>
          ) : isCreating || isEditing ? (
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
