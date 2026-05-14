import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ArticleView } from './components/ArticleView';
import { ArticleEdit } from './components/ArticleEdit';
import { Article, ArticleInput, ServerStatus } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
    checkWalletConnection();
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

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
      const response = await fetch('/api/articles');
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('PERMISSION_DENIED');
        }
        throw new Error(data.error || 'Failed to fetch articles');
      }

      if (Array.isArray(data)) {
        setArticles(data);
        if (data.length > 0 && selectedId === null) {
          setSelectedId(data[0].id);
        }
      } else {
        console.error('Expected array of articles, got:', data);
        setArticles([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch articles:', error);
      // Don't clear articles if we already have some, but handle empty state
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
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        status={status}
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
