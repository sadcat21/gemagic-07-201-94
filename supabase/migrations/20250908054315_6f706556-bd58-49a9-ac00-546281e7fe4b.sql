-- إنشاء جداول إدارة مشاريع تحرير ودمج الصور

-- جدول مشاريع الصور
CREATE TABLE public.image_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL CHECK (project_type IN ('image-editing', 'image-merging', 'background-removal')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول العمليات المنجزة على الصور
CREATE TABLE public.image_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.image_projects(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('edit', 'merge', 'background-remove', 'analyze')),
  original_image_url TEXT,
  processed_image_url TEXT,
  prompt_text TEXT,
  translated_prompt TEXT,
  operation_settings JSONB DEFAULT '{}',
  processing_time INTEGER, -- بالثواني
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- جدول تحليلات الصور
CREATE TABLE public.image_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id UUID REFERENCES public.image_operations(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('elements', 'object-detection', 'segmentation', 'classification')),
  analysis_results JSONB NOT NULL DEFAULT '{}',
  detected_elements TEXT[],
  object_detections JSONB DEFAULT '[]',
  segmentation_masks JSONB DEFAULT '[]',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات المستخدمين
CREATE TABLE public.user_image_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users UNIQUE,
  default_image_style TEXT DEFAULT 'realistic',
  preferred_language TEXT DEFAULT 'ar',
  auto_translate BOOLEAN DEFAULT true,
  quality_settings JSONB DEFAULT '{"resolution": "high", "compression": "medium"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.image_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_image_preferences ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمشاريع
CREATE POLICY "Users can view their own projects" 
ON public.image_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.image_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.image_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.image_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- سياسات الأمان للعمليات
CREATE POLICY "Users can view operations for their projects" 
ON public.image_operations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.image_projects 
    WHERE image_projects.id = image_operations.project_id 
    AND image_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create operations for their projects" 
ON public.image_operations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.image_projects 
    WHERE image_projects.id = image_operations.project_id 
    AND image_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update operations for their projects" 
ON public.image_operations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.image_projects 
    WHERE image_projects.id = image_operations.project_id 
    AND image_projects.user_id = auth.uid()
  )
);

-- سياسات الأمان للتحليلات
CREATE POLICY "Users can view analysis for their operations" 
ON public.image_analysis 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.image_operations io
    JOIN public.image_projects ip ON ip.id = io.project_id
    WHERE io.id = image_analysis.operation_id 
    AND ip.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create analysis for their operations" 
ON public.image_analysis 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.image_operations io
    JOIN public.image_projects ip ON ip.id = io.project_id
    WHERE io.id = image_analysis.operation_id 
    AND ip.user_id = auth.uid()
  )
);

-- سياسات الأمان لإعدادات المستخدمين
CREATE POLICY "Users can view their own preferences" 
ON public.user_image_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_image_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_image_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- دوال مساعدة
CREATE OR REPLACE FUNCTION public.create_image_project(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_project_type TEXT DEFAULT 'image-editing'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_project_id UUID;
BEGIN
  INSERT INTO public.image_projects (user_id, title, description, project_type)
  VALUES (auth.uid(), p_title, p_description, p_project_type)
  RETURNING id INTO new_project_id;
  
  RETURN new_project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_image_operation(
  p_project_id UUID,
  p_operation_type TEXT,
  p_prompt_text TEXT DEFAULT NULL,
  p_original_image_url TEXT DEFAULT NULL,
  p_operation_settings JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_operation_id UUID;
BEGIN
  INSERT INTO public.image_operations (
    project_id, 
    operation_type, 
    prompt_text, 
    original_image_url,
    operation_settings
  )
  VALUES (
    p_project_id, 
    p_operation_type, 
    p_prompt_text, 
    p_original_image_url,
    p_operation_settings
  )
  RETURNING id INTO new_operation_id;
  
  RETURN new_operation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_operation_status(
  p_operation_id UUID,
  p_status TEXT,
  p_processed_image_url TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.image_operations 
  SET 
    status = p_status,
    processed_image_url = COALESCE(p_processed_image_url, processed_image_url),
    error_message = p_error_message,
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_operation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_image_analysis(
  p_operation_id UUID,
  p_analysis_type TEXT,
  p_analysis_results JSONB,
  p_detected_elements TEXT[] DEFAULT NULL,
  p_confidence_score DECIMAL DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_analysis_id UUID;
BEGIN
  INSERT INTO public.image_analysis (
    operation_id,
    analysis_type,
    analysis_results,
    detected_elements,
    confidence_score
  )
  VALUES (
    p_operation_id,
    p_analysis_type,
    p_analysis_results,
    p_detected_elements,
    p_confidence_score
  )
  RETURNING id INTO new_analysis_id;
  
  RETURN new_analysis_id;
END;
$$;

-- تريجرز لتحديث الطوابع الزمنية
CREATE TRIGGER update_image_projects_updated_at
  BEFORE UPDATE ON public.image_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_image_preferences_updated_at
  BEFORE UPDATE ON public.user_image_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- فهارس لتحسين الأداء
CREATE INDEX idx_image_projects_user_id ON public.image_projects(user_id);
CREATE INDEX idx_image_projects_type ON public.image_projects(project_type);
CREATE INDEX idx_image_operations_project_id ON public.image_operations(project_id);
CREATE INDEX idx_image_operations_status ON public.image_operations(status);
CREATE INDEX idx_image_analysis_operation_id ON public.image_analysis(operation_id);
CREATE INDEX idx_image_analysis_type ON public.image_analysis(analysis_type);