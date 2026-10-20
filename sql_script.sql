CREATE TABLE IF NOT EXISTS public.monitoring_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitoring_id UUID NOT NULL REFERENCES public.monitoring(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitoring_comments_monitoring_id_idx ON public.monitoring_comments(monitoring_id);

ALTER TABLE public.monitoring_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON public.monitoring_comments;
CREATE POLICY "comments_select" ON public.monitoring_comments FOR SELECT
    USING (
        is_admin() OR 
        monitoring_id IN (SELECT id FROM public.monitoring WHERE user_id = auth.uid()) OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "comments_insert" ON public.monitoring_comments;
CREATE POLICY "comments_insert" ON public.monitoring_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND (
            is_admin() OR 
            monitoring_id IN (SELECT id FROM public.monitoring WHERE user_id = auth.uid())
        )
    );
