-- Add policy to block anonymous/public access to profiles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add DELETE policy for admins on profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin(auth.uid()));

-- Create email_verification_codes table if not exists (to store verification codes)
-- Note: table already exists based on schema

-- Add index for faster verification code lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id ON public.email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON public.email_verification_codes(expires_at);