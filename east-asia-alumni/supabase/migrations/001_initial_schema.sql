-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  home_country TEXT,
  current_location TEXT,
  work_location TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- STUDY ABROAD HISTORIES (multiple per user)
-- ============================================
CREATE TABLE study_abroad_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  university_name TEXT NOT NULL,
  country TEXT NOT NULL,
  program TEXT, -- "CAMPUS Asia", "BaiXian", "Other"
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- FOLLOWS
-- ============================================
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- POSTS
-- ============================================
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- POST LIKES
-- ============================================
CREATE TABLE post_likes (
  post_id UUID REFERENCES posts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  event_type TEXT NOT NULL CHECK (event_type IN ('dinner', 'study', 'networking', 'sports', 'culture', 'other')),
  location TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  max_participants INT CHECK (max_participants > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- EVENT PARTICIPANTS
-- ============================================
CREATE TABLE event_participants (
  event_id UUID REFERENCES events ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

-- ============================================
-- CONVERSATIONS (DM threads)
-- ============================================
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'event_join', 'message')),
  entity_id UUID,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_study_abroad_histories_profile_id ON study_abroad_histories(profile_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_abroad_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Study histories viewable by everyone" ON study_abroad_histories FOR SELECT USING (true);
CREATE POLICY "Users can manage own study history" ON study_abroad_histories FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can manage own posts" ON posts FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON post_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can manage own comments" ON comments FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Users can manage own events" ON events FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "Event participants viewable by everyone" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Users can manage own participation" ON event_participants FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT
  USING (id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));

CREATE POLICY "Users can view conversation participants" ON conversation_participants FOR SELECT
  USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can join conversations" ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT
  USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can send messages to their conversations" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
