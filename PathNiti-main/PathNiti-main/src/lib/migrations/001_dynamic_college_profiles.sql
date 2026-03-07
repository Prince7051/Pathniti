-- Dynamic College Profiles Migration
-- This migration adds support for dynamic college profiles with unique URLs,
-- student applications, course management, and college notices

-- Add new columns to existing colleges table
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS admission_criteria JSONB;
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS scholarships JSONB;
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS entrance_tests JSONB;
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS gallery TEXT[];

-- Create unique index for slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_slug ON public.colleges(slug);

-- Student Applications Table
CREATE TABLE IF NOT EXISTS public.student_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    class_stream TEXT NOT NULL,
    documents JSONB NOT NULL, -- {marksheet_10th: url, marksheet_12th: url, other_documents: [urls]}
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- College Courses Table
CREATE TABLE IF NOT EXISTS public.college_courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    eligibility TEXT,
    fees JSONB,
    seats INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- College Notices Table
CREATE TABLE IF NOT EXISTS public.college_notices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'admission', 'event', 'urgent')),
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_student_applications_student_id ON public.student_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_college_id ON public.student_applications(college_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_status ON public.student_applications(status);
CREATE INDEX IF NOT EXISTS idx_student_applications_submitted_at ON public.student_applications(submitted_at);

CREATE INDEX IF NOT EXISTS idx_college_courses_college_id ON public.college_courses(college_id);
CREATE INDEX IF NOT EXISTS idx_college_courses_is_active ON public.college_courses(is_active);

CREATE INDEX IF NOT EXISTS idx_college_notices_college_id ON public.college_notices(college_id);
CREATE INDEX IF NOT EXISTS idx_college_notices_type ON public.college_notices(type);
CREATE INDEX IF NOT EXISTS idx_college_notices_published_at ON public.college_notices(published_at);
CREATE INDEX IF NOT EXISTS idx_college_notices_is_active ON public.college_notices(is_active);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_applications_college_status ON public.student_applications(college_id, status);
CREATE INDEX IF NOT EXISTS idx_college_courses_college_active ON public.college_courses(college_id, is_active);
CREATE INDEX IF NOT EXISTS idx_college_notices_college_active ON public.college_notices(college_id, is_active);

-- Enable Row Level Security
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_applications
CREATE POLICY "Students can view own applications" ON public.student_applications
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own applications" ON public.student_applications
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own applications" ON public.student_applications
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "College admins can view applications to their college" ON public.student_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.college_profiles cp
            WHERE cp.id = auth.uid() AND cp.college_id = student_applications.college_id
        )
    );

CREATE POLICY "College admins can update applications to their college" ON public.student_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.college_profiles cp
            WHERE cp.id = auth.uid() AND cp.college_id = student_applications.college_id
        )
    );

CREATE POLICY "Admins can view all applications" ON public.student_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for college_courses
CREATE POLICY "Anyone can view active courses" ON public.college_courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "College admins can manage their courses" ON public.college_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.college_profiles cp
            WHERE cp.id = auth.uid() AND cp.college_id = college_courses.college_id
        )
    );

CREATE POLICY "Admins can manage all courses" ON public.college_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for college_notices
CREATE POLICY "Anyone can view active notices" ON public.college_notices
    FOR SELECT USING (is_active = true);

CREATE POLICY "College admins can manage their notices" ON public.college_notices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.college_profiles cp
            WHERE cp.id = auth.uid() AND cp.college_id = college_notices.college_id
        )
    );

CREATE POLICY "Admins can manage all notices" ON public.college_notices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add triggers for updating timestamps
CREATE TRIGGER update_student_applications_updated_at BEFORE UPDATE ON public.student_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_courses_updated_at BEFORE UPDATE ON public.college_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_notices_updated_at BEFORE UPDATE ON public.college_notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique slug for colleges
CREATE OR REPLACE FUNCTION generate_college_slug(college_name TEXT, college_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from college name
    base_slug := lower(trim(regexp_replace(college_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'college';
    END IF;
    
    -- Check for uniqueness and append counter if needed
    final_slug := base_slug;
    
    WHILE EXISTS (
        SELECT 1 FROM public.colleges 
        WHERE slug = final_slug 
        AND (college_id IS NULL OR id != college_id)
    ) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug when college is inserted/updated
CREATE OR REPLACE FUNCTION auto_generate_college_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate slug if it's not provided or if name changed
    IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
        NEW.slug := generate_college_slug(NEW.name, NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slugs
DROP TRIGGER IF EXISTS auto_generate_college_slug_trigger ON public.colleges;
CREATE TRIGGER auto_generate_college_slug_trigger
    BEFORE INSERT OR UPDATE ON public.colleges
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_college_slug();

-- Update existing colleges to have slugs if they don't already
UPDATE public.colleges 
SET slug = generate_college_slug(name, id)
WHERE slug IS NULL;