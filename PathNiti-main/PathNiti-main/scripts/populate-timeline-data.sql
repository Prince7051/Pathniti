-- Script to populate admission_deadlines table with sample data
-- This will help test the database integration for the timeline page

-- Clear existing data (optional - remove if you want to keep existing data)
-- DELETE FROM admission_deadlines;

-- Insert sample timeline events
INSERT INTO admission_deadlines (title, description, deadline_date, deadline_type, stream, class_level, is_active) VALUES
-- 2024 Events (should show as overdue)
('NEET 2024 Application Deadline', 'Last date to submit NEET 2024 application forms', '2024-01-15', 'application', 'medical', '12', true),
('CUET 2024 Registration', 'Common University Entrance Test registration opens', '2024-02-01', 'exam', 'general', '12', true),
('National Merit Scholarship Application', 'Apply for National Merit Scholarship Scheme', '2024-03-15', 'application', 'general', '12', true),
('Post Matric Scholarship Deadline', 'Last date for SC/ST Post Matric Scholarship applications', '2024-04-30', 'application', 'general', '12', true),
('Class 12 Board Results', 'CBSE Class 12 board examination results declaration', '2024-05-13', 'result', 'general', '12', true),
('Delhi University Admissions', 'Delhi University undergraduate admissions begin', '2024-05-15', 'counseling', 'general', '12', true),
('AIIMS MBBS Entrance Exam', 'All India Institute of Medical Sciences entrance exam', '2024-05-26', 'exam', 'medical', '12', true),
('IIT JEE Advanced 2024', 'JEE Advanced examination for IIT admissions', '2024-06-02', 'exam', 'engineering', '12', true),
('NIT Admissions Counseling', 'National Institute of Technology counseling begins', '2024-07-01', 'counseling', 'engineering', '12', true),

-- 2025 Events (should show as upcoming)
('JEE Main 2025 Registration', 'Registration for JEE Main 2025 examination begins', '2025-12-15', 'application', 'engineering', '12', true),
('NEET 2025 Application Deadline', 'Last date to submit NEET 2025 application forms', '2025-01-15', 'application', 'medical', '12', true),
('CUET 2025 Registration', 'Common University Entrance Test registration opens', '2025-02-01', 'exam', 'general', '12', true),
('Class 12 Board Results 2025', 'CBSE Class 12 board examination results declaration', '2025-05-13', 'result', 'general', '12', true),
('Delhi University Admissions 2025', 'Delhi University undergraduate admissions begin', '2025-05-15', 'counseling', 'general', '12', true),
('AIIMS MBBS Entrance Exam 2025', 'All India Institute of Medical Sciences entrance exam', '2025-05-26', 'exam', 'medical', '12', true),
('IIT JEE Advanced 2025', 'JEE Advanced examination for IIT admissions', '2025-06-02', 'exam', 'engineering', '12', true),
('NIT Admissions Counseling 2025', 'National Institute of Technology counseling begins', '2025-07-01', 'counseling', 'engineering', '12', true),

-- Current/Recent Events (should show as ongoing or upcoming)
('Current Month Application', 'Sample application deadline for current month', CURRENT_DATE + INTERVAL '5 days', 'application', 'general', '12', true),
('Next Week Exam', 'Sample exam happening next week', CURRENT_DATE + INTERVAL '7 days', 'exam', 'engineering', '12', true),
('Today Event', 'Sample event happening today', CURRENT_DATE, 'result', 'general', '12', true);

-- Verify the data was inserted
SELECT 
    title, 
    deadline_date, 
    deadline_type, 
    stream, 
    class_level,
    CASE 
        WHEN deadline_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN deadline_date = CURRENT_DATE THEN 'TODAY'
        WHEN deadline_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'UPCOMING (within week)'
        ELSE 'FUTURE'
    END as status_category
FROM admission_deadlines 
WHERE is_active = true 
ORDER BY deadline_date;
