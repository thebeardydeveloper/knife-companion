import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type AnnouncementType = 'update' | 'event' | 'feature' | 'news';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  post_id: string | null;
  news_id: string | null;
  published_at: string | null;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  body_html: string;
  cover_url: string | null;
  published_at: string | null;
  created_at: string;
}
