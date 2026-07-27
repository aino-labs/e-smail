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
			header_enc,
			body_enc,
			wrapped_dek,
			key_version,
			is_draft
		)
		VALUES (NULL, $1, $2, $3, $4, 2, false)
		RETURNING id
	`
	var id int64
	encryptedTexts, wrappedDEK, err := r.encryptor.EncryptMultiple(
		[]byte(header),
		[]byte(body),
	)
	if err != nil {
		return 0, mapPgError(err)
	}

	if err = tx.QueryRowContext(
		ctx,
		query,
		senderEmail,
		encryptedTexts[0],
		encryptedTexts[1],
		wrappedDEK,
	).Scan(&id); err != nil {
		return 0, mapPgError(err)
	}

	return id, nil
}
