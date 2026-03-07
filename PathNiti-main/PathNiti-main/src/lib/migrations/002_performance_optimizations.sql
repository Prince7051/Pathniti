-- Performance Optimization Migration
-- This migration adds additional indexes and optimizations for better query performance

-- Enable pg_trgm extension first (required for text search indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Additional indexes for colleges table (without trgm for now, as it may not be available in all Supabase instances)
-- CREATE INDEX IF NOT EXISTS idx_colleges_name_trgm ON public.colleges USING gin (name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_colleges_address_trgm ON public.colleges USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_colleges_location_state ON public.colleges USING gin ((location->>'state'));
CREATE INDEX IF NOT EXISTS idx_colleges_location_city ON public.colleges USING gin ((location->>'city'));
CREATE INDEX IF NOT EXISTS idx_colleges_type ON public.colleges(type);
CREATE INDEX IF NOT EXISTS idx_colleges_is_active ON public.colleges(is_active);
CREATE INDEX IF NOT EXISTS idx_colleges_is_verified ON public.colleges(is_verified);
CREATE INDEX IF NOT EXISTS idx_colleges_created_at ON public.colleges(created_at);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_colleges_active_type ON public.colleges(is_active, type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_colleges_active_state ON public.colleges(is_active, (location->>'state')) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_colleges_active_verified ON public.colleges(is_active, is_verified) WHERE is_active = true;

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_colleges_active_only ON public.colleges(name, slug, type, location) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_colleges_verified_active ON public.colleges(name, slug, type, location) WHERE is_active = true AND is_verified = true;

-- Additional indexes for student applications with better query patterns
CREATE INDEX IF NOT EXISTS idx_student_applications_college_status_submitted ON public.student_applications(college_id, status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_applications_student_status ON public.student_applications(student_id, status, submitted_at DESC);
-- Text search indexes (commented out as pg_trgm may not be available)
-- CREATE INDEX IF NOT EXISTS idx_student_applications_full_name_trgm ON public.student_applications USING gin (full_name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_student_applications_email_trgm ON public.student_applications USING gin (email gin_trgm_ops);

-- Indexes for college courses with better filtering
CREATE INDEX IF NOT EXISTS idx_college_courses_college_active_name ON public.college_courses(college_id, is_active, name) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_college_courses_name_trgm ON public.college_courses USING gin (name gin_trgm_ops);

-- Indexes for college notices with better filtering
CREATE INDEX IF NOT EXISTS idx_college_notices_college_active_published ON public.college_notices(college_id, is_active, published_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_college_notices_type_published ON public.college_notices(type, published_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_college_notices_expires_at ON public.college_notices(expires_at) WHERE expires_at IS NOT NULL;

-- pg_trgm extension already enabled above

-- Create materialized view for college statistics (for dashboard performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS college_stats AS
SELECT 
    c.id,
    c.slug,
    c.name,
    COUNT(DISTINCT sa.id) as total_applications,
    COUNT(DISTINCT CASE WHEN sa.status = 'pending' THEN sa.id END) as pending_applications,
    COUNT(DISTINCT CASE WHEN sa.status = 'approved' THEN sa.id END) as approved_applications,
    COUNT(DISTINCT CASE WHEN sa.status = 'rejected' THEN sa.id END) as rejected_applications,
    COUNT(DISTINCT cc.id) as total_courses,
    COUNT(DISTINCT CASE WHEN cc.is_active = true THEN cc.id END) as active_courses,
    COUNT(DISTINCT cn.id) as total_notices,
    COUNT(DISTINCT CASE WHEN cn.is_active = true THEN cn.id END) as active_notices,
    MAX(sa.submitted_at) as last_application_date,
    MAX(cn.published_at) as last_notice_date
FROM public.colleges c
LEFT JOIN public.student_applications sa ON c.id = sa.college_id
LEFT JOIN public.college_courses cc ON c.id = cc.college_id
LEFT JOIN public.college_notices cn ON c.id = cn.college_id
WHERE c.is_active = true
GROUP BY c.id, c.slug, c.name;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_college_stats_id ON college_stats(id);
CREATE INDEX IF NOT EXISTS idx_college_stats_slug ON college_stats(slug);

-- Function to refresh college stats
CREATE OR REPLACE FUNCTION refresh_college_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY college_stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to get college profile with optimized queries
CREATE OR REPLACE FUNCTION get_college_profile_optimized(college_slug TEXT)
RETURNS TABLE (
    college_data JSONB,
    courses_data JSONB,
    notices_data JSONB,
    stats_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH college_info AS (
        SELECT to_jsonb(c.*) as college_json
        FROM public.colleges c
        WHERE c.slug = college_slug AND c.is_active = true
    ),
    courses_info AS (
        SELECT COALESCE(jsonb_agg(to_jsonb(cc.*) ORDER BY cc.name), '[]'::jsonb) as courses_json
        FROM public.college_courses cc
        JOIN public.colleges c ON c.id = cc.college_id
        WHERE c.slug = college_slug AND cc.is_active = true
    ),
    notices_info AS (
        SELECT COALESCE(jsonb_agg(to_jsonb(cn.*) ORDER BY cn.published_at DESC), '[]'::jsonb) as notices_json
        FROM public.college_notices cn
        JOIN public.colleges c ON c.id = cn.college_id
        WHERE c.slug = college_slug AND cn.is_active = true
        AND (cn.expires_at IS NULL OR cn.expires_at > NOW())
        LIMIT 10
    ),
    stats_info AS (
        SELECT to_jsonb(cs.*) as stats_json
        FROM college_stats cs
        WHERE cs.slug = college_slug
    )
    SELECT 
        ci.college_json,
        coi.courses_json,
        ni.notices_json,
        si.stats_json
    FROM college_info ci
    CROSS JOIN courses_info coi
    CROSS JOIN notices_info ni
    LEFT JOIN stats_info si ON true;
END;
$$ LANGUAGE plpgsql;

-- Create function for paginated applications with better performance
CREATE OR REPLACE FUNCTION get_college_applications_paginated(
    college_slug TEXT,
    filter_status TEXT DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    page_size INTEGER DEFAULT 10,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    applications JSONB,
    total_count INTEGER
) AS $$
DECLARE
    college_id_var UUID;
    where_conditions TEXT := '';
    count_query TEXT;
    data_query TEXT;
    total_records INTEGER;
    applications_json JSONB;
BEGIN
    -- Get college ID from slug
    SELECT c.id INTO college_id_var
    FROM public.colleges c
    WHERE c.slug = college_slug AND c.is_active = true;
    
    IF college_id_var IS NULL THEN
        RETURN QUERY SELECT '[]'::jsonb, 0;
        RETURN;
    END IF;
    
    -- Build where conditions
    where_conditions := 'sa.college_id = $1';
    
    IF filter_status IS NOT NULL AND filter_status != 'all' THEN
        where_conditions := where_conditions || ' AND sa.status = $2';
    END IF;
    
    IF search_term IS NOT NULL AND search_term != '' THEN
        where_conditions := where_conditions || ' AND (sa.full_name ILIKE $3 OR sa.email ILIKE $3 OR sa.phone ILIKE $3)';
    END IF;
    
    -- Get total count
    count_query := 'SELECT COUNT(*) FROM public.student_applications sa WHERE ' || where_conditions;
    
    IF filter_status IS NOT NULL AND filter_status != 'all' AND search_term IS NOT NULL AND search_term != '' THEN
        EXECUTE count_query INTO total_records USING college_id_var, filter_status, '%' || search_term || '%';
    ELSIF filter_status IS NOT NULL AND filter_status != 'all' THEN
        EXECUTE count_query INTO total_records USING college_id_var, filter_status;
    ELSIF search_term IS NOT NULL AND search_term != '' THEN
        EXECUTE count_query INTO total_records USING college_id_var, '%' || search_term || '%';
    ELSE
        EXECUTE count_query INTO total_records USING college_id_var;
    END IF;
    
    -- Get paginated data
    data_query := 'SELECT jsonb_agg(
        jsonb_build_object(
            ''id'', sa.id,
            ''full_name'', sa.full_name,
            ''email'', sa.email,
            ''phone'', sa.phone,
            ''class_stream'', sa.class_stream,
            ''status'', sa.status,
            ''submitted_at'', sa.submitted_at,
            ''reviewed_at'', sa.reviewed_at,
            ''feedback'', sa.feedback,
            ''documents'', sa.documents,
            ''student_profile'', jsonb_build_object(
                ''first_name'', p.first_name,
                ''last_name'', p.last_name,
                ''email'', p.email
            )
        ) ORDER BY sa.submitted_at DESC
    )
    FROM public.student_applications sa
    LEFT JOIN public.profiles p ON p.id = sa.student_id
    WHERE ' || where_conditions || '
    LIMIT $' || (CASE 
        WHEN filter_status IS NOT NULL AND filter_status != 'all' AND search_term IS NOT NULL AND search_term != '' THEN '4'
        WHEN filter_status IS NOT NULL AND filter_status != 'all' OR search_term IS NOT NULL AND search_term != '' THEN '3'
        ELSE '2'
    END) || ' OFFSET $' || (CASE 
        WHEN filter_status IS NOT NULL AND filter_status != 'all' AND search_term IS NOT NULL AND search_term != '' THEN '5'
        WHEN filter_status IS NOT NULL AND filter_status != 'all' OR search_term IS NOT NULL AND search_term != '' THEN '4'
        ELSE '3'
    END);
    
    IF filter_status IS NOT NULL AND filter_status != 'all' AND search_term IS NOT NULL AND search_term != '' THEN
        EXECUTE data_query INTO applications_json USING college_id_var, filter_status, '%' || search_term || '%', page_size, page_offset;
    ELSIF filter_status IS NOT NULL AND filter_status != 'all' THEN
        EXECUTE data_query INTO applications_json USING college_id_var, filter_status, page_size, page_offset;
    ELSIF search_term IS NOT NULL AND search_term != '' THEN
        EXECUTE data_query INTO applications_json USING college_id_var, '%' || search_term || '%', page_size, page_offset;
    ELSE
        EXECUTE data_query INTO applications_json USING college_id_var, page_size, page_offset;
    END IF;
    
    RETURN QUERY SELECT COALESCE(applications_json, '[]'::jsonb), total_records;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh materialized view when data changes
CREATE OR REPLACE FUNCTION refresh_college_stats_trigger()
RETURNS trigger AS $$
BEGIN
    -- Refresh stats asynchronously to avoid blocking
    PERFORM pg_notify('refresh_college_stats', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stats refresh
DROP TRIGGER IF EXISTS trigger_refresh_stats_applications ON public.student_applications;
CREATE TRIGGER trigger_refresh_stats_applications
    AFTER INSERT OR UPDATE OR DELETE ON public.student_applications
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_college_stats_trigger();

DROP TRIGGER IF EXISTS trigger_refresh_stats_courses ON public.college_courses;
CREATE TRIGGER trigger_refresh_stats_courses
    AFTER INSERT OR UPDATE OR DELETE ON public.college_courses
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_college_stats_trigger();

DROP TRIGGER IF EXISTS trigger_refresh_stats_notices ON public.college_notices;
CREATE TRIGGER trigger_refresh_stats_notices
    AFTER INSERT OR UPDATE OR DELETE ON public.college_notices
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_college_stats_trigger();

-- Initial refresh of materialized view
SELECT refresh_college_stats();