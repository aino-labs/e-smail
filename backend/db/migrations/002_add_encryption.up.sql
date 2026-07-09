ALTER TABLE emails
    ADD COLUMN body_enc BYTEA,
    ADD COLUMN wrapped_dek BYTEA,
    ADD COLUMN key_version SMALLINT NOT NULL DEFAULT 0;
