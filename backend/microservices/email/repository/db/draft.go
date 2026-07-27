package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"smail/microservices/email/models"
)

func (r *Repository) CreateDraft(ctx context.Context, draft models.Draft) (*models.Draft, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, ErrTransactionFailed
	}
	defer func() {
		_ = tx.Rollback()
	}()

	const query = `
		INSERT INTO emails (
			sender_id,
			sender_email,
			header_enc,
			body_enc,
			wrapped_dek,
			key_version,
			is_draft,
			is_anonymous,
			body
		)
		SELECT $1, users.email, $2, $3, $4, 2, true, $5, NULL FROM users WHERE users.id = $1
		RETURNING id, sender_email, created_at, updated_at
	`

	encryptedTexts, wrappedDEK, err := r.encryptor.EncryptMultiple(
		[]byte(draft.Header),
		[]byte(draft.Body),
	)
	if err != nil {
		return nil, fmt.Errorf("encrypt body: %w", err)
	}

	err = tx.QueryRowContext(
		ctx,
		query,
		draft.SenderID,
		encryptedTexts[0], // Encrypted header
		encryptedTexts[1], // Encrypted body
		wrappedDEK,
		draft.IsAnonymous,
	).Scan(
		&draft.ID,
		&draft.SenderEmail,
		&draft.CreatedAt,
		&draft.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, mapPgError(err)
	}

	if err = insertEmailRecipients(ctx, tx, draft.ID, draft.Recipients); err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, ErrTransactionFailed
	}
	return &draft, nil
}

func (r *Repository) UpdateDraft(ctx context.Context, userID int64, draft models.Draft) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return ErrTransactionFailed
	}
	defer func() {
		_ = tx.Rollback()
	}()

	const query = `
		UPDATE emails
		SET
			header_enc = $1,
			body_enc = $2,
			wrapped_dek = $3,
			key_version = 1,
			body = NULL,
			is_anonymous = $4,
			updated_at = NOW()
		WHERE id = $5 AND sender_id = $6 AND is_draft = true
	`

	encryptedTexts, wrappedDEK, err := r.encryptor.EncryptMultiple(
		[]byte(draft.Header),
		[]byte(draft.Body),
	)
	if err != nil {
		return mapPgError(err)
	}

	res, err := tx.ExecContext(
		ctx,
		query,
		encryptedTexts[0], // Encrypted header
		encryptedTexts[1], // Encrypted bodys
		wrappedDEK,
		draft.IsAnonymous,
		draft.ID,
		userID,
	)
	if err != nil {
		return mapPgError(err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return ErrQueryFail
	}
	if rows == 0 {
		return ErrDraftNotFound
	}

	if _, err = tx.ExecContext(ctx, `
		DELETE FROM email_recipients WHERE email_id = $1
	`, draft.ID); err != nil {
		return ErrQueryFail
	}
	if err = insertEmailRecipients(ctx, tx, draft.ID, draft.Recipients); err != nil {
		return err
	}
	if err = tx.Commit(); err != nil {
		return ErrTransactionFailed
	}
	return nil
}

func (r *Repository) GetDraftByID(ctx context.Context, draftID, userID int64) (*models.Draft, error) {
	var d models.Draft
	const query = `
		SELECT
			id,
			sender_id,
			sender_email,
			header,
			header_enc,s
			body,
			body_enc,
			wrapped_dek,
			key_version,
			is_anonymous,
			created_at,
			updated_at
		FROM emails
		WHERE id = $1 AND sender_id = $2 AND is_draft = true
	`

	var encryptedBody, encryptedHeader []byte
	var wrappedDEK []byte
	var keyVersion int
	var plainBody, plainHeader sql.NullString

	err := r.db.QueryRowContext(ctx, query, draftID, userID).Scan(
		&d.ID,
		&d.SenderID,
		&d.SenderEmail,
		&plainHeader,
		&encryptedHeader,
		&plainBody,
		&encryptedBody,
		&wrappedDEK,
		&keyVersion,
		&d.IsAnonymous,
		&d.CreatedAt,
		&d.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrDraftNotFound
	}
	if err != nil {
		return nil, ErrQueryFail
	}

	d.Body, err = r.resolveEncryptionKey(plainBody, encryptedBody, wrappedDEK, keyVersion)
	if err != nil {
		return nil, mapPgError(err)
	}

	d.Header, err = r.resolveEncryptionKey(plainHeader, encryptedHeader, wrappedDEK, keyVersion)
	if err != nil {
		return nil, mapPgError(err)
	}

	drafts := []models.Draft{d}
	if err := r.fillRecipients(ctx, drafts, []int64{d.ID}, map[int64]int{d.ID: 0}); err != nil {
		return nil, err
	}

	return &drafts[0], nil
}

func (r *Repository) GetDrafts(ctx context.Context, userID int64, limit, offset int) ([]models.Draft, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			id,
			sender_id,
			sender_email,
			header,
			header_enc,
			body,
			body_enc,
			wrapped_dek,
			key_version,
			is_anonymous,
			created_at,
			updated_at
		FROM emails
		WHERE sender_id = $1 AND is_draft = true
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, ErrQueryFail
	}
	defer func() {
		_ = rows.Close()
	}()

	var drafts []models.Draft
	var ids []int64
	idxByID := map[int64]int{}

	for rows.Next() {
		var d models.Draft

		var plainBody, plainHeader sql.NullString
		var encryptedBody, encryptedHeader []byte
		wrappedDEK := make([]byte, 60)
		var keyVersion int

		if err := rows.Scan(
			&d.ID,
			&d.SenderID,
			&d.SenderEmail,
			&plainHeader,
			&encryptedHeader,
			&plainBody,
			&encryptedBody,
			&wrappedDEK,
			&keyVersion,
			&d.IsAnonymous,
			&d.CreatedAt,
			&d.UpdatedAt,
		); err != nil {
			return nil, ErrQueryFail
		}

		d.Body, err = r.resolveEncryptionKey(plainBody, encryptedBody, wrappedDEK, keyVersion)
		if err != nil {
			return nil, mapPgError(err)
		}

		d.Header, err = r.resolveEncryptionKey(plainHeader, encryptedHeader, wrappedDEK, keyVersion)
		if err != nil {
			return nil, mapPgError(err)
		}

		idxByID[d.ID] = len(drafts)
		drafts = append(drafts, d)
		ids = append(ids, d.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, ErrQueryFail
	}
	if len(drafts) == 0 {
		return drafts, nil
	}

	if err := r.fillRecipients(ctx, drafts, ids, idxByID); err != nil {
		return nil, err
	}
	return drafts, nil
}

func (r *Repository) fillRecipients(ctx context.Context, drafts []models.Draft, ids []int64, idxByID map[int64]int) error {
	placeholders := make([]string, len(ids))
	args := make([]any, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	rows, err := r.db.QueryContext(ctx,
		fmt.Sprintf(
			`SELECT email_id, recipient_email FROM email_recipients WHERE email_id IN (%s)`,
			strings.Join(placeholders, ","),
		),
		args...,
	)
	if err != nil {
		return ErrQueryFail
	}
	defer func() {
		_ = rows.Close()
	}()

	for rows.Next() {
		var emailID int64
		var recipient string
		if err := rows.Scan(&emailID, &recipient); err != nil {
			return ErrQueryFail
		}
		idx := idxByID[emailID]
		drafts[idx].Recipients = append(drafts[idx].Recipients, recipient)
	}
	return rows.Err()
}

func (r *Repository) MarkDraftAsSentTx(ctx context.Context, tx *sql.Tx, draftID, userID int64) error {
	const query = `
		UPDATE emails
		SET is_draft = false, updated_at = NOW()
		WHERE id = $1 AND sender_id = $2 AND is_draft = true
	`
	res, err := tx.ExecContext(ctx, query, draftID, userID)
	if err != nil {
		return mapPgError(err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return ErrQueryFail
	}
	if rows == 0 {
		return ErrDraftNotFound
	}
	return nil
}

func (r *Repository) DeleteDraftsBatch(ctx context.Context, userID int64, draftIDs []int64) error {
	if len(draftIDs) == 0 {
		return nil
	}
	parts := make([]string, len(draftIDs))
	args := make([]any, 0, len(draftIDs)+1)
	args = append(args, userID)
	for i, id := range draftIDs {
		parts[i] = fmt.Sprintf("$%d", i+2)
		args = append(args, id)
	}
	query := fmt.Sprintf(`
		DELETE FROM emails
		WHERE sender_id = $1 AND is_draft = true AND id IN (%s)
	`, strings.Join(parts, ","))
	if _, err := r.db.ExecContext(ctx, query, args...); err != nil {
		return ErrQueryFail
	}
	return nil
}
