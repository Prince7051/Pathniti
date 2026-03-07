-- Setup quiz tables to match the existing database structure
-- This script creates the missing quiz_responses table and ensures consistency

-- Create quiz_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    user_answer INTEGER NOT NULL,
    time_taken INTEGER DEFAULT 0, -- seconds
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_sessions table if it doesn't exist (to match the types)
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_score INTEGER DEFAULT 0,
    aptitude_score INTEGER DEFAULT 0,
    interest_scores JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session_id ON public.quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question_id ON public.quiz_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON public.quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_type ON public.quiz_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON public.quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON public.quiz_questions(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.quiz_questions IS 'Comprehensive assessment questions for aptitude, interests, and personality';
COMMENT ON TABLE public.quiz_responses IS 'Student responses to quiz questions during assessment sessions';
COMMENT ON TABLE public.quiz_sessions IS 'Assessment sessions tracking user progress and results';

COMMENT ON COLUMN public.quiz_questions.question_type IS 'Type of question: aptitude, riasec_interest, personality, subject_performance';
COMMENT ON COLUMN public.quiz_questions.category IS 'Specific category within question type (e.g., logical_reasoning, realistic, introvert_extrovert)';
COMMENT ON COLUMN public.quiz_questions.correct_answer IS 'Index of correct answer (0-based) for aptitude questions, NULL for interest/personality questions';
COMMENT ON COLUMN public.quiz_responses.user_answer IS 'User selected answer index (0-based)';
COMMENT ON COLUMN public.quiz_sessions.status IS 'Session status: not_started, in_progress, completed';
