package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"strings"

	"smail/microservices/email/models"
)

func (r *Repository) InsertEmail(ctx context.Context, tx *sql.Tx, email models.Email) (int64, error) {
	const query = `
		INSERT INTO emails
			(sender_id, sender_email, header_enc, body_enc, wrapped_dek, key_version,
			 is_draft, is_anonymous, parent_email_id)
		VALUES ($1, $2, $3, $4, $5, 2, $6, $7, $8)
		RETURNING id
	`

	// Анонимные письма шифруются ровно тем же путём, что и обычные:
	// key_version = 1, тело только в body_enc, plaintext body остаётся NULL.
	// key_version = 2, body and header are encrypted !WITH THE SAME DEK!
	encryptedTexts, wrappedDEK, err := r.encryptor.EncryptMultiple(
		[]byte(email.Header),
		[]byte(email.Body),
	)
	if err != nil {
		return 0, fmt.Errorf("encrypt body: %w", err)
	}

	var id int64
	err = tx.QueryRowContext(ctx, query,
		email.SenderID,
		email.SenderEmail,
		encryptedTexts[0], // Encrypted header
		encryptedTexts[1], // Encrypted body
		wrappedDEK,
		email.IsDraft,
		email.IsAnonymous,
		email.ParentEmailID,
	).Scan(&id)
	if err != nil {
		return 0, mapPgError(err)
	}
	return id, nil
}

func (r *Repository) GetEmailIdsByUserEmailIds(ctx context.Context, userEmailIDs []int64) ([]int64, error) {
	if len(userEmailIDs) == 0 {
		return []int64{}, nil
	}

	placeholders := make([]string, len(userEmailIDs))
	args := make([]any, len(userEmailIDs))
	for i, id := range userEmailIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
        SELECT email_id FROM user_emails
        WHERE id IN (%s)
    `, strings.Join(placeholders, ", "))

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query email_ids: %w", err)
	}
	defer func() {
		_ = rows.Close()
	}()

	var emailIDs []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to scan email_id: %w", err)
		}
		emailIDs = append(emailIDs, id)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return emailIDs, nil
}

func (r *Repository) GetUserEmailID(ctx context.Context, emailID, userID int64) (int64, error) {
	query := `
        SELECT id FROM user_emails
        WHERE email_id = $1 AND user_id = $2 AND is_sender = false
        LIMIT 1
    `

	var userEmailID int64
	err := r.db.QueryRowContext(ctx, query, emailID, userID).Scan(&userEmailID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrMailNotFound
		}
		return 0, fmt.Errorf("failed to get user_email_id: %w", err)
	}

	return userEmailID, nil
}

func (r *Repository) GetEmailByID(ctx context.Context, emailID int64) (*models.EmailWithAvatar, error) {
	const query = `
		SELECT
			e.id,
			e.sender_id,
			e.sender_email,
			e.header,
			e.header_enc,
			e.body,
			e.body_enc,
			e.wrapped_dek,
			e.key_version,
			e.is_draft,
			e.is_anonymous,
			e.parent_email_id,
			e.created_at,
			e.updated_at,
			COALESCE(u.image_path, ''),
			COALESCE((SELECT string_agg(er.recipient_email, ',') FROM email_recipients er WHERE er.email_id = e.id), '')
		FROM emails e
		LEFT JOIN users u ON u.id = e.sender_id
		WHERE e.id = $1
	`
	var em models.EmailWithAvatar
	var recipients string
	var plainBody, plainHeader sql.NullString
	var encryptedBody, encryptedHeader, wrappedDEK []byte
	var keyVersion int

	err := r.db.QueryRowContext(ctx, query, emailID).Scan(
		&em.ID,
		&em.SenderID,
		&em.SenderEmail,
		&plainHeader,
		&encryptedHeader,
		&plainBody,
		&encryptedBody,
		&wrappedDEK,
		&keyVersion,
		&em.IsDraft,
		&em.IsAnonymous,
		&em.ParentEmailID,
		&em.CreatedAt,
		&em.UpdatedAt,
		&em.SenderImagePath,
		&recipients,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	em.Recipients = parsePgTextArray(recipients)

	em.Body, err = r.resolveEncryptionKey(plainBody, encryptedBody, wrappedDEK, keyVersion)
	if err != nil {
		return nil, fmt.Errorf("email %d: %w", emailID, err)
	}
	em.Header, err = r.resolveEncryptionKey(plainHeader, encryptedHeader, wrappedDEK, keyVersion)
	if err != nil {
		return nil, fmt.Errorf("email %d: %w", emailID, err)
	}

	return &em, nil
}

func (r *Repository) CheckEmailAccess(ctx context.Context, userID, emailID int64) error {
	const query = `
		SELECT EXISTS (
			SELECT 1 FROM user_emails
			WHERE user_id = $1 AND email_id = $2
			UNION ALL
			SELECT 1 FROM emails
			WHERE id = $2 AND sender_id = $1
		)
	`
	var ok bool
	if err := r.db.QueryRowContext(ctx, query, userID, emailID).Scan(&ok); err != nil {
		return fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	if !ok {
		return ErrAccessDenied
	}
	return nil
}

func (r *Repository) queryUserMailbox(
	ctx context.Context,
	userID int64, limit, offset int,
	condition string,
) ([]models.EmailWithMetadata, error) {
	query := fmt.Sprintf(`
		SELECT
			emails.id,
			emails.sender_id,
			emails.sender_email,
			emails.header,
			emails.header_enc,
			emails.body,
			emails.body_enc,
			emails.wrapped_dek,
			emails.key_version,
			emails.is_draft,
			emails.is_anonymous,
			emails.parent_email_id,
			emails.created_at,
			emails.updated_at,
			user_emails.is_read,
			user_emails.is_starred,
			user_emails.is_spam,
			user_emails.is_deleted,
			user_emails.created_at,
			COALESCE((SELECT string_agg(er.recipient_email, ',') FROM email_recipients er WHERE er.email_id = emails.id), '')
		FROM emails
		JOIN user_emails ON user_emails.email_id = emails.id AND user_emails.user_id = $1
		WHERE %s
		ORDER BY user_emails.created_at DESC
		LIMIT $2 OFFSET $3
	`, condition)

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	defer func() {
		_ = rows.Close()
	}()

	out := make([]models.EmailWithMetadata, 0)
	for rows.Next() {
		var em models.EmailWithMetadata
		var recipients string

		var plainBody, plainHeader sql.NullString
		var encryptedBody, encryptedHeader []byte
		var wrappedDEK []byte
		var keyVersion int

		if err := rows.Scan(
			&em.ID,
			&em.SenderID,
			&em.SenderEmail,
			&plainHeader,
			&encryptedHeader,
			&plainBody,
			&encryptedBody,
			&wrappedDEK,
			&keyVersion,
			&em.IsDraft,
			&em.IsAnonymous,
			&em.ParentEmailID,
			&em.CreatedAt,
			&em.UpdatedAt,
			&em.IsRead,
			&em.IsStarred,
			&em.IsSpam,
			&em.IsDeleted,
			&em.ReceivedAt,
			&recipients,
		); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
		}
		em.Body, err = r.resolveEncryptionKey(plainBody, encryptedBody, wrappedDEK, keyVersion)
		if err != nil {
			return nil, mapPgError(err)
		}

		em.Header, err = r.resolveEncryptionKey(plainHeader, encryptedHeader, wrappedDEK, keyVersion)
		if err != nil {
			return nil, mapPgError(err)
		}

		em.Recipients = parsePgTextArray(recipients)
		out = append(out, em)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	return out, nil
}

func (r *Repository) GetInboxEmails(ctx context.Context, userID int64, limit, offset int) ([]models.EmailWithMetadata, error) {
	limit, offset = normPage(limit, offset)
	return r.queryUserMailbox(
		ctx,
		userID,
		limit,
		offset,
		"user_emails.is_deleted = false AND user_emails.is_spam = false AND user_emails.is_inbox = true AND user_emails.is_sender = false",
	)
}

func (r *Repository) GetReceivedEmails(
	ctx context.Context,
	userID int64,
	limit int,
	offset int,
) ([]models.EmailWithMetadata, error) {
	limit, offset = normPage(limit, offset)
	return r.queryUserMailbox(
		ctx,
		userID,
		limit,
		offset,
		"user_emails.is_deleted = false AND user_emails.is_spam = false AND user_emails.is_sender = false",
	)
}

func (r *Repository) GetAllEmails(ctx context.Context, userID int64, limit, offset int) ([]models.EmailWithMetadata, error) {
	inboxEmails, err := r.GetReceivedEmails(ctx, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get inbox emails: %w", err)
	}

	// Получаем отправленные
	sentEmails, err := r.GetSentEmails(ctx, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get sent emails: %w", err)
	}

	// Объединяем
	allEmails := append(inboxEmails, sentEmails...)

	// Сортируем по дате
	sort.Slice(allEmails, func(i, j int) bool {
		return allEmails[i].CreatedAt.After(allEmails[j].CreatedAt)
	})

	// Применяем пагинацию
	if offset >= len(allEmails) {
		return []models.EmailWithMetadata{}, nil
	}
	end := offset + limit
	if end > len(allEmails) {
		end = len(allEmails)
	}
	return allEmails[offset:end], nil
}

func (r *Repository) GetSpamEmails(ctx context.Context, userID int64, limit, offset int) ([]models.EmailWithMetadata, error) {
	limit, offset = normPage(limit, offset)
	return r.queryUserMailbox(ctx, userID, limit, offset,
		"user_emails.is_spam = true AND user_emails.is_deleted = false")
}

func (r *Repository) GetTrashEmails(ctx context.Context, userID int64, limit, offset int) ([]models.EmailWithMetadata, error) {
	limit, offset = normPage(limit, offset)
	return r.queryUserMailbox(ctx, userID, limit, offset, "user_emails.is_deleted = true")
}

func (r *Repository) GetFavoriteEmails(ctx context.Context, userID int64, limit, offset int) ([]models.EmailWithMetadata, error) {
	limit, offset = normPage(limit, offset)
	return r.queryUserMailbox(ctx, userID, limit, offset,
		"user_emails.is_starred = true AND user_emails.is_deleted = false")
}

func (r *Repository) GetSentEmails(
	ctx context.Context,
	userID int64,
	limit int,
	offset int,
) ([]models.EmailWithMetadata, error) {
	limit, offset = normPage(limit, offset)
	const query = `
		SELECT
			emails.id,
			emails.sender_id,
			emails.sender_email,
			emails.header,
			emails.header_enc,s
			emails.body,
			emails.body_enc,
			emails.wrapped_dek,
			emails.key_version,
			emails.is_draft,
			emails.is_anonymous,
			emails.parent_email_id,
			emails.created_at,
			emails.updated_at,
			user_emails.is_read,
			user_emails.is_starred,
			user_emails.is_spam,
			user_emails.is_deleted,
			emails.created_at,
			COALESCE((SELECT string_agg(er.recipient_email, ',') FROM email_recipients er WHERE er.email_id = emails.id), '')
		FROM emails
		LEFT JOIN user_emails ON user_emails.email_id = emails.id AND user_emails.user_id = $1 AND user_emails.is_deleted = false
		WHERE user_emails.user_id = $1 AND user_emails.is_sender = true AND emails.is_draft = false
		ORDER BY emails.created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	defer func() {
		_ = rows.Close()
	}()

	out := make([]models.EmailWithMetadata, 0)
	for rows.Next() {
		var em models.EmailWithMetadata
		var recipients string

		var plainBody, plainHeader sql.NullString
		var encryptedBody, encryptedHeader []byte
		var wrappedDEK []byte
		var keyVersion int

		if err := rows.Scan(
			&em.ID,
			&em.SenderID,
			&em.SenderEmail,
			&plainHeader,
			&encryptedHeader,
			&plainBody,
			&encryptedBody,
			&wrappedDEK,
			&keyVersion,
			&em.IsDraft,
			&em.IsAnonymous,
			&em.ParentEmailID,
			&em.CreatedAt,
			&em.UpdatedAt,
			&em.IsRead,
			&em.IsStarred,
			&em.IsSpam,
			&em.IsDeleted,
			&em.ReceivedAt,
			&recipients,
		); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
		}

		em.Body, err = r.resolveEncryptionKey(plainBody, encryptedBody, wrappedDEK, keyVersion)
		if err != nil {
			return nil, mapPgError(err)
		}

		em.Header, err = r.resolveEncryptionKey(plainHeader, encryptedHeader, wrappedDEK, keyVersion)
		if err != nil {
			return nil, mapPgError(err)
		}

		em.Recipients = parsePgTextArray(recipients)
		out = append(out, em)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	return out, nil
}

func (r *Repository) GetDeletedEmailIDs(ctx context.Context, userID int64, emailIDs []int64) ([]int64, error) {
	if len(emailIDs) == 0 {
		return []int64{}, nil
	}
	parts := make([]string, len(emailIDs))
	args := make([]any, 0, len(emailIDs)+1)
	args = append(args, userID)
	for i, id := range emailIDs {
		parts[i] = fmt.Sprintf("$%d", i+2)
		args = append(args, id)
	}
	query := fmt.Sprintf(`
		SELECT email_id FROM user_emails
		WHERE user_id = $1 AND is_deleted = true AND email_id IN (%s)
	`, strings.Join(parts, ","))

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	defer func() {
		_ = rows.Close()
	}()

	out := make([]int64, 0)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
		}
		out = append(out, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	return out, nil
}

func (r *Repository) SwitchIsInbox(ctx context.Context, emailID int64, UserID int64) error {
	query := `
		UPDATE user_emails
		SET is_inbox = NOT is_inbox, updated_at = NOW()
		WHERE user_id = $1 AND email_id =$2 AND is_spam = false
	`
	if _, err := r.db.ExecContext(ctx, query, UserID, emailID); err != nil {
		return fmt.Errorf("%w: %v", ErrQueryFail, err)
	}
	return nil
}

func (r *Repository) resolveEncryptionKey(
	plainText sql.NullString,
	encryptedText []byte,
	wrappedDEK []byte,
	keyVersion int,
) (string, error) {
	switch keyVersion {
	case 0:
		return plainText.String, nil
	case 1, 2:
		decryptedText, err := r.encryptor.Decrypt(encryptedText, wrappedDEK)
		if err != nil {
			return "", fmt.Errorf("decrypt body: %w", err)
		}
		return string(decryptedText), nil
	default:
		return "", fmt.Errorf("unknown key_version %d", keyVersion)
	}
}
