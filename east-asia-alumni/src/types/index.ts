export type EventType = 'dinner' | 'study' | 'networking' | 'sports' | 'culture' | 'other'
export type NotificationType = 'follow' | 'like' | 'comment' | 'event_join' | 'event_update' | 'message'

export type SnsLinks = {
  x?: string
  instagram?: string
  facebook?: string
  wechat?: string
  line?: string
  kakao?: string
  note?: string
  wantedly?: string
  youtrust?: string
}

export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  home_country: string | null
  current_location: string | null
  work_location: string | null
  tags: string[]
  sns_links: SnsLinks | null
  area: string[] | null
  wants: string[] | null
  created_at: string
  updated_at: string
}

export interface StudyAbroadHistory {
  id: string
  profile_id: string
  university_name: string
  country: string
  program: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface PostLike {
  post_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  post_id: string | null
  event_id: string | null
  author_id: string
  content: string
  created_at: string
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  description: string | null
  event_type: EventType
  location: string | null
  event_date: string
  max_participants: number | null
  price_students: string | null
  price_other: string | null
  registration_link: string | null
  created_at: string
  updated_at: string
}

export interface EventParticipant {
  event_id: string
  user_id: string
  created_at: string
}

export interface Conversation {
  id: string
  created_at: string
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  joined_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  entity_id: string | null
  read: boolean
  created_at: string
}

// Extended types with joins
export interface PostWithAuthor extends Post {
  author: Profile
  likes_count: number
  comments_count: number
  is_liked?: boolean
}

export interface CommentWithAuthor extends Comment {
  author: Profile
}

export interface EventWithOrganizer extends Event {
  organizer: Profile
  participants_count: number
  is_participating?: boolean
}

export interface ProfileWithStats extends Profile {
  study_abroad_histories: StudyAbroadHistory[]
  followers_count: number
  following_count: number
  is_following?: boolean
}

export interface ConversationWithParticipants extends Conversation {
  participants: Profile[]
  last_message?: Message
}

export interface NotificationWithActor extends Notification {
  actor?: Profile
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          username: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          home_country?: string | null
          current_location?: string | null
          work_location?: string | null
          tags?: string[]
        }
        Update: {
          username?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          home_country?: string | null
          current_location?: string | null
          work_location?: string | null
          tags?: string[]
          sns_links?: SnsLinks | null
          area?: string[] | null
          wants?: string[] | null
        }
        Relationships: []
      }
      study_abroad_histories: {
        Row: StudyAbroadHistory
        Insert: {
          profile_id: string
          university_name: string
          country: string
          program?: string | null
          start_date?: string | null
          end_date?: string | null
        }
        Update: {
          university_name?: string
          country?: string
          program?: string | null
          start_date?: string | null
          end_date?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: Follow
        Insert: { follower_id: string; following_id: string }
        Update: { [_ in never]: never }
        Relationships: []
      }
      posts: {
        Row: Post
        Insert: { author_id: string; content: string }
        Update: { content?: string }
        Relationships: []
      }
      post_likes: {
        Row: PostLike
        Insert: { post_id: string; user_id: string }
        Update: { [_ in never]: never }
        Relationships: []
      }
      comments: {
        Row: Comment
        Insert: { post_id: string; author_id: string; content: string }
        Update: { content?: string }
        Relationships: []
      }
      events: {
        Row: Event
        Insert: {
          organizer_id: string
          title: string
          description?: string | null
          event_type: EventType
          location?: string | null
          event_date: string
          max_participants?: number | null
        }
        Update: {
          title?: string
          description?: string | null
          event_type?: EventType
          location?: string | null
          event_date?: string
          max_participants?: number | null
        }
        Relationships: []
      }
      event_participants: {
        Row: EventParticipant
        Insert: { event_id: string; user_id: string }
        Update: { [_ in never]: never }
        Relationships: []
      }
      conversations: {
        Row: Conversation
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      conversation_participants: {
        Row: ConversationParticipant
        Insert: { conversation_id: string; user_id: string }
        Update: { [_ in never]: never }
        Relationships: []
      }
      messages: {
        Row: Message
        Insert: { conversation_id: string; sender_id: string; content: string }
        Update: { read_at?: string | null }
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: {
          user_id: string
          actor_id?: string | null
          type: NotificationType
          entity_id?: string | null
          read?: boolean
        }
        Update: { read?: boolean }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
