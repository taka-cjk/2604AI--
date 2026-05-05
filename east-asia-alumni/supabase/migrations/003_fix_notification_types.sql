-- Extend notifications.type CHECK constraint to include all used types
-- 'mention', 'thread_reply', 'event_update' were missing, causing silent INSERT failures

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'follow',
    'like',
    'comment',
    'event_join',
    'event_update',
    'mention',
    'message',
    'thread_reply'
  ));
