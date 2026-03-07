-- Setup Supabase Storage for document uploads
-- This script should be run in the Supabase SQL editor

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for college documents (gallery, brochures, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'college-documents',
  'college-documents',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for student documents bucket
CREATE POLICY "Authenticated users can upload student documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'student-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view student documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'student-documents' 
  AND (
    auth.role() = 'authenticated' OR
    bucket_id = 'student-documents' -- Allow public read for college admins
  )
);

CREATE POLICY "Document owners can update their documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'student-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Document owners can delete their documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'student-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- RLS policies for college documents bucket
CREATE POLICY "Authenticated users can upload college documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'college-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Public read access for college documents" ON storage.objects
FOR SELECT USING (bucket_id = 'college-documents');

CREATE POLICY "College owners can update their documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'college-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "College owners can delete their documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'college-documents' 
  AND auth.role() = 'authenticated'
);

-- RLS policies for profile images bucket
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Public read access for profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Profile owners can update their images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Profile owners can delete their images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create document metadata table for tracking uploads
CREATE TABLE IF NOT EXISTS public.document_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    document_type TEXT, -- 'marksheet_10th', 'marksheet_12th', 'other', 'gallery', 'profile'
    application_id UUID REFERENCES public.student_applications(id) ON DELETE CASCADE,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for document metadata
CREATE INDEX IF NOT EXISTS idx_document_metadata_user_id ON public.document_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_application_id ON public.document_metadata(application_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_college_id ON public.document_metadata(college_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_document_type ON public.document_metadata(document_type);

-- Enable RLS on document metadata
ALTER TABLE public.document_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies for document metadata
CREATE POLICY "Users can view their own document metadata" ON public.document_metadata
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own document metadata" ON public.document_metadata
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own document metadata" ON public.document_metadata
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own document metadata" ON public.document_metadata
FOR DELETE USING (user_id = auth.uid());

-- Allow college admins to view document metadata for their applications
CREATE POLICY "College admins can view application document metadata" ON public.document_metadata
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.student_applications sa
    JOIN public.colleges c ON c.id = sa.college_id
    JOIN public.college_profiles cp ON cp.college_id = c.id
    WHERE sa.id = document_metadata.application_id
    AND cp.id = auth.uid()
  )
);