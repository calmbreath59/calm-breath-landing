-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  user_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('problem', 'result', 'suggestion')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all feedbacks"
  ON public.feedbacks
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Users can only view their own feedbacks
CREATE POLICY "Users can view their own feedbacks"
  ON public.feedbacks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can insert feedback (including anonymous)
CREATE POLICY "Anyone can insert feedback"
  ON public.feedbacks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();