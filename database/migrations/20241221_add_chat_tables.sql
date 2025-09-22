-- Add chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'english', 'essay', 'general')),
  title TEXT,
  context JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add chat messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on chat tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat conversations
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for chat messages
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM public.chat_conversations 
      WHERE id = chat_messages.conversation_id
    )
  );

CREATE POLICY "Users can create own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.chat_conversations 
      WHERE id = chat_messages.conversation_id
    )
  );

-- Indexes for performance
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_updated_at ON public.chat_conversations(updated_at);
CREATE INDEX idx_chat_conversations_subject ON public.chat_conversations(subject);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON public.chat_messages(role);

-- Trigger for updated_at on conversations
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();