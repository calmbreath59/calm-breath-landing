-- Create ban appeals table
CREATE TABLE public.ban_appeals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ban_appeals ENABLE ROW LEVEL SECURITY;

-- Users can create appeals (even if banned, they need to be able to submit)
CREATE POLICY "Users can create own appeals"
ON public.ban_appeals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view own appeals
CREATE POLICY "Users can view own appeals"
ON public.ban_appeals
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all appeals
CREATE POLICY "Admins can manage appeals"
ON public.ban_appeals
FOR ALL
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_ban_appeals_updated_at
BEFORE UPDATE ON public.ban_appeals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();