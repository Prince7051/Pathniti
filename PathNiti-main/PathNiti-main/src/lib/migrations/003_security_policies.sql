-- Security Policies Migration for Dynamic College Profiles
-- This migration adds Row Level Security (RLS) policies for all new tables

-- Enable RLS on student_applications table
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Students can only view their own applications
CREATE POLICY "Students can view own applications" ON public.student_applications
    FOR SELECT USING (
        auth.uid() = student_id
    );

-- Policy: Students can insert their own applications
CREATE POLICY "Students can insert own applications" ON public.student_applications
    FOR INSERT WITH CHECK (
        auth.uid() = student_id
    );

-- Policy: Students can update their own applications (for document updates)
CREATE POLICY "Students can update own applications" ON public.student_applications
    FOR UPDATE USING (
        auth.uid() = student_id
    ) WITH CHECK (
        auth.uid() = student_id
    );

-- Policy: College admins can view applications to their college
CREATE POLICY "College admins can view college applications" ON public.student_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.colleges c ON p.id = c.created_by
            WHERE p.id = auth.uid() 
            AND c.id = student_applications.college_id
            AND p.role = 'college'
        )
    );

-- Policy: College admins can update applications to their college (status changes)
CREATE POLICY "College admins can update college applications" ON public.student_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.colleges c ON p.id = c.created_by
            WHERE p.id = auth.uid() 
            AND c.id = student_applications.college_id
            AND p.role = 'college'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.colleges c ON p.id = c.created_by
            WHERE p.id = auth.uid() 
            AND c.id = student_applications.college_id
            AND p.role = 'college'
        )
    );

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications" ON public.student_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on college_courses table
ALTER TABLE public.college_courses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active courses
CREATE POLICY "Anyone can view active courses" ON public.college_courses
    FOR SELECT USING (is_active = true);

-- Policy: College admins can manage their own courses
CREATE POLICY "College admins can manage own courses" ON public.college_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.colleges c ON p.id = c.created_by
            WHERE p.id = auth.uid() 
            AND c.id = college_courses.college_id
            AND p.role = 'college'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.colleges c ON p.id = c.created_by
            WHERE p.id = auth.uid() 
            AND c.id = college_courses.college_id
            AND p.role = 'college'
        )
    );

-- Policy: Admins can manage all courses
CREATE POLICY "Admins can manage all courses" ON public.college_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on college_notices table
ALTER TABLE public.college_notices ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active notices
CREATE POLICY "Anyone can view active notices" ON public.college_notices
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Policy: College admins can manage their own notices
CREATE POLICY "College admins can manage own notices" ON public.college_notices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.colleges c ON p.id = c.created_by
            WHERE p.id = auth.uid() 
            AND c.id = college_notices.college_id
            AND p.role = 'college'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.colleges c ON p.id = c.created_by
            WHERE p.id = auth.uid() 
            AND c.id = college_notices.college_id
            AND p.role = 'college'
        )
    );

-- Policy: Admins can manage all notices
CREATE POLICY "Admins can manage all notices" ON public.college_notices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Enhanced security for colleges table
-- Policy: College admins can only update their own college
CREATE POLICY "College admins can update own college" ON public.colleges
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.id = colleges.created_by
            AND p.role = 'college'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.id = colleges.created_by
            AND p.role = 'college'
        )
    );

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: System can insert audit logs (no user restriction for logging)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_student_applications_student_id ON public.student_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_college_id ON public.student_applications(college_id);
CREATE INDEX IF NOT EXISTS idx_college_courses_college_id ON public.college_courses(college_id);
CREATE INDEX IF NOT EXISTS idx_college_notices_college_id ON public.college_notices(college_id);