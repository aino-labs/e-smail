ALTER TABLE emails
    DROP CONSTRAINT IF EXISTS anonymous_requires_internal_sender;

DROP INDEX IF EXISTS idx_emails_parent_email_id;

ALTER TABLE emails
    DROP COLUMN IF EXISTS parent_email_id;

ALTER TABLE emails
    DROP COLUMN IF EXISTS is_anonymous;

ALTER TABLE users
    DROP COLUMN IF EXISTS accept_anonymous;
