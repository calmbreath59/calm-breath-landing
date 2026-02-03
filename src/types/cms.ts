export interface Category {
  id: string;
  name: string;
  name_translations: Record<string, string> | null;
  description: string | null;
  description_translations: Record<string, string> | null;
  type: "video" | "audio" | "guide";
  icon: string | null;
  sort_order: number | null;
  is_visible: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  category_id: string;
  title: string;
  title_translations: Record<string, string> | null;
  description: string | null;
  description_translations: Record<string, string> | null;
  content: string | null;
  content_translations: Record<string, string> | null;
  type: "video" | "audio" | "guide";
  file_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  read_time: string | null;
  sort_order: number | null;
  is_visible: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  media_item_id: string;
  user_id: string;
  content: string;
  is_visible: boolean | null;
  is_hidden_by_admin: boolean | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
}

export interface CommentReport {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed" | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  comment?: Comment;
  reporter?: {
    full_name: string | null;
    email: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: "comment_hidden" | "comment_deleted" | "account_banned" | "report_reviewed";
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  is_read: boolean | null;
  created_at: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  type: "video" | "audio" | "guide";
  icon?: string;
  is_visible: boolean;
}

export interface MediaItemFormData {
  title: string;
  description?: string;
  content?: string;
  type: "video" | "audio" | "guide";
  file_url?: string;
  thumbnail_url?: string;
  duration?: string;
  read_time?: string;
  is_visible: boolean;
}
