-- Conversation Schema for AI Sarthi Chat Interface
-- This schema supports persistent conversation history and session management

-- Create custom types for conversation
CREATE TYPE message_type AS ENUM ('user', 'assistant', 'system');
CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'deleted');

-- Conversation sessions table
CREATE TABLE public.conversation_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_name TEXT DEFAULT 'Chat with Sarthi',
    status conversation_status DEFAULT 'active',
    context JSONB, -- Store conversation context, user preferences, etc.
    metadata JSONB, -- Additional metadata like device info, location, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages in conversations
CREATE TABLE public.conversation_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
    message_type message_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB, -- Store additional data like AI model used, confidence scores, etc.
    parent_message_id UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL, -- For threading/replies
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Sarthi capabilities and responses tracking
CREATE TABLE public.sarthi_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
    capability_used TEXT NOT NULL, -- 'recommendation', 'question_generation', 'college_info', 'general_chat'
    input_data JSONB, -- What the user asked for
    output_data JSONB, -- What Sarthi provided
    confidence_score FLOAT, -- AI confidence in the response
    processing_time_ms INTEGER, -- How long it took to generate response
    user_feedback TEXT, -- User feedback on the response (thumbs up/down, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversation_sessions_user_id ON public.conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_status ON public.conversation_sessions(status);
CREATE INDEX idx_conversation_sessions_last_activity ON public.conversation_sessions(last_activity_at);
CREATE INDEX idx_conversation_messages_session_id ON public.conversation_messages(session_id);
CREATE INDEX idx_conversation_messages_type ON public.conversation_messages(message_type);
CREATE INDEX idx_conversation_messages_created_at ON public.conversation_messages(created_at);
CREATE INDEX idx_sarthi_interactions_session_id ON public.sarthi_interactions(session_id);
CREATE INDEX idx_sarthi_interactions_capability ON public.sarthi_interactions(capability_used);

-- Row Level Security (RLS) policies
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sarthi_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for conversation sessions
CREATE POLICY "Users can view own conversation sessions" ON public.conversation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversation sessions" ON public.conversation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation sessions" ON public.conversation_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation sessions" ON public.conversation_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for conversation messages
CREATE POLICY "Users can view messages in own sessions" ON public.conversation_messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.conversation_sessions 
        WHERE id = conversation_messages.session_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can create messages in own sessions" ON public.conversation_messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.conversation_sessions 
        WHERE id = conversation_messages.session_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update messages in own sessions" ON public.conversation_messages
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.conversation_sessions 
        WHERE id = conversation_messages.session_id AND user_id = auth.uid()
    ));

-- Policies for Sarthi interactions
CREATE POLICY "Users can view own Sarthi interactions" ON public.sarthi_interactions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.conversation_sessions 
        WHERE id = sarthi_interactions.session_id AND user_id = auth.uid()
    ));

CREATE POLICY "System can create Sarthi interactions" ON public.sarthi_interactions
    FOR INSERT WITH CHECK (true); -- Allow system to log interactions

CREATE POLICY "Users can update own Sarthi interactions" ON public.sarthi_interactions
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.conversation_sessions 
        WHERE id = sarthi_interactions.session_id AND user_id = auth.uid()
    ));

-- Admin policies for analytics
CREATE POLICY "Admins can view all conversation data" ON public.conversation_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all messages" ON public.conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all Sarthi interactions" ON public.sarthi_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Triggers for updating timestamps
CREATE TRIGGER update_conversation_sessions_updated_at BEFORE UPDATE ON public.conversation_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_messages_updated_at BEFORE UPDATE ON public.conversation_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last activity when messages are added
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversation_sessions 
    SET last_activity_at = NOW(), updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update session activity on new messages
CREATE TRIGGER update_session_activity_on_message 
    AFTER INSERT ON public.conversation_messages
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

-- Function to clean up old conversations (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Archive conversations older than 90 days with no activity
    UPDATE public.conversation_sessions 
    SET status = 'archived'
    WHERE status = 'active' 
    AND last_activity_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';
