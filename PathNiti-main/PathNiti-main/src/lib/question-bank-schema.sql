-- Enhanced Question Bank and Test System Schema
-- This extends the existing schema with curriculum-aligned questions and tests

-- Create custom types for question system
CREATE TYPE question_type AS ENUM ('mcq_single', 'mcq_multi', 'short', 'long', 'numerical', 'diagram');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE test_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE subject_type AS ENUM ('mathematics', 'science', 'english', 'social_science', 'aptitude', 'personality', 'interest');

-- Enhanced questions table for curriculum-aligned questions
CREATE TABLE public.questions (
    question_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    grade INTEGER NOT NULL CHECK (grade IN (10, 11, 12)),
    subject subject_type NOT NULL,
    topic TEXT NOT NULL,
    question_type question_type NOT NULL,
    difficulty difficulty_level NOT NULL,
    text TEXT NOT NULL,
    options JSONB, -- For MCQ questions: ["option1", "option2", ...]
    correct_answer JSONB NOT NULL, -- Answer(s) in structured format
    explanation TEXT NOT NULL,
    time_seconds INTEGER NOT NULL DEFAULT 120,
    marks INTEGER NOT NULL DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    competency_codes TEXT[], -- Learning objectives/competencies
    version INTEGER DEFAULT 1,
    pending_review BOOLEAN DEFAULT TRUE,
    generated_by TEXT DEFAULT 'sarthi-auto',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT FALSE, -- Only active after approval
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tests table for generated tests
CREATE TABLE public.tests (
    test_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    grade INTEGER NOT NULL,
    test_type TEXT NOT NULL DEFAULT 'stream_assessment', -- 'stream_assessment', 'subject_test', 'practice'
    questions JSONB NOT NULL, -- Ordered list of question_ids
    total_marks INTEGER NOT NULL,
    time_limit_seconds INTEGER NOT NULL,
    status test_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metrics JSONB, -- {accuracy_percent, avg_response_time, speed_score, weighted_score}
    created_by TEXT DEFAULT 'system'
);

-- Student responses table for detailed tracking
CREATE TABLE public.student_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES public.tests(test_id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(question_id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    is_correct BOOLEAN,
    response_time_seconds INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced colleges table with verification system
CREATE TABLE public.colleges_enhanced (
    college_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    pin_code TEXT,
    streams_offered JSONB NOT NULL, -- Array of streams offered
    admission_criteria TEXT,
    fee_structure JSONB, -- Structured fee information
    admission_open_date DATE,
    admission_close_date DATE,
    contact_info JSONB, -- {phone, email, website}
    verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question approval workflow
CREATE TABLE public.question_approvals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(question_id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    feedback TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- College verification workflow
CREATE TABLE public.college_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    college_id UUID REFERENCES public.colleges_enhanced(college_id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'needs_info')),
    feedback TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Curriculum topics mapping
CREATE TABLE public.curriculum_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    grade INTEGER NOT NULL,
    subject subject_type NOT NULL,
    topic TEXT NOT NULL,
    subtopics TEXT[],
    learning_objectives TEXT[],
    competency_codes TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_questions_grade_subject ON public.questions(grade, subject);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_questions_active ON public.questions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_tests_student ON public.tests(student_id);
CREATE INDEX idx_responses_test ON public.student_responses(test_id);
CREATE INDEX idx_responses_question ON public.student_responses(question_id);
CREATE INDEX idx_colleges_verified ON public.colleges_enhanced(verified) WHERE verified = TRUE;

-- RLS Policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges_enhanced ENABLE ROW LEVEL SECURITY;

-- Students can view active questions
CREATE POLICY "Students can view active questions" ON public.questions
    FOR SELECT USING (is_active = TRUE);

-- Students can view their own tests
CREATE POLICY "Students can view own tests" ON public.tests
    FOR SELECT USING (auth.uid() = student_id);

-- Students can view their own responses
CREATE POLICY "Students can view own responses" ON public.student_responses
    FOR SELECT USING (auth.uid() = student_id);

-- Students can view verified colleges
CREATE POLICY "Students can view verified colleges" ON public.colleges_enhanced
    FOR SELECT USING (verified = TRUE);

-- Admins can manage all content
CREATE POLICY "Admins can manage questions" ON public.questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage tests" ON public.tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage colleges" ON public.colleges_enhanced
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- College admins can update their own college
CREATE POLICY "College admins can update own college" ON public.colleges_enhanced
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'college_admin'
        )
    );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colleges_enhanced_updated_at BEFORE UPDATE ON public.colleges_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate test metrics
CREATE OR REPLACE FUNCTION calculate_test_metrics(test_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    total_questions INTEGER;
    correct_answers INTEGER;
    total_time INTEGER;
    avg_time FLOAT;
    accuracy FLOAT;
    result JSONB;
BEGIN
    -- Get total questions and correct answers
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE is_correct = TRUE),
        SUM(response_time_seconds)
    INTO total_questions, correct_answers, total_time
    FROM public.student_responses 
    WHERE test_id = test_uuid;
    
    -- Calculate metrics
    IF total_questions > 0 THEN
        accuracy := (correct_answers::FLOAT / total_questions::FLOAT) * 100;
        avg_time := total_time::FLOAT / total_questions::FLOAT;
        
        result := jsonb_build_object(
            'total_questions', total_questions,
            'correct_answers', correct_answers,
            'accuracy_percent', accuracy,
            'avg_response_time_seconds', avg_time,
            'total_time_seconds', total_time
        );
    ELSE
        result := jsonb_build_object(
            'total_questions', 0,
            'correct_answers', 0,
            'accuracy_percent', 0,
            'avg_response_time_seconds', 0,
            'total_time_seconds', 0
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
