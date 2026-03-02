export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export type ArticleInput = Pick<Article, 'title' | 'content' | 'category'>;
