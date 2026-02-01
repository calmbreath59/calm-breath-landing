-- Migration para tabela de comentários
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_hidden BOOLEAN DEFAULT FALSE,
  hidden_at TIMESTAMP WITH TIME ZONE,
  hidden_by UUID REFERENCES auth.users(id),
  hide_reason TEXT
);

-- Índices e política básica de RLS
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visible comments" ON public.comments FOR SELECT USING (NOT is_hidden OR auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can moderate comments" ON public.comments FOR UPDATE, DELETE USING (public.is_admin(auth.uid()));
