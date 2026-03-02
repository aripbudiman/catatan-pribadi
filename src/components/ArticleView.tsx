import React from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Article } from '../types';
import { Edit2, Trash2, Calendar, Tag, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ArticleViewProps {
  article: Article;
  onEdit: () => void;
  onDelete: () => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
              <span className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded text-zinc-600">
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {format(new Date(article.created_at), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Updated {format(new Date(article.updated_at), 'MMM d, yyyy')}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
              {article.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-indigo-600 transition-all"
              title="Edit Article"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this article?')) {
                  onDelete();
                }
              }}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-600 transition-all"
              title="Delete Article"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="markdown-body prose-custom">
          <Markdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="my-6 rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                    <div className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 font-mono flex justify-between items-center">
                      <span>{match[1]}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(String(children))}
                        className="hover:text-white transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {article.content}
          </Markdown>
        </div>
      </div>
    </div>
  );
};
