-- Add a flexible website content store so admins can edit public site sections.
CREATE TABLE IF NOT EXISTS public.website_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read website content"
ON public.website_content
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage website content"
ON public.website_content
FOR ALL
USING (get_user_role(auth.uid()) IN ('admin_i', 'admin_ii', 'admin_iii'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin_i', 'admin_ii', 'admin_iii'));

CREATE TRIGGER update_website_content_updated_at
BEFORE UPDATE ON public.website_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure MS Clash appears on the programs page with the requested overview.
INSERT INTO public.programs (name, website, description)
VALUES (
  'MS Clash',
  'https://supercell.com/en/games/clashroyale/',
  'MS Clash is a competitive, strategy-focused Clash Royale program designed to build critical thinking, teamwork, and decision-making skills in high school students. Participants learn advanced gameplay concepts, analyze real match scenarios, and collaborate with peers to refine tactics in a supportive, structured environment. The program blends game-based learning with enrichment activities that foster communication, adaptability, and strategic planning. Whether students are new to Clash Royale or experienced players, MS Clash provides a fun and academically grounded space to grow.'
)
ON CONFLICT (name)
DO UPDATE SET
  website = EXCLUDED.website,
  description = EXCLUDED.description,
  updated_at = NOW();
