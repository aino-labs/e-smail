package repository

import (
	"context"
	"database/sql"
)

func (r *Repository) InsertExternalEmail(
	ctx context.Context,
	tx *sql.Tx,
	senderEmail, header, body string,
) (int64, error) {
	const query = `
		INSERT INTO emails (
			sender_id,
			sender_email,
			header,
			body_enc,
			wrapped_dek,
			key_version,
			is_draft
		)
		VALUES (NULL, $1, $2, $3, $4, 1, false)
		RETURNING id
	`
	var id int64
	cipherBody, wrappedDEK, err := r.encryptor.Encrypt([]byte(body))
	if err != nil {
		return 0, mapPgError(err)
	}

	if err = tx.QueryRowContext(
		ctx,
		query,
		senderEmail,
		header,
		cipherBody,
		wrappedDEK,
	).Scan(&id); err != nil {
		return 0, mapPgError(err)
	}

	return id, nil
}
