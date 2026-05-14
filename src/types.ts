export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export type ArticleInput = Pick<Article, 'title' | 'content' | 'category'>;

export interface ServerStatus {
  database: string;
  type: string;
  uri: string;
  auth_configured: boolean;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
